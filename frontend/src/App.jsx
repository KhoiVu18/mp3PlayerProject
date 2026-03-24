import React, { useState } from 'react'
import { PlayerProvider } from './context/PlayerContext'
import Sidebar from './components/Sidebar'
import PlayerBar from './components/PlayerBar'

// 👇 ADD THESE THREE LINES TO FIX THE ERROR
import LibraryView from './components/LibraryView'
import FavoritesView from './components/FavoritesView'
import PlaylistView from './components/PlaylistView'

function AppContent() {
  const [view, setView] = useState('library')

  return (
    <div className="flex flex-row min-h-screen bg-bg-deep pb-[88px]">
      <Sidebar view={view} onViewChange={setView} />
      <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-bg-deep overflow-hidden">
        {view === 'library' && <LibraryView />}
        {view === 'favorites' && <FavoritesView />}
        {view === 'playlists' && <PlaylistView />}
      </main>
      <PlayerBar />
    </div>
  )
}

export default function App() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  )
}