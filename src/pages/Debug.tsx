import { useState, useEffect } from 'react'
import { getLogs, clearLogs } from '../lib/logger'

interface DebugProps {
  onNavigate: (page: string) => void
}

export function Debug({ onNavigate }: DebugProps) {
  const [logs, setLogs] = useState(getLogs())
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => {
      setLogs(getLogs())
    }, 1000)
    return () => clearInterval(timer)
  }, [autoRefresh])

  const handleClear = () => {
    clearLogs()
    setLogs([])
  }

  const handleRefresh = () => {
    setLogs(getLogs())
  }

  return (
    <div className="page active">
      <div className="page-content">
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <img src="/icons/back.svg" alt="back" width="24" height="24" />
              </button>
              <h2 style={{ fontSize: '18px', margin: 0 }}>调试日志</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleRefresh} className="btn" style={{ padding: '6px 12px', fontSize: '12px' }}>刷新</button>
              <button onClick={handleClear} className="btn" style={{ padding: '6px 12px', fontSize: '12px' }}>清空</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 0 12px' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              id="autoRefresh"
            />
            <label htmlFor="autoRefresh" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>自动刷新</label>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
              {logs.length} 条日志
            </span>
          </div>
        </div>

        {/* Log List */}
        <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {logs.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px 0' }}>暂无日志</p>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--glass-border)',
                  background: log.type === 'ERROR' ? 'rgba(255,77,77,0.1)' : log.type === 'WARN' ? 'rgba(255,193,7,0.1)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{log.time}</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 4px',
                    borderRadius: '4px',
                    background: log.type === 'ERROR' ? '#ff4d4d' : log.type === 'WARN' ? '#ffc107' : '#666',
                    color: log.type === 'WARN' ? '#000' : '#fff'
                  }}>
                    {log.type}
                  </span>
                </div>
                <div style={{ color: 'var(--text)', wordBreak: 'break-all', lineHeight: '1.4' }}>
                  {log.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
