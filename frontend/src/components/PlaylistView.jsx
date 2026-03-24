import React, { useState, useContext, useEffect } from 'react'
import { PlayerContext } from '../context/PlayerContext'
import TrackList from './TrackList'

export default function PlaylistView() {
  const {
    playlists = [],
    library = [],
    currentTrack,
    playQueue,
    createPlaylist,
    removeFromPlaylist, // FIX: This was used but never provided by old PlayerContext — now defined there
  } = useContext(PlayerContext);

  const [selectedId, setSelectedId] = useState(null);
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Auto-select the first playlist if nothing is selected
  useEffect(() => {
    if (!selectedId && playlists.length > 0) {
      setSelectedId(playlists[0].id);
    }
  }, [playlists, selectedId]);

  const selected = playlists?.find((p) => p.id === selectedId);

  // Build track objects for the selected playlist
  const tracks = selected?.trackIds
    ? selected.trackIds.map(fileName => {
        const libraryTrack = library.find(t => t.fileName === fileName);

        // FIX: Encode the filename so special chars/spaces don't produce 404s
        // e.g. "Born To Die_spotdown.org.mp3" → "Born%20To%20Die_spotdown.org.mp3"
        const encodedFileName = encodeURIComponent(fileName);
        const playlistUrl = `http://127.0.0.1:5000/api/playlists/tracks/${encodeURIComponent(selected.name)}/${encodedFileName}`;

        return {
          ...libraryTrack,
          id: `${selected.name}-${fileName}`,
          title: libraryTrack?.title || fileName.replace('.mp3', ''),
          artist: libraryTrack?.artist || 'Playlist Track',
          fileName,
          url: playlistUrl,
        };
      })
    : [];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newId = await createPlaylist(newName.trim());
    if (newId) {
      setSelectedId(newId);
      setNewName('');
      setShowCreate(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg-deep">

      {/* 1. SIDEBAR */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col bg-bg-panel h-full">
        <header className="flex items-center justify-between py-5 px-4 pb-3">
          <h2 className="text-[0.85rem] font-semibold text-text-muted uppercase tracking-wider">
            Playlists
          </h2>
          <button
            onClick={() => setShowCreate(true)}
            className="text-xl text-text-muted hover:text-accent transition-colors"
            aria-label="Create new playlist"
          >
            +
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-2">
          {playlists.length === 0 ? (
            // FIX: Show helpful empty state in sidebar
            <p className="text-xs text-text-muted px-3 pt-2">No playlists yet</p>
          ) : (
            playlists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => setSelectedId(playlist.id)}
                className={`p-3 mb-1 rounded-md cursor-pointer transition-colors ${
                  selectedId === playlist.id ? 'bg-bg-hover' : 'hover:bg-bg-elevated'
                }`}
              >
                <p className="font-medium text-[#e8eaed] truncate">{playlist.name}</p>
                <span className="text-xs text-text-muted">
                  {(playlist.trackIds || []).length} songs
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-bg-deep">
        {selected ? (
          <>
            <header className="flex items-center justify-between py-5 px-6 pb-4 border-b border-border shrink-0">
              <div>
                <h1 className="text-2xl font-bold text-[#e8eaed]">{selected.name}</h1>
                <p className="text-sm text-text-muted">{tracks.length} tracks</p>
              </div>
              {tracks.length > 0 && (
                <button
                  type="button"
                  className="py-2.5 px-6 bg-accent text-bg-deep font-bold rounded-full hover:scale-105 transition-transform"
                  onClick={() => playQueue(tracks, 0)}
                >
                  Play All
                </button>
              )}
            </header>

            <div className="flex-1 overflow-y-auto">
              {tracks.length === 0 ? (
                // FIX: Show empty state when playlist has no songs
                <div className="flex flex-col items-center justify-center h-full text-text-muted">
                  <p className="text-lg">This playlist is empty</p>
                  <p className="text-sm mt-1">Go to Library and add songs here</p>
                </div>
              ) : (
                <TrackList
                  tracks={tracks}
                  currentTrackId={currentTrack?.id}
                  onPlay={(track) =>
                    playQueue(tracks, tracks.findIndex((t) => t.id === track.id))
                  }
                  showFavorite
                  extraActions={(track) => (
                    <button
                      className="text-xs text-text-muted hover:text-red-500 px-2 py-1 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // FIX: Guard against removeFromPlaylist being undefined
                        if (removeFromPlaylist) {
                          removeFromPlaylist(selected.id, track.fileName);
                        }
                      }}
                    >
                      Remove
                    </button>
                  )}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
            <p className="mb-4 text-lg">No playlist selected</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-accent underline"
            >
              Create your first playlist
            </button>
          </div>
        )}
      </div>

      {/* 3. NEW PLAYLIST MODAL */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200]"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-bg-panel border border-border rounded-app p-6 w-full max-w-[360px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 text-xl font-bold text-[#e8eaed]">New playlist</h2>
            <form onSubmit={handleCreate}>
              <label className="block mb-3.5 text-[0.85rem] text-text-muted">
                Name
                <input
                  className="block w-full mt-1.5 py-2.5 px-3 bg-bg-elevated border border-border rounded-app-sm text-[#e8eaed] text-[0.95rem] focus:outline-none focus:border-accent"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="E.g. Study Vibes"
                  autoFocus
                />
              </label>
              <div className="flex gap-2.5 justify-end mt-5">
                <button
                  type="button"
                  className="py-2 px-4 text-text-muted hover:text-white"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-accent text-bg-deep font-bold rounded-app-sm hover:bg-accent-hover"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}