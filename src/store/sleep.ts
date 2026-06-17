import { create } from 'zustand'

interface SleepState {
  enabled: boolean
  duration: number | null // minutes
  remaining: number | null // seconds
  finishAfterCurrent: boolean
  
  startTimer: (minutes: number) => void
  cancelTimer: () => void
  setFinishAfterCurrent: (value: boolean) => void
}

let intervalId: ReturnType<typeof setInterval> | null = null

export const useSleepStore = create<SleepState>((set, get) => ({
  enabled: false,
  duration: null,
  remaining: null,
  finishAfterCurrent: true,
  
  startTimer: (minutes) => {
    if (intervalId) clearInterval(intervalId)
    
    const remaining = minutes * 60
    set({ enabled: true, duration: minutes, remaining })
    
    intervalId = setInterval(() => {
      const { remaining } = get()
      if (remaining !== null && remaining > 0) {
        set({ remaining: remaining - 1 })
      } else {
        if (intervalId) clearInterval(intervalId)
        set({ enabled: false, duration: null, remaining: null })
        // TODO: Stop playback
      }
    }, 1000)
  },
  
  cancelTimer: () => {
    if (intervalId) clearInterval(intervalId)
    set({ enabled: false, duration: null, remaining: null })
  },
  
  setFinishAfterCurrent: (value) => set({ finishAfterCurrent: value }),
}))