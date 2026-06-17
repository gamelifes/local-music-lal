import { Howl, Howler } from 'howler'
import type { Song } from '../types/song'

let currentHowl: Howl | null = null
let currentSongId: string | null = null

export function playSong(song: Song, onEnd?: () => void) {
  // Stop current if different song
  if (currentSongId !== song.id) {
    stop()
  }

  // Create new Howl if needed
  if (!currentHowl || currentSongId !== song.id) {
    currentHowl = new Howl({
      src: [song.filePath],
      html5: true,
      onplay: () => {},
      onend: () => onEnd?.(),
      onloaderror: (_id, err) => console.error('Load error:', err),
    })
    currentSongId = song.id
  }

  currentHowl.play()
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
  return currentHowl?.seek() as number || 0
}

export function getDuration(): number {
  return currentHowl?.duration() || 0
}

export function isPlaying(): boolean {
  return currentHowl?.playing() || false
}

export function setVolume(volume: number) {
  Howler.volume(volume)
}
