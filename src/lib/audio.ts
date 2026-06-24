import { Howl, Howler } from 'howler'
import type { Song } from '../types/song'

let currentHowl: Howl | null = null
let currentSongId: string | null = null

// Store file handles for audio playback (Web only)
let fileHandleStore: Map<string, FileSystemFileHandle> = new Map()

// Store blob URLs for Android playback
let blobUrlStore: Map<string, string> = new Map()

export function storeFileHandle(filePath: string, handle: FileSystemFileHandle) {
  fileHandleStore.set(filePath, handle)
}

export function storeBlobUrl(filePath: string, url: string) {
  blobUrlStore.set(filePath, url)
}

export function getFileHandle(filePath: string): FileSystemFileHandle | undefined {
  return fileHandleStore.get(filePath)
}

// Get audio file as blob via Capacitor Filesystem (Android)
async function getAudioBlobFromPath(filePath: string): Promise<Blob | null> {
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')

    // Remove leading slash if present
    let path = filePath
    if (path.startsWith('/')) {
      path = path.substring(1)
    }

    const result = await Filesystem.readFile({
      path: path,
      directory: Directory.ExternalStorage
    })

    // Determine MIME type
    const ext = path.split('.').pop()?.toLowerCase() || 'mp3'
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'flac': 'audio/flac',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'aac': 'audio/aac',
      'm4a': 'audio/mp4',
      'ape': 'audio/ape'
    }
    const mimeType = mimeTypes[ext] || 'audio/mpeg'

    // Handle both string and Blob responses
    const data = result.data
    if (typeof data === 'string') {
      // Base64 encoded string
      const byteCharacters = atob(data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      return new Blob([byteArray], { type: mimeType })
    } else {
      // Already a Blob
      return data as Blob
    }
  } catch (e) {
    console.error('Failed to read audio file:', filePath, e)
    return null
  }
}

export async function playSong(song: Song, onEnd?: () => void, onLoad?: (duration: number) => void) {
  // Stop current if different song
  if (currentSongId !== song.id) {
    stop()
  }

  let url: string | null = null

  // Check if we have a cached blob URL
  if (blobUrlStore.has(song.filePath)) {
    url = blobUrlStore.get(song.filePath)!
  }
  // Check if we have a file handle (Web)
  else if (fileHandleStore.has(song.filePath)) {
    const fileHandle = fileHandleStore.get(song.filePath)!
    const file = await fileHandle.getFile()
    url = URL.createObjectURL(file)
    blobUrlStore.set(song.filePath, url)
  }
  // On Android, read file via Capacitor Filesystem
  else if (window.Capacitor) {
    const blob = await getAudioBlobFromPath(song.filePath)
    if (blob) {
      url = URL.createObjectURL(blob)
      blobUrlStore.set(song.filePath, url)
    }
  }

  if (!url) {
    console.error('Cannot play:', song.filePath)
    return
  }

  try {
    // Create new Howl if needed
    if (!currentHowl || currentSongId !== song.id) {
      currentHowl = new Howl({
        src: [url],
        html5: true,
        onplay: () => {},
        onend: () => onEnd?.(),
        onload: () => {
          const duration = currentHowl?.duration() || 0
          onLoad?.(duration)
        },
        onloaderror: (_id, err) => console.error('Load error:', err),
        onplayerror: (_id, err) => console.error('Play error:', err),
      })
      currentSongId = song.id
    }

    currentHowl.play()
  } catch (err) {
    console.error('Failed to play song:', err)
  }
}

export function pause() {
  currentHowl?.pause()
}

export function resume() {
  currentHowl?.play()
}

export function stop() {
  currentHowl?.stop()
  currentHowl = null
  currentSongId = null
}

export function seek(position: number) {
  currentHowl?.seek(position)
}

export function getPosition(): number {
  if (!currentHowl) return 0
  const pos = currentHowl.seek()
  return typeof pos === 'number' ? pos : 0
}

export function getDuration(): number {
  if (!currentHowl) return 0
  return currentHowl.duration() || 0
}

export function isPlaying(): boolean {
  return currentHowl?.playing() || false
}

export function setVolume(volume: number) {
  Howler.volume(volume)
}
