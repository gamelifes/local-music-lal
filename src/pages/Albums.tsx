import { useLibraryStore } from '../store/library'

interface AlbumsProps {
  onNavigate: (page: string) => void
  onSelectAlbum: (name: string) => void
}

export function Albums({ onNavigate, onSelectAlbum }: AlbumsProps) {
  const { songs } = useLibraryStore()

  const groups = Object.entries(
    songs.reduce((acc, s) => {
      if (!acc[s.album]) acc[s.album] = []
      acc[s.album].push(s)
      return acc
    }, {} as Record<string, typeof songs>)
  )
    .map(([name, list]) => ({ name, count: list.length }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="page active">
      <div className="page-content" style={{ paddingTop: 0 }}>
        {/* Sticky Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 16px' }}>
            <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '20px', cursor: 'pointer' }}>←</button>
            <h2 style={{ fontSize: '18px' }}>专辑</h2>
          </div>
        </div>
        {groups.map(g => (
          <div key={g.name} className="group-header" onClick={() => onSelectAlbum(g.name)}>
            <div className="group-cover">💿</div>
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
