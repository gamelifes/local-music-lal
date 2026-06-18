import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useSleepStore } from '../store/sleep'

describe('SleepStore', () => {
  beforeEach(() => {
    useSleepStore.setState({
      enabled: false,
      duration: null,
      remaining: null,
      finishAfterCurrent: true,
    })
  })

  afterEach(() => {
    useSleepStore.getState().cancelTimer()
  })

  it('should have initial state', () => {
    const state = useSleepStore.getState()
    expect(state.enabled).toBe(false)
    expect(state.remaining).toBeNull()
    expect(state.finishAfterCurrent).toBe(true)
  })

  it('should start timer', () => {
    useSleepStore.getState().startTimer(1)
    const state = useSleepStore.getState()
    expect(state.enabled).toBe(true)
    expect(state.duration).toBe(1)
    expect(state.remaining).toBe(60)
  })

  it('should cancel timer', () => {
    useSleepStore.getState().startTimer(1)
    useSleepStore.getState().cancelTimer()
    const state = useSleepStore.getState()
    expect(state.enabled).toBe(false)
    expect(state.remaining).toBeNull()
  })

  it('should set finish after current', () => {
    useSleepStore.getState().setFinishAfterCurrent(false)
    expect(useSleepStore.getState().finishAfterCurrent).toBe(false)
  })
})
