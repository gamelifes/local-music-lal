import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'
import { SongTable } from '../components/SongTable'

interface AlbumDetailProps {
  album: string
  onNavigate: (page: string) => void
}

export function AlbumDetail({ album, onNavigate }: AlbumDetailProps) {
  const { songs } = useLibraryStore()
  const { play } = usePlayerStore()

  const filtered = songs.filter(s => s.album === album)

  return (
    <SongTable
      title={album}
      onBack={() => onNavigate('albums')}
      songs={filtered}
      columns={[
        { label: '' },
        { label: '歌名' },
        { label: '歌手' },
        { label: '时长', width: 60, textAlign: 'right' }
      ]}
      onPlaySong={(song) => play(song, filtered)}
    />
  )
}
