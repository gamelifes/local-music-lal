import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      className={`bg-[var(--bg-card)] border border-[var(--glass-border)] rounded-xl p-3 ${hover ? 'hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
