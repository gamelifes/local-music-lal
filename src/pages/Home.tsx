import { useState } from 'react'
import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'
import { SongTable } from '../components/SongTable'
import { AddToPlaylistModal } from '../components/AddToPlaylistModal'
import type { Song } from '../types/song'

interface HomeProps {
  onNavigate: (page: string) => void
  onToggleDrawer: () => void
}

export function Home({ onNavigate, onToggleDrawer }: HomeProps) {
  const { songs, hiddenIds } = useLibraryStore()
  const { play } = usePlayerStore()
  const [addSong, setAddSong] = useState<Song | null>(null)

  const visibleSongs = songs.filter(s => !hiddenIds.has(s.filePath))

  return (
    <>
      <SongTable
        title="本地音乐"
        onMenu={onToggleDrawer}
        songs={visibleSongs}
        columns={[
          { label: '歌名' },
          { label: '歌手' },
          { label: '时长', width: 60, textAlign: 'right' }
        ]}
        showIndex
        extraColumns={(song) => (
          <button
            onClick={(e) => { e.stopPropagation(); setAddSong(song) }}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
          >+</button>
        )}
        emptyState={
          <div>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
            <div style={{ marginBottom: '16px' }}>还没有歌曲</div>
            <button className="btn primary" onClick={() => onNavigate('scan')}>
              去扫描
            </button>
          </div>
        }
        onPlaySong={(song) => play(song, visibleSongs)}
      />
      {addSong && <AddToPlaylistModal song={addSong} onClose={() => setAddSong(null)} />}
    </>
  )
}
