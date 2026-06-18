import { create } from 'zustand'
import type { Song } from '../types/song'
import * as audio from '../lib/audio'

interface PlayerState {
  currentSong: Song | null
  songList: Song[]
  currentIndex: number
  isPlaying: boolean
  progress: number // 0-100
  currentTime: number // seconds
  duration: number // seconds
  volume: number // 0-1
  viewMode: 'vinyl' | 'lyrics'
  activeLine: number
  activeWord: number

  play: (song: Song, list?: Song[]) => void
  pause: () => void
  resume: () => void
  stop: () => void
  togglePlay: () => void
  nextSong: () => void
  prevSong: () => void
  seek: (position: number) => void
  setProgress: (progress: number) => void
  updateProgress: () => void
  setVolume: (volume: number) => void
  setViewMode: (mode: 'vinyl' | 'lyrics') => void
  setActiveLine: (line: number) => void
  setActiveWord: (word: number) => void
  resetKaraoke: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  songList: [],
  currentIndex: -1,
  isPlaying: false,
  progress: 0,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  viewMode: 'vinyl',
  activeLine: 0,
  activeWord: -1,

  play: (song, list) => {
    const songList = list || [song]
    const currentIndex = list ? list.findIndex(s => s.id === song.id) : 0
    audio.playSong(song, () => {
      const state = get()
      if (state.currentIndex < state.songList.length - 1) {
        get().nextSong()
      } else {
        set({ isPlaying: false, progress: 0, currentTime: 0 })
      }
    })
    set({
      currentSong: song,
      songList,
      currentIndex,
      isPlaying: true,
      progress: 0,
      currentTime: 0,
      duration: song.duration,
      activeLine: 0,
      activeWord: -1
    })
  },
  pause: () => { audio.pause(); set({ isPlaying: false }) },
  resume: () => { audio.resume(); set({ isPlaying: true }) },
  stop: () => { audio.stop(); set({ isPlaying: false, progress: 0, currentTime: 0 }) },
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
    const { songList, currentIndex } = get()
    if (currentIndex < songList.length - 1) {
      const nextIndex = currentIndex + 1
      const nextSong = songList[nextIndex]
      audio.playSong(nextSong, () => {
        const state = get()
        if (state.currentIndex < state.songList.length - 1) {
          get().nextSong()
        } else {
          set({ isPlaying: false, progress: 0, currentTime: 0 })
        }
      })
      set({
        currentSong: nextSong,
        currentIndex: nextIndex,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
        duration: nextSong.duration,
        activeLine: 0,
        activeWord: -1
      })
    }
  },
  prevSong: () => {
    const { songList, currentIndex, currentTime } = get()
    if (currentTime > 3) {
      audio.seek(0)
      set({ progress: 0, currentTime: 0 })
    } else if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      const prevSong = songList[prevIndex]
      audio.playSong(prevSong, () => {
        const state = get()
        if (state.currentIndex < state.songList.length - 1) {
          get().nextSong()
        } else {
          set({ isPlaying: false, progress: 0, currentTime: 0 })
        }
      })
      set({
        currentSong: prevSong,
        currentIndex: prevIndex,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
        duration: prevSong.duration,
        activeLine: 0,
        activeWord: -1
      })
    }
  },
  seek: (position) => {
    const { duration } = get()
    const seekTime = (position / 100) * duration
    audio.seek(seekTime)
    set({ progress: position, currentTime: seekTime })
  },
  setProgress: (progress) => {
    const { duration } = get()
    set({ progress, currentTime: (progress / 100) * duration })
  },
  updateProgress: () => {
    const { isPlaying, duration } = get()
    if (!isPlaying || duration === 0) return
    const position = audio.getPosition()
    const progress = (position / duration) * 100
    set({ progress, currentTime: position })
  },
  setVolume: (volume) => { audio.setVolume(volume); set({ volume }) },
  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveLine: (line) => set({ activeLine: line }),
  setActiveWord: (word) => set({ activeWord: word }),
  resetKaraoke: () => set({ activeLine: 0, activeWord: -1 }),
}))
