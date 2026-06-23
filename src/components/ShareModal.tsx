import { useAppStore } from '../store/appStore'
import { usePlayerStore } from '../store/player'

export function ShareModal() {
  const { modals, closeModal } = useAppStore()
  const { currentSong } = usePlayerStore()

  if (!modals.share) return null

  const copyAsText = () => {
    const duration = currentSong?.duration || 0
    const fmtDuration = `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`
    const text = `🎵 ${currentSong?.title || '未知歌曲'}\n👤 ${currentSong?.artist || '未知歌手'}\n💿 ${currentSong?.album || ''}\n⏱️ ${fmtDuration}\n\n正在使用 MusicFree 播放`
    navigator.clipboard?.writeText(text)
    closeModal('share')
  }

  const copyAsCard = async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 400
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 800, 400)
    gradient.addColorStop(0, '#1a1a16')
    gradient.addColorStop(1, '#0F0F0A')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 800, 400)

    // Decorative circle
    ctx.beginPath()
    ctx.arc(200, 200, 120, 0, Math.PI * 2)
    const circleGradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 120)
    circleGradient.addColorStop(0, 'rgba(232, 180, 60, 0.8)')
    circleGradient.addColorStop(1, 'rgba(232, 180, 60, 0.2)')
    ctx.fillStyle = circleGradient
    ctx.fill()

    // Music note
    ctx.fillStyle = '#000'
    ctx.font = 'bold 64px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('♫', 200, 200)

    // Song title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 36px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    const title = currentSong?.title || '未知歌曲'
    ctx.fillText(title.length > 12 ? title.substring(0, 12) + '...' : title, 380, 120)

    // Artist
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '24px -apple-system, sans-serif'
    ctx.fillText(currentSong?.artist || '未知歌手', 380, 170)

    // Album
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '20px -apple-system, sans-serif'
    ctx.fillText(currentSong?.album || '', 380, 210)

    // Divider line
    ctx.strokeStyle = 'rgba(232, 180, 60, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(380, 250)
    ctx.lineTo(750, 250)
    ctx.stroke()

    // Footer text
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '16px -apple-system, sans-serif'
    ctx.fillText('MusicFree · 极简 · 自由 · 无广告', 380, 280)

    // Copy to clipboard
    try {
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      closeModal('share')
    } catch (err) {
      // Fallback: copy as text
      copyAsText()
    }
  }

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
          <button onClick={copyAsText} style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>复制文案</button>
          <button onClick={copyAsCard} style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--accent)', background: 'var(--accent)', color: '#000', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>复制名片</button>
        </div>
      </div>
    </div>
  )
}
