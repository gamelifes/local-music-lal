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
  lyrics: {
    key: string
    value: { filePath: string; content: string }
  }
}

let dbPromise: Promise<IDBPDatabase<MusicDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MusicDB>('musicplayer', 2, {
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
