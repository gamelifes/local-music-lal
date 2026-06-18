import { describe, it, expect, beforeEach } from 'vitest'
import { useEqStore } from '../store/eq'

describe('EqStore', () => {
  beforeEach(() => {
    useEqStore.setState({
      currentPreset: '正常',
      currentValues: [0, 0, 0, 0, 0],
      savedPresets: [],
    })
  })

  it('should have initial state', () => {
    const state = useEqStore.getState()
    expect(state.currentPreset).toBe('正常')
    expect(state.currentValues).toEqual([0, 0, 0, 0, 0])
    expect(state.savedPresets).toEqual([])
  })

  it('should set preset by name', () => {
    useEqStore.getState().setPreset('流行')
    expect(useEqStore.getState().currentPreset).toBe('流行')
    expect(useEqStore.getState().currentValues).toEqual([2, 4, 5, 3, 1])
  })

  it('should set custom values', () => {
    useEqStore.getState().setValues([1, 2, 3, 4, 5])
    expect(useEqStore.getState().currentValues).toEqual([1, 2, 3, 4, 5])
    expect(useEqStore.getState().currentPreset).toBe('自定义')
  })

  // Skip IndexedDB-dependent tests in test environment
  it.skip('should save custom preset', async () => {
    await useEqStore.getState().savePreset('MyPreset', [1, 2, 3, 4, 5])
    const saved = useEqStore.getState().savedPresets
    expect(saved.length).toBe(1)
    expect(saved[0].name).toBe('MyPreset')
    expect(saved[0].values).toEqual([1, 2, 3, 4, 5])
    expect(useEqStore.getState().currentPreset).toBe('MyPreset')
  })

  it.skip('should delete preset', async () => {
    await useEqStore.getState().savePreset('ToDelete', [1, 2, 3, 4, 5])
    expect(useEqStore.getState().savedPresets.length).toBe(1)

    await useEqStore.getState().deletePreset('ToDelete')
    expect(useEqStore.getState().savedPresets.length).toBe(0)
  })
})
