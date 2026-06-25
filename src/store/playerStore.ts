import { create } from 'zustand';
import TrackPlayer, { RepeatMode, Event } from 'react-native-track-player';
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

    if (list && list.length > 0) {
      await TrackPlayer.reset();
      const tracks = list.map(s => ({
        id: s.id,
        url: `file://${s.filePath}`,
        title: s.title,
        artist: s.artist,
        album: s.album,
        duration: s.duration,
      }));
      await TrackPlayer.add(tracks);
    }

    await TrackPlayer.skip(index);
    await TrackPlayer.play();

    set({
      currentSong: song,
      songList,
      isPlaying: true,
    });
  },

  togglePlay: async () => {
    const { isPlaying } = get();
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
    set({ isPlaying: !isPlaying });
  },

  nextSong: async () => {
    await TrackPlayer.skipToNext();
  },

  prevSong: async () => {
    await TrackPlayer.skipToPrevious();
  },

  seek: async (position) => {
    await TrackPlayer.seekTo(position);
  },

  setRepeatMode: async (mode) => {
    const repeatModeMap: Record<string, RepeatMode> = {
      'none': RepeatMode.Off,
      'all': RepeatMode.Queue,
      'one': RepeatMode.Track,
    };
    await TrackPlayer.setRepeatMode(repeatModeMap[mode]);
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
