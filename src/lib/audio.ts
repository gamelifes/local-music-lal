import { Howl, Howler } from 'howler'
import type { Song } from '../types/song'
import AudioPlayer from '../plugins/audio-player'

let currentHowl: Howl | null = null
let currentSongId: string | null = null

// Native player state (Android)
let nativePlaying = false
let nativeDuration = 0
let nativePosition = 0
let progressInterval: ReturnType<typeof setInterval> | null = null
let onEndCallback: (() => void) | null = null
let onLoadCallback: ((duration: number) => void) | null = null
let trackCompleteListener: any = null

// Store file handles for audio playback (Web only)
const fileHandleStore: Map<string, FileSystemFileHandle> = new Map()
const blobUrlStore: Map<string, string> = new Map()

export function storeFileHandle(filePath: string, handle: FileSystemFileHandle) {
  fileHandleStore.set(filePath, handle)
}

export function storeBlobUrl(filePath: string, url: string) {
  blobUrlStore.set(filePath, url)
}

export function getFileHandle(filePath: string): FileSystemFileHandle | undefined {
  return fileHandleStore.get(filePath)
}

export async function playSong(song: Song, onEnd?: () => void, onLoad?: (duration: number) => void) {
  console.log('playSong:', song.filePath, 'Capacitor:', !!window.Capacitor)
  onEndCallback = onEnd || null
  onLoadCallback = onLoad || null

  if (window.Capacitor) {
    await playNative(song)
    return
  }

  // Web: use Howler
  if (currentSongId !== song.id) {
    currentHowl?.stop()
    currentHowl = null
  }

  let url: string | null = null

  if (blobUrlStore.has(song.filePath)) {
    url = blobUrlStore.get(song.filePath)!
  } else if (fileHandleStore.has(song.filePath)) {
    const fileHandle = fileHandleStore.get(song.filePath)!
    const file = await fileHandle.getFile()
    url = URL.createObjectURL(file)
    blobUrlStore.set(song.filePath, url)
  }

  if (!url) {
    console.error('Cannot play:', song.filePath)
    return
  }

  try {
    if (!currentHowl || currentSongId !== song.id) {
      currentHowl = new Howl({
        src: [url],
        html5: true,
        onplay: () => {},
        onend: () => onEndCallback?.(),
        onload: () => {
          const duration = currentHowl?.duration() || 0
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

async function playNative(song: Song) {
  console.log('playNative:', song.filePath)
  try {
    if (currentSongId !== song.id) {
      try { await AudioPlayer.stop() } catch {}
      nativePlaying = false
      nativeDuration = 0
      nativePosition = 0
      if (progressInterval) { clearInterval(progressInterval); progressInterval = null }
      if (trackCompleteListener) { trackCompleteListener.remove(); trackCompleteListener = null }
    }

    const fullPath = `/storage/emulated/0/${song.filePath}`
    console.log('Native play:', fullPath)

    const result = await AudioPlayer.play({ path: fullPath })
    console.log('Native play result:', result)

    nativePlaying = true
    nativeDuration = result.duration
    currentSongId = song.id

    // Progress tracking
    if (progressInterval) clearInterval(progressInterval)
    progressInterval = setInterval(async () => {
      if (!nativePlaying || !currentSongId) return
      try {
        const state = await AudioPlayer.getState()
        nativePosition = state.position
        nativePlaying = state.playing
      } catch {}
    }, 250)

    // Track completion listener
    if (trackCompleteListener) { trackCompleteListener.remove(); trackCompleteListener = null }
    trackCompleteListener = await AudioPlayer.addListener('trackComplete', () => {
      nativePlaying = false
      onEndCallback?.()
    })

    onLoadCallback?.(result.duration)
  } catch (e) {
    console.error('Native play failed:', e)
  }
}

export async function pause() {
  if (window.Capacitor) {
    try { await AudioPlayer.pause(); nativePlaying = false } catch {}
  } else {
    currentHowl?.pause()
  }
}

export async function resume() {
  if (window.Capacitor) {
    try { await AudioPlayer.resume(); nativePlaying = true } catch {}
  } else {
    currentHowl?.play()
  }
}

export async function stop() {
  if (window.Capacitor) {
    try { await AudioPlayer.stop() } catch {}
    nativePlaying = false
    nativeDuration = 0
    nativePosition = 0
    if (progressInterval) { clearInterval(progressInterval); progressInterval = null }
    if (trackCompleteListener) { trackCompleteListener.remove(); trackCompleteListener = null }
  } else {
    currentHowl?.stop()
    currentHowl = null
  }
  currentSongId = null
}

export async function seek(position: number) {
  if (window.Capacitor) {
    try { await AudioPlayer.seek({ position }); nativePosition = position } catch {}
  } else {
    currentHowl?.seek(position)
  }
}

export function getPosition(): number {
  if (window.Capacitor) return nativePosition
  if (!currentHowl) return 0
  const pos = currentHowl.seek()
  return typeof pos === 'number' ? pos : 0
}

export function getDuration(): number {
  if (window.Capacitor) return nativeDuration
  if (!currentHowl) return 0
  return currentHowl.duration() || 0
}

export function isPlaying(): boolean {
  if (window.Capacitor) return nativePlaying
  return currentHowl?.playing() || false
}

export function setVolume(volume: number) {
  if (window.Capacitor) {
    AudioPlayer.setVolume({ volume }).catch(() => {})
  } else {
    Howler.volume(volume)
  }
}
