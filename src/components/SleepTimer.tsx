import { useSleepStore } from '../store/sleep'

export function SleepTimer() {
  const { enabled, remaining, cancelTimer } = useSleepStore()
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  if (enabled && remaining !== null) {
    return (
      <div className="fixed top-4 right-4 bg-accent/20 border border-accent/50 rounded-xl px-4 py-2 text-accent z-50">
        <span className="font-mono">{formatTime(remaining)}</span>
        <button onClick={cancelTimer} className="ml-2 text-accent/70 hover:text-accent">
          ✕
        </button>
      </div>
    )
  }
  
  return null
}