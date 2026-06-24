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

// Pick a folder using custom Android plugin
export async function pickFolder(): Promise<{ path: string; folderName: string } | null> {
  try {
    const { FolderPicker } = await import('../plugins/folder-picker')
    const result = await FolderPicker.pickFolder()
    if (result && result.folderName) {
      return { path: result.path, folderName: result.folderName }
    }
    return null
  } catch (e) {
    console.error('pickFolder failed:', e)
    return null
  }
}

// Scan a directory using Capacitor Filesystem
async function scanDirectory(dirPath: string, folderName: string): Promise<ScanResult> {
  const songs: Song[] = []
  const lyrics = new Map<string, string>()

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')

    // The path from picker might need to be converted
    let pathToScan = dirPath

    // If path starts with content://, we need to handle differently
    if (pathToScan.startsWith('content://')) {
      const match = pathToScan.match(/tree\/primary%3A(.+)/)
      if (match) {
        pathToScan = decodeURIComponent(match[1])
      }
    }

    // Remove leading slash for ExternalStorage
    if (pathToScan.startsWith('/')) {
      pathToScan = pathToScan.substring(1)
    }

    console.log('Scanning path:', pathToScan)

    const dirResult = await Filesystem.readdir({
      path: pathToScan,
      directory: Directory.ExternalStorage
    })

    const files = dirResult.files || []
    console.log('Found', files.length, 'items in', pathToScan)

    for (const file of files) {
      const name = file.name
      const filePath = pathToScan ? `${pathToScan}/${name}` : name

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
          folder: folderName,
          hidden: false,
          addedAt: Date.now(),
        }
        songs.push(song)
        console.log('Found audio:', name)
      } else if (isLyricsFile(name)) {
        try {
          const content = await Filesystem.readFile({
            path: filePath,
            directory: Directory.ExternalStorage
          })
          lyrics.set(filePath, content.data as string)
          console.log('Found lyrics:', name)
        } catch (e) {
          console.warn('Failed to read lyrics:', name)
        }
      }
    }

    console.log('Scan complete:', songs.length, 'songs,', lyrics.size, 'lyrics')
  } catch (e) {
    console.error('scanDirectory failed:', e)
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
    // Try to pick folder using custom plugin
    const picked = await pickFolder()
    if (picked) {
      return scanDirectory(picked.path, picked.folderName)
    }
    return { songs: [], lyrics: new Map() }
  }

  if (typeof window.showDirectoryPicker === 'function') {
    return scanWithFilePicker()
  }

  console.warn('No file access API available')
  return { songs: [], lyrics: new Map() }
}
