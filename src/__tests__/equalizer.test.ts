import { describe, it, expect } from 'vitest'

describe('Equalizer Module', () => {
  it('should export equalizer functions', async () => {
    const eq = await import('../lib/equalizer')
    expect(typeof eq.initEqualizer).toBe('function')
    expect(typeof eq.setEqValues).toBe('function')
    expect(typeof eq.setMasterVolume).toBe('function')
    expect(typeof eq.destroy).toBe('function')
  })

  it('should set EQ values without error', async () => {
    const eq = await import('../lib/equalizer')
    // Should not throw even without initialization
    expect(() => eq.setEqValues([0, 0, 0, 0, 0])).not.toThrow()
  })

  it('should set master volume without error', async () => {
    const eq = await import('../lib/equalizer')
    expect(() => eq.setMasterVolume(0.8)).not.toThrow()
  })

  it('should destroy without error', async () => {
    const eq = await import('../lib/equalizer')
    expect(() => eq.destroy()).not.toThrow()
  })
})
