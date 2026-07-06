import { create } from 'zustand'
import { usePlayerStore } from './player'

interface SleepState {
  enabled: boolean
  duration: number | null // minutes
  remaining: number | null // seconds
  finishAfterCurrent: boolean
  finishPending: boolean
  
  startTimer: (minutes: number) => void
  cancelTimer: () => void
  setFinishAfterCurrent: (value: boolean) => void
  triggerFinish: () => boolean
}

let intervalId: ReturnType<typeof setInterval> | null = null

export const useSleepStore = create<SleepState>((set, get) => ({
  enabled: false,
  duration: null,
  remaining: null,
  finishAfterCurrent: true,
  finishPending: false,
  
  startTimer: (minutes) => {
    if (intervalId) clearInterval(intervalId)
    
    const remaining = minutes * 60
    set({ enabled: true, duration: minutes, remaining, finishPending: false })
    
    intervalId = setInterval(() => {
      const state = get()
      if (state.remaining !== null && state.remaining > 0) {
        set({ remaining: state.remaining - 1 })
      } else {
        if (intervalId) clearInterval(intervalId)
        intervalId = null
        if (state.finishAfterCurrent) {
          set({ remaining: null, finishPending: true })
        } else {
          set({ enabled: false, duration: null, remaining: null, finishPending: false })
          usePlayerStore.getState().pause()
        }
      }
    }, 1000)
  },
  
  cancelTimer: () => {
    if (intervalId) clearInterval(intervalId)
    intervalId = null
    set({ enabled: false, duration: null, remaining: null, finishPending: false })
  },
  
  triggerFinish: () => {
    const { finishPending } = get()
    if (finishPending) {
      set({ enabled: false, duration: null, remaining: null, finishPending: false })
      usePlayerStore.getState().pause()
      return true
    }
    return false
  },
  
  setFinishAfterCurrent: (value) => set({ finishAfterCurrent: value }),
}))