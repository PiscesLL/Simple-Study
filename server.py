"""
SIMPLE-STUDY Backend — User accounts + learning analytics
Flask + sqlite3 + werkzeug (zero extra dependencies)
"""
from flask import Flask, request, jsonify, send_from_directory
import os, uuid, sqlite3, json, time, random
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__)
BASE = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE, 'study.db')
ICONS_DIR = os.path.join(BASE, 'icons')
ADMIN_FILE = os.path.join(BASE, 'admin.json')
os.makedirs(ICONS_DIR, exist_ok=True)

# ─── Admin password management ──────────────────────────────
# First-run: created from ADMIN_PASSWORD env var, default 'admin123'.
# Change it after login via POST /api/admin/password, or by editing admin.json.
def init_admin():
    if os.path.exists(ADMIN_FILE):
        return
    pw = os.environ.get('ADMIN_PASSWORD', 'admin123')
    with open(ADMIN_FILE, 'w') as f:
        json.dump({'password_hash': generate_password_hash(pw)}, f)
    if not os.environ.get('ADMIN_PASSWORD'):
        app.logger.warning('ADMIN_PASSWORD not set — using default admin123. Change it via admin panel.')

def check_admin_password(pw):
    try:
        with open(ADMIN_FILE) as f:
            data = json.load(f)
        return check_password_hash(data.get('password_hash', ''), pw)
    except Exception:
        return False

def set_admin_password(pw):
    with open(ADMIN_FILE, 'w') as f:
        json.dump({'password_hash': generate_password_hash(pw)}, f)

# Admin tokens — in-memory, 24h expiry (server restart requires re-login)
import threading
_admin_tokens = {}
_admin_lock = threading.Lock()

# Admin login attempt limiting: {ip: {'count': n, 'lock_until': ts}}
_admin_attempts = {}
_ADMIN_MAX_ATTEMPTS = 5
_ADMIN_LOCK_SECONDS = 600

def _check_admin_lock(ip):
    with _admin_lock:
        entry = _admin_attempts.get(ip)
        if entry and entry['lock_until'] > time.time():
            remain = int(entry['lock_until'] - time.time())
            return f'尝试次数过多，请 {remain//60} 分钟后再试'
    return None

def _record_admin_failure(ip):
    with _admin_lock:
        entry = _admin_attempts.get(ip) or {'count': 0, 'lock_until': 0}
        entry['count'] += 1
        if entry['count'] >= _ADMIN_MAX_ATTEMPTS:
            entry['lock_until'] = time.time() + _ADMIN_LOCK_SECONDS
            entry['count'] = 0
        _admin_attempts[ip] = entry

def _clear_admin_failures(ip):
    with _admin_lock:
        _admin_attempts.pop(ip, None)

def _new_admin_token():
    tok = uuid.uuid4().hex
    with _admin_lock:
        _admin_tokens[tok] = time.time() + 86400
    return tok

def require_admin(f):
    @wraps(f)
    def wrapper(*a, **kw):
        token = request.headers.get('X-Admin-Token', '')
        with _admin_lock:
            exp = _admin_tokens.get(token)
            if exp is None or exp < time.time():
                if exp is not None:
                    _admin_tokens.pop(token, None)
                return jsonify({'error': '管理密码未验证或已过期'}), 401
        return f(*a, **kw)
    return wrapper

# ═══════════════════════════════════════════════════════════════
#  DATABASE
# ═══════════════════════════════════════════════════════════════
# In-memory captcha store: {captcha_id: {'answer': int, 'expires': ts}}
_captchas = {}
_captcha_lock = threading.Lock()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    with get_db() as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                display_name TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS auth_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                token TEXT UNIQUE NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS listening_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                category TEXT NOT NULL,
                item TEXT NOT NULL,
                listened_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS diagnosis_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                category TEXT NOT NULL,
                pinyin TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('known','unsure','unknown')),
                diagnosed_at TEXT DEFAULT (datetime('now')),
                UNIQUE(user_id, category, pinyin)
            );
            CREATE TABLE IF NOT EXISTS dictation_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                mode TEXT NOT NULL DEFAULT 'normal',
                category TEXT DEFAULT 'all',
                total_questions INTEGER NOT NULL DEFAULT 0,
                correct_count INTEGER NOT NULL DEFAULT 0,
                wrong_count INTEGER NOT NULL DEFAULT 0,
                details TEXT DEFAULT '[]',
                completed_at TEXT DEFAULT (datetime('now'))
            );
        """)
init_db()
# Migration: add details column to dictation_sessions for older databases
with get_db() as db:
    cols = [r[1] for r in db.execute("PRAGMA table_info(dictation_sessions)").fetchall()]
    if 'details' not in cols:
        db.execute("ALTER TABLE dictation_sessions ADD COLUMN details TEXT DEFAULT '[]'")
init_admin()

# ═══════════════════════════════════════════════════════════════
#  AUTH MIDDLEWARE
# ═══════════════════════════════════════════════════════════════
def require_auth(f):
    @wraps(f)
    def wrapper(*a, **kw):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': '未登录'}), 401
        with get_db() as db:
            row = db.execute(
                "SELECT u.id, u.username, u.display_name FROM auth_tokens t JOIN users u ON t.user_id=u.id WHERE t.token=?",
                (token,)
            ).fetchone()
        if not row:
            return jsonify({'error': '登录已过期'}), 401
        return f(user=dict(row), *a, **kw)
    return wrapper

# ═══════════════════════════════════════════════════════════════
#  AUTH API
# ═══════════════════════════════════════════════════════════════
@app.route('/api/captcha')
def api_captcha():
    """Simple arithmetic captcha: {id, question}. Answer stored in memory."""
    import random
    a = random.randint(1, 9)
    b = random.randint(1, 9)
    op = random.choice(['+', '-', '×'])
    if op == '-':
        if a < b: a, b = b, a
        ans = a - b
        question = f'{a} - {b} = ?'
    elif op == '+':
        ans = a + b
        question = f'{a} + {b} = ?'
    else:
        ans = a * b
        question = f'{a} × {b} = ?'
    cid = uuid.uuid4().hex
    with _captcha_lock:
        _captchas[cid] = {'answer': ans, 'expires': time.time() + 300}
    return jsonify({'id': cid, 'question': question})

def verify_captcha(cid, answer):
    with _captcha_lock:
        entry = _captchas.pop(cid, None)
    if not entry:
        return False
    if entry['expires'] < time.time():
        return False
    try:
        return int(answer) == entry['answer']
    except (TypeError, ValueError):
        return False

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password', '')
    captcha_id = data.get('captcha_id', '')
    captcha_answer = data.get('captcha_answer', '')
    if len(username) < 2 or len(password) < 4:
        return jsonify({'error': '用户名至少2位，密码至少4位'}), 400
    if not verify_captcha(captcha_id, captcha_answer):
        return jsonify({'error': '验证码错误或已过期'}), 400
    with get_db() as db:
        if db.execute("SELECT 1 FROM users WHERE username=?", (username,)).fetchone():
            return jsonify({'error': '用户名已存在'}), 409
        pw_hash = generate_password_hash(password)
        cur = db.execute("INSERT INTO users (username, password_hash) VALUES (?,?)", (username, pw_hash))
        user_id = cur.lastrowid
        token = str(uuid.uuid4())
        db.execute("INSERT INTO auth_tokens (user_id, token) VALUES (?,?)", (user_id, token))
        return jsonify({'token': token, 'user': {'id': user_id, 'username': username, 'display_name': ''}}), 201

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password', '')
    with get_db() as db:
        user = db.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': '用户名或密码错误'}), 401
        token = str(uuid.uuid4())
        db.execute("INSERT INTO auth_tokens (user_id, token) VALUES (?,?)", (user['id'], token))
        return jsonify({'token': token, 'user': {'id': user['id'], 'username': user['username'], 'display_name': user['display_name']}})

@app.route('/api/me')
@require_auth
def api_me(user):
    return jsonify({'user': user})

@app.route('/api/logout', methods=['POST'])
@require_auth
def api_logout(user):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    with get_db() as db:
        db.execute("DELETE FROM auth_tokens WHERE token=?", (token,))
    return jsonify({'ok': True})

# ═══════════════════════════════════════════════════════════════
#  DIAGNOSIS API
# ═══════════════════════════════════════════════════════════════
@app.route('/api/diagnosis', methods=['GET'])
@require_auth
def api_get_diagnosis(user):
    with get_db() as db:
        rows = db.execute(
            "SELECT category, pinyin, status, diagnosed_at FROM diagnosis_results WHERE user_id=? ORDER BY category, pinyin",
            (user['id'],)
        ).fetchall()
    return jsonify({'results': [dict(r) for r in rows]})

@app.route('/api/diagnosis', methods=['POST'])
@require_auth
def api_save_diagnosis(user):
    data = request.get_json() or {}
    results = data.get('results', [])
    if not results:
        return jsonify({'error': '缺少数据'}), 400
    saved = 0
    with get_db() as db:
        for r in results:
            cat = r.get('category', '')
            py = r.get('pinyin', '')
            st = r.get('status', '')
            if not cat or not py or st not in ('known','unsure','unknown'):
                continue
            db.execute("""
                INSERT INTO diagnosis_results (user_id, category, pinyin, status)
                VALUES (?,?,?,?)
                ON CONFLICT(user_id, category, pinyin) DO UPDATE SET status=excluded.status, diagnosed_at=datetime('now')
            """, (user['id'], cat, py, st))
            saved += 1
    return jsonify({'saved': saved}), 201

@app.route('/api/diagnosis', methods=['DELETE'])
@require_auth
def api_clear_diagnosis(user):
    with get_db() as db:
        db.execute("DELETE FROM diagnosis_results WHERE user_id=?", (user['id'],))
    return jsonify({'ok': True})

# ═══════════════════════════════════════════════════════════════
#  LISTENING API
# ═══════════════════════════════════════════════════════════════
@app.route('/api/listening', methods=['POST'])
@require_auth
def api_log_listening(user):
    data = request.get_json() or {}
    category = data.get('category', '')
    item = data.get('item', '')
    if not category or not item:
        return jsonify({'error': '缺少数据'}), 400
    with get_db() as db:
        db.execute("INSERT INTO listening_records (user_id, category, item) VALUES (?,?,?)",
                   (user['id'], category, item))
    return jsonify({'ok': True}), 201

@app.route('/api/listening/stats')
@require_auth
def api_listening_stats(user):
    with get_db() as db:
        total = db.execute("SELECT COUNT(*) as c FROM listening_records WHERE user_id=?", (user['id'],)).fetchone()['c']
        by_cat = db.execute(
            "SELECT category, COUNT(*) as c FROM listening_records WHERE user_id=? GROUP BY category ORDER BY c DESC",
            (user['id'],)
        ).fetchall()
        recent = db.execute(
            "SELECT category, item, listened_at FROM listening_records WHERE user_id=? ORDER BY listened_at DESC LIMIT 20",
            (user['id'],)
        ).fetchall()
    return jsonify({'total_listens': total, 'by_category': [dict(r) for r in by_cat], 'recent': [dict(r) for r in recent]})

# ═══════════════════════════════════════════════════════════════
#  DICTATION API
# ═══════════════════════════════════════════════════════════════
@app.route('/api/dictation', methods=['GET'])
@require_auth
def api_get_dictations(user):
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    offset = (page - 1) * limit
    with get_db() as db:
        total = db.execute("SELECT COUNT(*) as c FROM dictation_sessions WHERE user_id=?", (user['id'],)).fetchone()['c']
        rows = db.execute(
            "SELECT * FROM dictation_sessions WHERE user_id=? ORDER BY completed_at DESC LIMIT ? OFFSET ?",
            (user['id'], limit, offset)
        ).fetchall()
    return jsonify({'sessions': [dict(r) for r in rows], 'total': total, 'page': page})

@app.route('/api/dictation', methods=['POST'])
@require_auth
def api_save_dictation(user):
    data = request.get_json() or {}
    mode = data.get('mode', 'normal')
    category = data.get('category', 'all')
    total_q = data.get('total_questions', 0)
    correct = data.get('correct_count', 0)
    wrong = data.get('wrong_count', 0)
    details = data.get('details', [])
    if total_q == 0:
        return jsonify({'error': '缺少数据'}), 400
    if not isinstance(details, list):
        details = []
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO dictation_sessions (user_id, mode, category, total_questions, correct_count, wrong_count, details) VALUES (?,?,?,?,?,?,?)",
            (user['id'], mode, category, total_q, correct, wrong, json.dumps(details, ensure_ascii=False))
        )
        session_id = cur.lastrowid
    return jsonify({'session_id': session_id}), 201

# ═══════════════════════════════════════════════════════════════
#  STATS API
# ═══════════════════════════════════════════════════════════════
@app.route('/api/stats')
@require_auth
def api_stats(user):
    uid = user['id']
    with get_db() as db:
        total_listens = db.execute("SELECT COUNT(*) as c FROM listening_records WHERE user_id=?", (uid,)).fetchone()['c']
        diag_count = db.execute("SELECT COUNT(*) as c FROM diagnosis_results WHERE user_id=?", (uid,)).fetchone()['c']
        unknown_count = db.execute("SELECT COUNT(*) as c FROM diagnosis_results WHERE user_id=? AND status='unknown'", (uid,)).fetchone()['c']
        dict_count = db.execute("SELECT COUNT(*) as c FROM dictation_sessions WHERE user_id=?", (uid,)).fetchone()['c']
        total_q = db.execute("SELECT IFNULL(SUM(total_questions),0) as c FROM dictation_sessions WHERE user_id=?", (uid,)).fetchone()['c']
        total_correct = db.execute("SELECT IFNULL(SUM(correct_count),0) as c FROM dictation_sessions WHERE user_id=?", (uid,)).fetchone()['c']
        # Daily activity (last 30 days) — listening + dictation sessions
        daily = db.execute("""
            SELECT d, SUM(cnt) as c FROM (
                SELECT date(listened_at) as d, COUNT(*) as cnt FROM listening_records
                WHERE user_id=? AND listened_at >= date('now','-29 days') GROUP BY d
                UNION ALL
                SELECT date(completed_at) as d, 1 as cnt FROM dictation_sessions
                WHERE user_id=? AND completed_at >= date('now','-29 days')
            ) GROUP BY d ORDER BY d
        """, (uid, uid)).fetchall()
        # Dictation sessions summary (recent 20, with details)
        sessions = db.execute(
            "SELECT id, mode, category, total_questions, correct_count, wrong_count, details, completed_at FROM dictation_sessions WHERE user_id=? ORDER BY completed_at DESC LIMIT 20",
            (uid,)
        ).fetchall()
        sessions_out = []
        for s in sessions:
            d = dict(s)
            try:
                d['details'] = json.loads(d.get('details') or '[]')
            except Exception:
                d['details'] = []
            sessions_out.append(d)
        # Diagnosis results
        diag = db.execute(
            "SELECT category, pinyin, status, diagnosed_at FROM diagnosis_results WHERE user_id=? ORDER BY category, pinyin",
            (uid,)
        ).fetchall()
    accuracy = round(total_correct / total_q * 100, 1) if total_q > 0 else 0
    return jsonify({
        'total_listens': total_listens,
        'diagnosis_count': diag_count,
        'unknown_count': unknown_count,
        'dictation_sessions': dict_count,
        'total_questions': total_q,
        'total_correct': total_correct,
        'accuracy': accuracy,
        'daily': [dict(r) for r in daily],
        'sessions': sessions_out,
        'diag': [dict(r) for r in diag]
    })

@app.route('/api/stats/daily', methods=['GET'])
@require_auth
def api_stats_daily(user):
    """按日统计：某天的听读明细、听写会话、诊断情况"""
    date = request.args.get('date', '')
    if not date:
        return jsonify({'error': '缺少日期'}), 400
    uid = user['id']
    with get_db() as db:
        listens = db.execute(
            "SELECT category, item, listened_at FROM listening_records "
            "WHERE user_id=? AND date(listened_at)=? ORDER BY listened_at",
            (uid, date)
        ).fetchall()
        sessions = db.execute(
            "SELECT mode, category, total_questions, correct_count, wrong_count, details, completed_at "
            "FROM dictation_sessions WHERE user_id=? AND date(completed_at)=? ORDER BY completed_at",
            (uid, date)
        ).fetchall()
        diag = db.execute(
            "SELECT category, pinyin, status FROM diagnosis_results "
            "WHERE user_id=? AND date(diagnosed_at)=? ORDER BY category, pinyin",
            (uid, date)
        ).fetchall()
    sessions_out = []
    for s in sessions:
        d = dict(s)
        try:
            d['details'] = json.loads(d.get('details') or '[]')
        except Exception:
            d['details'] = []
        sessions_out.append(d)
    return jsonify({
        'date': date,
        'listens': [dict(r) for r in listens],
        'sessions': sessions_out,
        'diag': [dict(r) for r in diag],
        'listens_count': len(listens),
        'sessions_count': len(sessions_out),
        'diag_count': len(diag)
    })

# ═══════════════════════════════════════════════════════════════
#  ADMIN API
# ═══════════════════════════════════════════════════════════════
@app.route('/api/admin/login', methods=['POST'])
def api_admin_login():
    ip = request.headers.get('X-Forwarded-For', request.remote_addr or '').split(',')[0].strip()
    locked = _check_admin_lock(ip)
    if locked:
        return jsonify({'error': locked}), 429
    data = request.get_json() or {}
    pw = data.get('password', '')
    if not check_admin_password(pw):
        _record_admin_failure(ip)
        return jsonify({'error': '管理密码错误'}), 401
    _clear_admin_failures(ip)
    return jsonify({'token': _new_admin_token()})

@app.route('/api/admin/logout', methods=['POST'])
@require_admin
def api_admin_logout():
    token = request.headers.get('X-Admin-Token', '')
    with _admin_lock:
        _admin_tokens.pop(token, None)
    return jsonify({'ok': True})

@app.route('/api/admin/password', methods=['POST'])
@require_admin
def api_admin_change_password():
    data = request.get_json() or {}
    old_pw = data.get('old_password', '')
    new_pw = data.get('new_password', '')
    if len(new_pw) < 4:
        return jsonify({'error': '新密码至少4位'}), 400
    if not check_admin_password(old_pw):
        return jsonify({'error': '原密码错误'}), 401
    set_admin_password(new_pw)
    return jsonify({'ok': True})

@app.route('/api/admin/users')
@require_admin
def api_admin_users():
    with get_db() as db:
        rows = db.execute("""
            SELECT u.id, u.username, u.display_name, u.created_at,
                   (SELECT COUNT(*) FROM listening_records l WHERE l.user_id=u.id) AS listen_count,
                   (SELECT COUNT(*) FROM dictation_sessions d WHERE d.user_id=u.id) AS dict_count,
                   (SELECT COUNT(*) FROM diagnosis_results g WHERE g.user_id=u.id) AS diag_count,
                   (SELECT IFNULL(MAX(l2.listened_at), u.created_at) FROM listening_records l2 WHERE l2.user_id=u.id) AS last_active
            FROM users u
            ORDER BY last_active DESC, u.id
        """).fetchall()
    return jsonify({'users': [dict(r) for r in rows]})

@app.route('/api/admin/users/<int:uid>')
@require_admin
def api_admin_user_detail(uid):
    with get_db() as db:
        user = db.execute("SELECT id, username, display_name, created_at FROM users WHERE id=?", (uid,)).fetchone()
        if not user:
            return jsonify({'error': '用户不存在'}), 404

        # Listening summary + recent
        listen_total = db.execute("SELECT COUNT(*) as c FROM listening_records WHERE user_id=?", (uid,)).fetchone()['c']
        listen_by_cat = db.execute(
            "SELECT category, item, COUNT(*) as c FROM listening_records WHERE user_id=? GROUP BY category, item ORDER BY c DESC LIMIT 100",
            (uid,)
        ).fetchall()
        listen_recent = db.execute(
            "SELECT category, item, listened_at FROM listening_records WHERE user_id=? ORDER BY listened_at DESC LIMIT 50",
            (uid,)
        ).fetchall()

        # Dictation sessions (with details)
        sessions = db.execute(
            "SELECT id, mode, category, total_questions, correct_count, wrong_count, details, completed_at FROM dictation_sessions WHERE user_id=? ORDER BY completed_at DESC LIMIT 100",
            (uid,)
        ).fetchall()
        sessions_out = []
        for s in sessions:
            d = dict(s)
            try:
                d['details'] = json.loads(d.get('details') or '[]')
            except Exception:
                d['details'] = []
            sessions_out.append(d)

        # Diagnosis
        diag = db.execute(
            "SELECT category, pinyin, status, diagnosed_at FROM diagnosis_results WHERE user_id=? ORDER BY category, pinyin",
            (uid,)
        ).fetchall()
        diag_known = db.execute("SELECT COUNT(*) as c FROM diagnosis_results WHERE user_id=? AND status='known'", (uid,)).fetchone()['c']
        diag_unsure = db.execute("SELECT COUNT(*) as c FROM diagnosis_results WHERE user_id=? AND status='unsure'", (uid,)).fetchone()['c']
        diag_unknown = db.execute("SELECT COUNT(*) as c FROM diagnosis_results WHERE user_id=? AND status='unknown'", (uid,)).fetchone()['c']

        # Daily activity (last 30 days)
        daily = db.execute("""
            SELECT date(listened_at) as d, COUNT(*) as c FROM listening_records WHERE user_id=? AND listened_at >= date('now','-29 days') GROUP BY d ORDER BY d
        """, (uid,)).fetchall()

    return jsonify({
        'user': dict(user),
        'listen_total': listen_total,
        'listen_by_cat': [dict(r) for r in listen_by_cat],
        'listen_recent': [dict(r) for r in listen_recent],
        'sessions': sessions_out,
        'diag': [dict(r) for r in diag],
        'diag_counts': {'known': diag_known, 'unsure': diag_unsure, 'unknown': diag_unknown},
        'daily': [dict(r) for r in daily]
    })

# ═══════════════════════════════════════════════════════════════
#  LEGACY ENDPOINTS (unchanged)
# ═══════════════════════════════════════════════════════════════
@app.route('/upload-icon', methods=['POST'])
def upload_icon():
    icon_type = request.form.get('type', '')
    if icon_type == 'reset':
        for fn in ('correct.png','wrong.png','correct.jpg','wrong.jpg','correct.webp','wrong.webp','correct.svg','wrong.svg'):
            fp = os.path.join(ICONS_DIR, fn)
            if os.path.exists(fp): os.remove(fp)
        return jsonify({'status': 'reset'}), 200
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    if icon_type not in ('correct', 'wrong'):
        return jsonify({'error': 'type must be correct/wrong'}), 400
    ext = os.path.splitext(f.filename)[1] or '.png'
    if ext.lower() not in ('.png','.jpg','.jpeg','.gif','.webp','.svg'):
        ext = '.png'
    from werkzeug.utils import secure_filename
    filename = secure_filename(f'{icon_type}{ext.lower()}')
    for old_fn in os.listdir(ICONS_DIR):
        if old_fn.startswith(icon_type + '.') and old_fn != filename:
            os.remove(os.path.join(ICONS_DIR, old_fn))
    f.save(os.path.join(ICONS_DIR, filename))
    return jsonify({'url': f'/icons/{filename}', 'filename': filename}), 200

@app.route('/icons/<path:filename>')
def serve_icon(filename):
    return send_from_directory(ICONS_DIR, filename)

@app.route('/recognize', methods=['POST'])
def recognize():
    # Placeholder — handwriting recognition not implemented
    return jsonify({'text': '', 'status': 'not_implemented'}), 200

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'db': os.path.exists(DB_PATH)})

if __name__ == '__main__':
    print(f"DB: {DB_PATH}")
    app.run(host='127.0.0.1', port=5001, debug=False)
