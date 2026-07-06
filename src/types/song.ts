export interface Song {
  id: string
  title: string
  artist: string
  album: string
  duration: number // seconds
  filePath: string
  size: number // bytes
  format: string // mp3, flac, wav, etc.
  bitrate: number // kbps
  sampleRate: number // Hz
  channels: number // 1 or 2
  quality: 'lossless' | 'high' | 'standard' | 'low'
  folder: string
  hidden: boolean
  addedAt: number // timestamp
  cover?: string // data URL
}
