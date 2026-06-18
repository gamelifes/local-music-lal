import { usePlayerStore } from '../store/player'

interface MusicBarProps {
  onNavigate: (page: string) => void
}

export function MusicBar({ onNavigate }: MusicBarProps) {
  const { currentSong, isPlaying, togglePlay, nextSong, prevSong } = usePlayerStore()

  if (!currentSong) return null

  return (
    <div className="musicbar" onClick={() => onNavigate('player')}>
      <div className="musicbar-cover"></div>
      <div className="musicbar-info">
        <div className="musicbar-song">{currentSong.title}</div>
        <div className="musicbar-artist">{currentSong.artist}</div>
      </div>
      <div className="musicbar-controls" onClick={e => e.stopPropagation()}>
        <button className="musicbar-btn" onClick={prevSong}>⏮</button>
        <button className="musicbar-btn musicbar-btn-play" onClick={togglePlay}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="musicbar-btn" onClick={nextSong}>⏭</button>
      </div>
    </div>
  )
}
