import { useState, useRef, useEffect } from 'react'
import { useLibraryStore } from '../store/library'
import { scanFolder } from '../lib/scanner'

interface ScanProps {
  onNavigate: (page: string) => void
}

export function Scan({ onNavigate }: ScanProps) {
  const { songs, addSongs, removeSongsByFolder } = useLibraryStore()
  const folders = [...new Set(songs.map(s => s.folder))]
  const [folderList, setFolderList] = useState(folders)
  const [scanning, setScanning] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('')
  const [scannedCount, setScannedCount] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [swipedFolder, setSwipedFolder] = useState<string | null>(null)
  const [swipeStart, setSwipeStart] = useState({ x: 0, y: 0 })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = songs.filter(s => s.folder === selectedFolder).length

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => () => clearTimer(), [])

  const removeFolder = async (f: string) => {
    await removeSongsByFolder(f)
    setFolderList(prev => prev.filter(x => x !== f))
    if (selectedFolder === f) setSelectedFolder('')
    setSwipedFolder(null)
  }

  const addFolder = async () => {
    try {
      const result = await scanFolder((count) => {
        setScannedCount(count)
      })
      console.log('Scan result:', result)
      console.log('Songs:', result.songs.length)
      console.log('Lyrics:', result.lyrics.size)
      if (result.songs.length > 0) {
        await addSongs(result.songs, result.lyrics)
        const newFolders = [...new Set(result.songs.map(s => s.folder))]
        setFolderList(prev => [...new Set([...prev, ...newFolders])])
      }
    } catch (err) {
      console.error('Add folder failed:', err)
    }
  }

  const startScan = (folder?: string) => {
    const targetFolder = folder || selectedFolder
    if (!targetFolder) return
    setScanning(true)
    setCompleted(false)
    setSelectedFolder(targetFolder)
    setScannedCount(0)
    let count = 0
    const folderSongs = songs.filter(s => s.folder === targetFolder)
    const totalSongs = folderSongs.length || 1
    timerRef.current = setInterval(() => {
      count++
      setScannedCount(count)
      if (count >= totalSongs) {
        clearTimer()
        setTimeout(() => {
          setScanning(false)
          setCompleted(true)
        }, 500)
      }
    }, 300)
  }

  const startScanAll = () => {
    setScanning(true)
    setCompleted(false)
    setSelectedFolder('')
    setScannedCount(0)
    let count = 0
    const totalSongs = songs.length || 1
    timerRef.current = setInterval(() => {
      count++
      setScannedCount(count)
      if (count >= totalSongs) {
        clearTimer()
        setTimeout(() => {
          setScanning(false)
          setCompleted(true)
        }, 500)
      }
    }, 300)
  }

  const stopScan = () => {
    clearTimer()
    setScanning(false)
  }

  const handleTouchStart = (_folder: string, x: number, y: number) => {
    setSwipeStart({ x, y })
  }

  const handleTouchEnd = (folder: string, x: number, _y: number) => {
    const dx = x - swipeStart.x
    if (dx < -60) {
      setSwipedFolder(folder)
    } else {
      setSwipedFolder(null)
    }
  }

  const handleMouseDown = (_folder: string, x: number, y: number) => {
    setSwipeStart({ x, y })
  }

  const handleMouseUp = (folder: string, x: number, _y: number) => {
    const dx = x - swipeStart.x
    if (dx < -60) {
      setSwipedFolder(folder)
    } else {
      setSwipedFolder(null)
    }
  }

  return (
    <div className="page active">
      <div className="page-content" style={{ paddingTop: 0 }}>
        {/* Sticky Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <img src="/icons/back.svg" alt="back" width="24" height="24" />
              </button>
              <h2 style={{ fontSize: '18px', margin: 0 }}>{scanning ? '正在扫描' : '扫描音乐'}</h2>
            </div>
            {!scanning && !completed && (
              <button onClick={addFolder} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>+</button>
            )}
          </div>
        </div>

        {/* Icon */}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>{completed ? '✅' : scanning ? '📡' : '📁'}</div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>
            {completed ? '扫描完成' : scanning ? '正在扫描...' : '选择扫描文件夹'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {completed
              ? `共发现 ${selectedFolder ? total : songs.length} 首歌曲`
              : scanning
                ? `已发现 ${scannedCount} 首歌曲`
                : '选择文件夹后开始扫描音频文件'
            }
          </p>
        </div>

        {/* Scanning Animation */}
        {scanning && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              position: 'relative',
              background: 'conic-gradient(var(--accent), var(--accent-glow), var(--accent))',
              animation: 'spin 3s linear infinite'
            }}>
              <div style={{ position: 'absolute', inset: '8px', borderRadius: '50%', background: 'var(--bg)' }}></div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'var(--text-secondary)', zIndex: 1 }}>
                {scannedCount} / {selectedFolder ? total : songs.length}
              </div>
            </div>
          </div>
        )}

        {/* Folder List */}
        {!scanning && !completed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {folderList.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '16px 0' }}>
                暂无文件夹，点击右上角 + 添加
              </p>
            )}
            {folderList.map(f => {
              const count = songs.filter(s => s.folder === f).length
              const isSwiped = swipedFolder === f
              return (
                <div
                  key={f}
                  style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}
                >
                  {/* Delete button behind - only visible when swiped */}
                  {isSwiped && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: '80px',
                        background: '#ff4d4d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        zIndex: 1,
                      }}
                      onClick={() => removeFolder(f)}
                    >
                      删除
                    </div>
                  )}
                  {/* Folder item */}
                  <div
                    onClick={() => {
                      if (!isSwiped) setSelectedFolder(f)
                    }}
                    className="group-header"
                    style={{
                      margin: 0,
                      borderColor: selectedFolder === f ? 'var(--accent)' : undefined,
                      background: selectedFolder === f ? 'rgba(255,255,255,0.06)' : undefined,
                      transform: isSwiped ? 'translateX(-80px)' : 'translateX(0)',
                      transition: 'transform 0.3s ease',
                      cursor: 'pointer',
                    }}
                    onTouchStart={(e) => handleTouchStart(f, e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchEnd={(e) => handleTouchEnd(f, e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
                    onMouseDown={(e) => handleMouseDown(f, e.clientX, e.clientY)}
                    onMouseUp={(e) => handleMouseUp(f, e.clientX, e.clientY)}
                  >
                    <div className="group-cover">📁</div>
                    <div className="group-info">
                      <div className="group-name">{f}</div>
                      <div className="group-count">{count} 首歌曲</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Completed Buttons */}
        {completed && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <button className="btn primary" onClick={() => onNavigate('home')}>查看歌曲</button>
            <button className="btn" onClick={() => { setCompleted(false); setSelectedFolder('') }}>重新扫描</button>
          </div>
        )}

        {/* Scan Buttons */}
        {!completed && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              className="btn primary"
              onClick={() => startScan()}
              disabled={!selectedFolder || scanning}
            >
              {scanning ? '扫描中...' : '开始扫描'}
            </button>
            <button
              className="btn"
              onClick={startScanAll}
              disabled={scanning}
            >
              全部扫描
            </button>
            {scanning && (
              <button className="btn" onClick={stopScan}>停止</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
