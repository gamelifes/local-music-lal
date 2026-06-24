import type { Song } from '../types/song'
import { storeFileHandle } from './audio'

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>
    Capacitor?: any
  }
}

function detectQuality(format: string, _bitrate: number): Song['quality'] {
  const losslessFormats = ['flac', 'wav', 'ape', 'alac', 'ogg']
  if (losslessFormats.includes(format.toLowerCase())) return 'lossless'
  return 'standard'
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

export interface ScanResult {
  songs: Song[]
  lyrics: Map<string, string>
  folderName?: string
}

function isAudioFile(filename: string): boolean {
  const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.ape']
  const name = filename.toLowerCase()
  return audioExtensions.some(ext => name.endsWith(ext))
}

function isLyricsFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.lrc')
}

// Scan directories on Android using Capacitor Filesystem
async function scanAndroidDirectories(): Promise<ScanResult> {
  const songs: Song[] = []
  const lyrics = new Map<string, string>()

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')

    // Common music directories on Android
    const dirs = ['Music', 'Download', 'Download/Music', 'DCIM', 'Documents', 'recordings']

    for (const dir of dirs) {
      try {
        const result = await Filesystem.readdir({
          path: dir,
          directory: Directory.ExternalStorage
        })

        const files = result.files || []
        for (const file of files) {
          const name = file.name
          const filePath = `${dir}/${name}`

          if (isAudioFile(name)) {
            const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
            const format = ext.substring(1)
            const song: Song = {
              id: generateId(filePath),
              title: name.replace(ext, ''),
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
              folder: dir,
              hidden: false,
              addedAt: Date.now(),
            }
            songs.push(song)
          } else if (isLyricsFile(name)) {
            try {
              const content = await Filesystem.readFile({
                path: filePath,
                directory: Directory.ExternalStorage
              })
              lyrics.set(filePath, content.data as string)
            } catch (e) {
              // Ignore
            }
          }
        }
      } catch (e) {
        // Directory doesn't exist, continue
      }
    }
  } catch (e) {
    console.error('scanAndroidDirectories failed:', e)
  }

  return { songs, lyrics }
}

// Scan using File System Access API (Web)
async function scanWithFilePicker(): Promise<ScanResult> {
  const dirHandle = await window.showDirectoryPicker()
  const songs: Song[] = []
  const lyrics = new Map<string, string>()

  async function scanDir(handle: FileSystemDirectoryHandle, path: string) {
    for await (const entry of handle.values()) {
      if (entry.kind === 'file') {
        const name = entry.name

        if (isAudioFile(name)) {
          const file = await entry.getFile()
          const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
          const format = ext.substring(1)
          const audioPath = path + '/' + name

          storeFileHandle(audioPath, entry)

          const song: Song = {
            id: generateId(audioPath),
            title: name.replace(ext, ''),
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            duration: 0,
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
        } else if (isLyricsFile(name)) {
          const file = await entry.getFile()
          const text = await file.text()
          const lrcPath = path + '/' + name
          lyrics.set(lrcPath, text)
        }
      } else if (entry.kind === 'directory') {
        await scanDir(entry, path + '/' + entry.name)
      }
    }
  }

  await scanDir(dirHandle, dirHandle.name)
  return { songs, lyrics, folderName: dirHandle.name }
}

export async function scanFolder(): Promise<ScanResult> {
  if (window.Capacitor) {
    return scanAndroidDirectories()
  }

  if (typeof window.showDirectoryPicker === 'function') {
    return scanWithFilePicker()
  }

  console.warn('No file access API available')
  return { songs: [], lyrics: new Map() }
}
