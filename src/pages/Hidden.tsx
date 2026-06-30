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
        { label: '时长', width: 60 }
      ]}
      showIndex
      emptyState={
        <div style={{ padding: '32px 0' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎵</div>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>没有已隐藏的歌曲</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>在歌曲列表中隐藏的歌曲会显示在这里</div>
        </div>
      }
      extraColumns={(song) => (
        <button
          onClick={(e) => { e.stopPropagation(); unhideSong(song.filePath) }}
          title="恢复显示"
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', padding: '4px', borderRadius: '50%', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      )}
    />
  )
}
