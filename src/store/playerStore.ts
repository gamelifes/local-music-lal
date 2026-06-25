import { create } from 'zustand';
import { Song, RepeatMode } from '../types';
import * as player from '../utils/player';

interface PlayerState {
  currentSong: Song | null;
  songList: Song[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  repeatMode: RepeatMode;

  setSongList: (songs: Song[]) => void;
  playSong: (song: Song, list?: Song[]) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seek: (position: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  updateProgress: (progress: number, duration: number) => void;
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

    if (list) {
      await player.addTracks(list);
    }

    await player.play(index);
    set({
      currentSong: song,
      songList,
      isPlaying: true,
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
    await player.skipToNext();
  },

  prevSong: async () => {
    await player.skipToPrevious();
  },

  seek: async (position) => {
    await player.seek(position);
  },

  setRepeatMode: async (mode) => {
    const repeatModeMap: Record<RepeatMode, number> = {
      'none': 0,
      'all': 1,
      'one': 2,
    };
    await player.setRepeatMode(repeatModeMap[mode]);
    set({ repeatMode: mode });
  },

  updateProgress: (progress, duration) => {
    set({
      progress,
      duration,
      currentTime: progress,
    });
  },
}));
