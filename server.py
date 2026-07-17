from flask import Flask, request, jsonify, send_from_directory
import os
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)
ICONS_DIR = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(ICONS_DIR, exist_ok=True)

@app.route('/upload-icon', methods=['POST'])
def upload_icon():
    icon_type = request.form.get('type', '')
    
    # Handle reset: delete both icon files
    if icon_type == 'reset':
        for fn in ('correct.png', 'wrong.png', 'correct.jpg', 'wrong.jpg', 'correct.webp', 'wrong.webp', 'correct.svg', 'wrong.svg'):
            fp = os.path.join(ICONS_DIR, fn)
            if os.path.exists(fp):
                os.remove(fp)
        return jsonify({'status': 'reset'}), 200
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    if icon_type not in ('correct', 'wrong'):
        return jsonify({'error': 'type must be "correct" or "wrong"'}), 400
    
    ext = os.path.splitext(f.filename)[1] or '.png'
    ext = ext.lower()
    if ext not in ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'):
        ext = '.png'
    
    filename = secure_filename(f'{icon_type}{ext}')
    filepath = os.path.join(ICONS_DIR, filename)
    # Remove old file if exists with different extension
    old_extensions = ('.png','.jpg','.jpeg','.gif','.webp','.svg')
    for old_fn in os.listdir(ICONS_DIR):
        if old_fn.startswith(icon_type + '.') and old_fn != filename:
            os.remove(os.path.join(ICONS_DIR, old_fn))
    
    f.save(filepath)
    
    url = f'/icons/{filename}'
    return jsonify({'url': url, 'filename': filename}), 200

@app.route('/icons/<path:filename>')
def serve_icon(filename):
    return send_from_directory(ICONS_DIR, filename)

@app.route('/icons/<path:filename>', methods=['HEAD'])
def serve_icon_head(filename):
    resp = send_from_directory(ICONS_DIR, filename)
    return ('', 200, resp.headers)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=False)
