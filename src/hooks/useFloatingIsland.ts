import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/player'
import { Capacitor } from '../lib/capacitor-shim'

export function useFloatingIsland() {
  const { currentSong, isPlaying, togglePlay, nextSong, prevSong } = usePlayerStore()
  const isFloatingActive = useRef(false)
  const hasPermission = useRef(false)

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return

    hasPermission.current = Capacitor.checkOverlayPermission()

    const showFloating = () => {
      if (!hasPermission.current) {
        Capacitor.requestOverlayPermission()
        return
      }
      if (currentSong && !isFloatingActive.current) {
        Capacitor.showFloatingPlayer(currentSong.title, currentSong.artist)
        Capacitor.updateFloatingState(isPlaying)
        isFloatingActive.current = true
      }
    }

    const hideFloating = () => {
      if (isFloatingActive.current) {
        Capacitor.hideFloatingPlayer()
        isFloatingActive.current = false
      }
    }

    const onBackground = () => showFloating()
    const onForeground = () => hideFloating()

    window._onAppBackground = onBackground
    window._onAppForeground = onForeground

    Capacitor.onFloatingAction((action) => {
      switch (action) {
        case 'togglePlay': togglePlay(); break
        case 'next': nextSong(); break
        case 'prev': prevSong(); break
        case 'open': window.focus(); break
      }
    })

    return () => {
      delete window._onAppBackground
      delete window._onAppForeground
      if (isFloatingActive.current) {
        Capacitor.hideFloatingPlayer()
        isFloatingActive.current = false
      }
    }
  }, [currentSong, isPlaying, togglePlay, nextSong, prevSong])

  useEffect(() => {
    if (isFloatingActive.current && currentSong) {
      Capacitor.showFloatingPlayer(currentSong.title, currentSong.artist)
      Capacitor.updateFloatingState(isPlaying)
    }
  }, [currentSong?.title, currentSong?.artist, isPlaying])
}
