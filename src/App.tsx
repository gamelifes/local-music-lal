import { useEffect } from 'react'
import { useLibraryStore } from './store/library'
import { useEqStore } from './store/eq'

function App() {
  const loadSongs = useLibraryStore(s => s.loadSongs)
  const loadPresets = useEqStore(s => s.loadPresets)

  useEffect(() => {
    loadSongs()
    loadPresets()
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text p-4">
      <h1 className="text-2xl font-bold">MusicPlayer</h1>
      <p className="text-text-secondary">Phase 1: Foundation Complete</p>
    </div>
  )
}

export default App
