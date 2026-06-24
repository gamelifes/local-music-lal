import { useState } from 'react'
import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'

interface SearchProps {
  onNavigate: (page: string) => void
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export function Search({ onNavigate }: SearchProps) {
  const [query, setQuery] = useState('')
  const { songs, hiddenIds } = useLibraryStore()
  const { play } = usePlayerStore()

  const results = query
    ? songs.filter(s =>
        !hiddenIds.has(s.filePath) &&
        (s.title.toLowerCase().includes(query.toLowerCase()) ||
         s.artist.toLowerCase().includes(query.toLowerCase()) ||
         s.album.toLowerCase().includes(query.toLowerCase()))
      )
    : []

  return (
    <div className="page active">
      <div className="page-content" style={{ paddingTop: 0 }}>
        {/* Sticky Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 16px' }}>
            <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
              <img src="/icons/back.svg" alt="back" width="24" height="24" />
            </button>
            <input
              type="text"
              placeholder="搜索歌曲、歌手、专辑..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '16px', outline: 'none' }}
            />
          </div>
        </div>

        {/* Results */}
        {!query && (
          <p style={{ textAlign: 'center', marginTop: '48px', color: 'var(--text-secondary)' }}>输入关键词开始搜索</p>
        )}
        {query && results.length === 0 && (
          <p style={{ textAlign: 'center', marginTop: '48px', color: 'var(--text-secondary)' }}>无搜索结果</p>
        )}
        {query && results.length > 0 && (
          <table className="song-table" style={{ width: '100%' }}>
            <tbody>
              {results.map(s => (
                <tr
                  key={s.id}
                  onClick={() => { play(s, results); onNavigate('player') }}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ width: 64, padding: '8px', textAlign: 'center' }}>
                    <div className="cover-thumb"></div>
                  </td>
                  <td className="col-song">{s.title}</td>
                  <td className="col-artist">{s.artist}</td>
                  <td style={{ width: 60, textAlign: 'right' }}>{formatDuration(s.duration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
