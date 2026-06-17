import type { ReactNode } from 'react'

interface BadgeProps {
  variant: 'lossless' | 'high' | 'standard' | 'low'
  children: ReactNode
}

const variantStyles = {
  lossless: 'bg-[oklch(0.72_0.14_85/0.15)] text-[var(--accent)] border-[oklch(0.72_0.14_85/0.2)]',
  high: 'bg-[oklch(0.68_0.16_55/0.15)] text-[var(--accent)] border-[oklch(0.68_0.16_55/0.2)]',
  standard: 'bg-[oklch(0.62_0.15_250/0.15)] text-[var(--accent)] border-[oklch(0.62_0.15_250/0.2)]',
  low: 'bg-[rgba(255,77,77,0.12)] text-[#ff6b6b] border-[rgba(255,77,77,0.2)]',
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-[10px] tracking-wide uppercase border ${variantStyles[variant]}`}>
      {children}
    </span>
  )
}
