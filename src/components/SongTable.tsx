import type { ReactNode } from 'react'
import { usePlayerStore } from '../store/player'
import type { Song } from '../types/song'

interface SongTableProps {
  title: string
  onBack?: () => void
  onMenu?: () => void
  rightAction?: ReactNode
  songs: Song[]
  columns: { label: string; width?: number | string; textAlign?: 'left' | 'right' | 'center' }[]
  onPlaySong?: (song: Song) => void
  extraColumns?: (song: Song) => ReactNode
  renderSong?: (song: Song, index: number) => ReactNode
  showIndex?: boolean
  indexWidth?: number
  emptyState?: ReactNode
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export function SongTable({
  title, onBack, onMenu, rightAction, songs, columns,
  onPlaySong, extraColumns, renderSong,
  showIndex = false, indexWidth = 36, emptyState
}: SongTableProps) {
  const { currentSong } = usePlayerStore()

  const hasSongs = songs.length > 0
  const showEmpty = songs.length === 0 && emptyState

  return (
    <div className="page active">
      <div className="page-content" style={{ paddingTop: 0 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 8px' }}>
            {onBack && (
              <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <img src="/icons/back.svg" alt="back" width="24" height="24" />
              </button>
            )}
            {onMenu && (
              <button onClick={onMenu} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '24px', cursor: 'pointer' }}>☰</button>
            )}
            <h2 style={{ fontSize: '18px', flex: 1 }}>{title}</h2>
            {rightAction}
          </div>
        </div>

        {showEmpty && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
            {emptyState}
          </div>
        )}

        {hasSongs && (
          <table className="song-table" style={{ width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              {showIndex && <col style={{ width: indexWidth }} />}
              {columns.map((col, i) => (
                <col key={i} style={col.width ? { width: col.width } : undefined} />
              ))}
              {extraColumns && <col style={{ width: 48 }} />}
            </colgroup>
            <thead>
              <tr>
                {showIndex && <th style={{ textAlign: 'center' }}>#</th>}
                {columns.map((col, i) => (
                  <th key={i} style={{ textAlign: col.textAlign }}>{col.label}</th>
                ))}
                {extraColumns && <th style={{ textAlign: 'right' }}></th>}
              </tr>
            </thead>
            <tbody>
              {songs.map((song, index) => (
                renderSong ? renderSong(song, index) : (
                  <tr
                    key={song.id}
                    className={currentSong?.id === song.id ? 'song-playing' : ''}
                    onClick={() => onPlaySong?.(song)}
                    style={{ cursor: onPlaySong ? 'pointer' : undefined }}
                  >
                    {showIndex && (
                      <td className="col-index" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {index + 1}
                      </td>
                    )}
                    <td className="col-song">{song.title}</td>
                    <td className="col-artist">{song.artist}</td>
                    <td className="col-duration">{formatDuration(song.duration)}</td>
                    {extraColumns && <td style={{ textAlign: 'right' }}>{extraColumns(song)}</td>}
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
