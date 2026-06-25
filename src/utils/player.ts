import { Audio, AVPlaybackStatus } from 'expo-av';

let soundObject: Audio.Sound | null = null;

export async function setupPlayer() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

export async function playSong(song: { filePath: string; title: string; artist: string }, onEnd?: () => void) {
  if (soundObject) {
    await soundObject.unloadAsync();
  }

  const { sound } = await Audio.Sound.createAsync(
    { uri: `file://${song.filePath}` },
    { shouldPlay: true },
    (status: AVPlaybackStatus) => {
      if (status.isLoaded && status.didJustFinish) {
        onEnd?.();
      }
    }
  );

  soundObject = sound;
}

export async function pause() {
  if (soundObject) {
    await soundObject.pauseAsync();
  }
}

export async function resume() {
  if (soundObject) {
    await soundObject.playAsync();
  }
}

export async function stop() {
  if (soundObject) {
    await soundObject.stopAsync();
    await soundObject.unloadAsync();
    soundObject = null;
  }
}

export async function seek(position: number) {
  if (soundObject) {
    await soundObject.setPositionAsync(position * 1000);
  }
}

export async function getDuration(): Promise<number> {
  if (soundObject) {
    const status = await soundObject.getStatusAsync();
    if (status.isLoaded) {
      return status.durationMillis / 1000;
    }
  }
  return 0;
}

export async function getPosition(): Promise<number> {
  if (soundObject) {
    const status = await soundObject.getStatusAsync();
    if (status.isLoaded) {
      return status.positionMillis / 1000;
    }
  }
  return 0;
}

export async function setVolume(volume: number) {
  if (soundObject) {
    await soundObject.setVolumeAsync(volume);
  }
}
