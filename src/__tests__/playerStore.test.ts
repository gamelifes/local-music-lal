import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from '../store/player'

describe('PlayerStore', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      currentSong: null,
      isPlaying: false,
      progress: 0,
      viewMode: 'vinyl',
      activeLine: 0,
      activeWord: -1,
    })
  })

  it('should have initial state', () => {
    const state = usePlayerStore.getState()
    expect(state.currentSong).toBeNull()
    expect(state.isPlaying).toBe(false)
    expect(state.progress).toBe(0)
    expect(state.viewMode).toBe('vinyl')
  })

  it('should set view mode', () => {
    usePlayerStore.getState().setViewMode('lyrics')
    expect(usePlayerStore.getState().viewMode).toBe('lyrics')
  })

  it('should set active line and word', () => {
    usePlayerStore.getState().setActiveLine(3)
    usePlayerStore.getState().setActiveWord(5)
    expect(usePlayerStore.getState().activeLine).toBe(3)
    expect(usePlayerStore.getState().activeWord).toBe(5)
  })

  it('should reset karaoke', () => {
    usePlayerStore.getState().setActiveLine(3)
    usePlayerStore.getState().setActiveWord(5)
    usePlayerStore.getState().resetKaraoke()
    expect(usePlayerStore.getState().activeLine).toBe(0)
    expect(usePlayerStore.getState().activeWord).toBe(-1)
  })

  it('should set progress', () => {
    usePlayerStore.getState().setProgress(50)
    expect(usePlayerStore.getState().progress).toBe(50)
  })
})
