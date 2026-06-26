import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'
import { SongTable } from '../components/SongTable'

interface AlbumDetailProps {
  album: string
  onNavigate: (page: string) => void
}

export function AlbumDetail({ album, onNavigate }: AlbumDetailProps) {
  const { songs, hiddenIds } = useLibraryStore()
  const { play } = usePlayerStore()

  const filtered = songs.filter(s => s.album === album && !hiddenIds.has(s.filePath))

  return (
    <SongTable
      title={album}
      onBack={() => onNavigate('albums')}
      songs={filtered}
  columns={[
    { label: '', width: 48 },
    { label: '歌名' },
    { label: '歌手' },
    { label: '时长', width: 60, textAlign: 'right' }
  ]}
  showIndex
  onPlaySong={(song) => play(song, filtered)}
/>
  )
}
