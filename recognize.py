"""Pinyin handwriting recognition using stroke analysis (no OCR needed)"""
import json
import math
import logging
from flask import Flask, request, jsonify

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# ═══ Pinyin letter feature database ═══
# Each letter has features derived from handwriting analysis
# loops: number of enclosed holes in the letter
# strokes: typical number of pen strokes
# has_dot: has a dot (i, j)
# tall: extends above x-height (b, d, f, h, k, l, t)
# desc: extends below baseline (g, j, p, q, y)
# curve: 0=straight, 1=curved, 2=very curved
# direction: 0=vertical, 1=horizontal, 2=both, 3=circular

LETTER_FEATURES = {
    'a': {'strokes':2, 'loops':1, 'has_dot':False, 'tall':False, 'desc':False, 'loop_side':'right'},
    'b': {'strokes':2, 'loops':1, 'has_dot':False, 'tall':True, 'desc':False, 'loop_side':'right'},
    'c': {'strokes':1, 'loops':0, 'has_dot':False, 'tall':False, 'desc':False, 'loop_side':''},
    'd': {'strokes':2, 'loops':1, 'has_dot':False, 'tall':True, 'desc':False, 'loop_side':'left'},
    'e': {'strokes':1, 'loops':0, 'has_dot':False, 'tall':False, 'desc':False, 'loop_side':''},
    'f': {'strokes':2, 'loops':0, 'has_dot':False, 'tall':True, 'desc':False, 'loop_side':''},
    'g': {'strokes':2, 'loops':1, 'has_dot':False, 'tall':False, 'desc':True, 'loop_side':'bottom'},
    'h': {'strokes':2, 'loops':0, 'has_dot':False, 'tall':True, 'desc':False, 'loop_side':''},
    'i': {'strokes':2, 'loops':0, 'has_dot':True, 'tall':True, 'desc':False, 'loop_side':''},
    'j': {'strokes':2, 'loops':0, 'has_dot':True, 'tall':False, 'desc':True, 'loop_side':''},
    'k': {'strokes':2, 'loops':0, 'has_dot':False, 'tall':True, 'desc':False, 'loop_side':''},
    'l': {'strokes':1, 'loops':0, 'has_dot':False, 'tall':True, 'desc':False, 'loop_side':''},
    'm': {'strokes':1, 'loops':0, 'has_dot':False, 'tall':False, 'desc':False, 'loop_side':''},
    'n': {'strokes':1, 'loops':0, 'has_dot':False, 'tall':False, 'desc':False, 'loop_side':''},
    'o': {'strokes':1, 'loops':1, 'has_dot':False, 'tall':False, 'desc':False, 'loop_side':'center'},
    'p': {'strokes':2, 'loops':1, 'has_dot':False, 'tall':False, 'desc':True, 'loop_side':'top'},
    'q': {'strokes':2, 'loops':1, 'has_dot':False, 'tall':False, 'desc':True, 'loop_side':'bottom'},
    'r': {'strokes':1, 'loops':0, 'has_dot':False, 'tall':False, 'desc':False, 'loop_side':''},
    's': {'strokes':1, 'loops':0, 'has_dot':False, 'tall':False, 'desc':False, 'loop_side':''},
    't': {'strokes':2, 'loops':0, 'has_dot':False, 'tall':True, 'desc':False, 'loop_side':''},
    'u': {'strokes':1, 'loops':0, 'has_dot':False, 'tall':False, 'desc':False, 'loop_side':''},
    'v': {'strokes':1, 'loops':0, 'has_dot':False, 'tall':False, 'desc':False, 'loop_side':''},
    'w': {'strokes':1, 'loops':0, 'has_dot':False, 'tall':False, 'desc':False, 'loop_side':''},
    'x': {'strokes':2, 'loops':0, 'has_dot':False, 'tall':False, 'desc':False, 'loop_side':''},
    'y': {'strokes':2, 'loops':0, 'has_dot':False, 'tall':False, 'desc':True, 'loop_side':''},
    'z': {'strokes':1, 'loops':0, 'has_dot':False, 'tall':False, 'desc':False, 'loop_side':''},
}

def analyze_strokes(strokes):
    """Analyze stroke data to extract features"""
    if not strokes or len(strokes) == 0:
        return None
    
    # Normalize all points to 0-1 range
    all_x = [p['x'] for s in strokes for p in s]
    all_y = [p['y'] for s in strokes for p in s]
    
    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)
    
    width = max_x - min_x if max_x > min_x else 1
    height = max_y - min_y if max_y > min_y else 1
    
    # Detection of loops: check if any stroke ends near where it started
    loops = 0
    for stroke in strokes:
        if len(stroke) >= 5:
            first = stroke[0]
            last = stroke[-1]
            dx = (last['x'] - first['x']) / width
            dy = (last['y'] - first['y']) / height
            dist = math.sqrt(dx*dx + dy*dy)
            if dist < 0.2:
                loops += 1
    
    # Count "dots" - very short strokes in the upper region  
    dots = 0
    main_strokes = 0
    mid_y = (min_y + max_y) / 2
    
    for stroke in strokes:
        # Calculate stroke length as proportion of canvas
        if len(stroke) < 3:
            dots += 1
            continue
        dx = max(p['x'] for p in stroke) - min(p['x'] for p in stroke)
        dy = max(p['y'] for p in stroke) - min(p['y'] for p in stroke)
        stroke_length = math.sqrt(dx*dx + dy*dy)
        if stroke_length / max(width, height) < 0.15:
            dots += 1
        else:
            main_strokes += 1
    
    # Directionality analysis
    h_count = 0  # horizontal strokes
    v_count = 0  # vertical strokes
    
    # Loop position analysis
    loop_right = False
    loop_left = False
    loop_at_top = False
    loop_at_bottom = False
    
    for stroke in strokes:
        if len(stroke) < 5: continue
        dx = max(p['x'] for p in stroke) - min(p['x'] for p in stroke)
        dy = max(p['y'] for p in stroke) - min(p['y'] for p in stroke)
        if dx > dy * 1.5: h_count += 1  
        elif dy > dx * 1.5: v_count += 1
        
        # Check if this stroke forms a loop (returns near start)
        first = stroke[0]
        last = stroke[-1]
        ddx = (last['x'] - first['x']) / width if width > 0 else 0
        ddy = (last['y'] - first['y']) / height if height > 0 else 0
        dist = math.sqrt(ddx*ddx + ddy*ddy)
        if dist < 0.2 and len(stroke) > 8:
            # Determine loop position relative to writing
            sx = (first['x'] - min_x) / width if width > 0 else 0.5
            sy = (first['y'] - min_y) / height if height > 0 else 0.5
            mid_y_local = (min_y + max_y) / 2
            mid_x_local = (min_x + max_x) / 2
            if first['x'] > mid_x_local and last['x'] > mid_x_local:
                loop_right = True
            if first['x'] < mid_x_local and last['x'] < mid_x_local:
                loop_left = True
            if first['y'] < mid_y_local and last['y'] < mid_y_local:
                loop_at_top = True
            if first['y'] > mid_y_local and last['y'] > mid_y_local:
                loop_at_bottom = True
    
    # Height analysis - does the writing go above or below
    # Mid-point reference (x-height region)
    has_tall = any(p['y'] < min_y + height * 0.3 for s in strokes for p in s) if height > 0 else False
    has_desc = any(p['y'] > min_y + height * 0.85 for s in strokes for p in s) if height > 0 else False
    
    # Aspect ratio of the whole writing
    aspect = width / height if height > 0 else 1
    
    result = {
        'num_strokes': len(strokes),
        'main_strokes': main_strokes,
        'dots': dots,
        'loops': loops,
        'h_strokes': h_count,
        'v_strokes': v_count,
        'has_tall': has_tall,
        'has_desc': has_desc,
        'loop_right': loop_right,
        'loop_left': loop_left,
        'loop_top': loop_at_top,
        'loop_bottom': loop_at_bottom,
        'aspect': aspect,
        'width': width,
        'height': height,
    }
    return result

def score_letter(features, letter):
    """Score how well features match a known letter (0-100)"""
    lf = LETTER_FEATURES.get(letter)
    if not lf:
        return 0
    
    score = 0
    
    # Loop match (most important feature - very distinctive)
    if features['loops'] == lf['loops']:
        score += 30
    elif abs(features['loops'] - lf['loops']) <= 1:
        score += 10
    
    # Total strokes
    total_strokes = features['main_strokes'] + features['dots']
    if total_strokes == lf['strokes']:
        score += 20
    elif abs(total_strokes - lf['strokes']) <= 1:
        score += 8
    
    # Dot presence
    has_dot = features['dots'] > 0
    if has_dot == lf['has_dot']:
        score += 15
    elif has_dot and lf['has_dot']:
        score += 5  # both have dots but wrong number
    
    # Tall (ascender)
    if features['has_tall'] == lf['tall']:
        score += 10
    
    # Descender
    if features['has_desc'] == lf['desc']:
        score += 10
    
    # Loop position matching
    if lf.get('loop_side') and features.get('loop_right') and lf['loop_side'] == 'right':
        score += 20
    if lf.get('loop_side') and features.get('loop_left') and lf['loop_side'] == 'left':
        score += 20
    if lf.get('loop_side') and features.get('loop_top') and lf['loop_side'] == 'top':
        score += 15
    if lf.get('loop_side') and features.get('loop_bottom') and lf['loop_side'] == 'bottom':
        score += 15
    if lf.get('loop_side') == 'center' and features['loops'] > 0:
        score += 10
    
    # Direction analysis
    if features['h_strokes'] > features['v_strokes']:
        dominant_dir = 1  # horizontal
    elif features['v_strokes'] > features['h_strokes']:
        dominant_dir = 0  # vertical
    else:
        dominant_dir = 2  # both or neither
    
    if dominant_dir == lf['direction'] or abs(dominant_dir - lf['direction']) <= 1:
        score += 15
    elif lf['direction'] == 3:  # circular - special case
        if features['loops'] > 0:
            score += 10
    
    return min(score, 100)

def recognize_pinyin(strokes_data, canvas_width, canvas_height):
    """Main recognition function"""
    if not strokes_data or len(strokes_data) == 0:
        return {'text': '', 'best': '', 'confidence': 0}
    
    features = analyze_strokes(strokes_data)
    if not features:
        return {'text': '', 'best': '', 'confidence': 0}
    
    log.info(f"Stroke features: {json.dumps(features)}")
    
    # All possible pinyin syllables
    all_pinyin = [
        'a','o','e','i','u','v',
        'b','p','m','f','d','t','n','l','g','k','h','j','q','x',
        'r','z','c','s','y','w',
        'zh','ch','sh',
        'ai','ei','ui','ao','ou','iu','ie','ve','er',
        'an','en','in','un','vn',
        'ang','eng','ing','ong',
        'zhi','chi','shi','ri','zi','ci','si',
        'yi','wu','yu','ye','yue','yuan','yin','yun','ying'
    ]
    
    scored = []
    for py in all_pinyin:
        # For multi-letter syllables, score each letter and average
        if len(py) == 1:
            s = score_letter(features, py)
            scored.append((py, s))
        else:
            # Multi-letter: score is based on the most distinctive letter in the combo
            # For simplicity, score the first letter more heavily
            letters = list(py)
            total = 0
            for i, ch in enumerate(letters):
                fake_features = dict(features)
                weight = 1.0 / (i + 1)  # first letter has more weight
                # Adjust features to better match
                if i > 0:
                    fake_features['has_tall'] = False
                    fake_features['loops'] = 0
                s = score_letter(fake_features, ch)
                total += s * weight
            avg = total / sum(1.0/(i+1) for i in range(len(letters)))
            scored.append((py, avg))
    
    # Sort by score descending
    scored.sort(key=lambda x: -x[1])
    
    # Get top 3
    top = scored[:5]
    best = top[0][0] if top else ''
    confidence = top[0][1] if top else 0
    
    log.info(f"Top 5: {[(p, round(s,1)) for p,s in top]}")
    
    return {
        'text': best,
        'best': best,
        'confidence': round(confidence, 1),
        'top5': [{'text': p, 'score': round(s,1)} for p,s in top]
    }

# ═══ API ═══
@app.route('/recognize', methods=['POST'])
def recognize():
    """Receive stroke data, return recognized pinyin"""
    data = request.get_json()
    if not data or 'strokes' not in data:
        return jsonify({'error': 'No stroke data', 'text': '', 'best': ''})
    
    try:
        strokes = data['strokes']
        cw = data.get('canvas_width', 340)
        ch = data.get('canvas_height', 150)
        
        result = recognize_pinyin(strokes, cw, ch)
        return jsonify(result)
    
    except Exception as e:
        log.error(f"Recognition error: {e}")
        return jsonify({'text': '', 'best': '', 'error': str(e)})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    log.info("Starting stroke-based pinyin recognition server...")
    app.run(host='127.0.0.1', port=5001, debug=False)
