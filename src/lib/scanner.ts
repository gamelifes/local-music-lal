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
}

// Pick a directory using system file picker (Android)
export async function pickDirectory(): Promise<string | null> {
  try {
    const { FilePicker } = await import('@capawesome/capacitor-file-picker')
    const result = await FilePicker.pickDirectory()
    if (result && result.path) {
      return result.path
    }
    return null
  } catch (e) {
    console.error('pickDirectory failed:', e)
    return null
  }
}

// Convert absolute path to relative path for Capacitor Filesystem
function toRelativePath(absolutePath: string): string {
  // Remove common prefixes
  let path = absolutePath
  if (path.startsWith('file://')) {
    path = path.substring(7)
  }
  // Remove /storage/emulated/0/ prefix if present
  if (path.startsWith('/storage/emulated/0/')) {
    path = path.substring(20)
  }
  // Remove leading slash
  if (path.startsWith('/')) {
    path = path.substring(1)
  }
  return path
}

// Scan a specific directory path (Android)
export async function scanDirectoryByPath(dirPath: string): Promise<ScanResult> {
  const songs: Song[] = []
  const lyrics = new Map<string, string>()
  const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.ape']
  const folderName = dirPath.split('/').pop() || 'Music'

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const relativePath = toRelativePath(dirPath)

    console.log('Scanning folder:', folderName, 'relativePath:', relativePath)

    async function scanDir(path: string) {
      try {
        const dirResult = await Filesystem.readdir({
          path: path,
          directory: Directory.ExternalStorage
        })

        console.log('Directory contents:', dirResult.files?.length, 'items')

        const files = dirResult.files || []
        for (const file of files) {
          const name = file.name.toLowerCase()
          const ext = name.substring(name.lastIndexOf('.'))
          const filePath = path ? `${path}/${file.name}` : file.name

          if (file.type === 'directory') {
            // Recursively scan subdirectories
            await scanDir(filePath)
          } else if (audioExtensions.includes(ext)) {
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
              folder: folderName,
              hidden: false,
              addedAt: Date.now(),
            }
            songs.push(song)
            console.log('Found audio:', file.name)
          } else if (ext === '.lrc') {
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
        console.error('Error scanning directory:', path, e)
      }
    }

    await scanDir(relativePath)
    console.log('Scan complete. Found', songs.length, 'songs')
  } catch (e) {
    console.error('scanDirectoryByPath failed:', e)
  }

  return { songs, lyrics }
}

// Scan using File System Access API (Web)
async function scanWithFilePicker(): Promise<ScanResult> {
  const dirHandle = await window.showDirectoryPicker()
  const songs: Song[] = []
  const lyrics = new Map<string, string>()
  const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.ape']

  async function scanDir(handle: FileSystemDirectoryHandle, path: string) {
    for await (const entry of handle.values()) {
      if (entry.kind === 'file') {
        const name = entry.name.toLowerCase()
        const ext = name.substring(name.lastIndexOf('.'))

        if (audioExtensions.includes(ext)) {
          const file = await entry.getFile()
          const format = ext.substring(1)
          const audioPath = path + '/' + entry.name

          storeFileHandle(audioPath, entry)

          const song: Song = {
            id: generateId(audioPath),
            title: entry.name.replace(ext, ''),
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
        } else if (ext === '.lrc') {
          const file = await entry.getFile()
          const text = await file.text()
          const lrcPath = path + '/' + entry.name
          lyrics.set(lrcPath, text)
        }
      } else if (entry.kind === 'directory') {
        await scanDir(entry, path + '/' + entry.name)
      }
    }
  }

  await scanDir(dirHandle, dirHandle.name)
  return { songs, lyrics }
}

export async function scanFolder(): Promise<ScanResult> {
  if (window.Capacitor) {
    const path = await pickDirectory()
    if (!path) return { songs: [], lyrics: new Map() }
    return scanDirectoryByPath(path)
  }

  if (typeof window.showDirectoryPicker === 'function') {
    return scanWithFilePicker()
  }

  console.warn('No file access API available')
  return { songs: [], lyrics: new Map() }
}
