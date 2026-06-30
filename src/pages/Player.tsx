import { useState, useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '../store/player'
import { useAppStore } from '../store/appStore'
import { useLibraryStore } from '../store/library'
import { QueueModal } from '../components/QueueModal'

interface PlayerProps {
  onNavigate: (page: string) => void
}

export function Player({ onNavigate }: PlayerProps) {
  const { currentSong, isPlaying, togglePlay, nextSong, prevSong, progress, updateProgress, viewMode, setViewMode, activeLine, activeWord, setActiveLine, setActiveWord, currentTime, duration, lyrics, repeatMode, toggleRepeatMode, volume, setVolume } = usePlayerStore()
  const { openModal } = useAppStore()
  const { hideSong } = useLibraryStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  const [volumeOpen, setVolumeOpen] = useState(false)
  const [swipeStart, setSwipeStart] = useState({ x: 0, y: 0 })
  const [swipeDir, setSwipeDir] = useState<'h' | 'v' | null>(null)
  const swipeStartVolume = useRef(0)
  const volumeDragging = useRef(false)
  const volumeBarRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lyricsContainerRef = useRef<HTMLDivElement>(null)

  // Progress update
  useEffect(() => {
    if (isPlaying) {
      progressRef.current = setInterval(updateProgress, 250)
    } else {
      if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null }
    }
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [isPlaying, updateProgress])

  // Auto-scroll lyrics when active line changes
  useEffect(() => {
    if (viewMode === 'lyrics' && lyricsContainerRef.current && lyrics.length > 0) {
      const container = lyricsContainerRef.current
      const lineElements = container.querySelectorAll('.lyrics-line')
      if (lineElements[activeLine]) {
        const lineElement = lineElements[activeLine] as HTMLElement
        const lineTop = lineElement.offsetTop
        const lineHeight = lineElement.clientHeight
        const containerHeight = container.clientHeight
        const targetScroll = lineTop - containerHeight / 2 + lineHeight / 2
        container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' })
      }
    }
  }, [activeLine, viewMode, lyrics.length])

  // Reset karaoke when song changes
  useEffect(() => { setActiveLine(0); setActiveWord(-1) }, [currentSong])

  // Volume bar drag handlers
  const handleVolumeFromEvent = useCallback((clientY: number) => {
    if (!volumeBarRef.current) return
    const r = volumeBarRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, 1 - (clientY - r.top) / r.height))
    setVolume(pct)
  }, [setVolume])

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!volumeDragging.current) return
      e.preventDefault()
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY
      handleVolumeFromEvent(y)
    }
    const onUp = () => { volumeDragging.current = false }
    window.addEventListener('mousemove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [handleVolumeFromEvent])

  // Cover area swipe → view switch (horizontal) or volume (vertical)
  const onStart = (x: number, y: number) => { setSwipeStart({ x, y }); setSwipeDir(null); swipeStartVolume.current = usePlayerStore.getState().volume }
  const onMove = (x: number, y: number) => {
    const dx = x - swipeStart.x
    const dy = y - swipeStart.y
    if (!swipeDir) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        setSwipeDir(Math.abs(dx) > Math.abs(dy) ? 'h' : 'v')
      }
    }
    if (swipeDir === 'v') {
      const delta = -dy / 200
      setVolume(Math.max(0, Math.min(1, swipeStartVolume.current + delta)))
    }
  }
  const onEnd = (x: number, y: number) => {
    const dx = x - swipeStart.x
    if (swipeDir === 'h' && Math.abs(dx) > 50) {
      if (dx < 0 && viewMode === 'vinyl') setViewMode('lyrics')
      else if (dx > 0 && viewMode === 'lyrics') setViewMode('vinyl')
    }
    setSwipeDir(null)
  }
  const handleTouchStart = (e: React.TouchEvent) => onStart(e.touches[0].clientX, e.touches[0].clientY)
  const handleTouchMove = (e: React.TouchEvent) => onMove(e.touches[0].clientX, e.touches[0].clientY)
  const handleTouchEnd = (e: React.TouchEvent) => onEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
  const handleMouseDown = (e: React.MouseEvent) => { onStart(e.clientX, e.clientY) }
  const handleMouseMove = (e: React.MouseEvent) => { if (e.buttons === 1) onMove(e.clientX, e.clientY) }
  const handleMouseUp = (e: React.MouseEvent) => { onEnd(e.clientX, e.clientY) }

  if (!currentSong) {
    return (
      <div className="page active player-page">
        <div className="player-header">
          <button className="player-header-btn" onClick={() => onNavigate('home')}>
            <img src="/icons/back.svg" alt="back" width="24" height="24" />
          </button>
          <div className="player-header-title">无歌曲</div>
        </div>
      </div>
    )
  }

  const prog = progress
  const fmt = (s: number) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0')

  return (
    <div className="page active player-page">
      <div className="player-header" style={{ position: 'relative' }}>
        <button className="player-header-btn" onClick={() => onNavigate('home')}>
          <img src="/icons/back.svg" alt="back" width="24" height="24" />
        </button>
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
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
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
          overflow: 'hidden'
        }}>
          <div ref={lyricsContainerRef} className="lyrics-container" style={{ width: '100%', height: '100%', padding: '8px 16px', overflowY: 'auto' }}>
            {lyrics.length > 0 ? (
              lyrics.map((line, li) => {
                const words = line.text.split('')
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
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                <p>暂无歌词</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>请将 .lrc 文件放在音频文件同目录下</p>
              </div>
            )}
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
        <button className="player-action-btn" onClick={() => openModal('quality')} title="音质">
          <img src="/icons/quality.svg" alt="quality" width="20" height="20" />
        </button>
        <button className="player-action-btn" onClick={() => openModal('share')} title="分享">
          <img src="/icons/share.svg" alt="share" width="20" height="20" />
        </button>
        <button className="player-action-btn" onClick={() => openModal('sleep')} title="睡眠">
          <img src="/icons/sleep.svg" alt="sleep" width="20" height="20" />
        </button>
        <button className="player-action-btn" onClick={() => setVolumeOpen(o => !o)} title="音量">
          <img src="/icons/volume.svg" alt="volume" width="20" height="20" />
        </button>
        <button className="player-action-btn" onClick={() => { if (currentSong) { hideSong(currentSong.filePath); nextSong(); onNavigate('home') } }} title="隐藏">
          <img src="/icons/hide.svg" alt="hide" width="20" height="20" />
        </button>
      </div>

      {/* Volume Vertical Slider */}
      {volumeOpen && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'relative', zIndex: 50,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '6px', padding: '12px 16px', margin: '0 auto',
          background: 'rgba(22,22,20,0.85)', backdropFilter: 'blur(16px)',
          borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)',
          width: '60px',
        }}>
          <img src="/icons/volume.svg" alt="vol" width="18" height="18" style={{ opacity: 0.6 }} />
          <div
            ref={volumeBarRef}
            style={{ width: 4, height: 120, borderRadius: 2, background: 'rgba(255,255,255,0.15)', position: 'relative', cursor: 'pointer', touchAction: 'none' }}
            onClick={(e) => handleVolumeFromEvent(e.clientY)}
            onTouchStart={(e) => { e.stopPropagation(); volumeDragging.current = true; handleVolumeFromEvent(e.touches[0].clientY) }}
            onMouseDown={(e) => { e.stopPropagation(); volumeDragging.current = true; handleVolumeFromEvent(e.clientY) }}
          >
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${volume * 100}%`, borderRadius: 2, background: 'var(--accent)' }} />
            <div style={{
              position: 'absolute', left: '50%', bottom: `${volume * 100}%`,
              transform: 'translate(-50%, 50%)',
              width: 14, height: 14, borderRadius: '50%',
              background: 'var(--accent)', boxShadow: '0 0 8px rgba(var(--accent-rgb), 0.4)',
            }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{Math.round(volume * 100)}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="player-progress">
        <div className="player-progress-bar" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); usePlayerStore.getState().seek(Math.round((e.clientX - r.left) / r.width * 100)) }}>
          <div className="player-progress-fill" style={{ width: `${prog}%` }}>
            <div className="player-progress-thumb"></div>
          </div>
        </div>
        <div className="player-progress-time">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="player-controls">
        <button
          className={`player-ctrl-btn active`}
          onClick={toggleRepeatMode}
          title={repeatMode === 'all' ? '列表循环' : repeatMode === 'shuffle' ? '随机播放' : '单曲循环'}
        >
          <img
            src={repeatMode === 'one' ? '/icons/repeat-one.svg' : repeatMode === 'shuffle' ? '/icons/shuffle.svg' : '/icons/repeat-all.svg'}
            alt={repeatMode}
            width="18"
            height="18"
          />
        </button>
        <button className="player-ctrl-btn" onClick={prevSong}>
          <img src="/icons/prev.svg" alt="previous" width="20" height="20" />
        </button>
        <button className="player-btn-play player-ctrl-btn" onClick={togglePlay}>
          <img src={isPlaying ? '/icons/pause.svg' : '/icons/play.svg'} alt={isPlaying ? 'pause' : 'play'} width="24" height="24" />
        </button>
        <button className="player-ctrl-btn" onClick={nextSong}>
          <img src="/icons/next.svg" alt="next" width="20" height="20" />
        </button>
        <button className="player-ctrl-btn" onClick={() => setQueueOpen(true)}>
          <img src="/icons/queue.svg" alt="queue" width="18" height="18" />
        </button>
      </div>
      <QueueModal visible={queueOpen} onClose={() => setQueueOpen(false)} />
    </div>
  )
}
