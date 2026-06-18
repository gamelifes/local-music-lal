import { describe, it, expect } from 'vitest'
import { parseLRC, parseEnhancedLRC } from '../lib/lyrics'

describe('Lyrics Parser', () => {
  const sampleLRC = `[00:12.34]故事的小黄花
[00:16.78]从出生那年就飘着
[00:21.45]童年的荡秋千`

  const sampleEnhancedLRC = `[00:12.34]我<00:12.34>习<00:12.68>惯<00:13.02>在<00:13.36>夜<00:13.70>里`

  it('should parse standard LRC', () => {
    const lines = parseLRC(sampleLRC, 180000)
    expect(lines.length).toBe(3)
    expect(lines[0].text).toBe('故事的小黄花')
    expect(lines[0].startMs).toBe(12340)
    expect(lines[0].words.length).toBe(6) // 6 characters
  })

  it('should sort lines by start time', () => {
    const unsortedLRC = `[00:21.45]第三行
[00:12.34]第一行
[00:16.78]第二行`
    const lines = parseLRC(unsortedLRC, 180000)
    expect(lines[0].startMs).toBe(12340)
    expect(lines[1].startMs).toBe(16780)
    expect(lines[2].startMs).toBe(21450)
  })

  it('should parse enhanced LRC with word timestamps', () => {
    const lines = parseEnhancedLRC(sampleEnhancedLRC)
    expect(lines.length).toBe(1)
    expect(lines[0].words.length).toBe(6) // 我习惯在夜里
    expect(lines[0].words[0].text).toBe('我')
    expect(lines[0].words[0].startMs).toBe(12340)
  })

  it('should handle empty input', () => {
    const lines = parseLRC('', 180000)
    expect(lines.length).toBe(0)
  })

  it('should handle invalid format', () => {
    const lines = parseLRC('This is not LRC format', 180000)
    expect(lines.length).toBe(0)
  })
})
