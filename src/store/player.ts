import { create } from 'zustand'
import type { Song } from '../types/song'
import * as audio from '../lib/audio'

interface PlayerState {
  currentSong: Song | null
  isPlaying: boolean
  progress: number // 0-100
  duration: number // seconds
  volume: number // 0-1

  play: (song: Song) => void
  pause: () => void
  resume: () => void
  stop: () => void
  seek: (position: number) => void
  setProgress: (progress: number) => void
  setVolume: (volume: number) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentSong: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.8,

  play: (song) => {
    audio.playSong(song, () => {
      // Auto-play next song
      set({ isPlaying: false })
    })
    set({ currentSong: song, isPlaying: true, progress: 0 })
  },
  pause: () => { audio.pause(); set({ isPlaying: false }) },
  resume: () => { audio.resume(); set({ isPlaying: true }) },
  stop: () => { audio.stop(); set({ isPlaying: false, progress: 0 }) },
  seek: (position) => { audio.seek(position); set({ progress: position }) },
  setProgress: (progress) => set({ progress }),
  setVolume: (volume) => { audio.setVolume(volume); set({ volume }) },
}))
