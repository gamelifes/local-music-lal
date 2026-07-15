import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/player'
import { Capacitor } from '../lib/capacitor-shim'

export function useFloatingIsland() {
  const { currentSong, isPlaying, togglePlay, nextSong, prevSong } = usePlayerStore()
  const isFloatingActive = useRef(false)

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return

    const handleVisibility = () => {
      if (document.hidden && currentSong) {
        if (!isFloatingActive.current) {
          Capacitor.showFloatingPlayer(currentSong.title, currentSong.artist)
          Capacitor.updateFloatingState(isPlaying)
          isFloatingActive.current = true
        }
      } else if (!document.hidden && isFloatingActive.current) {
        Capacitor.hideFloatingPlayer()
        isFloatingActive.current = false
      }
    }

    Capacitor.onFloatingAction((action) => {
      switch (action) {
        case 'togglePlay':
          togglePlay()
          break
        case 'next':
          nextSong()
          break
        case 'prev':
          prevSong()
          break
        case 'open':
          window.focus()
          break
      }
    })

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (isFloatingActive.current) {
        Capacitor.hideFloatingPlayer()
        isFloatingActive.current = false
      }
    }
  }, [currentSong, isPlaying, togglePlay, nextSong, prevSong])
}
