import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/player'
import { Capacitor } from '../lib/capacitor-shim'

export function useFloatingIsland() {
  const { currentSong, isPlaying } = usePlayerStore()

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return
    if (!currentSong) return

    Capacitor.updateSongInfo(currentSong.title, currentSong.artist, isPlaying)
  }, [currentSong?.title, currentSong?.artist, isPlaying])
}
