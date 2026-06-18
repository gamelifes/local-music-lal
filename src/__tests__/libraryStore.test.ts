import { describe, it, expect, beforeEach } from 'vitest'
import { useLibraryStore } from '../store/library'

describe('LibraryStore', () => {
  beforeEach(() => {
    useLibraryStore.setState({
      songs: [],
      hiddenIds: new Set(),
      isLoading: false,
    })
  })

  it('should have initial state', () => {
    const state = useLibraryStore.getState()
    expect(state.songs).toEqual([])
    expect(state.hiddenIds.size).toBe(0)
    expect(state.isLoading).toBe(false)
  })

  it('should get visible songs (not hidden)', () => {
    const mockSongs = [
      { id: '1', filePath: '/path/1.mp3', hidden: false } as any,
      { id: '2', filePath: '/path/2.mp3', hidden: false } as any,
    ]
    useLibraryStore.setState({
      songs: mockSongs,
      hiddenIds: new Set(['/path/1.mp3']),
    })

    const visible = useLibraryStore.getState().getVisibleSongs()
    expect(visible.length).toBe(1)
    expect(visible[0].id).toBe('2')
  })

  // Skip IndexedDB-dependent tests in test environment
  it.skip('should hide song locally', async () => {
    const mockSongs = [
      { id: '1', filePath: '/path/1.mp3' } as any,
    ]
    useLibraryStore.setState({ songs: mockSongs })

    await useLibraryStore.getState().hideSong('/path/1.mp3')
    expect(useLibraryStore.getState().hiddenIds.has('/path/1.mp3')).toBe(true)
  })

  it.skip('should unhide song locally', async () => {
    useLibraryStore.setState({
      hiddenIds: new Set(['/path/1.mp3']),
    })

    await useLibraryStore.getState().unhideSong('/path/1.mp3')
    expect(useLibraryStore.getState().hiddenIds.has('/path/1.mp3')).toBe(false)
  })
})
