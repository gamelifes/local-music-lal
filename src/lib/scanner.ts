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
    console.log('pickDirectory result:', result)
    if (result && result.path) {
      return result.path
    }
    return null
  } catch (e) {
    console.error('pickDirectory failed:', e)
    return null
  }
}

// Get relative path for Capacitor Filesystem (Android)
// The path from pickDirectory is like "/storage/emulated/0/Music"
// Filesystem.readdir with ExternalStorage expects relative path like "Music"
function getRelativePathForFilesystem(absolutePath: string): string {
  let path = absolutePath
  // Remove file:// prefix
  if (path.startsWith('file://')) {
    path = path.substring(7)
  }
  // Remove /storage/emulated/0/ prefix
  if (path.startsWith('/storage/emulated/0/')) {
    path = path.substring(20)
  }
  // Remove leading slash
  if (path.startsWith('/')) {
    path = path.substring(1)
  }
  return path
}

// Check if a file is an audio file
function isAudioFile(filename: string): boolean {
  const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.ape']
  const name = filename.toLowerCase()
  return audioExtensions.some(ext => name.endsWith(ext))
}

// Check if a file is a lyrics file
function isLyricsFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.lrc')
}

// Scan a specific directory path (Android)
export async function scanDirectoryByPath(dirPath: string): Promise<ScanResult> {
  const songs: Song[] = []
  const lyrics = new Map<string, string>()
  const folderName = dirPath.split('/').pop() || 'Music'

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const relativePath = getRelativePathForFilesystem(dirPath)

    console.log('Scanning folder:', folderName, 'relativePath:', relativePath)

    async function scanDir(path: string) {
      try {
        const dirResult = await Filesystem.readdir({
          path: path,
          directory: Directory.ExternalStorage
        })

        console.log('Directory contents:', dirResult.files?.length, 'items in', path)

        const files = dirResult.files || []
        for (const file of files) {
          const name = file.name
          const filePath = path ? `${path}/${name}` : name

          // Check if it's a directory (no extension or type is directory)
          const hasExtension = name.includes('.')
          const isDir = file.type === 'directory' || !hasExtension

          if (isDir && name !== '.' && name !== '..') {
            // Recursively scan subdirectories
            console.log('Scanning subdirectory:', filePath)
            await scanDir(filePath)
          } else if (isAudioFile(name)) {
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
              console.warn('Failed to read lyrics:', name, e)
            }
          }
        }
      } catch (e) {
        console.error('Error scanning directory:', path, e)
      }
    }

    await scanDir(relativePath)
    console.log('Scan complete. Found', songs.length, 'songs and', lyrics.size, 'lyrics files')
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
