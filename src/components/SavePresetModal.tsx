import { useState, useEffect } from 'react'

interface SavePresetModalProps {
  visible: boolean
  onClose: () => void
  onSave: (name: string) => void
  initialName?: string
}

export function SavePresetModal({ visible, onClose, onSave, initialName }: SavePresetModalProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (visible) setName(initialName || '')
  }, [visible, initialName])

  if (!visible) return null

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{ width: '280px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title" style={{ marginBottom: '16px', fontSize: '16px' }}>保存自定义预设</div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>预设名称</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="输入预设名称..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-card)',
              color: 'var(--text)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" onClick={onClose} style={{ flex: 1 }}>取消</button>
          <button
            className="btn primary"
            onClick={() => { if (name.trim()) onSave(name.trim()) }}
            disabled={!name.trim()}
            style={{ flex: 1 }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
