import type { ReactNode } from 'react'
import { usePlayerStore } from '../store/player'
import type { Song } from '../types/song'

interface SongTableProps {
  title: string
  onBack?: () => void
  backIcon?: string
  rightAction?: ReactNode
  songs: Song[]
  columns: { label: string; width?: number | string; textAlign?: 'left' | 'right' | 'center' }[]
  onPlaySong?: (song: Song) => void
  extraColumns?: (song: Song) => ReactNode
  renderSong?: (song: Song, index: number) => ReactNode
}

export function SongTable({ title, onBack, backIcon = '←', rightAction, songs, columns, onPlaySong, extraColumns, renderSong }: SongTableProps) {
  const { currentSong } = usePlayerStore()

  return (
    <div className="page active">
      <div className="page-content" style={{ paddingTop: 0 }}>
        {/* Sticky Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 8px' }}>
            {onBack && (
              <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '20px', cursor: 'pointer' }}>{backIcon}</button>
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
                  <td className="col-cover">
                    <div className="cover-thumb"></div>
                  </td>
                  <td className="col-song">{song.title}</td>
                  <td className="col-artist">{song.artist}</td>
                  <td className="col-duration">{song.duration}</td>
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
