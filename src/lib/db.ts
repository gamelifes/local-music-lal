import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { Song } from '../types/song'
import type { EqPreset } from '../types/eq'

interface MusicDB extends DBSchema {
  songs: {
    key: string
    value: Song
    indexes: { 'by-artist': string; 'by-album': string; 'by-folder': string }
  }
  hiddenSongs: {
    key: string
    value: { filePath: string; hiddenAt: number }
  }
  eqPresets: {
    key: string
    value: EqPreset
  }
  scanHistory: {
    key: string
    value: { folder: string; path?: string; scannedAt: number; songCount: number }
  }
  selectedScanFolders: {
    key: string
    value: { id: string; folders: string[] }
  }
  playlists: {
    key: string
    value: { id: string; name: string; createdAt: number; updatedAt: number }
  }
  playlistSongs: {
    key: string
    value: { id: string; playlistId: string; songId: string; order: number }
  }
  lyrics: {
    key: string
    value: { filePath: string; content: string }
  }
}

let dbPromise: Promise<IDBPDatabase<MusicDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MusicDB>('musicplayer', 4, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const songStore = db.createObjectStore('songs', { keyPath: 'id' })
          songStore.createIndex('by-artist', 'artist')
          songStore.createIndex('by-album', 'album')
          songStore.createIndex('by-folder', 'folder')

          db.createObjectStore('hiddenSongs', { keyPath: 'filePath' })
          db.createObjectStore('eqPresets', { keyPath: 'name' })
          db.createObjectStore('scanHistory', { keyPath: 'folder' })
        }
        if (oldVersion < 2) {
          db.createObjectStore('lyrics', { keyPath: 'filePath' })
        }
        if (oldVersion < 3) {
          db.createObjectStore('selectedScanFolders', { keyPath: 'id' })
        }
        if (oldVersion < 4) {
          const plStore = db.createObjectStore('playlists', { keyPath: 'id' })
          ;(plStore as any).createIndex('by-createdAt', 'createdAt')
          db.createObjectStore('playlistSongs', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllSongs(): Promise<Song[]> {
  const db = await getDB()
  return db.getAll('songs')
}

export async function addSong(song: Song): Promise<void> {
  const db = await getDB()
  await db.put('songs', song)
}

export async function addSongs(songs: Song[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('songs', 'readwrite')
  await Promise.all(songs.map(s => tx.store.put(s)))
  await tx.done
}

export async function updateSong(song: Song): Promise<void> {
  const db = await getDB()
  await db.put('songs', song)
}

export async function hideSong(filePath: string): Promise<void> {
  const db = await getDB()
  await db.put('hiddenSongs', { filePath, hiddenAt: Date.now() })
}

export async function unhideSong(filePath: string): Promise<void> {
  const db = await getDB()
  await db.delete('hiddenSongs', filePath)
}

export async function getHiddenSongs(): Promise<Set<string>> {
  const db = await getDB()
  const hidden = await db.getAll('hiddenSongs')
  return new Set(hidden.map(h => h.filePath))
}

export async function saveEqPreset(preset: EqPreset): Promise<void> {
  const db = await getDB()
  await db.put('eqPresets', preset)
}

export async function getEqPresets(): Promise<EqPreset[]> {
  const db = await getDB()
  return db.getAll('eqPresets')
}

export async function deleteEqPreset(name: string): Promise<void> {
  const db = await getDB()
  await db.delete('eqPresets', name)
}

// Scan History (folders) functions
export async function saveScanHistory(folder: string, path?: string): Promise<void> {
  const db = await getDB()
  await db.put('scanHistory', { folder, path, scannedAt: Date.now(), songCount: 0 })
}

export async function getScanHistory(): Promise<Array<{ folder: string; path?: string }>> {
  const db = await getDB()
  const history = await db.getAll('scanHistory')
  return history.map(h => ({ folder: h.folder, path: (h as any).path || '' }))
}

export async function deleteScanHistory(folder: string): Promise<void> {
  const db = await getDB()
  await db.delete('scanHistory', folder)
}

export async function saveSelectedScanFolders(folders: string[]): Promise<void> {
  const db = await getDB()
  await db.put('selectedScanFolders', { id: 'current', folders })
}

export async function loadSelectedScanFolders(): Promise<string[]> {
  const db = await getDB()
  const record = await db.get('selectedScanFolders', 'current')
  return (record as any)?.folders ?? []
}

export async function clearSelectedScanFolders(): Promise<void> {
  const db = await getDB()
  await db.delete('selectedScanFolders', 'current')
}

// Lyrics functions
export async function saveLyrics(lyrics: Map<string, string>): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('lyrics', 'readwrite')
  for (const [filePath, content] of lyrics) {
    await tx.store.put({ filePath, content })
  }
  await tx.done
}

export async function getLyrics(filePath: string): Promise<string | undefined> {
  const db = await getDB()
  const record = await db.get('lyrics', filePath)
  return record?.content
}

export async function getAllLyrics(): Promise<Map<string, string>> {
  const db = await getDB()
  const all = await db.getAll('lyrics')
  const map = new Map<string, string>()
  for (const record of all) {
    map.set(record.filePath, record.content)
  }
  return map
}

// Playlist CRUD
export async function createPlaylist(name: string): Promise<string> {
  const db = await getDB()
  const id = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const now = Date.now()
  await db.put('playlists', { id, name, createdAt: now, updatedAt: now })
  return id
}

export async function getAllPlaylistsRaw(): Promise<any[]> {
  const db = await getDB()
  return db.getAll('playlists')
}

export async function getPlaylistRaw(id: string): Promise<any | undefined> {
  const db = await getDB()
  return db.get('playlists', id)
}

export async function renamePlaylistRaw(id: string, name: string): Promise<void> {
  const db = await getDB()
  const existing = await db.get('playlists', id)
  if (!existing) return
  await db.put('playlists', { ...existing, name, updatedAt: Date.now() })
}

export async function deletePlaylistRaw(id: string): Promise<void> {
  const db = await getDB()
  const all = await db.getAll('playlistSongs')
  const tx1 = db.transaction('playlists', 'readwrite')
  await tx1.store.delete(id)
  await tx1.done
  const tx2 = db.transaction('playlistSongs', 'readwrite')
  for (const r of all) { if (r.playlistId === id) await tx2.store.delete(r.id) }
  await tx2.done
}

export async function getAllPlaylistSongRows(): Promise<any[]> {
  const db = await getDB()
  return db.getAll('playlistSongs')
}

export async function addToPlaylistRaw(playlistId: string, songId: string): Promise<void> {
  const db = await getDB()
  const all = (await db.getAll('playlistSongs')) as any[]
  const existing = all.filter(r => r.playlistId === playlistId)
  const maxOrder = existing.reduce((max, row) => Math.max(max, row.order ?? 0), 0)
  await db.put('playlistSongs', { id: `${playlistId}_${songId}`, playlistId, songId, order: maxOrder + 1 })
}

export async function removeFromPlaylistRaw(playlistId: string, songId: string): Promise<void> {
  const db = await getDB()
  await db.delete('playlistSongs', `${playlistId}_${songId}`)
}

export async function getPlaylistSongsRaw(playlistId: string): Promise<string[]> {
  const db = await getDB()
  const all = (await db.getAll('playlistSongs')) as any[]
  return all.filter(r => r.playlistId === playlistId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(r => r.songId)
}
