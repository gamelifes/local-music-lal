import { usePlayerStore } from '../store/player'

interface QueueModalProps {
  visible: boolean
  onClose: () => void
}

export function QueueModal({ visible, onClose }: QueueModalProps) {
  const { songList, currentIndex, isPlaying, play } = usePlayerStore()

  if (!visible) return null

  return (
    <>
      <div className="context-menu-overlay active" onClick={onClose}></div>
      <div className="context-menu active" style={{ maxHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
        <div className="context-menu-title">播放队列</div>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 8 }}>
          {songList.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
              暂无歌曲
            </div>
          ) : (
            songList.map((song, idx) => (
              <div
                key={song.id}
                onClick={() => {
                  play(song, songList)
                }}
                style={{
                  borderBottom: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: idx === currentIndex ? 'var(--accent)' : 'var(--text)',
                  background: idx === currentIndex ? 'rgba(255,255,255,0.03)' : 'transparent',
                  margin: '0 -24px',
                  padding: '12px 24px',
                }}
              >
                <div style={{ width: 24, textAlign: 'center', fontSize: 12, color: idx === currentIndex ? 'var(--accent)' : 'var(--text-secondary)', flexShrink: 0 }}>
                  {idx === currentIndex && isPlaying ? '♫' : `${idx + 1}`}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: idx === currentIndex ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{song.artist}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
