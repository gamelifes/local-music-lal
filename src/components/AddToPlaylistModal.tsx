import { useLibraryStore } from '../store/library'
import type { Song } from '../types/song'

interface AddToPlaylistModalProps {
  song: Song
  onClose: () => void
}

export function AddToPlaylistModal({ song, onClose }: AddToPlaylistModalProps) {
  const { playlists, addToPlaylist } = useLibraryStore()

  const handleAdd = async (playlistId: string) => {
    await addToPlaylist(playlistId, song.id)
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
      <div
        style={{ position: 'relative', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '16px', width: '280px', maxHeight: '60vh', overflowY: 'auto', border: '1px solid var(--glass-border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--text)' }}>
          加入歌单
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          {song.title} — {song.artist}
        </div>
        {playlists.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '12px 0', textAlign: 'center' }}>
            暂无歌单，请先创建
          </div>
        ) : (
          playlists.map(pl => (
            <div
              key={pl.id}
              onClick={() => handleAdd(pl.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600, flexShrink: 0 }}>
                {pl.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text)' }}>{pl.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pl.songs.length} 首歌曲</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
