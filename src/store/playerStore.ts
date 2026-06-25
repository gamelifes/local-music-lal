import { create } from 'zustand';
import * as player from '../utils/player';
import { AudioFile } from '../utils/fileSystem';

interface PlayerState {
  currentSong: AudioFile | null;
  songList: AudioFile[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  repeatMode: 'none' | 'all' | 'one';

  setSongList: (songs: AudioFile[]) => void;
  playSong: (song: AudioFile, list?: AudioFile[]) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seek: (position: number) => void;
  setRepeatMode: (mode: 'none' | 'all' | 'one') => void;
  updateProgress: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  songList: [],
  isPlaying: false,
  progress: 0,
  duration: 0,
  currentTime: 0,
  repeatMode: 'all',

  setSongList: (songs) => set({ songList: songs }),

  playSong: async (song, list) => {
    const songList = list || get().songList;
    const index = list ? list.findIndex(s => s.id === song.id) : 0;

    await player.playSong(song, () => {
      get().nextSong();
    });

    const duration = await player.getDuration();
    set({
      currentSong: song,
      songList,
      isPlaying: true,
      duration,
    });
  },

  togglePlay: async () => {
    const { isPlaying } = get();
    if (isPlaying) {
      await player.pause();
    } else {
      await player.resume();
    }
    set({ isPlaying: !isPlaying });
  },

  nextSong: async () => {
    const { songList, currentIndex, repeatMode } = get();
    let nextIndex = currentIndex + 1;

    if (nextIndex >= songList.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return;
      }
    }

    const nextSong = songList[nextIndex];
    if (nextSong) {
      await player.playSong(nextSong, () => get().nextSong());
      set({ currentSong: nextSong, currentIndex: nextIndex, isPlaying: true });
    }
  },

  prevSong: async () => {
    const { songList, currentIndex } = get();
    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      prevIndex = songList.length - 1;
    }

    const prevSong = songList[prevIndex];
    if (prevSong) {
      await player.playSong(prevSong, () => get().nextSong());
      set({ currentSong: prevSong, currentIndex: prevIndex, isPlaying: true });
    }
  },

  seek: async (position) => {
    await player.seek(position);
  },

  setRepeatMode: (mode) => {
    set({ repeatMode: mode });
  },

  updateProgress: async () => {
    const { isPlaying } = get();
    if (!isPlaying) return;

    const position = await player.getPosition();
    const duration = await player.getDuration();
    const progress = duration > 0 ? (position / duration) * 100 : 0;

    set({
      progress,
      duration,
      currentTime: position,
    });
  },
}));
