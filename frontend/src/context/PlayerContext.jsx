import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

export const PlayerContext = createContext(null);

const STORAGE_KEYS = {
  favorites:   'mp3-player-favorites',
  sleepTimer:  'mp3-player-sleep-timer', // persists the configured time across reloads
};

export function PlayerProvider({ children }) {
  const [playlists, setPlaylists]       = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [library, setLibrary]           = useState([]);
  const [favorites, setFavorites]       = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.favorites);
    return saved ? JSON.parse(saved) : [];
  });
  const [isListening, setIsListening]   = useState(false);
  const [isShuffled, setIsShuffled]     = useState(false);
  const [isRepeating, setIsRepeating]   = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [currentTime, setCurrentTime]   = useState(0);
  const [duration, setDuration]         = useState(0);
  const [volume, setVolume]             = useState(0.7);
  const [playbackRate, setRate]         = useState(1);
  const [speed, setSpeed]               = useState(1);

  const [sleepTime, setSleepTime]     = useState(
    () => localStorage.getItem(STORAGE_KEYS.sleepTimer) || ''
  );
  const [sleepActive, setSleepActive] = useState(false);
  const [sleepAlert, setSleepAlert]   = useState(false);

  const audioRef        = useRef(null);
  const shuffleQueueRef = useRef([]);
  const sleepTimerRef   = useRef(null); // holds the setInterval ID

  const filteredLibrary = library.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Fetch library from Flask ---
  const fetchLibrary = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/library');
      const data = await response.json();
      const updatedTracks = data.map(track => {
        const isExternal = track.id.startsWith('ext');
        let url;
        if (isExternal) {
          const [prefix, fileName] = track.id.split('::');
          const folderIdx = prefix.replace('ext', '');
          url = `http://127.0.0.1:5000/external/${folderIdx}/${encodeURIComponent(fileName)}`;
        } else {
          url = `http://127.0.0.1:5000/library/Music/normal_music/${encodeURIComponent(track.id)}`;
        }
        return { ...track, url, fileName: track.fileName || track.id };
      });
      setLibrary(updatedTracks);
    } catch (error) {
      console.error('Error fetching library:', error);
    }
  }, []);

  const fetchPlaylists = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/playlists');
      const data = await response.json();
      setPlaylists(data);
    } catch (err) {
      console.error('Error fetching playlists:', err);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
    fetchPlaylists();
  }, [fetchLibrary, fetchPlaylists]);

  // --- Persist favorites ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }, [favorites]);

  // --- Persist configured sleep time ---
  useEffect(() => {
    if (sleepTime) localStorage.setItem(STORAGE_KEYS.sleepTimer, sleepTime);
    else           localStorage.removeItem(STORAGE_KEYS.sleepTimer);
  }, [sleepTime]);

  // --- Audio sync ---
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackRate; }, [playbackRate]);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = speed; }, [speed]);

  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    audioRef.current.src = currentTrack.url;
    audioRef.current.volume = volume;
    audioRef.current.playbackRate = playbackRate;
    if (isPlaying) audioRef.current.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  const triggerSleep = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setSleepActive(false);
    setSleepAlert(true);
    clearInterval(sleepTimerRef.current);
    sleepTimerRef.current = null;
  }, []);

  const startSleepTimer = useCallback((time) => {
    
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);

    setSleepActive(true);

    sleepTimerRef.current = setInterval(() => {
      const now  = new Date();
      const hhmm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      if (hhmm === time) triggerSleep();
    }, 10_000);
  }, [triggerSleep]);

  const cancelSleepTimer = useCallback(() => {
    clearInterval(sleepTimerRef.current);
    sleepTimerRef.current = null;
    setSleepActive(false);
  }, []);


  useEffect(() => () => clearInterval(sleepTimerRef.current), []);

 
  useEffect(() => {
    if (sleepTime) startSleepTimer(sleepTime);
  
  }, []); 
  const buildShuffleQueue = useCallback((trackList, currentId) => {
    const indices = trackList.map((_, i) => i).filter(i => trackList[i].id !== currentId);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    shuffleQueueRef.current = indices;
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled(prev => {
      if (!prev) buildShuffleQueue(library, currentTrack?.id);
      else shuffleQueueRef.current = [];
      return !prev;
    });
  }, [library, currentTrack, buildShuffleQueue]);

  // ---------------------------------------------------------------------------
  // PLAYBACK
  // ---------------------------------------------------------------------------
  const playTrack = useCallback((track) => {
    if (!track) return;
    setCurrentTrack(track);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(p => !p);
  }, [isPlaying]);

  const seek = useCallback((value) => {
    if (audioRef.current) { audioRef.current.currentTime = value; setCurrentTime(value); }
  }, []);

  const previous = useCallback(() => {
    if (!currentTrack || library.length === 0) return;
    const idx = library.findIndex(t => t.id === currentTrack.id);
    if (idx > 0) setCurrentTrack(library[idx - 1]);
  }, [currentTrack, library]);

  const next = useCallback(() => {
    if (library.length === 0) return;
    if (isShuffled) {
      if (shuffleQueueRef.current.length === 0) buildShuffleQueue(library, currentTrack?.id);
      setCurrentTrack(library[shuffleQueueRef.current.pop()]);
    } else {
      const idx = library.findIndex(t => t.id === currentTrack?.id);
      setCurrentTrack(library[(idx + 1) % library.length]);
    }
  }, [currentTrack, library, isShuffled, buildShuffleQueue]);

  const handleTrackEnd = useCallback(() => {
    if (isRepeating === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (isRepeating === 'all') {
      next();
    } else {
      const idx = library.findIndex(t => t.id === currentTrack?.id);
      if (idx < library.length - 1) next();
      else setIsPlaying(false);
    }
  }, [isRepeating, currentTrack, library, next]);

  const playQueue = useCallback((tracks, index) => {
    if (tracks[index]) playTrack(tracks[index]);
  }, [playTrack]);

  // ---------------------------------------------------------------------------
  // PLAYLISTS
  // ---------------------------------------------------------------------------
  const createPlaylist = useCallback(async (name) => {
    try {
      const res  = await fetch('http://127.0.0.1:5000/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      setPlaylists(prev => [...prev, data]);
      return data.id;
    } catch (err) { console.error('Create playlist error:', err); }
  }, []);

  const addSongToPlaylist = useCallback(async (songFilename, playlistName) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/playlists/add-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_filename: songFilename, playlist_name: playlistName }),
      });
      if (res.ok) { alert(`Added to ${playlistName}`); fetchPlaylists(); }
    } catch (err) { console.error('Add song error:', err); }
  }, [fetchPlaylists]);

  const removeFromPlaylist = useCallback(async (playlistId, fileName) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/playlists/remove-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlist_name: playlistId, song_filename: fileName }),
      });
      if (res.ok) fetchPlaylists();
    } catch (err) { console.error('Remove song error:', err); }
  }, [fetchPlaylists]);

  // ---------------------------------------------------------------------------
  // FAVORITES
  // ---------------------------------------------------------------------------
  const toggleFavorite = useCallback((id) =>
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  , []);
  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------------------------
  const value = {
    audioRef, library, filteredLibrary, favorites, playlists,
    currentTrack, isPlaying, currentTime, duration,
    volume, playbackRate, speed,
    isRepeating, isShuffled, searchQuery, isListening,

    // Sleep timer
    sleepTime, setSleepTime,
    sleepActive, sleepAlert, setSleepAlert,
    startSleepTimer, cancelSleepTimer,

    setVolume, setRate, setSpeed, setCurrentTime, setDuration,
    setIsPlaying, setPlaylists, setIsRepeating, setIsShuffled,
    setSearchQuery, setIsListening,

    togglePlay, playTrack, playQueue,
    playFromLibrary: playTrack,
    playNextTrack: next,
    previous, next, seek,
    handleSeek: seek,
    handleTrackEnd,
    toggleShuffle,
    isFavorite, toggleFavorite,
    fetchLibrary, fetchPlaylists,
    createPlaylist, addSongToPlaylist, removeFromPlaylist,

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
