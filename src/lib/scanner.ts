import type { Song } from '../types/song'
import { storeFileHandle } from './audio'
import { parseBuffer } from 'music-metadata'

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

// Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// Read file chunk and parse metadata using music-metadata
async function readFileMetadata(
  filePath: string,
  fileSize: number
): Promise<{ title?: string; artist?: string; album?: string; duration: number; bitrate: number; sampleRate: number; channels: number }> {
  const defaults = { duration: 0, bitrate: 320, sampleRate: 44100, channels: 2 }

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')

    // Read first 256KB - enough for most format headers
    const chunkSize = Math.min(262144, fileSize)
    const result = await Filesystem.readFile({
      path: filePath,
      directory: Directory.ExternalStorage,
      offset: 0,
      length: chunkSize,
    })

    const data = base64ToUint8Array(result.data as string)
    const metadata = await parseBuffer(data, { duration: true })

    return {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      duration: metadata.format.duration ?? 0,
      bitrate: metadata.format.bitrate ?? defaults.bitrate,
      sampleRate: metadata.format.sampleRate ?? defaults.sampleRate,
      channels: metadata.format.numberOfChannels ?? defaults.channels,
    }
  } catch {
    return defaults
  }
}

// Parse SAF content URI to get the actual filesystem path
// Format: content://com.android.externalstorage.documents/tree/primary%3AMusic/SubFolder
//   primary → /storage/emulated/0/
//   Other IDs (e.g. AABB-CCDD) → /storage/AABB-CCDD/
function parseContentUri(uri: string): { path: string; relativePath: string; folderName: string } {
  try {
    // Match tree URI pattern: .../tree/<volumeId>%3A<relativePath>
    const treeMatch = uri.match(/\/tree\/([^/]+)/)
    if (treeMatch) {
      const volumeAndPath = decodeURIComponent(treeMatch[1])
      const colonIdx = volumeAndPath.indexOf(':')
      if (colonIdx !== -1) {
        const volumeId = volumeAndPath.substring(0, colonIdx)
        const relativePath = volumeAndPath.substring(colonIdx + 1)

        let basePath: string
        if (volumeId === 'primary') {
          basePath = '/storage/emulated/0'
        } else {
          basePath = `/storage/${volumeId}`
        }

        const fullPath = relativePath ? `${basePath}/${relativePath}` : basePath
        const folderName = relativePath ? relativePath.split('/').pop() || 'Music' : 'Music'

        return { path: fullPath, relativePath, folderName }
      }
    }

    // Fallback: treat as a plain path
    const folderName = uri.split('/').pop() || 'Music'
    return { path: uri, relativePath: folderName, folderName }
  } catch {
    const folderName = uri.split('/').pop() || 'Music'
    return { path: uri, relativePath: folderName, folderName }
  }
}

// Pick a directory
export async function pickDirectory(): Promise<{ path: string; relativePath: string; folderName: string } | null> {
  try {
    const { CapgoFilePicker } = await import('@capgo/capacitor-file-picker')
    const result = await CapgoFilePicker.pickDirectory()
    if (result && result.path) {
      return parseContentUri(result.path)
    }
    return null
  } catch (e) {
    console.error('pickDirectory failed:', e)
    return null
  }
}

// Scan a directory using Capacitor Filesystem
export async function scanDirectoryByPath(dirPath: string, folderName: string): Promise<ScanResult> {
  const songs: Song[] = []
  const lyrics = new Map<string, string>()

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')

    // dirPath is full path like /storage/emulated/0/Music
    // Filesystem.readdir with ExternalStorage expects path relative to /storage/emulated/0/
    let pathToScan = dirPath
    if (pathToScan.startsWith('/storage/emulated/0/')) {
      pathToScan = pathToScan.substring('/storage/emulated/0/'.length)
    } else if (pathToScan.startsWith('/storage/emulated/0')) {
      pathToScan = pathToScan.substring('/storage/emulated/0'.length)
    } else if (pathToScan.startsWith('/')) {
      pathToScan = pathToScan.substring(1)
    }

    // Remove trailing slash
    if (pathToScan.endsWith('/')) {
      pathToScan = pathToScan.slice(0, -1)
    }

    async function scanDir(relativePath: string): Promise<void> {
      const dirResult = await Filesystem.readdir({
        path: relativePath,
        directory: Directory.ExternalStorage
      })

      const files = dirResult.files || []

      for (const file of files) {
        const name = file.name

        if (file.type === 'directory') {
          // Recurse into subdirectories
          const subPath = relativePath ? `${relativePath}/${name}` : name
          await scanDir(subPath)
          continue
        }

        const filePath = relativePath ? `${relativePath}/${name}` : name

        if (isLyricsFile(name)) {
          try {
            const content = await Filesystem.readFile({
              path: filePath,
              directory: Directory.ExternalStorage
            })
            const title = name.replace('.lrc', '')
            lyrics.set(title, content.data as string)
          } catch (e) {}
          continue
        }

        if (isAudioFile(name)) {
          const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
          const format = ext.substring(1)
          const fallbackTitle = name.replace(ext, '')
          const fileSize = file.size || 0

          const meta = await readFileMetadata(filePath, fileSize)

          const song: Song = {
            id: generateId(filePath),
            title: meta.title || fallbackTitle,
            artist: meta.artist || 'Unknown Artist',
            album: meta.album || 'Unknown Album',
            duration: meta.duration,
            filePath: filePath,
            size: fileSize,
            format,
            bitrate: meta.bitrate,
            sampleRate: meta.sampleRate,
            channels: meta.channels,
            quality: detectQuality(format, meta.bitrate),
            folder: folderName,
            hidden: false,
            addedAt: Date.now(),
          }
          songs.push(song)
        }
      }
    }

    await scanDir(pathToScan)
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

          let meta = { title: '', artist: 'Unknown Artist', album: 'Unknown Album', duration: 0, bitrate: 320, sampleRate: 44100, channels: 2 }
          try {
            // Read first 256KB for metadata
            const chunk = file.slice(0, 262144)
            const parsed = await parseBuffer(new Uint8Array(await chunk.arrayBuffer()), { duration: true })
            meta = {
              title: parsed.common.title || '',
              artist: parsed.common.artist || 'Unknown Artist',
              album: parsed.common.album || 'Unknown Album',
              duration: parsed.format.duration ?? 0,
              bitrate: parsed.format.bitrate ?? 320,
              sampleRate: parsed.format.sampleRate ?? 44100,
              channels: parsed.format.numberOfChannels ?? 2,
            }
          } catch {}

          const song: Song = {
            id: generateId(audioPath),
            title: meta.title || name.replace(ext, ''),
            artist: meta.artist,
            album: meta.album,
            duration: meta.duration,
            filePath: audioPath,
            size: file.size,
            format,
            bitrate: meta.bitrate,
            sampleRate: meta.sampleRate,
            channels: meta.channels,
            quality: detectQuality(format, meta.bitrate),
            folder: dirHandle.name,
            hidden: false,
            addedAt: Date.now(),
          }
          songs.push(song)
        } else if (isLyricsFile(name)) {
          const file = await entry.getFile()
          const text = await file.text()
          const title = name.replace('.lrc', '')
          lyrics.set(title, text)
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
    const picked = await pickDirectory()
    if (picked) {
      return scanDirectoryByPath(picked.path, picked.folderName)
    }
    return { songs: [], lyrics: new Map() }
  }

  if (typeof window.showDirectoryPicker === 'function') {
    return scanWithFilePicker()
  }

  return { songs: [], lyrics: new Map() }
}
