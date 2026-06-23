import { useLibraryStore } from '../store/library'

interface ArtistsProps {
  onNavigate: (page: string) => void
  onSelectArtist: (name: string) => void
}

export function Artists({ onNavigate, onSelectArtist }: ArtistsProps) {
  const { songs } = useLibraryStore()

  const groups = Object.entries(
    songs.reduce((acc, s) => {
      if (!acc[s.artist]) acc[s.artist] = []
      acc[s.artist].push(s)
      return acc
    }, {} as Record<string, typeof songs>)
  )
    .map(([name, list]) => ({ name, count: list.length }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="page active">
      <div className="page-content" style={{ paddingTop: 0 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 16px' }}>
            <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
              <span style={{ fontSize: '24px', lineHeight: 1 }}>&lt;</span>
            </button>
            <h2 style={{ fontSize: '18px' }}>歌手</h2>
          </div>
        </div>
        {groups.map(g => (
          <div key={g.name} className="group-header" onClick={() => onSelectArtist(g.name)}>
            <div className="group-cover">🎤</div>
            <div className="group-info">
              <div className="group-name">{g.name}</div>
              <div className="group-count">{g.count} 首歌曲</div>
            </div>
            <div className="group-arrow">›</div>
          </div>
        ))}
      </div>
    </div>
  )
}
