import type { LyricLine, LyricWord } from '../types/lyrics'

export function parseLRC(raw: string, _durationMs: number): LyricLine[] {
  const lines: LyricLine[] = []
  const regex = /\[(\d{2}):(\d{2})\.?(\d{0,3})\](.*)/

  for (const line of raw.split('\n')) {
    const match = line.match(regex)
    if (match) {
      const [, min, sec, ms, text] = match
      const startMs = parseInt(min) * 60000 + parseInt(sec) * 1000 + (ms ? parseInt(ms) : 0)

      const words: LyricWord[] = text.split('').map((char, i) => ({
        text: char,
        startMs: startMs + (i * 200),
        durationMs: 200,
      }))

      lines.push({ text, startMs, words })
    }
  }

  return lines.sort((a, b) => a.startMs - b.startMs)
}

export function parseEnhancedLRC(raw: string): LyricLine[] {
  const lines: LyricLine[] = []
  const lineRegex = /\[(\d{2}):(\d{2})\.?(\d{0,3})\](.*)/
  const wordRegex = /<(\d{2}):(\d{2})\.?(\d{0,3})>/

  for (const line of raw.split('\n')) {
    const lineMatch = line.match(lineRegex)
    if (lineMatch) {
      const [, min, sec, ms, content] = lineMatch
      const lineStartMs = parseInt(min) * 60000 + parseInt(sec) * 1000 + (ms ? parseInt(ms) : 0)

      const words: LyricWord[] = []
      let lastTime = lineStartMs

      const parts = content.split(wordRegex)
      for (let i = 1; i < parts.length; i += 4) {
        if (parts[i] && parts[i+1] && parts[i+2]) {
          const wordTime = parseInt(parts[i]) * 60000 + parseInt(parts[i+1]) * 1000 + (parts[i+2] ? parseInt(parts[i+2]) : 0)
          if (parts[i+3]) {
            words.push({
              text: parts[i+3],
              startMs: wordTime,
              durationMs: wordTime - lastTime,
            })
            lastTime = wordTime
          }
        }
      }

      lines.push({ text: content.replace(wordRegex, ''), startMs: lineStartMs, words })
    }
  }

  return lines.sort((a, b) => a.startMs - b.startMs)
}
