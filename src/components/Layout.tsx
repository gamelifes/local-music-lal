import { useNavigate, useLocation } from 'react-router-dom'

interface LayoutProps {
  title: string
  children: React.ReactNode
  rightAction?: React.ReactNode
}

export function Layout({ title, children, rightAction }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const canGoBack = location.pathname !== '/'

  return (
    <div className="flex flex-col h-[100dvh] bg-bg overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 bg-bg/80 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 w-24">
          {canGoBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
        </div>
        <h1 className="text-base font-semibold text-text truncate">{title}</h1>
        <div className="flex items-center justify-end w-24">
          {rightAction}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        {children}
      </main>
    </div>
  )
}
