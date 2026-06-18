import { useState } from 'react'
import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'

interface SearchProps {
  onNavigate: (page: string) => void
}

export function Search({ onNavigate }: SearchProps) {
  const [query, setQuery] = useState('')
  const { songs } = useLibraryStore()
  const { play } = usePlayerStore()

  const results = query
    ? songs.filter(s =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.artist.toLowerCase().includes(query.toLowerCase()) ||
        s.album.toLowerCase().includes(query.toLowerCase())
      )
    : []

  return (
    <div className="page active">
      <div className="page-content" style={{ paddingTop: '8px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 16px' }}>
          <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '20px', cursor: 'pointer' }}>←</button>
          <input
            type="text"
            placeholder="搜索歌曲、歌手、专辑..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '16px', outline: 'none' }}
          />
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
                  onClick={() => { play(s); onNavigate('player') }}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ width: 64, padding: '8px', textAlign: 'center' }}>
                    <div className="cover-thumb"></div>
                  </td>
                  <td className="col-song">{s.title}</td>
                  <td className="col-artist">{s.artist}</td>
                  <td style={{ width: 60, textAlign: 'right' }}>{s.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
