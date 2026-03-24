import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

export const PlayerContext = createContext(null);

const STORAGE_KEYS = {
  favorites: 'mp3-player-favorites',
};

export function PlayerProvider({ children }) {
  const [playlists, setPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [library, setLibrary] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.favorites);
    return saved ? JSON.parse(saved) : [];
  });
  const [isListening, setIsListening] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [playbackRate, setRate] = useState(1);
  const [speed, setSpeed] = useState(1);  // FIX: kept only one definition (was duplicated below)

  const audioRef = useRef(null);

  // Shuffle queue — holds a pre-randomised copy of the library indices.
  // We pop from the end so every track plays exactly once before reshuffling.
  const shuffleQueueRef = useRef([]);

  const filteredLibrary = library.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Fetch Library from Flask Backend ---
  // FIX: Removed the duplicate bare `fetch` useEffect that ran alongside fetchLibrary.
  // Only one fetch path is needed — the one inside fetchLibrary below.
  const fetchLibrary = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/library');
      const data = await response.json();

      const updatedTracks = data.map(track => {
        // External tracks have id like "ext0::filename.mp3"
        const isExternal = track.id.startsWith('ext');
        let url;
        if (isExternal) {
          const [prefix, fileName] = track.id.split('::');
          const folderIdx = prefix.replace('ext', '');
          url = `http://127.0.0.1:5000/external/${folderIdx}/${encodeURIComponent(fileName)}`;
        } else {
          // Primary library — encodeURIComponent handles spaces + Vietnamese chars
          url = `http://127.0.0.1:5000/library/Music/normal_music/${encodeURIComponent(track.id)}`;
        }
        return {
          ...track,
          url,
          fileName: track.fileName || track.id,
        };
      });

      setLibrary(updatedTracks);
    } catch (error) {
      console.error("Error fetching library:", error);
    }
  }, []);

  const fetchPlaylists = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/playlists');
      const data = await response.json();
      setPlaylists(data);
    } catch (err) {
      console.error("Error updating playlists:", err);
    }
  }, []);

  // Single bootstrap effect — fetches library + playlists once on mount
  useEffect(() => {
    fetchLibrary();
    fetchPlaylists();
  }, [fetchLibrary, fetchPlaylists]);

  // --- Persist Favorites ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }, [favorites]);

  // --- Sync audio volume whenever state changes ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // --- Sync playback rate whenever state changes ---
  // FIX: Merged two separate (conflicting) playbackRate effects into one.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // --- Sync speed (separate state used by some UI controls) ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  // --- Load & play whenever currentTrack changes ---
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;

      if (isPlaying) {
        audioRef.current.play().catch(() => {
          console.log("Playback interaction handled");
        });
      }
    }
    // FIX: isPlaying intentionally omitted from deps — we only re-load on track change,
    // not every time pause/play toggles (that is handled by togglePlay).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  // --- Playback Controls ---
  const playTrack = useCallback((track) => {
    if (!track) return;
    setCurrentTrack(track);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(prev => !prev);
  }, [isPlaying]);

  // FIX: `previous` was crashing when currentTrack was null (no null guard)
  const previous = useCallback(() => {
    if (!currentTrack || library.length === 0) return;
    const currentIndex = library.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(library[currentIndex - 1]);
    }
  }, [currentTrack, library]);

  // Build a new Fisher-Yates shuffled index queue, excluding the current track
  // so it doesn't play again immediately after toggling shuffle on.
  const buildShuffleQueue = useCallback((trackList, currentId) => {
    const indices = trackList
      .map((_, i) => i)
      .filter(i => trackList[i].id !== currentId);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    shuffleQueueRef.current = indices;
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled(prev => {
      const turningOn = !prev;
      if (turningOn) {
        // Pre-build the queue right away so the very next "next()" call uses it
        buildShuffleQueue(library, currentTrack?.id);
      } else {
        shuffleQueueRef.current = [];
      }
      return turningOn;
    });
  }, [library, currentTrack, buildShuffleQueue]);

  const next = useCallback(() => {
    if (library.length === 0) return;

    if (isShuffled) {
      // If the queue is empty, rebuild it (all songs played — start a new round)
      if (shuffleQueueRef.current.length === 0) {
        buildShuffleQueue(library, currentTrack?.id);
      }
      // Pop the next index from the end of the queue
      const nextIndex = shuffleQueueRef.current.pop();
      setCurrentTrack(library[nextIndex]);
    } else {
      const currentIndex = library.findIndex(t => t.id === currentTrack?.id);
      const nextIndex = (currentIndex + 1) % library.length;
      setCurrentTrack(library[nextIndex]);
    }
  }, [currentTrack, library, isShuffled, buildShuffleQueue]);

  const seek = useCallback((value) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  }, []);

  // FIX: handleSeek was calling setTrackProgress which was never defined — replaced with setCurrentTime
  const handleSeek = useCallback((newTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const handleTrackEnd = useCallback(() => {
    if (isRepeating === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (isRepeating === 'all') {
      next();
    } else {
      const currentIndex = library.findIndex(t => t.id === currentTrack?.id);
      if (currentIndex < library.length - 1) {
        next();
      } else {
        setIsPlaying(false);
      }
    }
  }, [isRepeating, currentTrack, library, next]);

  // --- Playlist Controls ---
  const createPlaylist = useCallback(async (name) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      setPlaylists(prev => [...prev, data]);
      return data.id;
    } catch (err) {
      console.error("Failed to create playlist folder:", err);
    }
  }, []);

  const addSongToPlaylist = useCallback(async (songFilename, playlistName) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/playlists/add-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song_filename: songFilename,
          playlist_name: playlistName,
        }),
      });
      if (response.ok) {
        alert(`Success! ${songFilename} added to ${playlistName}`);
        fetchPlaylists();
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, [fetchPlaylists]);

  // FIX: removeFromPlaylist was used in PlaylistView but was never defined here
  const removeFromPlaylist = useCallback(async (playlistId, fileName) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/playlists/remove-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlist_name: playlistId, song_filename: fileName }),
      });
      if (response.ok) {
        fetchPlaylists();
      }
    } catch (err) {
      console.error("Remove from playlist error:", err);
    }
  }, [fetchPlaylists]);

  const playQueue = useCallback((tracks, index) => {
    const track = tracks[index];
    if (track) {
      playTrack(track);
    }
  }, [playTrack]);

  const playNextTrack = useCallback(() => {
    next();
  }, [next]);

  const toggleFavorite = useCallback((trackId) => {
    setFavorites(prev =>
      prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId]
    );
  }, []);

  const isFavorite = useCallback((trackId) => favorites.includes(trackId), [favorites]);

  // FIX: Removed stale `contextValue` object defined mid-file that shadowed real values.
  // Everything is consolidated into the single `value` object below.
  const value = {
    audioRef,
    library,
    filteredLibrary,
    favorites,
    playlists,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    speed,
    isRepeating,
    isShuffled,
    searchQuery,
    isListening,

    setVolume,
    setRate,
    setSpeed,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setPlaylists,
    setIsRepeating,
    setIsShuffled,
    toggleShuffle,
    setSearchQuery,
    setIsListening,

    togglePlay,
    playTrack,
    playQueue,
    playFromLibrary: (track) => playTrack(track),
    playNextTrack,
    previous,
    next,
    seek,
    handleSeek,
    handleTrackEnd,
    isFavorite,
    toggleFavorite,
    fetchLibrary,
    fetchPlaylists,
    createPlaylist,
    addSongToPlaylist,
    removeFromPlaylist,

    getTrackById: (id) =>
      library.find(t => t.id === id || t.fileName === id || t.id === String(id)),
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={handleTrackEnd}
      />
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);