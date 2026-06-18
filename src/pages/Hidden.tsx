import { useLibraryStore } from '../store/library'

interface HiddenProps {
  onNavigate: (page: string) => void
}

export function Hidden({ onNavigate }: HiddenProps) {
  const { songs, hiddenIds, unhideSong } = useLibraryStore()

  const hiddenSongs = songs.filter(s => hiddenIds.has(s.filePath))

  return (
    <div className="page active">
      <div className="page-content">
        {/* Header */}
        <div style={{ padding: '8px 0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '20px', cursor: 'pointer' }}>←</button>
            <h2 style={{ fontSize: '20px', margin: 0 }}>已隐藏的歌曲</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>隐藏的歌曲不会出现在列表中，可以随时恢复</p>
        </div>

        {hiddenSongs.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-secondary)' }}>暂无隐藏歌曲</p>
        ) : (
          <table className="song-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 64 }}></th>
                <th>歌名</th>
                <th>歌手</th>
                <th style={{ width: 60, textAlign: 'right' }}>时长</th>
                <th style={{ width: 80, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {hiddenSongs.map(s => (
                <tr key={s.id}>
                  <td style={{ width: 64, padding: '8px', textAlign: 'center' }}>
                    <div className="cover-thumb"></div>
                  </td>
                  <td className="col-song">{s.title}</td>
                  <td className="col-artist">{s.artist}</td>
                  <td style={{ width: 60, textAlign: 'right' }}>{s.duration}</td>
                  <td style={{ width: 80, textAlign: 'right' }}>
                    <button
                      onClick={() => unhideSong(s.filePath)}
                      style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer' }}
                    >
                      恢复
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
