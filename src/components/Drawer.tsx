import { useState } from 'react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  activePage: string
  onNavigate: (page: string) => void
}

interface NavGroup {
  label: string
  items: { id: string; icon: string; label: string }[]
}

const navGroups: NavGroup[] = [
  {
    label: '音乐库',
    items: [
      { id: 'home', icon: '🏠', label: '全部' },
      { id: 'artists', icon: '🎤', label: '歌手' },
      { id: 'albums', icon: '💿', label: '专辑' },
      { id: 'hidden', icon: '🔒', label: '已隐藏' },
    ]
  },
  {
    label: '工具',
    items: [
      { id: 'search', icon: '🔍', label: '搜索' },
      { id: 'equalizer', icon: '🎛️', label: '均衡器' },
      { id: 'scan', icon: '📡', label: '扫描' },
      { id: 'debug', icon: '🐛', label: '调试日志' },
    ]
  }
]

export function Drawer({ open, onClose, activePage, onNavigate }: DrawerProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['音乐库', '工具']))

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  return (
    <>
      <div
        className={`drawer-overlay ${open ? 'active' : ''}`}
        onClick={onClose}
      />
      <div className={`drawer ${open ? 'active' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-avatar">♫</div>
      <div className="drawer-user">
        <svg width="180" height="50" viewBox="0 0 600 160" style={{ display: 'block', marginBottom: 2 }}>
          <defs>
            <linearGradient id="holoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a0e0ff"/>
              <stop offset="50%" stopColor="#6080c0"/>
              <stop offset="100%" stopColor="#3050a0"/>
            </linearGradient>
            <filter id="glow2">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <text x="300" y="28" textAnchor="middle" fontFamily="Courier New, monospace" fontSize="16" fill="#4060a0" letterSpacing="10">LHH</text>
          <text x="302" y="28" textAnchor="middle" fontFamily="Courier New, monospace" fontSize="16" fill="#ff60a0" opacity="0.4" letterSpacing="10">LHH</text>
          <text x="300" y="110" textAnchor="middle" fontFamily="serif" fontSize="96" fontWeight="bold" fill="url(#holoGrad)" filter="url(#glow2)" letterSpacing="12">乐库</text>
          <text x="302" y="110" textAnchor="middle" fontFamily="serif" fontSize="96" fontWeight="bold" fill="#00f0ff" opacity="0.25" letterSpacing="12">乐库</text>
          <line x1="80" y1="125" x2="520" y2="125" stroke="#4060a0" strokeWidth="0.5" opacity="0.4"/>
          <circle cx="80" cy="125" r="2" fill="#00f0ff" opacity="0.6"/>
          <circle cx="520" cy="125" r="2" fill="#00f0ff" opacity="0.6"/>
        </svg>
        <div className="status">极简 · 自由 · 无广告</div>
      </div>
        </div>
        <div className="drawerNav" style={{ flex: 1, overflowY: 'auto' }}>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: '8px' }}>
              <div
                onClick={() => toggleGroup(group.label)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <span>{group.label}</span>
                <span style={{
                  transform: expandedGroups.has(group.label) ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  fontSize: '10px',
                }}>›</span>
              </div>
              {expandedGroups.has(group.label) && (
                <div>
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      className={`drawer-item ${activePage === item.id ? 'active' : ''}`}
                      onClick={() => { onNavigate(item.id); onClose() }}
                    >
                      <span>{item.icon} {item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
