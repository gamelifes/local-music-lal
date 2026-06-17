import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '../store/player'
import { useLibraryStore } from '../store/library'
import { Layout } from '../components/Layout'
import * as audio from '../lib/audio'

export function Player() {
  const currentSong = usePlayerStore((s) => s.currentSong)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const progress = usePlayerStore((s) => s.progress)
  const volume = usePlayerStore((s) => s.volume)
  const play = usePlayerStore((s) => s.play)
  const pause = usePlayerStore((s) => s.pause)
  const resume = usePlayerStore((s) => s.resume)
  const seek = usePlayerStore((s) => s.seek)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const songs = useLibraryStore((s) => s.songs)

  const progressRef = useRef<HTMLDivElement>(null)

  const currentIndex = songs.findIndex((s) => s.id === currentSong?.id)

  const playNext = useCallback(() => {
    if (songs.length === 0) return
    const nextIdx = (currentIndex + 1) % songs.length
    play(songs[nextIdx])
  }, [currentIndex, songs, play])

  const playPrev = useCallback(() => {
    if (songs.length === 0) return
    const prevIdx = (currentIndex - 1 + songs.length) % songs.length
    play(songs[prevIdx])
  }, [currentIndex, songs, play])

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      const duration = audio.getDuration()
      const position = audio.getPosition()
      if (duration > 0) {
        usePlayerStore.getState().setProgress((position / duration) * 100)
        usePlayerStore.setState({ duration })
      }
    }, 250)
    return () => clearInterval(interval)
  }, [isPlaying])

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !currentSong) return
    const rect = progressRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const duration = usePlayerStore.getState().duration
    seek(ratio * duration)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const duration = usePlayerStore((s) => s.duration)
  const currentTime = (progress / 100) * duration

  return (
    <Layout title="正在播放">
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-120px)] px-6">
        {/* Album Art Circle */}
        <div className="relative mb-8">
          <div
            className={`w-56 h-56 rounded-full border-4 border-accent/30 flex items-center justify-center ${
              isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''
            }`}
            style={{
              background: currentSong
                ? 'conic-gradient(from 0deg, oklch(0.72 0.16 82), oklch(0.5 0.1 82), oklch(0.72 0.16 82))'
                : 'conic-gradient(from 0deg, #333, #555, #333)',
            }}
          >
            <div className="w-48 h-48 rounded-full bg-bg flex items-center justify-center border-2 border-white/5">
              <div className="w-40 h-40 rounded-full bg-white/5 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                </div>
              </div>
            </div>
          </div>
          {isPlaying && (
            <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-[pulse_2s_ease-in-out_infinite]" />
          )}
        </div>

        {/* Song Info */}
        <div className="text-center mb-8 w-full max-w-xs">
          <h2 className="text-xl font-bold text-text truncate mb-1">
            {currentSong?.title || '未在播放'}
          </h2>
          <p className="text-sm text-text-secondary truncate">
            {currentSong?.artist || '选择一首歌曲开始'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs mb-4">
          <div
            ref={progressRef}
            className="relative h-1.5 bg-white/10 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div
              className="absolute h-full bg-accent rounded-full transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute w-3 h-3 bg-accent rounded-full -top-[4.5px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-accent/40"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-text-secondary">{formatTime(currentTime)}</span>
            <span className="text-[11px] text-text-secondary">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mb-6">
          <button
            onClick={playPrev}
            className="p-2 text-text-secondary hover:text-text transition-colors"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <button
            onClick={() => (isPlaying ? pause() : resume())}
            className="w-16 h-16 rounded-full bg-accent flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-accent/30"
          >
            {isPlaying ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#000">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#000" className="ml-1">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>
          <button
            onClick={playNext}
            className="p-2 text-text-secondary hover:text-text transition-colors"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary shrink-0">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
          />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary shrink-0">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
          </svg>
        </div>
      </div>
    </Layout>
  )
}
