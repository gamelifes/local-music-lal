import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'
import { SongTable } from '../components/SongTable'

interface PlaylistDetailProps {
  playlistId: string
  onNavigate: (page: string) => void
}

export function PlaylistDetail({ playlistId, onNavigate }: PlaylistDetailProps) {
  const { getPlaylist, removeFromPlaylist } = useLibraryStore()
  const { play } = usePlayerStore()
  const playlist = getPlaylist(playlistId)

  if (!playlist) {
    return (
      <div className="page active">
        <div className="page-content" style={{ paddingTop: 0 }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 8px' }}>
              <button onClick={() => onNavigate('playlists')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <img src="/icons/back.svg" alt="back" width="24" height="24" />
              </button>
              <h2 style={{ fontSize: '18px', flex: 1 }}>歌单</h2>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SongTable
      title={playlist.name}
      onBack={() => onNavigate('playlists')}
      songs={playlist.songs}
      columns={[
        { label: '歌名' },
        { label: '歌手' },
        { label: '时长', width: 60, textAlign: 'right' }
      ]}
      showIndex
      onPlaySong={(song) => play(song, playlist.songs)}
      extraColumns={(song) => (
        <button
          onClick={(e) => { e.stopPropagation(); removeFromPlaylist(playlistId, song.id) }}
          title="从歌单移除"
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', padding: '4px', borderRadius: '50%', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ff4d4d')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </button>
      )}
    />
  )
}
