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
          style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer' }}
        >
          移除
        </button>
      )}
    />
  )
}
