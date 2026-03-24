import React from 'react'

const NAV = [
  { id: 'library', label: 'Library', icon: LibraryIcon },
  { id: 'favorites', label: 'Favorites', icon: HeartIcon },
  { id: 'playlists', label: 'Playlists', icon: PlaylistIcon },
]

export default function Sidebar({ view, onViewChange }) {
  return (
    <aside className="w-[220px] shrink-0 bg-bg-panel border-r border-border py-5 flex flex-col gap-6">
      <div className="flex items-center gap-2.5 px-5 font-bold text-base text-[#e8eaed]">
        <span className="text-2xl text-accent">♪</span>
        <span>MP3 Player</span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`flex items-center gap-3 py-3 px-5 w-full text-left text-[0.95rem] rounded-none transition-colors duration-150 ${
              view === item.id
                ? 'bg-accent-dim text-accent font-semibold'
                : 'text-text-muted hover:bg-bg-hover hover:text-[#e8eaed]'
            }`}
            onClick={() => onViewChange(item.id)}
          >
            <item.icon />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

function LibraryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-90">
      <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5c0 1.38-1.12 2.5-2.5 2.5S10 13.88 10 12.5s1.12-2.5 2.5-2.5c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-90">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

function PlaylistIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-90">
      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
    </svg>
  )
}
