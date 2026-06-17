import { useEffect } from 'react'
import { useLibraryStore } from './store/library'
import { useEqStore } from './store/eq'
import { usePlayerStore } from './store/player'

function App() {
  const loadSongs = useLibraryStore(s => s.loadSongs)
  const loadPresets = useEqStore(s => s.loadPresets)
  const songs = useLibraryStore(s => s.songs)
  const currentSong = usePlayerStore(s => s.currentSong)
  const play = usePlayerStore(s => s.play)

  useEffect(() => {
    loadSongs()
    loadPresets()
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text p-4">
      <h1 className="text-2xl font-bold mb-4">MusicPlayer</h1>
      <p className="text-text-secondary mb-4">Phase 2: Core Audio System</p>

      <div className="mb-4">
        <p className="text-sm text-text-secondary">Songs loaded: {songs.length}</p>
        {currentSong && (
          <p className="text-sm">Now playing: {currentSong.title}</p>
        )}
      </div>

      <button
        className="bg-accent text-black px-4 py-2 rounded-lg font-semibold"
        onClick={() => {
          if (songs.length > 0) play(songs[0])
        }}
      >
        Play First Song
      </button>
    </div>
  )
}

export default App
