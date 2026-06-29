import { useState } from 'react'
import { useLibraryStore } from '../store/library'
import { usePlayerStore } from '../store/player'

interface PlaylistsProps {
  onNavigate: (page: string) => void
  onSelectPlaylist: (id: string) => void
}

export function Playlists({ onNavigate, onSelectPlaylist }: PlaylistsProps) {
  const { playlists, createPlaylist, renamePlaylist, deletePlaylist, getPlaylist } = useLibraryStore()
  const { play } = usePlayerStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleCreate = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    await createPlaylist(trimmed)
    setNewName('')
    setShowCreate(false)
  }

  const handleRename = async (id: string) => {
    const trimmed = editName.trim()
    if (!trimmed) { setEditingId(null); return }
    await renamePlaylist(id, trimmed)
    setEditingId(null)
  }

  const handlePlayAll = (playlistId: string) => {
    const pl = getPlaylist(playlistId)
    if (pl && pl.songs.length > 0) play(pl.songs[0], pl.songs)
  }

  return (
    <div className="page active">
      <div className="page-content" style={{ paddingTop: 0 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <img src="/icons/back.svg" alt="back" width="24" height="24" />
              </button>
              <h2 style={{ fontSize: '18px', margin: 0 }}>歌单</h2>
            </div>
            {!showCreate && (
              <button onClick={() => setShowCreate(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>+</button>
            )}
          </div>
        </div>

        {showCreate && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="歌单名称"
              style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: '14px' }}
              autoFocus
            />
            <button className="btn primary" onClick={handleCreate}>创建</button>
            <button className="btn" onClick={() => { setShowCreate(false); setNewName('') }}>取消</button>
          </div>
        )}

        {playlists.length === 0 && !showCreate && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎵</div>
            <div>还没有歌单</div>
            <div style={{ fontSize: '13px', marginTop: '8px' }}>点击右上角 + 创建你的第一个歌单</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {playlists.map(pl => {
            const songCount = (getPlaylist(pl.id)?.songs.length || 0)
            return (
              <div
                key={pl.id}
                className="group-header"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                onClick={() => onSelectPlaylist(pl.id)}
              >
                <div className="group-cover" style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 600 }}>
                  {pl.name.charAt(0).toUpperCase()}
                </div>
                <div className="group-info" style={{ flex: 1 }}>
                  {editingId === pl.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRename(pl.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRename(pl.id); if (e.key === 'Escape') setEditingId(null) }}
                      autoFocus
                      style={{ padding: '4px 8px', background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: '4px', color: 'var(--text)', fontSize: '14px', width: '100%' }}
                    />
                  ) : (
                    <>
                      <div className="group-name">{pl.name}</div>
                      <div className="group-count">{songCount} 首歌曲</div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlayAll(pl.id) }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '18px' }}
                  >▶</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(pl.id); setEditName(pl.name) }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}
                  >✏️</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('确定删除歌单？')) deletePlaylist(pl.id) }}
                    style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '14px' }}
                  >🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
