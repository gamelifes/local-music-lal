import { describe, it, expect } from 'vitest'

describe('Scanner Module', () => {
  it('should export scanFolder function', async () => {
    const scanner = await import('../lib/scanner')
    expect(typeof scanner.scanFolder).toBe('function')
  })
})
