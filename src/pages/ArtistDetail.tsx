import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'
import { SongTable } from '../components/SongTable'

interface ArtistDetailProps {
  artist: string
  onNavigate: (page: string) => void
}

export function ArtistDetail({ artist, onNavigate }: ArtistDetailProps) {
  const { songs, hiddenIds } = useLibraryStore()
  const { play } = usePlayerStore()

  const filtered = songs.filter(s => s.artist === artist && !hiddenIds.has(s.filePath))

  return (
    <SongTable
      title={artist}
      onBack={() => onNavigate('artists')}
      songs={filtered}
  columns={[
    { label: '', width: 48 },
    { label: '歌名' },
    { label: '专辑' },
    { label: '时长', width: 60, textAlign: 'right' }
  ]}
  showIndex
  onPlaySong={(song) => play(song, filtered)}
/>
  )
}
