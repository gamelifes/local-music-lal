import { useState, useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/player'
import { useAppStore } from '../store/appStore'
import { LYRICS_LINES } from '../data/songs'

interface PlayerProps {
  onNavigate: (page: string) => void
}

export function Player({ onNavigate }: PlayerProps) {
  const { currentSong, isPlaying, togglePlay, nextSong, prevSong, progress, setProgress, viewMode, setViewMode, activeLine, activeWord, setActiveLine, setActiveWord } = usePlayerStore()
  const { openModal } = useAppStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [swipeStart, setSwipeStart] = useState({ x: 0, y: 0 })
  const karaokeRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Karaoke animation
  useEffect(() => {
    if (viewMode !== 'lyrics' || !isPlaying) {
      if (karaokeRef.current) { clearInterval(karaokeRef.current); karaokeRef.current = null }
      return
    }
    const lineWords = LYRICS_LINES.map(l => l.split(''))
    let lineIdx = 0, wordIdx = -1
    const wordInterval = 200
    karaokeRef.current = setInterval(() => {
      wordIdx++
      if (wordIdx >= lineWords[lineIdx].length) {
        lineIdx++
        wordIdx = -1
        if (lineIdx >= lineWords.length) { lineIdx = 0; wordIdx = -1; setActiveLine(0); setActiveWord(-1); return }
        setActiveLine(lineIdx)
        setActiveWord(-1)
      } else {
        setActiveWord(wordIdx)
      }
    }, wordInterval)
    return () => { if (karaokeRef.current) clearInterval(karaokeRef.current) }
  }, [viewMode, isPlaying])

  // Reset karaoke when song changes
  useEffect(() => { setActiveLine(0); setActiveWord(-1) }, [currentSong])

  if (!currentSong) {
    return (
      <div className="page active player-page">
        <div className="player-header">
          <button className="player-header-btn" onClick={() => onNavigate('home')}>←</button>
          <div className="player-header-title">无歌曲</div>
        </div>
      </div>
    )
  }

  const prog = progress
  const totalSec = currentSong.duration
  const curSec = Math.floor(totalSec * prog / 100)
  const fmt = (s: number) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')

  // Swipe handling
  const onStart = (x: number, y: number) => { setSwipeStart({ x, y }) }
  const onEnd = (x: number, y: number) => {
    const dx = x - swipeStart.x
    const dy = y - swipeStart.y
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0 && viewMode === 'vinyl') setViewMode('lyrics')
      else if (dx > 0 && viewMode === 'lyrics') setViewMode('vinyl')
    }
  }
  const handleTouchStart = (e: React.TouchEvent) => onStart(e.touches[0].clientX, e.touches[0].clientY)
  const handleTouchEnd = (e: React.TouchEvent) => onEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
  const handleMouseDown = (e: React.MouseEvent) => onStart(e.clientX, e.clientY)
  const handleMouseUp = (e: React.MouseEvent) => onEnd(e.clientX, e.clientY)

  return (
    <div className="page active player-page">
      <div className="player-header" style={{ position: 'relative' }}>
        <button className="player-header-btn" onClick={() => onNavigate('home')}>←</button>
        <div className="player-header-title">{currentSong.title}</div>
        <button className="player-header-btn" onClick={() => setMenuOpen(o => !o)}>⋮</button>
        {menuOpen && (
          <div style={{ position: 'absolute', top: '100%', right: 8, zIndex: 100, background: 'rgba(22,22,20,0.95)', backdropFilter: 'blur(24px)', borderRadius: 12, border: '1px solid var(--glass-border)', padding: '8px 0', minWidth: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <div onClick={() => { setMenuOpen(false); openModal('fileInfo') }} style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>ℹ️ 文件信息</div>
          </div>
        )}
      </div>

      <div className="player-artist-row">
        <span className="player-artist-name">{currentSong.artist}</span>
      </div>

      <div
        className="player-cover-area"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
      >
        {/* Vinyl View */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          opacity: viewMode === 'vinyl' ? 1 : 0,
          transform: viewMode === 'vinyl' ? 'translateX(0) scale(1)' : 'translateX(-30px) scale(0.95)',
          pointerEvents: viewMode === 'vinyl' ? 'auto' : 'none'
        }}>
          <div className="player-cover-wrapper">
            <div className={`player-cover-outer ${isPlaying ? 'playing' : ''}`}>
              <div className="player-cover">
                <div className="player-cover-art">
                  <span className="player-cover-art-icon">♫</span>
                </div>
                <div className="player-cover-grooves"></div>
                <div className="player-cover-label"><div className="player-cover-label-dot"></div></div>
                <div className="player-cover-shine"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Lyrics View */}
        <div style={{
          position: 'absolute', inset: 0,
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          opacity: viewMode === 'lyrics' ? 1 : 0,
          transform: viewMode === 'lyrics' ? 'translateX(0) scale(1)' : 'translateX(30px) scale(0.95)',
          pointerEvents: viewMode === 'lyrics' ? 'auto' : 'none',
          overflow: 'auto'
        }}>
          <div className="lyrics-container" style={{ width: '100%', height: '100%', padding: '8px 16px' }}>
            {LYRICS_LINES.map((line, li) => {
              const words = line.split('')
              const isLineActive = li === activeLine
              const isLineSung = li < activeLine
              return (
                <div key={li} className={`lyrics-line ${isLineActive ? 'active' : ''} ${isLineSung ? 'sung' : ''}`}>
                  {words.map((c, ci) => {
                    const isWordActive = isLineActive && ci === activeWord
                    const isWordSung = isLineActive && ci < activeWord
                    return <span key={ci} className={`word ${isWordActive ? 'active' : ''} ${isWordSung ? 'sung' : ''}`}>{c}</span>
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lyrics Dots */}
      <div className="player-lyrics-dots">
        <div className={`player-lyrics-dot ${viewMode === 'vinyl' ? 'active' : ''}`} onClick={() => setViewMode('vinyl')}></div>
        <div className={`player-lyrics-dot ${viewMode === 'lyrics' ? 'active' : ''}`} onClick={() => setViewMode('lyrics')}></div>
      </div>

      {/* Action Buttons */}
      <div className="player-actions">
        <button className="player-action-btn" onClick={() => openModal('quality')} title="音质">🎛️</button>
        <button className="player-action-btn" onClick={() => openModal('share')} title="分享">↗</button>
        <button className="player-action-btn" title="睡眠">☽</button>
        <button className="player-action-btn" title="隐藏">👁</button>
      </div>

      {/* Progress Bar */}
      <div className="player-progress">
        <div className="player-progress-bar" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setProgress(Math.round((e.clientX - r.left) / r.width * 100)) }}>
          <div className="player-progress-fill" style={{ width: `${prog}%` }}>
            <div className="player-progress-thumb"></div>
          </div>
        </div>
        <div className="player-progress-time">
          <span>{fmt(curSec)}</span>
          <span>{currentSong?.duration || '0:00'}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="player-controls">
        <button className="player-ctrl-btn">↻</button>
        <button className="player-ctrl-btn" onClick={prevSong}>⏮</button>
        <button className="player-btn-play player-ctrl-btn" onClick={togglePlay}>{isPlaying ? '⏸' : '▶'}</button>
        <button className="player-ctrl-btn" onClick={nextSong}>⏭</button>
        <button className="player-ctrl-btn">☰</button>
      </div>
    </div>
  )
}
