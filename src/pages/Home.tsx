import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'

interface HomeProps {
  onNavigate: (page: string) => void
  onToggleDrawer: () => void
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export function Home({ onToggleDrawer }: HomeProps) {
  const { songs, hiddenIds } = useLibraryStore()
  const { play, currentSong } = usePlayerStore()

  const visibleSongs = songs.filter(s => !hiddenIds.has(s.filePath))

  return (
    <div className="page active">
      <div className="page-content" style={{ paddingTop: 0 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0F0F0A', padding: '8px 0 0' }}>
          <div style={{ padding: '8px 0' }}>
            <button
              onClick={onToggleDrawer}
              style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '24px', cursor: 'pointer' }}
            >
              ☰
            </button>
          </div>
          <h2 style={{ fontSize: '24px', margin: '0 0 8px' }}>全部歌曲</h2>
          <table className="song-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 36, textAlign: 'center' }}>#</th>
                <th style={{ width: 48 }}></th>
                <th>歌名</th>
                <th>歌手</th>
                <th style={{ width: 60, textAlign: 'right' }}>时长</th>
              </tr>
            </thead>
          </table>
        </div>

        <table className="song-table" style={{ width: '100%' }}>
          <tbody>
            {visibleSongs.map((s, i) => (
              <tr
                key={s.id}
                className={currentSong?.id === s.id ? 'song-playing' : ''}
                onClick={() => play(s, visibleSongs)}
                style={{ cursor: 'pointer' }}
              >
                <td className="col-index" style={{ width: 36, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>{i + 1}</td>
                <td className="col-cover">
                  <div className="cover-thumb">
                    <img src="/icons/music-note.svg" alt="music" className="music-icon" />
                  </div>
                </td>
                <td className="col-song">{s.title}</td>
                <td className="col-artist">{s.artist}</td>
                <td className="col-duration">{formatDuration(s.duration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
