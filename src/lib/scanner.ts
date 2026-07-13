import type { Song } from '../types/song'
import { storeFileHandle, Capacitor, FilesystemBridge } from './capacitor-shim'
import { parseBuffer } from 'music-metadata'

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>
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

async function readFileMetadata(
  filePath: string,
  fileSize: number
): Promise<{ title?: string; artist?: string; album?: string; duration: number; bitrate: number; sampleRate: number; channels: number; cover?: string }> {
  const defaults = { duration: 0, bitrate: 320, sampleRate: 44100, channels: 2 }

  try {
    const chunkSize = Math.min(1048576, fileSize)
    const data = await FilesystemBridge.readFileChunk(filePath, 0, chunkSize)
    const metadata = await parseBuffer(data, undefined, { duration: true })

    let cover: string | undefined
    const pic = metadata.common.picture?.[0]
    if (pic?.data) {
      const bytes = pic.data instanceof Uint8Array ? pic.data : new Uint8Array(pic.data)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      cover = `data:${pic.format};base64,${btoa(binary)}`
    }

    return {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      duration: metadata.format.duration ?? 0,
      bitrate: metadata.format.bitrate ?? defaults.bitrate,
      sampleRate: metadata.format.sampleRate ?? defaults.sampleRate,
      channels: metadata.format.numberOfChannels ?? defaults.channels,
      cover,
    }
  } catch {
    return defaults
  }
}

function parseContentUri(uri: string): { path: string; relativePath: string; folderName: string } {
  try {
    const treeMatch = uri.match(/\/tree\/([^/]+)/)
    if (treeMatch) {
      const volumeAndPath = decodeURIComponent(treeMatch[1])
      const colonIdx = volumeAndPath.indexOf(':')
      if (colonIdx !== -1) {
        const volumeId = volumeAndPath.substring(0, colonIdx)
        const relativePath = volumeAndPath.substring(colonIdx + 1)
        const basePath = volumeId === 'primary' ? '/storage/emulated/0' : `/storage/${volumeId}`
        const fullPath = relativePath ? `${basePath}/${relativePath}` : basePath
        const folderName = relativePath ? relativePath.split('/').pop() || 'Music' : 'Music'
        return { path: fullPath, relativePath, folderName }
      }
    }
    const folderName = uri.split('/').pop() || 'Music'
    return { path: uri, relativePath: folderName, folderName }
  } catch {
    const folderName = uri.split('/').pop() || 'Music'
    return { path: uri, relativePath: folderName, folderName }
  }
}

export async function pickDirectory(): Promise<{ path: string; relativePath: string; folderName: string } | null> {
  try {
    const result = await FilesystemBridge.pickDirectory()
    if (result) {
      return parseContentUri(result)
    }
    return null
  } catch (e) {
    console.error('pickDirectory failed:', e)
    return null
  }
}

export async function scanDirectoryByPath(
  dirPath: string,
  folderName: string,
  onProgress?: (count: number) => void
): Promise<ScanResult> {
  const songs: Song[] = []
  const lyrics = new Map<string, string>()

  try {
    let pathToScan = dirPath
    if (pathToScan.startsWith('/storage/emulated/0/')) {
      pathToScan = pathToScan.substring('/storage/emulated/0/'.length)
    } else if (pathToScan.startsWith('/storage/emulated/0')) {
      pathToScan = pathToScan.substring('/storage/emulated/0'.length)
    } else if (pathToScan.startsWith('/')) {
      pathToScan = pathToScan.substring(1)
    }
    if (pathToScan.endsWith('/')) {
      pathToScan = pathToScan.slice(0, -1)
    }

    async function scanDir(relativePath: string): Promise<void> {
      const files = await FilesystemBridge.readdir(
        `/storage/emulated/0/${relativePath}`
      )

      for (const file of files) {
        const name = file.name

        if (file.type === 'directory') {
          const subPath = relativePath ? `${relativePath}/${name}` : name
          await scanDir(subPath)
          continue
        }

        const filePath = relativePath ? `${relativePath}/${name}` : name

        if (isLyricsFile(name)) {
          try {
            const content = await FilesystemBridge.readFileText(`/storage/emulated/0/${filePath}`)
            const title = name.replace('.lrc', '')
            lyrics.set(title, content)
          } catch {}
          continue
        }

        if (isAudioFile(name)) {
          const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
          const format = ext.substring(1)
          const fallbackTitle = name.replace(ext, '')
          const fileSize = file.size || 0

          const meta = await readFileMetadata(`/storage/emulated/0/${filePath}`, fileSize)

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
            cover: meta.cover,
          }
          songs.push(song)
          onProgress?.(songs.length)
        }
      }
    }

    await scanDir(pathToScan)
  } catch (e) {
    console.error('scanDirectory failed:', e)
  }

  return { songs, lyrics }
}

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

          let meta = { title: '', artist: 'Unknown Artist', album: 'Unknown Album', duration: 0, bitrate: 320, sampleRate: 44100, channels: 2, cover: undefined as string | undefined }
          try {
            const chunk = file.slice(0, 1048576)
            const parsed = await parseBuffer(new Uint8Array(await chunk.arrayBuffer()), undefined, { duration: true })
            let cover: string | undefined
            const pic = parsed.common.picture?.[0]
            if (pic?.data) {
              const bytes = pic.data instanceof Uint8Array ? pic.data : new Uint8Array(pic.data)
              let binary = ''
              for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i])
              }
              cover = `data:${pic.format};base64,${btoa(binary)}`
            }
            meta = {
              title: parsed.common.title || '',
              artist: parsed.common.artist || 'Unknown Artist',
              album: parsed.common.album || 'Unknown Album',
              duration: parsed.format.duration ?? 0,
              bitrate: parsed.format.bitrate ?? 320,
              sampleRate: parsed.format.sampleRate ?? 44100,
              channels: parsed.format.numberOfChannels ?? 2,
              cover,
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
            cover: meta.cover,
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
  if (Capacitor.getPlatform() === 'android') {
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
