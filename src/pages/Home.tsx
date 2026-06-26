import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'
import { SongTable } from '../components/SongTable'

interface HomeProps {
  onNavigate: (page: string) => void
  onToggleDrawer: () => void
}

export function Home({ onToggleDrawer }: HomeProps) {
  const { songs, hiddenIds } = useLibraryStore()
  const { play } = usePlayerStore()

  const visibleSongs = songs.filter(s => !hiddenIds.has(s.filePath))

  return (
    <SongTable
      title="全部歌曲"
      onMenu={onToggleDrawer}
      songs={visibleSongs}
      columns={[
        { label: '歌名' },
        { label: '歌手' },
        { label: '时长', width: 60, textAlign: 'right' }
      ]}
      showIndex
      onPlaySong={(song) => play(song, visibleSongs)}
    />
  )
}
