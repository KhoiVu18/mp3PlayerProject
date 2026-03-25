from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from urllib.parse import unquote
import os
import shutil

app = Flask(__name__)
CORS(app)
import sys, io
if sys.platform == 'win32':
    # Reconfigure stdout/stderr so Flask's debug logger doesn't choke on Unicode
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def decode_filename(raw: str) -> str:
    try:
        return raw.encode('latin-1').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        # Already valid Unicode (Linux/macOS) or already correct — return as-is
        return raw

# --- 1. SETTINGS ---
MUSIC_FOLDER = os.path.join('library', 'Music', 'normal_music')
PLAYLIST_BASE_DIR = os.path.join('playlist')

for path in [MUSIC_FOLDER, PLAYLIST_BASE_DIR]:
    if not os.path.exists(path):
        os.makedirs(path)


@app.route('/library/Music/normal_music/<path:filename>')
def serve_library_music(filename):
    directory = os.path.abspath(os.path.join('library', 'Music', 'normal_music'))
    # decode_filename fixes Vietnamese/accented chars mis-decoded on Windows
    safe_name = decode_filename(filename)
    return send_from_directory(directory, safe_name)


# --- 3. PLAYLIST FILE SERVER ---
# FIX: Same `path:` fix for playlist tracks
@app.route('/api/playlists/tracks/<playlist_name>/<path:filename>')
def serve_playlist_track(playlist_name, filename):
    safe_playlist = decode_filename(playlist_name)
    safe_name     = decode_filename(filename)
    playlist_path = os.path.abspath(os.path.join(PLAYLIST_BASE_DIR, safe_playlist))
    return send_from_directory(playlist_path, safe_name)


# --- 4. LIBRARY API ---
@app.route('/api/library', methods=['GET'])
def get_library():
    songs = []
    if os.path.exists(MUSIC_FOLDER):
        for filename in os.listdir(MUSIC_FOLDER):
            if filename.lower().endswith('.mp3'):
                # os.listdir on Windows may return bytes-as-latin1; normalise to UTF-8
                safe_name = decode_filename(filename)
                songs.append({
                    "id":       safe_name,
                    "fileName": safe_name,
                    "title":    safe_name.replace('.mp3', ''),
                    "artist":   "Local Artist",
                })
    return jsonify(songs)


# --- 5. PLAYLIST API ---
@app.route('/api/playlists', methods=['GET', 'POST'])
def manage_playlists():
    if request.method == 'POST':
        data = request.json
        name = data.get('name', '').strip()
        if not name:
            return jsonify({"error": "No name provided"}), 400
        path = os.path.join(PLAYLIST_BASE_DIR, name)
        if not os.path.exists(path):
            os.makedirs(path)
        return jsonify({"id": name, "name": name, "trackIds": []}), 201

    # GET
    playlists = []
    if os.path.exists(PLAYLIST_BASE_DIR):
        for folder in os.listdir(PLAYLIST_BASE_DIR):
            folder_path = os.path.join(PLAYLIST_BASE_DIR, folder)
            if os.path.isdir(folder_path):
                song_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.mp3')]
                playlists.append({"id": folder, "name": folder, "trackIds": song_files})
    return jsonify(playlists)


@app.route('/api/playlists/add-song', methods=['POST'])
def add_song_to_playlist():
    try:
        data = request.json
        song_filename = data.get('song_filename', '').strip()
        playlist_name = data.get('playlist_name', '').strip()

        if not song_filename or not playlist_name:
            return jsonify({"error": "song_filename and playlist_name are required"}), 400

        source = os.path.join(MUSIC_FOLDER, song_filename)
        dest_folder = os.path.join(PLAYLIST_BASE_DIR, playlist_name)
        dest_path = os.path.join(dest_folder, song_filename)

        if not os.path.exists(source):
            return jsonify({"error": f"Source file not found: {source}"}), 404

        if not os.path.exists(dest_folder):
            os.makedirs(dest_folder)

        shutil.copy2(source, dest_path)
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# FIX: Added remove-song endpoint that PlaylistView's "Remove" button calls
@app.route('/api/playlists/remove-song', methods=['POST'])
def remove_song_from_playlist():
    try:
        data = request.json
        song_filename = data.get('song_filename', '').strip()
        playlist_name = data.get('playlist_name', '').strip()

        if not song_filename or not playlist_name:
            return jsonify({"error": "song_filename and playlist_name are required"}), 400

        target = os.path.join(PLAYLIST_BASE_DIR, playlist_name, song_filename)
        if not os.path.exists(target):
            return jsonify({"error": f"File not found in playlist: {target}"}), 404

        os.remove(target)
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# FIX: Added /api/sync endpoint that LibraryView's upload form posts to
@app.route('/api/sync', methods=['POST'])
def sync_files():
    try:
        # FIX: Changed key to 'files' (LibraryView was sending formData.append('files', file))
        files = request.files.getlist('files')
        if not files:
            return jsonify({"error": "No files provided"}), 400

        saved = []
        for f in files:
            if f.filename.lower().endswith('.mp3'):
                dest = os.path.join(MUSIC_FOLDER, f.filename)
                f.save(dest)
                saved.append(f.filename)

        return jsonify({"success": True, "saved": saved}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
