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

// Read file from Capacitor Filesystem and create Blob URL for playback
async function getAudioUri(filePath: string): Promise<string | null> {
  if (blobUrlStore.has(filePath)) {
    return blobUrlStore.get(filePath)!
  }

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')

    let path = filePath
    if (path.startsWith('/')) {
      path = path.substring(1)
    }

    // Read file as base64
    const result = await Filesystem.readFile({
      path: path,
      directory: Directory.ExternalStorage,
    })

    // Convert base64 to Blob
    const base64 = result.data as string
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    // Detect MIME type from extension
    const ext = path.split('.').pop()?.toLowerCase() || 'mp3'
    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg', flac: 'audio/flac', wav: 'audio/wav',
      ogg: 'audio/ogg', aac: 'audio/aac', m4a: 'audio/mp4', ape: 'audio/ape',
    }
    const blob = new Blob([bytes], { type: mimeMap[ext] || 'audio/mpeg' })
    const url = URL.createObjectURL(blob)

    blobUrlStore.set(filePath, url)
    console.log('Blob URL created:', filePath)
    return url
  } catch (e) {
    console.error('Failed to create audio URL:', filePath, e)
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
  // On Android, get file URI directly
  else if (window.Capacitor) {
    const uri = await getAudioUri(song.filePath)
    if (uri) {
      url = uri
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
          console.log('Audio loaded, duration:', duration)
          onLoad?.(duration)
        },
        onloaderror: (_id, err) => {
          console.error('Load error:', err)
        },
        onplayerror: (_id, err) => console.error('Play error:', err),
      })
      currentSongId = song.id
    }

    currentHowl.play()

    // Check duration periodically until it's available
    const checkDuration = setInterval(() => {
      if (currentHowl && currentSongId === song.id) {
        const duration = currentHowl.duration()
        if (duration > 0) {
          clearInterval(checkDuration)
          onLoad?.(duration)
        }
      }
    }, 500)

    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkDuration), 5000)
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
