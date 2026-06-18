import type { LyricLine, LyricWord } from '../types/lyrics'

// Parse milliseconds from LRC format (e.g., "34" -> 340ms, "340" -> 340ms)
function parseMs(msStr: string): number {
  if (!msStr) return 0
  const ms = parseInt(msStr)
  // LRC format: 2 digits = *10, 3 digits = direct
  if (msStr.length === 2) return ms * 10
  return ms
}

export function parseLRC(raw: string, _durationMs: number): LyricLine[] {
  const lines: LyricLine[] = []
  const regex = /\[(\d{2}):(\d{2})\.?(\d{0,3})\](.*)/

  for (const line of raw.split('\n')) {
    const match = line.match(regex)
    if (match) {
      const [, min, sec, ms, text] = match
      const startMs = parseInt(min) * 60000 + parseInt(sec) * 1000 + parseMs(ms)

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
      const lineStartMs = parseInt(min) * 60000 + parseInt(sec) * 1000 + parseMs(ms)

      const words: LyricWord[] = []
      let lastTime = lineStartMs

      // Get text before first timestamp (if any)
      const firstTimestampMatch = content.match(wordRegex)
      const textBeforeFirst = firstTimestampMatch ? content.substring(0, content.indexOf(firstTimestampMatch[0])) : content
      
      if (textBeforeFirst) {
        for (const char of textBeforeFirst) {
          words.push({
            text: char,
            startMs: lastTime,
            durationMs: 200,
          })
          lastTime += 200
        }
      }

      // Parse remaining content with timestamps
      const parts = content.split(wordRegex)
      for (let i = 1; i < parts.length; i += 4) {
        if (parts[i] && parts[i+1] && parts[i+2]) {
          const wordTime = parseInt(parts[i]) * 60000 + parseInt(parts[i+1]) * 1000 + parseMs(parts[i+2])
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

      lines.push({ text: content.replace(/<[^>]+>/g, ''), startMs: lineStartMs, words })
    }
  }

  return lines.sort((a, b) => a.startMs - b.startMs)
}
