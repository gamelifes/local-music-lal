import { create } from 'zustand'
import type { Song } from '../types/song'
import type { LyricLine } from '../lib/lyrics'
import { parseLRC } from '../lib/lyrics'
import * as audio from '../lib/audio'
import { useLibraryStore } from './library'
import { useSleepStore } from './sleep'

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
  lyrics: LyricLine[]
  repeatMode: 'all' | 'shuffle' | 'one' // 列表循环/随机/单曲循环

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
  setLyrics: (lyrics: LyricLine[]) => void
  setRepeatMode: (mode: 'all' | 'shuffle' | 'one') => void
  toggleRepeatMode: () => void
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
  lyrics: [],
  repeatMode: 'all',

  play: async (song, list) => {
    const songList = list || [song]
    const currentIndex = list ? list.findIndex(s => s.id === song.id) : 0

    // Load lyrics from library store
    const { getLyrics } = useLibraryStore.getState()
    const lrcText = getLyrics(song.filePath)
    let lyrics: LyricLine[] = []
    if (lrcText) {
      lyrics = parseLRC(lrcText)
      console.log('Loaded lyrics:', lyrics.length, 'lines')
    } else {
      console.log('No lyrics found for:', song.filePath)
      lyrics = []
    }

    // Set state first - use song's duration from DB if available
    set({
      currentSong: song,
      songList,
      currentIndex,
      isPlaying: true,
      progress: 0,
      currentTime: 0,
      duration: song.duration || 0,
      activeLine: 0,
      activeWord: -1,
      lyrics
    })

    // Start playback
    await audio.playSong(song, () => {
      if (useSleepStore.getState().triggerFinish()) return

      const state = get()
      const { repeatMode } = state

      if (repeatMode === 'one') {
        get().play(song, songList)
      } else if (repeatMode === 'shuffle') {
        get().nextSong()
      } else {
        get().nextSong()
      }
    }, (duration) => {
      console.log('Duration loaded:', duration)
      set({ duration })
      // Update song duration in library
      if (duration > 0) {
        useLibraryStore.getState().updateSongDuration(song.id, duration)
      }
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
  nextSong: async () => {
    const { songList, currentIndex, repeatMode } = get()
    let nextIndex: number

    if (repeatMode === 'shuffle') {
      // Random next song
      nextIndex = Math.floor(Math.random() * songList.length)
      while (nextIndex === currentIndex && songList.length > 1) {
        nextIndex = Math.floor(Math.random() * songList.length)
      }
    } else if (repeatMode === 'one') {
      // Repeat current song
      nextIndex = currentIndex
    } else {
      // Repeat all - play next, loop to start if at end
      nextIndex = currentIndex + 1
      if (nextIndex >= songList.length) {
        nextIndex = 0
      }
    }

    const nextSong = songList[nextIndex]

    // Load lyrics from library store
    const { getLyrics } = useLibraryStore.getState()
    const lrcText = getLyrics(nextSong.filePath)
    let lyrics: LyricLine[] = []
    if (lrcText) {
      lyrics = parseLRC(lrcText)
    }

    // Set state first
    set({
      currentSong: nextSong,
      currentIndex: nextIndex,
      isPlaying: true,
      progress: 0,
      currentTime: 0,
      duration: nextSong.duration || 0,
      activeLine: 0,
      activeWord: -1,
      lyrics
    })

// Start playback
     audio.playSong(nextSong, () => {
if (useSleepStore.getState().triggerFinish()) return
        get().nextSong()
     }, (duration) => {
       set({ duration })
     })
  },
  prevSong: async () => {
    const { songList, currentIndex, currentTime } = get()
    if (currentTime > 3) {
      audio.seek(0)
      set({ progress: 0, currentTime: 0 })
    } else if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      const prevSong = songList[prevIndex]

      // Load lyrics from library store
      const { getLyrics } = useLibraryStore.getState()
      const lrcText = getLyrics(prevSong.filePath)
      let lyrics: LyricLine[] = []
      if (lrcText) {
        lyrics = parseLRC(lrcText)
      }

      // Set state first
      set({
        currentSong: prevSong,
        currentIndex: prevIndex,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
        duration: prevSong.duration || 0,
        activeLine: 0,
        activeWord: -1,
        lyrics
      })

// Start playback
       audio.playSong(prevSong, () => {
if (useSleepStore.getState().triggerFinish()) return
          get().nextSong()
       }, (duration) => {
         set({ duration })
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
    const { isPlaying, lyrics } = get()
    if (!isPlaying) return

    const position = audio.getPosition()
    const duration = audio.getDuration()
    if (duration === 0) return

    const progress = (position / duration) * 100

    // Update karaoke state based on lyrics
    let newActiveLine = 0
    let newActiveWord = -1

    if (lyrics.length > 0) {
      // Find the current line
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (position >= lyrics[i].time) {
          newActiveLine = i
          break
        }
      }

      // Find the current word within the line
      const currentLine = lyrics[newActiveLine]
      if (currentLine && currentLine.words.length > 0) {
        for (let i = currentLine.words.length - 1; i >= 0; i--) {
          if (position >= currentLine.words[i].time) {
            newActiveWord = i
            break
          }
        }
      }
    }

    set({ progress, currentTime: position, duration, activeLine: newActiveLine, activeWord: newActiveWord })
  },
  setVolume: (volume) => { audio.setVolume(volume); set({ volume }) },
  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveLine: (line) => set({ activeLine: line }),
  setActiveWord: (word) => set({ activeWord: word }),
  resetKaraoke: () => set({ activeLine: 0, activeWord: -1 }),
  setLyrics: (lyrics) => set({ lyrics }),
  setRepeatMode: (mode: 'all' | 'shuffle' | 'one') => set({ repeatMode: mode }),
  toggleRepeatMode: () => {
    const { repeatMode } = get()
    const modes: ('all' | 'shuffle' | 'one')[] = ['all', 'shuffle', 'one']
    const currentIndex = modes.indexOf(repeatMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    set({ repeatMode: nextMode })
  },
}))
