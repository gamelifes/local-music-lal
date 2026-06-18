export interface EqPreset {
  name: string
  values: number[] // 5 values for 5 bands
  isCustom: boolean
}

export const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000]
export const EQ_LABELS = ['低音', '中低', '中音', '中高', '高音']

export const DEFAULT_PRESETS: EqPreset[] = [
  { name: '正常', values: [0, 0, 0, 0, 0], isCustom: false },
  { name: '流行', values: [2, 4, 5, 3, 1], isCustom: false },
  { name: '摇滚', values: [5, 3, 0, 3, 5], isCustom: false },
  { name: '爵士', values: [3, 1, 2, 4, 2], isCustom: false },
  { name: '古典', values: [4, 3, 0, 2, 4], isCustom: false },
  { name: '人声', values: [-1, 2, 5, 4, 1], isCustom: false },
  { name: '自定义', values: [0, 0, 0, 0, 0], isCustom: true },
]
