import type { Song } from '../types/song'
import { storeFileHandle } from './audio'

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>
    Capacitor?: any
  }
}

function detectQuality(format: string, bitrate: number): Song['quality'] {
  const losslessFormats = ['flac', 'wav', 'ape', 'alac', 'ogg']
  if (losslessFormats.includes(format.toLowerCase())) return 'lossless'
  if (bitrate >= 800) return 'lossless'
  if (bitrate >= 320) return 'high'
  if (bitrate >= 128) return 'standard'
  return 'low'
}

function generateId(filePath: string): string {
  let hash = 0
  for (let i = 0; i < filePath.length; i++) {
    const char = filePath.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio()
    const url = URL.createObjectURL(file)

    const cleanup = () => {
      URL.revokeObjectURL(url)
    }

    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration
      cleanup()
      resolve(duration || 0)
    })

    audio.addEventListener('canplay', () => {
      const duration = audio.duration
      if (duration > 0) {
        cleanup()
        resolve(duration)
      }
    })

    audio.addEventListener('error', () => {
      cleanup()
      resolve(0)
    })

    audio.src = url

    setTimeout(() => {
      const duration = audio.duration
      cleanup()
      resolve(duration || 0)
    }, 5000)
  })
}

export interface ScanResult {
  songs: Song[]
  lyrics: Map<string, string>
}

async function scanWithFilePicker(): Promise<ScanResult> {
  const dirHandle = await window.showDirectoryPicker()
  const songs: Song[] = []
  const lyrics = new Map<string, string>()
  const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.ape']

  async function scanDirectory(handle: FileSystemDirectoryHandle, path: string) {
    for await (const entry of handle.values()) {
      if (entry.kind === 'file') {
        const name = entry.name.toLowerCase()
        const ext = name.substring(name.lastIndexOf('.'))

        if (audioExtensions.includes(ext)) {
          const file = await entry.getFile()
          const format = ext.substring(1)
          const audioPath = path + '/' + entry.name

          storeFileHandle(audioPath, entry)

          const duration = await getAudioDuration(file)

          const song: Song = {
            id: generateId(audioPath),
            title: entry.name.replace(ext, ''),
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            duration: duration,
            filePath: audioPath,
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
        } else if (ext === '.lrc') {
          const file = await entry.getFile()
          const text = await file.text()
          const lrcPath = path + '/' + entry.name
          lyrics.set(lrcPath, text)
        }
      } else if (entry.kind === 'directory') {
        await scanDirectory(entry, path + '/' + entry.name)
      }
    }
  }

  await scanDirectory(dirHandle, dirHandle.name)
  return { songs, lyrics }
}

async function scanWithCapacitor(): Promise<ScanResult> {
  const songs: Song[] = []
  const lyrics = new Map<string, string>()
  const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.ape']

  try {
    // Use Capacitor File Picker to let user select a directory
    const { FilePicker } = await import('@capawesome/capacitor-file-picker')

    // Pick a directory
    const result = await FilePicker.pickDirectory()

    if (!result || !result.path) {
      console.log('No directory selected')
      return { songs, lyrics }
    }

    // Read the directory contents
    const { Filesystem, Directory } = await import('@capacitor/filesystem')

    async function scanDir(path: string) {
      try {
        const dirResult = await Filesystem.readdir({
          path: path,
          directory: Directory.ExternalStorage
        })

        const files = dirResult.files || []
        for (const file of files) {
          const name = file.name.toLowerCase()
          const ext = name.substring(name.lastIndexOf('.'))
          const filePath = path ? `${path}/${file.name}` : file.name

          if (audioExtensions.includes(ext)) {
            const format = ext.substring(1)

            const song: Song = {
              id: generateId(filePath),
              title: file.name.replace(ext, ''),
              artist: 'Unknown Artist',
              album: 'Unknown Album',
              duration: 0,
              filePath: filePath,
              size: file.size || 0,
              format,
              bitrate: 320,
              sampleRate: 44100,
              channels: 2,
              quality: detectQuality(format, 320),
              folder: path || 'Music',
              hidden: false,
              addedAt: Date.now(),
            }
            songs.push(song)
          } else if (ext === '.lrc') {
            try {
              const content = await Filesystem.readFile({
                path: filePath,
                directory: Directory.ExternalStorage
              })
              lyrics.set(filePath, content.data as string)
            } catch (e) {
              // Ignore read errors for lyrics
            }
          } else if (!ext || file.type === 'directory') {
            // Recursively scan subdirectories
            await scanDir(filePath)
          }
        }
      } catch (e) {
        console.error('Error scanning directory:', path, e)
      }
    }

    // Use the path from the result
    await scanDir(result.path)

  } catch (e) {
    console.error('Capacitor scan failed:', e)
  }

  return { songs, lyrics }
}

export async function scanFolder(
  _onProgress?: (current: number, total: number) => void
): Promise<ScanResult> {
  // Check if running in Capacitor (Android)
  if (window.Capacitor) {
    return scanWithCapacitor()
  }

  // Check if File System Access API is available (Web)
  if (typeof window.showDirectoryPicker === 'function') {
    return scanWithFilePicker()
  }

  // Fallback for environments without file access
  console.warn('No file access API available')
  return { songs: [], lyrics: new Map() }
}
