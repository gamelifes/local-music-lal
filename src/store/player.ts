import { create } from 'zustand'
import type { Song } from '../types/song'
import * as audio from '../lib/audio'

interface PlayerState {
  currentSong: Song | null
  isPlaying: boolean
  progress: number // 0-100
  duration: number // seconds
  volume: number // 0-1
  viewMode: 'vinyl' | 'lyrics'
  activeLine: number
  activeWord: number

  play: (song: Song) => void
  pause: () => void
  resume: () => void
  stop: () => void
  togglePlay: () => void
  nextSong: () => void
  prevSong: () => void
  seek: (position: number) => void
  setProgress: (progress: number) => void
  setVolume: (volume: number) => void
  setViewMode: (mode: 'vinyl' | 'lyrics') => void
  setActiveLine: (line: number) => void
  setActiveWord: (word: number) => void
  resetKaraoke: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.8,
  viewMode: 'vinyl',
  activeLine: 0,
  activeWord: -1,

  play: (song) => {
    audio.playSong(song, () => {
      set({ isPlaying: false })
    })
    set({ currentSong: song, isPlaying: true, progress: 0, activeLine: 0, activeWord: -1 })
  },
  pause: () => { audio.pause(); set({ isPlaying: false }) },
  resume: () => { audio.resume(); set({ isPlaying: true }) },
  stop: () => { audio.stop(); set({ isPlaying: false, progress: 0 }) },
  togglePlay: () => {
    const { isPlaying } = get()
    if (isPlaying) {
      audio.pause()
      set({ isPlaying: false })
    } else {
      audio.resume()
      set({ isPlaying: true })
    }
  },
  nextSong: () => {
    set({ activeLine: 0, activeWord: -1 })
  },
  prevSong: () => {
    set({ activeLine: 0, activeWord: -1 })
  },
  seek: (position) => { audio.seek(position); set({ progress: position }) },
  setProgress: (progress) => set({ progress }),
  setVolume: (volume) => { audio.setVolume(volume); set({ volume }) },
  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveLine: (line) => set({ activeLine: line }),
  setActiveWord: (word) => set({ activeWord: word }),
  resetKaraoke: () => set({ activeLine: 0, activeWord: -1 }),
}))
