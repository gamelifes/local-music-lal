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
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--accent)',
                  color: '#fff', fontSize: '22px', fontWeight: 300,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(var(--accent-rgb), 0.3)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(var(--accent-rgb), 0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(var(--accent-rgb), 0.3)' }}
              >+</button>
            )}
          </div>
        </div>

        {showCreate && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>新建歌单</div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowCreate(false); setNewName('') } }}
              placeholder="输入歌单名称"
              style={{
                width: '100%', padding: '10px 14px',
                background: 'var(--bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text)', fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn"
                onClick={() => { setShowCreate(false); setNewName('') }}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >取消</button>
              <button
                className="btn primary"
                onClick={handleCreate}
                style={{ padding: '8px 20px', fontSize: '13px', opacity: newName.trim() ? 1 : 0.5 }}
              >创建</button>
            </div>
          </div>
        )}

        {playlists.length === 0 && !showCreate && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-glow))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: '36px',
              boxShadow: '0 4px 20px rgba(var(--accent-rgb), 0.25)',
            }}>🎶</div>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>还没有歌单</div>
            <div style={{ fontSize: '13px', marginBottom: '20px' }}>创建你的第一个歌单，整理喜欢的音乐</div>
            <button
              className="btn primary"
              onClick={() => setShowCreate(true)}
              style={{ padding: '10px 24px', fontSize: '14px', borderRadius: '24px' }}
            >+ 新建歌单</button>
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
                <div className="group-cover" style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-glow))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '20px', fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(var(--accent-rgb), 0.2)',
                }}>
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
