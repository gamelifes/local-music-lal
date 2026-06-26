import type { ReactNode } from 'react'
import { usePlayerStore } from '../store/player'
import type { Song } from '../types/song'

interface SongTableProps {
  title: string
  onBack?: () => void
  rightAction?: ReactNode
  songs: Song[]
  columns: { label: string; width?: number | string; textAlign?: 'left' | 'right' | 'center' }[]
  onPlaySong?: (song: Song) => void
  extraColumns?: (song: Song) => ReactNode
  renderSong?: (song: Song, index: number) => ReactNode
  showIndex?: boolean
  indexWidth?: number
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export function SongTable({ title, onBack, rightAction, songs, columns, onPlaySong, extraColumns, renderSong, showIndex = false, indexWidth = 36 }: SongTableProps) {
  const { currentSong } = usePlayerStore()

  return (
    <div className="page active">
      <div className="page-content" style={{ paddingTop: 0 }}>
        {/* Sticky Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 8px' }}>
            {onBack && (
              <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <img src="/icons/back.svg" alt="back" width="24" height="24" />
              </button>
            )}
            <h2 style={{ fontSize: '18px', flex: 1 }}>{title}</h2>
            {rightAction}
          </div>
          <table className="song-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i} style={{ width: col.width, textAlign: col.textAlign }}>{col.label}</th>
                ))}
                {extraColumns && <th style={{ width: 80, textAlign: 'right' }}></th>}
              </tr>
            </thead>
          </table>
        </div>

        {/* Song List */}
        <table className="song-table" style={{ width: '100%' }}>
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
          <td className="col-index" style={{ width: indexWidth, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            {index + 1}
          </td>
        )}
        <td className="col-cover" style={{ width: showIndex ? 48 : undefined }}>
          <div className="cover-thumb">
            <img src="/icons/music-note.svg" alt="music" className="music-icon" />
          </div>
        </td>
        <td className="col-song">{song.title}</td>
        <td className="col-artist">{song.artist}</td>
        <td className="col-duration">{formatDuration(song.duration)}</td>
        {extraColumns && <td>{extraColumns(song)}</td>}
      </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
