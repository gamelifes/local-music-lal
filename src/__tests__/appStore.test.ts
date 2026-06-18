import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../store/appStore'

describe('AppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      drawerOpen: false,
      modals: { sleep: false, quality: false, share: false, fileInfo: false },
    })
  })

  it('should have initial state', () => {
    const state = useAppStore.getState()
    expect(state.drawerOpen).toBe(false)
    expect(state.modals.sleep).toBe(false)
    expect(state.modals.quality).toBe(false)
    expect(state.modals.share).toBe(false)
    expect(state.modals.fileInfo).toBe(false)
  })

  it('should toggle drawer', () => {
    useAppStore.getState().toggleDrawer()
    expect(useAppStore.getState().drawerOpen).toBe(true)
    useAppStore.getState().toggleDrawer()
    expect(useAppStore.getState().drawerOpen).toBe(false)
  })

  it('should open modal', () => {
    useAppStore.getState().openModal('sleep')
    expect(useAppStore.getState().modals.sleep).toBe(true)
  })

  it('should close modal', () => {
    useAppStore.setState({ modals: { sleep: true, quality: false, share: false, fileInfo: false } })
    useAppStore.getState().closeModal('sleep')
    expect(useAppStore.getState().modals.sleep).toBe(false)
  })
})
