import { useState } from 'react'
import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'
import { scanFolder } from '../lib/scanner'
import { Badge } from '../components/ui/Badge'

interface HomeProps {
  onNavigate: (page: string) => void
  onToggleDrawer: () => void
}

export function Home({ onToggleDrawer }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { songs, addSongs } = useLibraryStore()
  const { play, currentSong } = usePlayerStore()

  const filteredSongs = songs.filter(s =>
    !s.hidden && (
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const handleScan = async () => {
    const scannedSongs = await scanFolder()
    if (scannedSongs.length > 0) {
      await addSongs(scannedSongs)
    }
  }

  return (
    <div className="page active">
      <div className="page-content" style={{ paddingTop: 0 }}>
        {/* Sticky Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0F0F0A', padding: '8px 0 0' }}>
          <div style={{ padding: '8px 0' }}>
            <button onClick={onToggleDrawer} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '24px', cursor: 'pointer' }}>☰</button>
          </div>
          <h2 style={{ fontSize: '24px', margin: '0 0 8px' }}>全部歌曲</h2>

          {/* Search */}
          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="搜索歌曲、歌手..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Scan Button */}
          <button
            onClick={handleScan}
            className="w-full py-3 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400 transition-colors mb-4"
          >
            📁 扫描音乐文件夹
          </button>

          {/* Table Header */}
          <table className="song-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 64 }}></th>
                <th>歌名</th>
                <th>歌手</th>
                <th style={{ width: 60, textAlign: 'right' }}>时长</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Song List */}
        <table className="song-table" style={{ width: '100%' }}>
          <tbody>
            {filteredSongs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎵</div>
                  <div>暂无歌曲</div>
                  <div style={{ fontSize: '13px', marginTop: '8px' }}>点击上方按钮扫描音乐文件夹</div>
                </td>
              </tr>
            ) : (
              filteredSongs.map(s => (
                <tr
                  key={s.id}
                  className={currentSong?.id === s.id ? 'song-playing' : ''}
                  onClick={() => play(s)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ width: 64, padding: '8px', textAlign: 'center' }}>
                    <div className="cover-thumb"></div>
                  </td>
                  <td className="col-song">
                    {s.title}
                    <Badge variant={s.quality}>{s.quality}</Badge>
                  </td>
                  <td className="col-artist">{s.artist}</td>
                  <td style={{ width: 60, textAlign: 'right' }}>{s.duration}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
