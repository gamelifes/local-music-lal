export interface LyricLine {
  text: string
  time: number // in seconds
  startMs: number // in milliseconds
  words: LyricWord[]
}

export interface LyricWord {
  text: string
  time: number // in seconds
  startMs: number // in milliseconds
}

export function parseLRC(lrcText: string, _durationMs?: number): LyricLine[] {
  // Check if it's Enhanced LRC (has word-level timing like <mm:ss.xx>)
  const isEnhanced = /\[\d{2}:\d{2}\.\d{2,3}\]<\d{2}:\d{2}\.\d{2,3}>/.test(lrcText)

  if (isEnhanced) {
    console.log('Detected Enhanced LRC format')
    return parseEnhancedLRC(lrcText)
  }

  // Standard LRC parsing
  const lines: LyricLine[] = []
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g

  for (const line of lrcText.split('\n')) {
    const times: number[] = []
    let match

    while ((match = timeRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const ms = parseInt(match[3].padEnd(3, '0'))
      times.push(minutes * 60 + seconds + ms / 1000)
    }

    const text = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim()
    if (text && times.length > 0) {
      for (const time of times) {
        lines.push({ text, time, startMs: Math.round(time * 1000), words: [] })
      }
    }
  }

  // Sort by time first
  lines.sort((a, b) => a.time - b.time)

  // Distribute word timing within each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextTime = i < lines.length - 1 ? lines[i + 1].time : line.time + 3
    const lineDuration = nextTime - line.time
    const chars = line.text.split('')
    const charDuration = lineDuration / Math.max(chars.length, 1)

    line.words = chars.map((char, idx) => ({
      text: char,
      time: line.time + (idx * charDuration),
      startMs: Math.round((line.time + (idx * charDuration)) * 1000)
    }))
  }

  return lines
}

export function parseEnhancedLRC(lrcText: string): LyricLine[] {
  const lines: LyricLine[] = []
  const lineRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*?)(?=\[\d{2}:\d{2}|$)/g
  const wordRegex = /<(\d{2}):(\d{2})\.(\d{2,3})>([^<]*)/g

  let lineMatch
  while ((lineMatch = lineRegex.exec(lrcText)) !== null) {
    const lineMinutes = parseInt(lineMatch[1])
    const lineSeconds = parseInt(lineMatch[2])
    const lineMs = parseInt(lineMatch[3].padEnd(3, '0'))
    const lineTime = lineMinutes * 60 + lineSeconds + lineMs / 1000
    const lineStartMs = Math.round(lineTime * 1000)

    const content = lineMatch[4]
    const words: LyricWord[] = []
    let wordMatch
    let lastWordEnd = 0

    while ((wordMatch = wordRegex.exec(content)) !== null) {
      const wordMinutes = parseInt(wordMatch[1])
      const wordSeconds = parseInt(wordMatch[2])
      const wordMs = parseInt(wordMatch[3].padEnd(3, '0'))
      const wordTime = wordMinutes * 60 + wordSeconds + wordMs / 1000
      const wordStartMs = Math.round(wordTime * 1000)

      // Add any text before this word marker
      const beforeText = content.substring(lastWordEnd, wordMatch.index)
      if (beforeText) {
        words.push({ text: beforeText, time: wordTime, startMs: wordStartMs })
      }

      // Add the word after the marker
      const wordText = wordMatch[4]
      if (wordText) {
        words.push({ text: wordText, time: wordTime, startMs: wordStartMs })
      }

      lastWordEnd = wordMatch.index + wordMatch[0].length
    }

    // Add any remaining text
    if (lastWordEnd < content.length) {
      const remainingText = content.substring(lastWordEnd)
      if (remainingText) {
        words.push({ text: remainingText, time: lineTime, startMs: lineStartMs })
      }
    }

    // If no word markers found, create words from the entire line
    if (words.length === 0 && content.trim()) {
      const chars = content.split('').map(char => ({
        text: char,
        time: lineTime,
        startMs: lineStartMs
      }))
      words.push(...chars)
    }

    lines.push({ text: content, time: lineTime, startMs: lineStartMs, words })
  }

  return lines.sort((a, b) => a.time - b.time)
}
