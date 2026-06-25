import RNFS, { ExternalStorageDirectoryPath } from 'react-native-fs';

export interface AudioFile {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  filePath: string;
  size: number;
  format: string;
  folder: string;
}

function generateId(filePath: string): string {
  let hash = 0;
  for (let i = 0; i < filePath.length; i++) {
    const char = filePath.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.ape'];

export async function scanFolder(path: string): Promise<AudioFile[]> {
  const songs: AudioFile[] = [];

  try {
    const items = await RNFS.readDir(path);

    for (const item of items) {
      if (item.isFile()) {
        const ext = item.name.substring(item.name.lastIndexOf('.')).toLowerCase();
        if (audioExtensions.includes(ext)) {
          const format = ext.substring(1);
          const song: AudioFile = {
            id: generateId(item.path),
            title: item.name.replace(ext, ''),
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            duration: 0,
            filePath: item.path,
            size: item.size,
            format,
            folder: path.split('/').pop() || 'Music',
          };
          songs.push(song);
        }
      } else if (item.isDirectory()) {
        const subSongs = await scanFolder(item.path);
        songs.push(...subSongs);
      }
    }
  } catch (error) {
    console.error('Scan error:', error);
  }

  return songs;
}

export async function readFile(path: string): Promise<string> {
  return RNFS.readFile(path, 'base64');
}

export async function fileExists(path: string): Promise<boolean> {
  return RNFS.exists(path);
}

export { ExternalStorageDirectoryPath };
