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

function isAudioFile(filename: string): boolean {
  const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.ape']
  const name = filename.toLowerCase()
  return audioExtensions.some(ext => name.endsWith(ext))
}

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

    // Try multiple path formats
    const possiblePaths = [
      dirPath,                                           // Original path
      dirPath.replace(/^\/storage\/emulated\/0\//, ''), // Relative path
      dirPath.replace(/^\/storage\/emulated\/0\//, '').replace(/^\//, ''), // No leading slash
    ]

    let success = false
    for (const testPath of possiblePaths) {
      try {
        console.log('Trying path:', testPath)
        const dirResult = await Filesystem.readdir({
          path: testPath,
          directory: Directory.ExternalStorage
        })

        if (dirResult.files && dirResult.files.length > 0) {
          success = true
          console.log('Success! Found', dirResult.files.length, 'items')

          for (const file of dirResult.files) {
            const name = file.name
            const filePath = testPath ? `${testPath}/${name}` : name

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
          break
        }
      } catch (e) {
        console.log('Path failed:', testPath, e)
      }
    }

    if (!success) {
      console.log('All path formats failed for:', dirPath)
    }
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
