import { useState, useEffect } from 'react'
import { useLibraryStore } from './store/library'
import { useEqStore } from './store/eq'
import { Drawer } from './components/Drawer'
import { MusicBar } from './components/MusicBar'
import { SleepModal } from './components/SleepModal'
import { QualityModal } from './components/QualityModal'
import { ShareModal } from './components/ShareModal'
import { FileInfoModal } from './components/FileInfoModal'
import { Home } from './pages/Home'
import { Player } from './pages/Player'
import { Scan } from './pages/Scan'
import { Equalizer } from './pages/Equalizer'
import { Lyrics } from './pages/Lyrics'
import { Hidden } from './pages/Hidden'
import { Search } from './pages/Search'
import { Artists } from './pages/Artists'
import { ArtistDetail } from './pages/ArtistDetail'
import { Albums } from './pages/Albums'
import { AlbumDetail } from './pages/AlbumDetail'
import { Debug } from './pages/Debug'
import { Playlists } from './pages/Playlists'
import { PlaylistDetail } from './pages/PlaylistDetail'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState('')
  const [selectedAlbum, setSelectedAlbum] = useState('')
  const [selectedPlaylist, setSelectedPlaylist] = useState('')
  const loadSongs = useLibraryStore((s) => s.loadSongs)
  const loadPresets = useEqStore((s) => s.loadPresets)

  useEffect(() => {
    loadSongs()
    loadPresets()
  }, [loadSongs, loadPresets])

  const navigateTo = (page: string) => {
    setCurrentPage(page)
    setDrawerOpen(false)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={navigateTo} onToggleDrawer={() => setDrawerOpen(o => !o)} />
      case 'player':
        return <Player onNavigate={navigateTo} />
      case 'scan':
        return <Scan onNavigate={navigateTo} />
      case 'equalizer':
        return <Equalizer onNavigate={navigateTo} />
      case 'lyrics':
        return <Lyrics onNavigate={navigateTo} />
      case 'hidden':
        return <Hidden onNavigate={navigateTo} />
      case 'search':
        return <Search onNavigate={navigateTo} />
      case 'artists':
        return <Artists onNavigate={navigateTo} onSelectArtist={(name) => { setSelectedArtist(name); setCurrentPage('artist-detail') }} />
      case 'artist-detail':
        return <ArtistDetail artist={selectedArtist} onNavigate={navigateTo} />
      case 'albums':
        return <Albums onNavigate={navigateTo} onSelectAlbum={(name) => { setSelectedAlbum(name); setCurrentPage('album-detail') }} />
      case 'album-detail':
        return <AlbumDetail album={selectedAlbum} onNavigate={navigateTo} />
  case 'playlists':
    return <Playlists onNavigate={navigateTo} onSelectPlaylist={(id) => { setSelectedPlaylist(id); setCurrentPage('playlist-detail') }} />
  case 'playlist-detail':
    return <PlaylistDetail playlistId={selectedPlaylist} onNavigate={navigateTo} />
  case 'debug':
    return <Debug onNavigate={navigateTo} />
  default:
        return <Home onNavigate={navigateTo} onToggleDrawer={() => setDrawerOpen(o => !o)} />
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {renderPage()}
      {currentPage !== 'player' && <MusicBar onNavigate={navigateTo} />}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activePage={currentPage}
        onNavigate={navigateTo}
      />
      <SleepModal />
      <QualityModal />
      <ShareModal />
      <FileInfoModal />
    </div>
  )
}

export default App
