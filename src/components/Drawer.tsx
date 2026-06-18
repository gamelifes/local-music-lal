interface DrawerProps {
  open: boolean
  onClose: () => void
  activePage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { id: 'home', icon: '🏠', label: '全部' },
  { id: 'artists', icon: '🎤', label: '歌手' },
  { id: 'albums', icon: '💿', label: '专辑' },
  { id: 'hidden', icon: '🔒', label: '已隐藏' },
  { id: 'search', icon: '🔍', label: '搜索' },
  { id: 'equalizer', icon: '🎛️', label: '均衡器' },
  { id: 'scan', icon: '📡', label: '扫描' },
]

export function Drawer({ open, onClose, activePage, onNavigate }: DrawerProps) {
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
        <div className="drawerNav">
          {navItems.map(item => (
            <div
              key={item.id}
              className={`drawer-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => { onNavigate(item.id); onClose() }}
            >
              <span>{item.icon} {item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
