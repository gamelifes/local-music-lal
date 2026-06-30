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
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 8px' }}>
            <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
              <img src="/icons/back.svg" alt="back" width="24" height="24" />
            </button>
            <input
              type="text"
              placeholder="搜索歌曲、歌手、专辑..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '14px', outline: 'none' }}
            />
          </div>
        </div>

        <table className="song-table" style={{ width: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col />
            <col />
            <col style={{ width: 60 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ textAlign: 'center' }}>#</th>
              <th>歌名</th>
              <th>歌手</th>
              <th>时长</th>
            </tr>
          </thead>
          <tbody>
            {query && results.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '48px 12px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>没有找到相关歌曲</div>
                  <div style={{ fontSize: '12px' }}>试试其他关键词</div>
                </td>
              </tr>
            )}
            {!query && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '48px 12px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
                  <div style={{ fontSize: '14px' }}>输入关键词开始搜索</div>
                </td>
              </tr>
            )}
            {results.map((s, i) => (
              <tr
                key={s.id}
                onClick={() => { play(s, results); onNavigate('player') }}
                style={{ cursor: 'pointer' }}
              >
                <td className="col-index" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>{i + 1}</td>
                <td className="col-song">{s.title}</td>
                <td className="col-artist">{s.artist}</td>
                <td className="col-duration">{formatDuration(s.duration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
