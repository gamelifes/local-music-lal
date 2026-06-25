export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  filePath: string;
  size: number;
  format: string;
  folder: string;
  quality?: 'lossless' | 'high' | 'standard' | 'low';
}

export interface LyricLine {
  text: string;
  time: number;
  words: LyricWord[];
}

export interface LyricWord {
  text: string;
  time: number;
}

export type RepeatMode = 'none' | 'all' | 'one';
