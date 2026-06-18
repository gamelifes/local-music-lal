import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Howler
vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    duration: vi.fn().mockReturnValue(180),
    playing: vi.fn().mockReturnValue(false),
  })),
  Howler: {
    volume: vi.fn(),
  },
}))

describe('Audio Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should export audio functions', async () => {
    const audio = await import('../lib/audio')
    expect(typeof audio.playSong).toBe('function')
    expect(typeof audio.pause).toBe('function')
    expect(typeof audio.resume).toBe('function')
    expect(typeof audio.stop).toBe('function')
    expect(typeof audio.seek).toBe('function')
    expect(typeof audio.getPosition).toBe('function')
    expect(typeof audio.getDuration).toBe('function')
    expect(typeof audio.isPlaying).toBe('function')
    expect(typeof audio.setVolume).toBe('function')
  })
})
