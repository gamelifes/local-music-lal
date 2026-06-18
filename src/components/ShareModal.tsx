import { useAppStore } from '../store/appStore'
import { usePlayerStore } from '../store/player'

export function ShareModal() {
  const { modals, closeModal } = useAppStore()
  const { currentSong } = usePlayerStore()

  if (!modals.share) return null

  return (
    <div className="modal-overlay active" onClick={() => closeModal('share')}>
      <div className="modal" style={{ width: '300px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => closeModal('share')}>✕</button>
        <div className="modal-title">歌曲信息</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-glow))', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>♫</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSong?.title || '未知歌曲'}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSong?.artist || '未知歌手'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => closeModal('share')} style={{ flex: 1, padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>查看信息</button>
          <button onClick={() => { navigator.clipboard?.writeText(`${currentSong?.title} - ${currentSong?.artist}`); closeModal('share') }} style={{ flex: 1, padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--accent)', background: 'var(--accent)', color: '#000', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>复制信息</button>
        </div>
      </div>
    </div>
  )
}
