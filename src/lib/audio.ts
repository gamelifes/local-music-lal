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

// Get audio file URI for Android playback
async function getAudioUri(filePath: string): Promise<string | null> {
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')

    // Remove leading slash if present
    let path = filePath
    if (path.startsWith('/')) {
      path = path.substring(1)
    }

    // Get the file URI using stat
    const stat = await Filesystem.stat({
      path: path,
      directory: Directory.ExternalStorage
    })

    return stat.uri || null
  } catch (e) {
    console.error('Failed to get audio URI:', filePath, e)
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
