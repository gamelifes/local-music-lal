import type { Song } from '../types/song'

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>
  }
}

function detectQuality(format: string, bitrate: number): Song['quality'] {
  // In production, use music-metadata library to parse actual bitrate
  const losslessFormats = ['flac', 'wav', 'ape', 'alac', 'ogg']
  if (losslessFormats.includes(format.toLowerCase())) return 'lossless'
  if (bitrate >= 800) return 'lossless'
  if (bitrate >= 320) return 'high'
  if (bitrate >= 128) return 'standard'
  return 'low'
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export async function scanFolder(
  onProgress?: (current: number, total: number) => void
): Promise<Song[]> {
  try {
    const dirHandle = await window.showDirectoryPicker()
    const songs: Song[] = []
    const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.ape']

    async function scanDirectory(handle: FileSystemDirectoryHandle, path: string) {
      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          const name = entry.name.toLowerCase()
          const ext = name.substring(name.lastIndexOf('.'))
          if (audioExtensions.includes(ext)) {
            const file = await entry.getFile()
            const format = ext.substring(1)

            const song: Song = {
              id: generateId(),
              title: entry.name.replace(ext, ''),
              artist: 'Unknown Artist',
              album: 'Unknown Album',
              duration: 0,
              filePath: path + '/' + entry.name,
              size: file.size,
              format,
              bitrate: 320,
              sampleRate: 44100,
              channels: 2,
              quality: detectQuality(format, 320),
              folder: dirHandle.name,
              hidden: false,
              addedAt: Date.now(),
            }
            songs.push(song)
            onProgress?.(songs.length, 0)
          }
        } else if (entry.kind === 'directory') {
          await scanDirectory(entry, path + '/' + entry.name)
        }
      }
    }

    await scanDirectory(dirHandle, dirHandle.name)
    return songs
  } catch (err) {
    console.error('Scan failed:', err)
    return []
  }
}
