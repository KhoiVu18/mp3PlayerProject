import React from 'react'
import { usePlayer } from '../context/PlayerContext'

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function TrackList({ tracks, currentTrackId, onPlay, showFavorite = true, extraActions }) {
  const { isFavorite, toggleFavorite, queue, queueIndex, playQueue } = usePlayer()

  const isCurrent = (id) => currentTrackId === id

  const handleRowClick = (track, index) => {
    if (onPlay) {
      onPlay(track, index)
    } else {
      playQueue(tracks, index)
    }
  }

  if (!tracks || tracks.length === 0) {
    return (
      <div className="py-12 px-6 text-center text-text-muted text-[0.95rem] overflow-auto flex-1 min-h-0">
        No tracks here. Add songs to your library or playlist.
      </div>
    )
  }

  return (
    <div className="overflow-auto flex-1 min-h-0">
      <table className="w-full border-collapse text-[0.9rem]">
        <thead>
          <tr>
            <th className="text-left py-2.5 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider border-b border-border w-12 text-center align-middle">
              #
            </th>
            <th className="text-left py-2.5 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider border-b border-border min-w-[160px]">
              Title
            </th>
            <th className="text-left py-2.5 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider border-b border-border min-w-[120px]">
              Artist
            </th>
            <th className="text-left py-2.5 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider border-b border-border w-16 tabular-nums">
              Duration
            </th>
            {showFavorite && (
              <th className="text-left py-2.5 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider border-b border-border w-12 text-center align-middle" />
            )}
            {extraActions && (
              <th className="text-left py-2.5 px-4 font-semibold text-text-muted text-xs uppercase tracking-wider border-b border-border w-12 text-center align-middle" />
            )}
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, index) => (
            <tr
              key={track.id}
              className={`cursor-pointer transition-colors duration-150 ${
                isCurrent(track.id)
                  ? 'bg-accent-dim text-accent'
                  : 'hover:bg-bg-hover'
              }`}
              onClick={() => handleRowClick(track, index)}
            >
              <td className="py-3 px-4 border-b border-border w-12 text-center align-middle">
                {isCurrent(track.id) ? (
                  <span className="text-accent text-base">♪</span>
                ) : (
                  <span className="text-text-muted tabular-nums">{index + 1}</span>
                )}
              </td>
              <td className="py-3 px-4 border-b border-border min-w-[160px]">
                <span className="font-medium">{track.title}</span>
              </td>
              <td className="py-3 px-4 border-b border-border min-w-[120px]">
                <span className={isCurrent(track.id) ? 'text-inherit' : 'text-text-muted'}>
                  {track.artist}
                </span>
              </td>
              <td className={`py-3 px-4 border-b border-border w-16 tabular-nums ${isCurrent(track.id) ? 'text-inherit' : 'text-text-muted'}`}>
                {formatDuration(track.duration)}
              </td>
              {showFavorite && (
                <td
                  className="py-3 px-4 border-b border-border w-12 text-center align-middle"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={`p-1.5 text-base rounded-app-sm hover:scale-110 transition-all ${
                      isFavorite(track.id) ? 'text-danger' : 'text-text-muted hover:text-danger'
                    }`}
                    onClick={() => toggleFavorite(track.id)}
                    title={isFavorite(track.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    ♥
                  </button>
                </td>
              )}
              {extraActions && (
                <td
                  className="py-3 px-4 border-b border-border w-12 text-center align-middle"
                  onClick={(e) => e.stopPropagation()}
                >
                  {extraActions(track)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
