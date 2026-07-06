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
    { id: 'playlists', icon: '📑', label: '歌单' },
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
        <div className="drawer-user">
        <svg width="240" height="64" viewBox="0 0 240 64" style={{ display: 'block' }}>
<defs>
<linearGradient id="holoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
<stop offset="0%" stopColor="#a0e0ff"/>
<stop offset="50%" stopColor="#6080c0"/>
<stop offset="100%" stopColor="#3050a0"/>
</linearGradient>
<linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
<stop offset="0%" stopColor="#004466"/>
<stop offset="30%" stopColor="#00e5ff"/>
<stop offset="50%" stopColor="#80f0ff"/>
<stop offset="70%" stopColor="#00e5ff"/>
<stop offset="100%" stopColor="#004466"/>
</linearGradient>
<pattern id="scanline" width="4" height="4" patternUnits="userSpaceOnUse">
<rect width="4" height="2" fill="#00f0ff"/>
</pattern>
<filter id="glow">
<feGaussianBlur stdDeviation="2" result="blur"/>
<feMerge>
<feMergeNode in="blur"/>
<feMergeNode in="SourceGraphic"/>
</feMerge>
</filter>
</defs>
{/* scan line overlay */}
<rect width="240" height="64" fill="url(#scanline)" opacity="0.06">
<animate attributeName="y" values="0;64;0" dur="4s" repeatCount="indefinite"/>
</rect>
{/* lhh label with chromatic aberration */}
<text x="120" y="12" textAnchor="middle" fontFamily="Courier New, monospace" fontSize="7" fill="#4060a0" letterSpacing="2" opacity="0.9">LHH</text>
<text x="121.5" y="12" textAnchor="middle" fontFamily="Courier New, monospace" fontSize="7" fill="#ff60a0" opacity="0.5" letterSpacing="2">LHH</text>
{/* glow behind 乐库 — blurred copy for halo effect */}
<text x="120" y="42" textAnchor="middle" fontFamily="serif" fontSize="32" fontWeight="bold" fill="#6090d0" opacity="0.35" filter="url(#glow)" letterSpacing="4">乐库</text>
{/* main text 乐库 — crisp foreground, no offset overlay */}
<text x="120" y="42" textAnchor="middle" fontFamily="serif" fontSize="32" fontWeight="bold" fill="url(#holoGrad)" letterSpacing="4">乐库</text>
{/* bottom line with animated pulse dots */}
<line x1="20" y1="50" x2="220" y2="50" stroke="#4060a0" strokeWidth="0.5" opacity="0.4"/>
<circle cx="20" cy="50" r="1.5" fill="#00f0ff" opacity="0.7">
<animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
</circle>
<circle cx="220" cy="50" r="1.5" fill="#00f0ff" opacity="0.7">
<animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="1s" repeatCount="indefinite"/>
</circle>
{/* corner brackets */}
<path d="M 4 4 L 4 8 M 4 4 L 8 4" fill="none" stroke="#00e5ff" strokeWidth="0.8" opacity="0.6"/>
<path d="M 236 60 L 236 56 M 236 60 L 232 60" fill="none" stroke="#00e5ff" strokeWidth="0.8" opacity="0.6"/>
</svg>
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
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: 'auto' }}>
          <div
            className="drawer-item"
            onClick={() => {
              if (window.AndroidBridge) {
                (window.AndroidBridge).exitApp()
              } else {
                window.close()
              }
            }}
          >
            <span>🚪 退出应用</span>
          </div>
        </div>
      </div>
    </>
  )
}
