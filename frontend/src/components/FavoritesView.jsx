import React from 'react'
import { usePlayer } from '../context/PlayerContext'
import TrackList from './TrackList'

export default function FavoritesView() {
  const { library, favorites, getTrackById, playQueue, currentTrack } = usePlayer()
  const tracks = favorites.map((id) => getTrackById(id)).filter(Boolean)

  return (
    <div className="flex flex-col min-h-0 overflow-hidden">
      <header className="flex items-center justify-between py-5 px-6 pb-4 border-b border-border shrink-0">
        <h1 className="text-2xl font-bold text-[#e8eaed]">Favorites</h1>
        {tracks.length > 0 && (
          <button
            type="button"
            className="py-2.5 px-[18px] bg-bg-elevated text-[#e8eaed] font-medium text-[0.9rem] rounded-app-sm border border-border hover:bg-bg-hover transition-colors"
            onClick={() => playQueue(tracks, 0)}
          >
            Play all
          </button>
        )}
      </header>
      <TrackList
        tracks={tracks}
        currentTrackId={currentTrack?.id}
        onPlay={(track) => playQueue(tracks, tracks.findIndex((t) => t.id === track.id))}
        showFavorite
      />
    </div>
  )
}
