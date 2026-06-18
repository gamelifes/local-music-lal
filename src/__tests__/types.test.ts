import { describe, it, expect } from 'vitest'
import { EQ_FREQUENCIES, EQ_LABELS, DEFAULT_PRESETS } from '../types/eq'

describe('Types', () => {
  it('should have 5 EQ frequencies', () => {
    expect(EQ_FREQUENCIES.length).toBe(5)
    expect(EQ_FREQUENCIES).toEqual([60, 230, 910, 3600, 14000])
  })

  it('should have 5 EQ labels', () => {
    expect(EQ_LABELS.length).toBe(5)
    expect(EQ_LABELS).toEqual(['低音', '中低', '中音', '中高', '高音'])
  })

  it('should have 6 default presets', () => {
    expect(DEFAULT_PRESETS.length).toBe(6)
    expect(DEFAULT_PRESETS[0].name).toBe('正常')
    expect(DEFAULT_PRESETS[0].values).toEqual([0, 0, 0, 0, 0])
  })

  it('each preset should have 5 values', () => {
    DEFAULT_PRESETS.forEach(preset => {
      expect(preset.values.length).toBe(5)
    })
  })
})
