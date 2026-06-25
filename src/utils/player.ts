import TrackPlayer, {
  Event,
  RepeatMode,
  Capability,
  AppKilledPlaybackBehavior,
  Track,
} from 'react-native-track-player';

export async function setupPlayer() {
  await TrackPlayer.setupPlayer({
    autoHandleInterruptions: true,
  });

  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
    },
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.Stop,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
    ],
    progressEventInterval: 1,
  });
}

export async function addTracks(tracks: Track[]) {
  await TrackPlayer.reset();
  await TrackPlayer.add(tracks);
}

export async function play(index: number = 0) {
  await TrackPlayer.skip(index);
  await TrackPlayer.play();
}

export async function pause() {
  await TrackPlayer.pause();
}

export async function resume() {
  await TrackPlayer.play();
}

export async function stop() {
  await TrackPlayer.stop();
}

export async function skipToNext() {
  await TrackPlayer.skipToNext();
}

export async function skipToPrevious() {
  await TrackPlayer.skipToPrevious();
}

export async function seek(position: number) {
  await TrackPlayer.seekTo(position);
}

export async function setRepeatMode(mode: RepeatMode) {
  await TrackPlayer.setRepeatMode(mode);
}

export async function setVolume(volume: number) {
  await TrackPlayer.setVolume(volume);
}

export function getPlaybackState() {
  return TrackPlayer.getState();
}

export function getProgress() {
  return TrackPlayer.getProgress();
}
