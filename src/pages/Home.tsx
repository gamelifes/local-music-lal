import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'

interface HomeProps {
  onNavigate: (page: string) => void
  onToggleDrawer: () => void
}

export function Home({ onToggleDrawer }: HomeProps) {
  const { songs } = useLibraryStore()
  const { play, currentSong } = usePlayerStore()

  const visibleSongs = songs.filter(s => !s.hidden)

  return (
    <div className="page active">
      <div className="page-content" style={{ paddingTop: 0 }}>
        {/* Sticky Header */}
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
                <th style={{ width: 64 }}></th>
                <th>歌名</th>
                <th>歌手</th>
                <th style={{ width: 60, textAlign: 'right' }}>时长</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Song List */}
        <table className="song-table" style={{ width: '100%' }}>
          <tbody>
            {visibleSongs.map(s => (
              <tr
                key={s.id}
                className={currentSong?.id === s.id ? 'song-playing' : ''}
                onClick={() => play(s, visibleSongs)}
                style={{ cursor: 'pointer' }}
              >
                <td className="col-cover">
                  <div className="cover-thumb"></div>
                </td>
                <td className="col-song">{s.title}<span className={`quality-badge quality-${s.quality}`}>{s.quality}</span></td>
                <td className="col-artist">{s.artist}</td>
                <td className="col-duration">{s.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
