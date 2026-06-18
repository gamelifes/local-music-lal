import { usePlayerStore } from '../store/player'
import { LYRICS_LINES } from '../data/songs'

interface LyricsProps {
  onNavigate: (page: string) => void
}

export function Lyrics({ onNavigate }: LyricsProps) {
  const { currentSong, activeLine, activeWord } = usePlayerStore()

  return (
    <div className="page active">
      <div className="page-content" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--divider)' }}>
          <button onClick={() => onNavigate('player')} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '20px', cursor: 'pointer' }}>←</button>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>{currentSong?.title || '未选择歌曲'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{currentSong?.artist}</div>
          </div>
        </div>

        {/* Lyrics */}
        <div className="lyrics-container">
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
  )
}
