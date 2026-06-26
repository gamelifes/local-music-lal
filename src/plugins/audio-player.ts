import { registerPlugin } from '@capacitor/core'

export interface AudioPlayerPlugin {
  play(options: { path: string }): Promise<{ duration: number; position: number }>
  pause(): Promise<void>
  resume(): Promise<void>
  stop(): Promise<void>
  seek(options: { position: number }): Promise<void>
  getPosition(): Promise<{ position: number }>
  getDuration(): Promise<{ duration: number }>
  getState(): Promise<{ playing: boolean; position: number; duration: number; path: string | null }>
  setVolume(options: { volume: number }): Promise<void>
  addListener(eventName: 'trackComplete', listenerFunc: (data: any) => void): Promise<any>
}

const AudioPlayer = registerPlugin<AudioPlayerPlugin>('AudioPlayer')

export default AudioPlayer
