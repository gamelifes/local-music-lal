export interface LyricWord {
  text: string
  startMs: number
  durationMs: number
}

export interface LyricLine {
  text: string
  startMs: number
  words: LyricWord[]
}
