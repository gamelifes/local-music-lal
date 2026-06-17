import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useLibraryStore } from './store/library'
import { useEqStore } from './store/eq'
import { NavBar } from './components/NavBar'
import { Home } from './pages/Home'
import { Player } from './pages/Player'
import { Scan } from './pages/Scan'
import { Equalizer } from './pages/Equalizer'
import { Lyrics } from './pages/Lyrics'

function App() {
  const loadSongs = useLibraryStore((s) => s.loadSongs)
  const loadPresets = useEqStore((s) => s.loadPresets)

  useEffect(() => {
    loadSongs()
    loadPresets()
  }, [loadSongs, loadPresets])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-text">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/player" element={<Player />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/equalizer" element={<Equalizer />} />
          <Route path="/lyrics" element={<Lyrics />} />
        </Routes>
        <NavBar />
      </div>
    </BrowserRouter>
  )
}

export default App
