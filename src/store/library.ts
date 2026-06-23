import { create } from 'zustand'
import type { Song } from '../types/song'
import * as db from '../lib/db'

interface LibraryState {
  songs: Song[]
  lyrics: Map<string, string>
  hiddenIds: Set<string>
  isLoading: boolean

  loadSongs: () => Promise<void>
  addSongs: (songs: Song[], lyrics?: Map<string, string>) => Promise<void>
  updateSongDuration: (songId: string, duration: number) => Promise<void>
  removeSongsByFolder: (folder: string) => Promise<void>
  hideSong: (filePath: string) => Promise<void>
  unhideSong: (filePath: string) => Promise<void>
  getVisibleSongs: () => Song[]
  getLyrics: (filePath: string) => string | undefined
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  songs: [],
  lyrics: new Map(),
  hiddenIds: new Set(),
  isLoading: false,

  loadSongs: async () => {
    set({ isLoading: true })
    const songs = await db.getAllSongs()
    const hiddenIds = await db.getHiddenSongs()
    const lyrics = await db.getAllLyrics()
    set({ songs, hiddenIds, lyrics, isLoading: false })
  },

  addSongs: async (songs, lyrics) => {
    const existingSongs = get().songs
    const existingIds = new Set(existingSongs.map(s => s.id))
    const newSongs = songs.filter(s => !existingIds.has(s.id))

    if (newSongs.length > 0) {
      await db.addSongs(newSongs)
    }

    if (lyrics && lyrics.size > 0) {
      await db.saveLyrics(lyrics)
    }

    set(state => ({
      songs: newSongs.length > 0 ? [...state.songs, ...newSongs] : state.songs,
      lyrics: lyrics ? new Map([...state.lyrics, ...lyrics]) : state.lyrics
    }))
  },

  updateSongDuration: async (songId, duration) => {
    // Get the song before update
    const song = get().songs.find(s => s.id === songId)
    if (!song) return

    // Update in store
    set(state => ({
      songs: state.songs.map(s => s.id === songId ? { ...s, duration } : s)
    }))

    // Update in IndexedDB with the new duration
    const updatedSong = { ...song, duration }
    await db.updateSong(updatedSong)
  },

  removeSongsByFolder: async (folder) => {
    const { songs } = get()
    const songsToRemove = songs.filter(s => s.folder === folder)
    const tx = await db.getDB().then(db => db.transaction('songs', 'readwrite'))
    await Promise.all(songsToRemove.map(s => tx.store.delete(s.id)))
    await tx.done
    set(state => ({ songs: state.songs.filter(s => s.folder !== folder) }))
  },

  hideSong: async (filePath) => {
    await db.hideSong(filePath)
    set(state => ({
      hiddenIds: new Set([...state.hiddenIds, filePath])
    }))
  },

  unhideSong: async (filePath) => {
    await db.unhideSong(filePath)
    set(state => {
      const newHidden = new Set(state.hiddenIds)
      newHidden.delete(filePath)
      return { hiddenIds: newHidden }
    })
  },

  getVisibleSongs: () => {
    const { songs, hiddenIds } = get()
    return songs.filter(s => !hiddenIds.has(s.filePath))
  },

  getLyrics: (filePath) => {
    const { lyrics } = get()
    // Try exact path first
    if (lyrics.has(filePath)) return lyrics.get(filePath)
    // Try .lrc extension
    const lrcPath = filePath.replace(/\.[^.]+$/, '.lrc')
    return lyrics.get(lrcPath)
  },
}))
