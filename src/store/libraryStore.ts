import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioFile } from '../utils/fileSystem';

interface LibraryState {
  songs: AudioFile[];
  hiddenIds: Set<string>;
  folders: string[];

  loadSongs: () => Promise<void>;
  addSongs: (songs: AudioFile[]) => Promise<void>;
  hideSong: (filePath: string) => Promise<void>;
  unhideSong: (filePath: string) => Promise<void>;
  addFolder: (folder: string) => Promise<void>;
  removeFolder: (folder: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  songs: [],
  hiddenIds: new Set(),
  folders: [],

  loadSongs: async () => {
    try {
      const songsJson = await AsyncStorage.getItem('songs');
      const hiddenJson = await AsyncStorage.getItem('hiddenIds');
      const foldersJson = await AsyncStorage.getItem('folders');

      if (songsJson) set({ songs: JSON.parse(songsJson) });
      if (hiddenJson) set({ hiddenIds: new Set(JSON.parse(hiddenJson)) });
      if (foldersJson) set({ folders: JSON.parse(foldersJson) });
    } catch (error) {
      console.error('Failed to load songs:', error);
    }
  },

  addSongs: async (songs) => {
    const existingSongs = get().songs;
    const existingIds = new Set(existingSongs.map(s => s.id));
    const newSongs = songs.filter(s => !existingIds.has(s.id));

    if (newSongs.length > 0) {
      const updatedSongs = [...existingSongs, ...newSongs];
      await AsyncStorage.setItem('songs', JSON.stringify(updatedSongs));
      set({ songs: updatedSongs });
    }
  },

  hideSong: async (filePath) => {
    const newHidden = new Set(get().hiddenIds);
    newHidden.add(filePath);
    await AsyncStorage.setItem('hiddenIds', JSON.stringify([...newHidden]));
    set({ hiddenIds: newHidden });
  },

  unhideSong: async (filePath) => {
    const newHidden = new Set(get().hiddenIds);
    newHidden.delete(filePath);
    await AsyncStorage.setItem('hiddenIds', JSON.stringify([...newHidden]));
    set({ hiddenIds: newHidden });
  },

  addFolder: async (folder) => {
    const folders = get().folders;
    if (!folders.includes(folder)) {
      const updatedFolders = [...folders, folder];
      await AsyncStorage.setItem('folders', JSON.stringify(updatedFolders));
      set({ folders: updatedFolders });
    }
  },

  removeFolder: async (folder) => {
    const updatedFolders = get().folders.filter(f => f !== folder);
    await AsyncStorage.setItem('folders', JSON.stringify(updatedFolders));
    set({ folders: updatedFolders });
  },
}));
