import type { ReactNode } from 'react'

interface PhoneFrameProps {
  children: ReactNode
  label?: string
}

export function PhoneFrame({ children, label }: PhoneFrameProps) {
  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="status-bar">
        <span>9:41</span>
        {label && <span>{label}</span>}
      </div>
      <div className="phone-content">
        {children}
      </div>
    </div>
  )
}
