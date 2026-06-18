import { useAppStore } from '../store/appStore'

export function QualityModal() {
  const { modals, closeModal } = useAppStore()

  if (!modals.quality) return null

  return (
    <div className="modal-overlay active" onClick={() => closeModal('quality')}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => closeModal('quality')}>✕</button>
        <div className="modal-title">选择音质</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--accent)', background: 'var(--accent)', color: '#000', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>无损 (FLAC)</button>
          <button style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>高品质 (320k)</button>
          <button style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>标准 (192k)</button>
          <button style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>流畅 (128k)</button>
        </div>
      </div>
    </div>
  )
}
