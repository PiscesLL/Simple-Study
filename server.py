"""
SIMPLE-STUDY Backend — User accounts + learning analytics
Flask + sqlite3 + werkzeug (zero extra dependencies)
"""
from flask import Flask, request, jsonify, send_from_directory
import os, uuid, sqlite3, json
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__)
BASE = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE, 'study.db')
ICONS_DIR = os.path.join(BASE, 'icons')
os.makedirs(ICONS_DIR, exist_ok=True)

# ═══════════════════════════════════════════════════════════════
#  DATABASE
# ═══════════════════════════════════════════════════════════════
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
                completed_at TEXT DEFAULT (datetime('now'))
            );
        """)
init_db()

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
@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password', '')
    if len(username) < 2 or len(password) < 4:
        return jsonify({'error': '用户名至少2位，密码至少4位'}), 400
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
    if total_q == 0:
        return jsonify({'error': '缺少数据'}), 400
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO dictation_sessions (user_id, mode, category, total_questions, correct_count, wrong_count) VALUES (?,?,?,?,?,?)",
            (user['id'], mode, category, total_q, correct, wrong)
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
    accuracy = round(total_correct / total_q * 100, 1) if total_q > 0 else 0
    return jsonify({
        'total_listens': total_listens,
        'diagnosis_count': diag_count,
        'unknown_count': unknown_count,
        'dictation_sessions': dict_count,
        'total_questions': total_q,
        'total_correct': total_correct,
        'accuracy': accuracy
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
