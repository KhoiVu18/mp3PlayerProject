import React, { useContext, useState } from 'react';
import { PlayerContext } from '../context/PlayerContext';


function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    isShuffled,
    isRepeating,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    setRate,
    setIsShuffled,
    setIsRepeating,
  } = useContext(PlayerContext)

  const [showSpeed, setShowSpeed] = useState(false)

  const cycleRepeat = () => {
    if (isRepeating === false) setIsRepeating('all')
    else if (isRepeating === 'all') setIsRepeating('one')
    else setIsRepeating(false)
  }

  if (!currentTrack) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 h-[88px] bg-bg-panel border-t border-border grid grid-cols-[1fr_minmax(400px,2fr)_1fr] items-center gap-6 px-6 z-[100] shadow-panel">
        <div className="col-span-full text-center text-text-muted text-[0.95rem]">
          Select a track to play
        </div>
      </footer>
    )
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-[88px] bg-bg-panel border-t border-border grid grid-cols-[1fr_minmax(400px,2fr)_1fr] items-center gap-6 px-6 z-[100] shadow-panel md:grid-cols-2 md:grid-rows-[auto_auto] md:h-auto md:p-3 md:gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-[52px] h-[52px] rounded-app-sm bg-gradient-to-br from-accent-dim to-bg-elevated shrink-0" />
        <div className="min-w-0 flex flex-col gap-0.5">
          <span className="font-semibold text-[0.95rem] truncate">{currentTrack.title}</span>
          <span className="text-[0.8rem] text-text-muted truncate">{currentTrack.artist}</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 min-w-0 md:col-span-full md:w-full">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`w-10 h-10 flex items-center justify-center rounded-app-sm transition-colors duration-150 ${
              isShuffled ? 'text-accent' : 'text-text-muted hover:bg-bg-hover hover:text-[#e8eaed]'
            }`}
            onClick={() => setIsShuffled(!isShuffled)}
            title={isShuffled ? 'Shuffle on' : 'Shuffle off'}
          >
            <ShuffleIcon />
          </button>
          <button type="button" className="w-10 h-10 flex items-center justify-center text-text-muted rounded-app-sm hover:bg-bg-hover hover:text-[#e8eaed] transition-colors duration-150" onClick={previous} title="Previous">
            <PreviousIcon />
          </button>
          <button
            type="button"
            className="w-11 h-11 mx-2 flex items-center justify-center bg-accent text-bg-deep rounded-full hover:bg-accent-hover hover:scale-105 transition-all duration-150"
            onClick={togglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button type="button" className="w-10 h-10 flex items-center justify-center text-text-muted rounded-app-sm hover:bg-bg-hover hover:text-[#e8eaed] transition-colors duration-150" onClick={next} title="Next">
            <NextIcon />
          </button>
          <button
            type="button"
            className={`w-10 h-10 flex items-center justify-center rounded-app-sm transition-colors duration-150 relative ${
              isRepeating !== false ? 'text-accent' : 'text-text-muted hover:bg-bg-hover hover:text-[#e8eaed]'
            }`}
            onClick={cycleRepeat}
            title={
              isRepeating === 'one'
                ? 'Repeat one'
                : isRepeating === 'all'
                  ? 'Repeat all'
                  : 'Repeat off'
            }
          >
            <span className="relative flex items-center justify-center">
              <RepeatIcon />
              {isRepeating === 'one' && (
                <span className="absolute -bottom-0.5 -right-1 text-[9px] font-bold tabular-nums">1</span>
              )}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-full max-w-[480px]">
          <span className="text-xs tabular-nums text-text-muted min-w-[2.5em]">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="flex-1 h-1.5"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
          />
          <span className="text-xs tabular-nums text-text-muted min-w-[2.5em]">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 md:col-start-2 md:row-start-1">
        <div className="relative">
          <button
            type="button"
            className="text-[0.8rem] font-semibold py-1.5 px-2.5 rounded-app-sm bg-bg-elevated text-text-muted min-w-12 hover:bg-bg-hover hover:text-[#e8eaed] transition-colors"
            onClick={() => setShowSpeed(!showSpeed)}
            title="Playback speed"
          >
            {playbackRate}x
          </button>
          {showSpeed && (
            <div className="absolute bottom-full right-0 mb-2 bg-bg-elevated border border-border rounded-app-sm p-1 min-w-20 shadow-panel">
              {SPEED_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`block w-full py-2 px-3 text-center text-[0.85rem] rounded-md transition-colors ${
                    r === playbackRate
                      ? 'bg-accent-dim text-accent font-semibold'
                      : 'hover:bg-bg-hover'
                  }`}
                  onClick={() => {
                    setRate(r)
                    setShowSpeed(false)
                  }}
                >
                  {r}x
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 w-32 text-text-muted">
          <VolumeIcon />
          <input
            type="range"
            className="flex-1 h-1.5 volume-slider"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </div>
      </div>
    </footer>
  )
}

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

function PreviousIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
  )
}

function NextIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  )
}

function ShuffleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
    </svg>
  )
}

function RepeatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
    </svg>
  )
}

function VolumeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  )
}
