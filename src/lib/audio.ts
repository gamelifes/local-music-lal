import { Howl, Howler } from 'howler'
import { Capacitor } from '@capacitor/core'
import type { Song } from '../types/song'

let currentHowl: Howl | null = null
let currentSongId: string | null = null
let onEndCallback: (() => void) | null = null
let onLoadCallback: ((duration: number) => void) | null = null

const fileHandleStore: Map<string, FileSystemFileHandle> = new Map()

export function storeFileHandle(filePath: string, handle: FileSystemFileHandle) {
  fileHandleStore.set(filePath, handle)
}

export function storeBlobUrl(_filePath: string, _url: string) {}
export function getFileHandle(filePath: string): FileSystemFileHandle | undefined {
  return fileHandleStore.get(filePath)
}

function getWebPath(filePath: string): string {
  // Convert native file path to Capacitor web-accessible path
  // On Android, convertFileSrc maps /storage/emulated/0/... to a local server URL
  const fullPath = `/storage/emulated/0/${filePath}`
  return Capacitor.convertFileSrc(fullPath)
}

export async function playSong(song: Song, onEnd?: () => void, onLoad?: (duration: number) => void) {
  console.log('playSong:', song.filePath, 'platform:', Capacitor.getPlatform())
  onEndCallback = onEnd || null
  onLoadCallback = onLoad || null

  // Stop if different song
  if (currentSongId !== song.id && currentHowl) {
    currentHowl.stop()
    currentHowl.unload()
    currentHowl = null
  }

  let url: string

  if (Capacitor.getPlatform() === 'android') {
    url = getWebPath(song.filePath)
  } else if (fileHandleStore.has(song.filePath)) {
    const fileHandle = fileHandleStore.get(song.filePath)!
    const file = await fileHandle.getFile()
    url = URL.createObjectURL(file)
  } else {
    console.error('Cannot play:', song.filePath)
    return
  }

  console.log('Audio URL:', url)

  try {
    if (!currentHowl || currentSongId !== song.id) {
      currentHowl = new Howl({
        src: [url],
        html5: true,
        onplay: () => {},
        onend: () => onEndCallback?.(),
        onload: () => {
          const duration = currentHowl?.duration() || 0
          console.log('Audio loaded, duration:', duration)
          onLoadCallback?.(duration)
        },
        onloaderror: (_id, err) => console.error('Load error:', err),
        onplayerror: (_id, err) => console.error('Play error:', err),
      })
      currentSongId = song.id
    }

    currentHowl.play()

    const checkDuration = setInterval(() => {
      if (currentHowl && currentSongId === song.id) {
        const duration = currentHowl.duration()
        if (duration > 0) {
          clearInterval(checkDuration)
          onLoadCallback?.(duration)
        }
      }
    }, 500)
    setTimeout(() => clearInterval(checkDuration), 5000)
  } catch (err) {
    console.error('Failed to play song:', err)
  }
}

export function pause() { currentHowl?.pause() }
export function resume() { currentHowl?.play() }
export function stop() {
  currentHowl?.stop()
  currentHowl = null
  currentSongId = null
}
export function seek(position: number) { currentHowl?.seek(position) }
export function getPosition(): number {
  if (!currentHowl) return 0
  const pos = currentHowl.seek()
  return typeof pos === 'number' ? pos : 0
}
export function getDuration(): number {
  if (!currentHowl) return 0
  return currentHowl.duration() || 0
}
export function isPlaying(): boolean { return currentHowl?.playing() || false }
export function setVolume(volume: number) { Howler.volume(volume) }
