import { Howl, Howler } from 'howler'
import type { Song } from '../types/song'

let currentHowl: Howl | null = null
let currentSongId: string | null = null
let currentBlobUrl: string | null = null

// Store file handles for audio playback
let fileHandleStore: Map<string, FileSystemFileHandle> = new Map()

export function storeFileHandle(filePath: string, handle: FileSystemFileHandle) {
  fileHandleStore.set(filePath, handle)
}

export function getFileHandle(filePath: string): FileSystemFileHandle | undefined {
  return fileHandleStore.get(filePath)
}

export async function playSong(song: Song, onEnd?: () => void, onLoad?: (duration: number) => void) {
  // Stop current if different song
  if (currentSongId !== song.id) {
    stop()
  }

  // Get file handle and create blob URL
  const fileHandle = fileHandleStore.get(song.filePath)
  if (!fileHandle) {
    console.error('No file handle for:', song.filePath)
    return
  }

  try {
    const file = await fileHandle.getFile()
    const url = URL.createObjectURL(file)

    // Revoke previous blob URL
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl)
    }
    currentBlobUrl = url

    // Create new Howl if needed
    if (!currentHowl || currentSongId !== song.id) {
      currentHowl = new Howl({
        src: [url],
        html5: true,
        onplay: () => {
          console.log('Howl playing')
        },
        onend: () => onEnd?.(),
        onload: () => {
          const duration = currentHowl?.duration() || 0
          console.log('Song loaded, duration:', duration)
          onLoad?.(duration)
        },
        onloaderror: (_id, err) => console.error('Load error:', err),
        onplayerror: (_id, err) => console.error('Play error:', err),
      })
      currentSongId = song.id
    }

    currentHowl.play()
    console.log('Howl.play() called')
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
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl)
    currentBlobUrl = null
  }
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
