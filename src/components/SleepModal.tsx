import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'

export function SleepModal() {
  const { modals, closeModal } = useAppStore()
  const [selected, setSelected] = useState('不开启')
  const [customMinutes, setCustomMinutes] = useState('')
  const options = ['不开启', '15分钟后', '30分钟后', '一小时后', '自定义']
  const [timerActive, setTimerActive] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  useEffect(() => () => clearTimer(), [])

  const startTimer = (mins: number) => {
    clearTimer()
    if (mins <= 0) { setTimerActive(false); setRemaining(0); return }
    setRemaining(mins * 60)
    setTimerActive(true)
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearTimer(); setTimerActive(false); return 0 }
        return r - 1
      })
    }, 1000)
  }

  const handleSelect = (opt: string) => {
    setSelected(opt)
    if (opt === '自定义') return
    clearTimer()
    setTimerActive(false)
    setRemaining(0)
    if (opt === '15分钟后') startTimer(15)
    else if (opt === '30分钟后') startTimer(30)
    else if (opt === '一小时后') startTimer(60)
  }

  const handleCustomApply = () => {
    const mins = parseInt(customMinutes)
    if (mins > 0) startTimer(mins)
  }

  const fmtTime = (s: number) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')

  if (!modals.sleep) return null

  return (
    <div className="modal-overlay active" onClick={() => closeModal('sleep')}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => closeModal('sleep')}>✕</button>
        <div className="modal-title">睡眠模式</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {options.map(opt => (
            <div
              key={opt}
              style={{ padding: '14px 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '15px', color: selected === opt ? 'var(--text)' : 'var(--text-secondary)' }}
              onClick={() => handleSelect(opt)}
            >
              <span>{opt}</span>
              {selected === opt && <span style={{ color: 'var(--accent)', fontSize: '18px' }}>✓</span>}
            </div>
          ))}
          {selected === '自定义' && (
            <div style={{ padding: '12px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" min="1" max="999" placeholder="分钟" value={customMinutes} onChange={e => setCustomMinutes(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '14px', outline: 'none' }} />
              <button onClick={handleCustomApply} disabled={!customMinutes || parseInt(customMinutes) <= 0}
                style={{ padding: '8px 16px', borderRadius: '12px', background: customMinutes && parseInt(customMinutes) > 0 ? 'var(--accent)' : 'var(--bg-card)', color: customMinutes && parseInt(customMinutes) > 0 ? '#000' : 'var(--text-secondary)', border: 'none', fontSize: '13px', fontWeight: 600, cursor: customMinutes && parseInt(customMinutes) > 0 ? 'pointer' : 'default' }}>
                确定
              </button>
            </div>
          )}
          {timerActive && (
            <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--accent)', fontSize: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {fmtTime(remaining)}
            </div>
          )}
          <div style={{ padding: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>播放完当前歌曲再关闭</span>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: 'var(--accent)', position: 'relative', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', right: 2, top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
