import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, children, title, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizeStyles = {
    sm: 'w-72',
    md: 'w-80',
    lg: 'w-96',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className={`relative ${sizeStyles[size]} bg-[rgba(22,22,20,0.95)] backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] p-5 transform transition-transform duration-300`}
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--glass-border)] text-[var(--text-secondary)] flex items-center justify-center text-sm hover:text-[var(--text)]"
          onClick={onClose}
        >
          ✕
        </button>
        {title && (
          <h3 className="text-lg font-bold mb-3 text-center">{title}</h3>
        )}
        {children}
      </div>
    </div>
  )
}
