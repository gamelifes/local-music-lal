import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'default'
  children: ReactNode
  fullWidth?: boolean
}

export function Button({ variant = 'default', children, fullWidth, className = '', ...props }: ButtonProps) {
  const baseStyles = 'px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-180 cursor-pointer border'

  const variantStyles = {
    primary: 'bg-[var(--accent)] text-black border-[var(--accent)] hover:bg-[var(--accent)]/90',
    danger: 'bg-transparent text-red-500 border-red-500 hover:bg-red-500/10',
    default: 'bg-[var(--bg-card)] text-[var(--text)] border-[var(--glass-border)] hover:bg-[var(--bg-card-hover)]',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
