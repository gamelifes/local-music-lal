import { Capacitor, getFileHandle } from './capacitor-shim'
import type { Song } from '../types/song'

let audio: HTMLAudioElement | null = null
let currentSongId: string | null = null
let onEndCallback: (() => void) | null = null
let onLoadCallback: ((duration: number) => void) | null = null

function getWebPath(filePath: string): string {
  return Capacitor.convertFileSrc(filePath)
}

export async function playSong(song: Song, onEnd?: () => void, onLoad?: (duration: number) => void) {
  onEndCallback = onEnd || null
  onLoadCallback = onLoad || null

  if (currentSongId !== song.id && audio) {
    audio.pause()
    audio.src = ''
    audio = null
  }

  let url: string

  if (Capacitor.getPlatform() === 'android') {
    url = getWebPath(song.filePath)
  } else if (getFileHandle(song.filePath)) {
    const fileHandle = getFileHandle(song.filePath)!
    const file = await fileHandle.getFile()
    url = URL.createObjectURL(file)
  } else {
    console.error('Cannot play:', song.filePath)
    return
  }

  if (!audio || currentSongId !== song.id) {
    audio = new Audio()
    audio.src = url
    audio.preload = 'auto'

    audio.addEventListener('ended', () => onEndCallback?.())

    audio.addEventListener('loadedmetadata', () => {
      const duration = audio?.duration || 0
      if (duration > 0 && duration < Infinity) {
        onLoadCallback?.(duration)
      }
    })

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
    })

    currentSongId = song.id
  }

  try {
    await audio.play()
  } catch (err) {
    console.error('Failed to play song:', err)
  }
}

export function pause() { audio?.pause() }
export function resume() { audio?.play() }
export function stop() {
  if (audio) {
    audio.pause()
    audio.src = ''
    audio = null
  }
  currentSongId = null
}
export function seek(position: number) { if (audio) audio.currentTime = position }
export function getPosition(): number { return audio?.currentTime || 0 }
export function getDuration(): number {
  if (!audio) return 0
  const d = audio.duration
  return (d && isFinite(d)) ? d : 0
}
export function isPlaying(): boolean { return audio ? !audio.paused : false }
export function setVolume(volume: number) { if (audio) audio.volume = volume }
