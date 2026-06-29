import { create } from 'zustand'
import type { Song } from '../types/song'
import * as db from '../lib/db'
import { usePlayerStore } from './player'

interface ScanHistoryEntry {
  folder: string
  path?: string
}

interface LibraryState {
  songs: Song[]
  lyrics: Map<string, string>
  hiddenIds: Set<string>
  folders: ScanHistoryEntry[]
  selectedScanFolders: string[]
  playlists: any[]
  playlistSongs: Map<string, string[]>
  isLoading: boolean

  loadSongs: () => Promise<void>
  addSongs: (songs: Song[], lyrics?: Map<string, string>) => Promise<void>
  updateSongDuration: (songId: string, duration: number) => Promise<void>
  removeSongsByFolder: (folder: string) => Promise<void>
  hideSong: (filePath: string) => Promise<void>
  unhideSong: (filePath: string) => Promise<void>
  addFolder: (folder: string, path?: string) => Promise<void>
  removeFolder: (folder: string) => Promise<void>
  toggleSelectedScanFolder: (folder: string) => Promise<void>
  setSelectedScanFolders: (folders: string[]) => Promise<void>
  getVisibleSongs: () => Song[]
  getLyrics: (filePath: string) => string | undefined
  createPlaylist: (name: string) => Promise<string>
  renamePlaylist: (id: string, name: string) => Promise<void>
  deletePlaylist: (id: string) => Promise<void>
  addToPlaylist: (playlistId: string, songId: string) => Promise<void>
  addToPlaylistByFilePath: (playlistId: string, filePath: string) => Promise<void>
  removeFromPlaylist: (playlistId: string, songId: string) => Promise<void>
  getPlaylist: (playlistId: string) => any
  getPlaylistSongs: (playlistId: string) => Song[]
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  songs: [],
  lyrics: new Map(),
  hiddenIds: new Set(),
  folders: [],
  selectedScanFolders: [] as string[],
  playlists: [],
  playlistSongs: new Map(),
  isLoading: false,

  loadSongs: async () => {
    set({ isLoading: true })
    const [songs, hiddenIds, lyrics, folderEntries, selectedScanFolders] = await Promise.all([
      db.getAllSongs(),
      db.getHiddenSongs(),
      db.getAllLyrics(),
      db.getScanHistory(),
      db.loadSelectedScanFolders(),
    ])

    const folders = folderEntries.map(e => ({ folder: e.folder, path: (e as any).path || '' }))

    const playlistsRaw = await db.getAllPlaylistsRaw()
    const allSongRows = await db.getAllPlaylistSongRows()
    const playlistSongsMap = new Map<string, string[]>()
    for (const row of allSongRows) {
      const arr = playlistSongsMap.get(row.playlistId) || []
      arr.push(row.songId)
      playlistSongsMap.set(row.playlistId, arr)
    }

    const playlists = playlistsRaw.map((pl: any) => ({
      id: pl.id,
      name: pl.name,
      createdAt: pl.createdAt,
      updatedAt: pl.updatedAt,
        songs: ((playlistSongsMap.get(pl.id) || []) as string[]).map((id) => songs.find((s) => s.id === id)).filter(Boolean) as Song[],
    }))

    set({ songs, hiddenIds, lyrics, folders, selectedScanFolders, playlists, playlistSongs: playlistSongsMap, isLoading: false })
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
      lyrics: lyrics ? new Map([...state.lyrics, ...lyrics]) : state.lyrics,
    }))
  },

  updateSongDuration: async (songId, duration) => {
    const song = get().songs.find(s => s.id === songId)
    if (!song) return

    set(state => ({
      songs: state.songs.map(s => s.id === songId ? { ...s, duration } : s),
    }))

    await db.updateSong({ ...song, duration } as Song)
  },

  removeSongsByFolder: async (folder) => {
    const { songs } = get()
    const songsToRemove = songs.filter(s => s.folder === folder)
    const tx = await db.getDB().then(d => d.transaction('songs', 'readwrite'))
    await Promise.all(songsToRemove.map(s => tx.store.delete(s.id)))
    await tx.done
    set(state => ({ songs: state.songs.filter(s => s.folder !== folder) }))
  },

  addFolder: async (folder, path) => {
    await db.saveScanHistory(folder, path)
    set(state => ({
      folders: [...state.folders, { folder, path: path || '' }],
    }))
  },

  removeFolder: async (folder) => {
    await db.deleteScanHistory(folder)
    set(state => ({
      folders: state.folders.filter(f => f.folder !== folder),
      selectedScanFolders: state.selectedScanFolders.filter(f => f !== folder),
    }))
  },

  hideSong: async (filePath) => {
    await db.hideSong(filePath)
    set(state => ({
      hiddenIds: new Set([...state.hiddenIds, filePath]),
    }))
    const { songList, currentSong, currentIndex } = usePlayerStore.getState()
    if (currentSong?.filePath === filePath) {
      const visible = songList.filter(s => s.filePath !== filePath)
      const next = visible[Math.min(currentIndex, visible.length - 1)] ?? null
      usePlayerStore.setState({
        songList: visible,
        currentSong: next,
        currentIndex: next ? visible.findIndex(s => s.id === next.id) : 0,
      })
    } else {
      usePlayerStore.setState(prev => ({
        songList: prev.songList.filter(s => s.filePath !== filePath),
      }))
    }
    await get().loadSongs()
  },

  unhideSong: async (filePath) => {
    await db.unhideSong(filePath)
    set(state => {
      const newHidden = new Set(state.hiddenIds)
      newHidden.delete(filePath)
      return { hiddenIds: newHidden }
    })
  },

  toggleSelectedScanFolder: async (folder) => {
    const current = get().selectedScanFolders
    const next = current.includes(folder) ? current.filter(f => f !== folder) : [...current, folder]
    await db.saveSelectedScanFolders(next)
    set({ selectedScanFolders: next })
  },

  setSelectedScanFolders: async (folders) => {
    await db.saveSelectedScanFolders(folders)
    set({ selectedScanFolders: folders })
  },

  getVisibleSongs: () => {
    const { songs, hiddenIds } = get()
    return songs.filter(s => !hiddenIds.has(s.filePath))
  },

  createPlaylist: async (name: string): Promise<string> => {
    const id = await db.createPlaylist(name)
    const pl = { id, name, createdAt: Date.now(), updatedAt: Date.now() }
    set(state => ({
      playlists: [...state.playlists, { ...pl, songs: [] }],
    }))
    return id
  },

  renamePlaylist: async (id: string, name: string) => {
    const now = Date.now()
    const all = (await db.getAllPlaylistsRaw()) as any[]
    const existing = all.find(p => p.id === id)
    if (!existing) return
    await db.renamePlaylistRaw(id, name)
    set(state => ({
      playlists: state.playlists.map(p => p.id === id ? { ...p, name, updatedAt: now } : p),
    }))
  },

  deletePlaylist: async (id: string) => {
    await db.deletePlaylistRaw(id)
    set(state => ({
      playlists: state.playlists.filter(p => p.id !== id),
      playlistSongs: (() => {
        const next = new Map(state.playlistSongs)
        next.delete(id)
        return next
      })(),
    }))
  },

  addToPlaylist: async (playlistId: string, songId: string) => {
    const song = get().songs.find(s => s.id === songId)
    if (!song) return
    const ids = get().playlistSongs.get(playlistId) || []
    if (ids.includes(songId)) return
    await db.addToPlaylistRaw(playlistId, songId)
    set(state => {
      const nextMap = new Map(state.playlistSongs)
      nextMap.set(playlistId, [...(nextMap.get(playlistId) || []), songId])
      return {
        playlistSongs: nextMap,
        playlists: state.playlists.map(p =>
          p.id === playlistId ? { ...p, songs: [...p.songs, song], updatedAt: Date.now() } : p,
        ),
      }
    })
  },

  addToPlaylistByFilePath: async (playlistId: string, filePath: string) => {
    const song = get().songs.find(s => s.filePath === filePath)
    if (!song) return
    await get().addToPlaylist(playlistId, song.id)
  },

  removeFromPlaylist: async (playlistId: string, songId: string) => {
    await db.removeFromPlaylistRaw(playlistId, songId)
    set(state => {
      const nextMap = new Map(state.playlistSongs)
      const arr = (nextMap.get(playlistId) || []).filter(id => id !== songId)
      if (arr.length > 0) nextMap.set(playlistId, arr); else nextMap.delete(playlistId)
      return {
        playlistSongs: nextMap,
        playlists: state.playlists.map(p =>
          p.id === playlistId ? { ...p, songs: p.songs.filter((s: any) => s.id !== songId), updatedAt: Date.now() } : p,
        ),
      }
    })
  },

  getPlaylist: (playlistId: string) => {
    const { playlists, playlistSongs, songs, hiddenIds } = get()
    const pl = playlists.find(p => p.id === playlistId)
    if (!pl) return null
    const ids = playlistSongs.get(playlistId) || []
    return {
      ...pl,
      songs: songs.filter(s => ids.includes(s.id) && !hiddenIds.has(s.filePath)),
    }
  },

  getPlaylistSongs: (playlistId: string) => {
    const { playlists, playlistSongs, songs, hiddenIds } = get()
    const pl = playlists.find(p => p.id === playlistId)
    if (!pl) return []
    const ids = playlistSongs.get(playlistId) || []
    return songs.filter(s => ids.includes(s.id) && !hiddenIds.has(s.filePath))
  },

  getLyrics: (filePath) => {
    const { lyrics, songs } = get()
    if (lyrics.has(filePath)) return lyrics.get(filePath)
    const lrcPath = filePath.replace(/\.[^.]+$/, '.lrc')
    if (lyrics.has(lrcPath)) return lyrics.get(lrcPath)
    const song = songs.find(s => s.filePath === filePath)
    if (song) {
      if (lyrics.has(song.title)) return lyrics.get(song.title)
      const filename = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || ''
      if (lyrics.has(filename)) return lyrics.get(filename)
      for (const [key, value] of lyrics) {
        if (filename.includes(key) || key.includes(filename)) return value
      }
    }
    return undefined
  },
}))
