import { useLibraryStore } from '../store/library'
import { SongTable } from '../components/SongTable'

interface HiddenProps {
  onNavigate: (page: string) => void
}

export function Hidden({ onNavigate }: HiddenProps) {
  const { songs, hiddenIds, unhideSong } = useLibraryStore()

  const hiddenSongs = songs.filter(s => hiddenIds.has(s.filePath))

  return (
    <SongTable
      title="已隐藏的歌曲"
      onBack={() => onNavigate('home')}
      songs={hiddenSongs}
      columns={[
        { label: '歌名' },
        { label: '歌手' },
        { label: '时长', width: 60, textAlign: 'right' }
      ]}
      showIndex
      extraColumns={(song) => (
        <button
          onClick={(e) => { e.stopPropagation(); unhideSong(song.filePath) }}
          style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer' }}
        >
          恢复
        </button>
      )}
    />
  )
}
