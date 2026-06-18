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
            <div className="name">MusicFree</div>
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
