import { usePlayerStore } from '../store/player'

interface MusicBarProps {
  onNavigate: (page: string) => void
}

export function MusicBar({ onNavigate }: MusicBarProps) {
  const { currentSong, isPlaying, togglePlay, nextSong, prevSong } = usePlayerStore()

  if (!currentSong) return null

  return (
    <div className="musicbar" onClick={() => onNavigate('player')}>
      <div className="musicbar-cover">
        {currentSong.cover ? (
          <img src={currentSong.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : null}
      </div>
      <div className="musicbar-info">
        <div className="musicbar-song">{currentSong.title}</div>
        <div className="musicbar-artist">{currentSong.artist}</div>
      </div>
      <div className="musicbar-controls" onClick={e => e.stopPropagation()}>
        <button className="musicbar-btn" onClick={prevSong}>
          <img src="/icons/prev.svg" alt="previous" width="18" height="18" />
        </button>
        <button className="musicbar-btn musicbar-btn-play" onClick={togglePlay}>
          <img src={isPlaying ? '/icons/pause.svg' : '/icons/play.svg'} alt={isPlaying ? 'pause' : 'play'} width="20" height="20" />
        </button>
        <button className="musicbar-btn" onClick={nextSong}>
          <img src="/icons/next.svg" alt="next" width="18" height="18" />
        </button>
      </div>
    </div>
  )
}
