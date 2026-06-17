import { create } from 'zustand'
import type { Song } from '../types/song'
import * as db from '../lib/db'

interface LibraryState {
  songs: Song[]
  hiddenIds: Set<string>
  isLoading: boolean

  loadSongs: () => Promise<void>
  addSongs: (songs: Song[]) => Promise<void>
  hideSong: (filePath: string) => Promise<void>
  unhideSong: (filePath: string) => Promise<void>
  getVisibleSongs: () => Song[]
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  songs: [],
  hiddenIds: new Set(),
  isLoading: false,

  loadSongs: async () => {
    set({ isLoading: true })
    const songs = await db.getAllSongs()
    const hiddenIds = await db.getHiddenSongs()
    set({ songs, hiddenIds, isLoading: false })
  },

  addSongs: async (songs) => {
    await db.addSongs(songs)
    set(state => ({ songs: [...state.songs, ...songs] }))
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
}))
