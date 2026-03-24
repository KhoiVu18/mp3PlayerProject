import React, { useState, useContext } from 'react'
import { PlayerContext } from '../context/PlayerContext'
import TrackList from './TrackList'

export default function LibraryView() {
  const {
    addSongToPlaylist,
    setIsListening,
    isListening,
    filteredLibrary,
    searchQuery,
    setSearchQuery,
    currentTrack,
    fetchLibrary,
    playTrack,
  } = useContext(PlayerContext);

  const [showAdd, setShowAdd] = useState(false);

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice search not supported.");

    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      setSearchQuery(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const formData = new FormData();
    // FIX: Changed 'files[]' key to 'files' to match what Flask expects
    // (Flask's request.files.getlist('files') is the standard pattern)
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch('http://127.0.0.1:5000/api/sync', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        alert("Sync Successful!");
        fetchLibrary();
        setShowAdd(false);
      } else {
        // FIX: Show meaningful error from server instead of silently failing
        const err = await response.json().catch(() => ({}));
        alert(`Sync failed: ${err.error || response.statusText}`);
      }
    } catch (err) {
      console.error("Sync error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-deep overflow-hidden">
      {/* Header with Search */}
      <header className="flex items-center justify-between py-6 px-8 shrink-0">
        <div className="relative flex items-center w-full max-w-md">
          <input
            type="text"
            placeholder="Search library..."
            className="w-full bg-bg-elevated border border-border rounded-full py-2 px-10 focus:outline-none focus:border-accent text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {/* FIX: Added left search icon padding to not overlap text with the mic button */}
          <span className="absolute left-3 text-text-muted pointer-events-none">
            <SearchIcon />
          </span>
          <button
            onClick={startVoiceSearch}
            className={`absolute right-3 ${isListening ? 'text-accent animate-pulse' : 'text-text-muted'}`}
          >
            <MicIcon />
          </button>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="ml-4 py-2 px-6 bg-accent text-bg-deep font-bold rounded-full hover:scale-105 transition-all"
        >
          + Sync MP3
        </button>
      </header>

      {/* The List of All Songs */}
      <div className="flex-1 overflow-y-auto px-4">
        {filteredLibrary.length === 0 ? (
          // FIX: Added empty-state message so the UI doesn't appear broken on empty library
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <p className="text-lg">No tracks found</p>
            {searchQuery && (
              <button
                className="mt-2 text-accent underline text-sm"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <TrackList
            tracks={filteredLibrary}
            currentTrackId={currentTrack?.id}
            onPlay={(track) => playTrack(track)}
            extraActions={(track) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const pName = prompt("Enter playlist name:");
                  // FIX: Guard against empty/cancelled prompt
                  if (pName && pName.trim()) {
                    addSongToPlaylist(track.fileName || track.id, pName.trim());
                  }
                }}
                className="ml-2 px-3 py-1 text-xs border border-border rounded-full hover:text-accent text-text-muted"
              >
                + Add to Playlist
              </button>
            )}
          />
        )}
      </div>

      {/* Sync Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          // FIX: Allow closing modal by clicking backdrop
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-bg-panel border border-border rounded-app p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Upload MP3 Files</h2>
            <input
              type="file"
              accept=".mp3"
              multiple
              onChange={handleUpload}
              className="mb-4 block w-full text-sm text-gray-400"
            />
            <button
              onClick={() => setShowAdd(false)}
              className="text-text-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}