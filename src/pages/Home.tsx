import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'
import { Layout } from '../components/Layout'

export function Home() {
  const navigate = useNavigate()
  const songs = useLibraryStore((s) => s.songs)
  const hiddenIds = useLibraryStore((s) => s.hiddenIds)
  const loadSongs = useLibraryStore((s) => s.loadSongs)
  const hideSong = useLibraryStore((s) => s.hideSong)
  const currentSong = usePlayerStore((s) => s.currentSong)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const play = usePlayerStore((s) => s.play)
  const pause = usePlayerStore((s) => s.pause)
  const resume = usePlayerStore((s) => s.resume)

  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadSongs()
  }, [loadSongs])

  const visibleSongs = songs.filter(
    (s) =>
      !hiddenIds.has(s.filePath) &&
      (s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handlePlaySong = (song: typeof visibleSongs[0]) => {
    if (currentSong?.id === song.id) {
      isPlaying ? pause() : resume()
    } else {
      play(song)
    }
  }

  return (
    <Layout
      title="音乐库"
      rightAction={
        <button
          onClick={() => navigate('/scan')}
          className="bg-accent text-black px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          扫描
        </button>
      }
    >
      <div className="p-4">
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="搜索歌曲、歌手..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-secondary outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        {visibleSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-40">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <p className="text-sm mb-2">暂无歌曲</p>
            <p className="text-xs opacity-60">点击右上角"扫描"导入音乐</p>
          </div>
        ) : (
          <div className="space-y-1">
            {visibleSongs.map((song) => {
              const isActive = currentSong?.id === song.id
              return (
                <div
                  key={song.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-accent/10 border border-accent/20'
                      : 'hover:bg-white/5'
                  }`}
                  onClick={() => handlePlaySong(song)}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-accent' : 'bg-white/5'
                    }`}
                  >
                    {isActive && isPlaying ? (
                      <div className="flex gap-0.5 items-end h-4">
                        <div className="w-0.5 bg-black animate-pulse" style={{ height: '60%', animationDelay: '0ms' }} />
                        <div className="w-0.5 bg-black animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                        <div className="w-0.5 bg-black animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
                        <div className="w-0.5 bg-black animate-pulse" style={{ height: '80%', animationDelay: '450ms' }} />
                      </div>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={isActive ? '#000' : 'currentColor'} className={isActive ? '' : 'text-text-secondary'}>
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-accent' : 'text-text'}`}>
                      {song.title}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {song.artist} · {song.format.toUpperCase()}
                    </p>
                  </div>
                  <span className="text-xs text-text-secondary shrink-0">
                    {formatDuration(song.duration)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      hideSong(song.filePath)
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-text-secondary transition-colors shrink-0"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
