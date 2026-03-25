import React, { useState, useContext } from 'react';
import { PlayerContext } from '../context/PlayerContext';

export default function SleepTimerModal() {
  // Safe destructuring with fallbacks — if the context is still the old version,
  // this prevents a crash and logs a clear warning instead.
  const ctx = useContext(PlayerContext);

  const {
    sleepTime       = '',
    setSleepTime    = null,
    sleepActive     = false,
    sleepAlert      = false,
    setSleepAlert   = null,
    startSleepTimer = null,
    cancelSleepTimer = null,
  } = ctx || {};

  // Detect stale context and surface a visible error instead of a cryptic crash
  const contextReady = typeof setSleepTime === 'function';

  const [showSettings, setShowSettings] = useState(false);
  const [inputTime, setInputTime]       = useState('');
  const [inputError, setInputError]     = useState('');

  // Open the panel and sync input to the current saved time
  const openSettings = () => {
    setInputTime(sleepTime || '');
    setInputError('');
    setShowSettings(true);
  };

  const getCountdown = () => {
    if (!sleepTime) return null;
    const now    = new Date();
    const [h, m] = sleepTime.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const mins  = Math.floor((target - now) / 60_000);
    const hours = Math.floor(mins / 60);
    const rem   = mins % 60;
    return hours > 0 ? `${hours}h ${rem}m` : `${rem}m`;
  };

  const handleActivate = () => {
    if (!contextReady) return;
    if (!inputTime) { setInputError('Please choose a time first.'); return; }
    setInputError('');
    setSleepTime(inputTime);
    startSleepTimer(inputTime);
    setShowSettings(false);
  };

  const handleUpdate = () => {
    if (!contextReady || !inputTime) return;
    setSleepTime(inputTime);
    startSleepTimer(inputTime);
    setShowSettings(false);
  };

  const handleCancel = () => {
    if (!contextReady) return;
    cancelSleepTimer();
    setSleepTime('');
    setInputTime('');
    setShowSettings(false);
  };

  return (
    <>
      {/* ── Trigger button (place in your player bar) ── */}
      <button
        onClick={openSettings}
        title={sleepActive ? `Sleep timer active (${sleepTime})` : 'Set sleep timer'}
        className={`relative p-2 rounded-full transition-colors ${
          sleepActive ? 'text-accent' : 'text-text-muted hover:text-white'
        }`}
      >
        <MoonIcon />
        {sleepActive && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-accent rounded-full border-2 border-bg-deep" />
        )}
      </button>

      {/* ── Settings panel ── */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-end sm:justify-center p-4 sm:p-6"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-bg-panel border border-border rounded-app shadow-2xl p-6 w-full max-w-xs"
            onClick={e => e.stopPropagation()}
          >
            {/* Stale context warning — shows if PlayerContext wasn't updated */}
            {!contextReady && (
              <div className="mb-4 px-3 py-2 bg-red-500/15 border border-red-500/40 rounded-md text-red-400 text-xs leading-relaxed">
                ⚠️ PlayerContext is outdated. Replace{' '}
                <code className="font-mono">src/context/PlayerContext.jsx</code>{' '}
                with the new version and restart the dev server.
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-white">
                <MoonIcon />
                <h3 className="font-bold text-lg">Sleep Timer</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-text-muted hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Time input */}
            <label className="block text-text-muted text-sm mb-1">Stop music at</label>
            <input
              type="time"
              value={inputTime}
              onChange={e => { setInputTime(e.target.value); setInputError(''); }}
              className="w-full bg-bg-elevated border border-border rounded-app-sm px-3 py-2.5
                         text-white text-base focus:outline-none focus:border-accent
                         [color-scheme:dark]"
            />
            {inputError && <p className="text-red-400 text-xs mt-1">{inputError}</p>}

            {/* Active countdown badge */}
            {sleepActive && sleepTime && (
              <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-accent/10 border border-accent/30 rounded-md">
                <span className="text-accent text-sm">⏱</span>
                <span className="text-accent text-sm font-medium">
                  Fires in ~{getCountdown()} at {sleepTime}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              {!sleepActive ? (
                // Not armed → single "Set Timer" button
                <button
                  onClick={handleActivate}
                  disabled={!contextReady}
                  className="flex-1 py-2.5 px-4 bg-accent text-bg-deep font-bold
                             rounded-app-sm hover:scale-[1.02] transition-transform text-sm
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Set Timer
                </button>
              ) : (
                // Armed → Cancel + Update
                <>
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-2.5 px-4 border border-red-500/50 text-red-400
                               rounded-app-sm font-semibold hover:bg-red-500/10 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-1 py-2.5 px-4 bg-bg-elevated border border-border text-white
                               rounded-app-sm font-semibold hover:border-accent transition-colors text-sm"
                  >
                    Update
                  </button>
                </>
              )}
            </div>

            <p className="text-text-muted text-xs mt-3 text-center leading-relaxed">
              Music pauses automatically and you'll see a reminder at the set time.
            </p>
          </div>
        </div>
      )}

      {/* ── Good-night alert overlay (fires when the time is reached) ── */}
      {sleepAlert && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 text-center px-8 max-w-sm">
            <div className="text-8xl select-none animate-bounce">🌙</div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-3">Time to sleep</h2>
              <p className="text-text-muted text-base leading-relaxed">
                It's {sleepTime}. Your music has been paused.
                <br />
                Rest well 
              </p>
            </div>
            <div className="text-xl tracking-[0.5em] opacity-50 select-none">✦ ✦ ✦</div>
            <button
              onClick={() => setSleepAlert && setSleepAlert(false)}
              className="py-3 px-10 bg-accent text-bg-deep font-bold rounded-full
                         text-lg hover:scale-105 transition-transform"
            >
              Good night 👋
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  );
}