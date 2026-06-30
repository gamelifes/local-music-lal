import { useState } from 'react'
import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'
import { SongTable } from '../components/SongTable'
import { AddToPlaylistModal } from '../components/AddToPlaylistModal'
import type { Song } from '../types/song'

interface ArtistDetailProps {
  artist: string
  onNavigate: (page: string) => void
}

export function ArtistDetail({ artist, onNavigate }: ArtistDetailProps) {
  const { songs, hiddenIds } = useLibraryStore()
  const { play } = usePlayerStore()
  const [addSong, setAddSong] = useState<Song | null>(null)

  const filtered = songs.filter(s => s.artist === artist && !hiddenIds.has(s.filePath))

  return (
    <>
      <SongTable
        title={artist}
        onBack={() => onNavigate('artists')}
        songs={filtered}
        columns={[
          { label: '歌名' },
          { label: '专辑' },
          { label: '时长', width: 60, textAlign: 'right' }
        ]}
        showIndex
        extraColumns={(song) => (
          <button
            onClick={(e) => { e.stopPropagation(); setAddSong(song) }}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
          >+</button>
        )}
        onPlaySong={(song) => play(song, filtered)}
      />
      {addSong && <AddToPlaylistModal song={addSong} onClose={() => setAddSong(null)} />}
    </>
  )
}
