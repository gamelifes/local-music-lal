import { useAppStore } from '../store/appStore'
import { usePlayerStore } from '../store/player'

export function FileInfoModal() {
  const { modals, closeModal } = useAppStore()
  const { currentSong } = usePlayerStore()

  if (!modals.fileInfo) return null

  const fileSize = currentSong ? (currentSong.size / (1024 * 1024)).toFixed(1) : '0'
  const filePath = currentSong ? `/storage/emulated/0/Music/${currentSong.artist}/${currentSong.title}.flac` : ''

  return (
    <div className="modal-overlay active" onClick={() => closeModal('fileInfo')}>
      <div className="modal" style={{ width: '300px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => closeModal('fileInfo')}>✕</button>
        <div className="modal-title" style={{ marginBottom: '16px', fontSize: '16px' }}>文件信息</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>歌名</span>
            <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>{currentSong?.title}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>歌手</span>
            <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>{currentSong?.artist}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>文件大小</span>
            <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>{fileSize} MB</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>文件地址</span>
            <span style={{ fontSize: '12px', color: 'var(--text)', wordBreak: 'break-all', lineHeight: '1.5' }}>{filePath}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
