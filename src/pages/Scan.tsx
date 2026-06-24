import { useState } from 'react'
import { useLibraryStore } from '../store/library'
import { pickDirectory, scanDirectoryByPath } from '../lib/scanner'

interface ScanProps {
  onNavigate: (page: string) => void
}

export function Scan({ onNavigate }: ScanProps) {
  const { songs, addSongs, folders, addFolder, removeFolder } = useLibraryStore()
  const [selectedFolder, setSelectedFolder] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scannedCount, setScannedCount] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [swipedFolder, setSwipedFolder] = useState<string | null>(null)
  const [swipeStart, setSwipeStart] = useState({ x: 0, y: 0 })
  const [folderPaths, setFolderPaths] = useState<Map<string, string>>(new Map())

  const handleRemoveFolder = async (f: string) => {
    await removeFolder(f)
    if (selectedFolder === f) setSelectedFolder('')
    setSwipedFolder(null)
  }

  const handleAddFolder = async () => {
    const path = await pickDirectory()
    if (path) {
      const folderName = path.split('/').pop() || path
      if (!folders.includes(folderName)) {
        await addFolder(folderName)
      }
      // Store the full path for scanning
      setFolderPaths(prev => new Map(prev).set(folderName, path))
      setSelectedFolder(folderName)

      // Immediately scan the folder to count files
      const result = await scanDirectoryByPath(path)
      if (result.songs.length > 0) {
        await addSongs(result.songs, result.lyrics)
      }
    }
  }

  const startScan = async () => {
    if (!selectedFolder) return
    setScanning(true)
    setCompleted(false)
    setScannedCount(0)
    setCompletedCount(0)

    const folderPath = folderPaths.get(selectedFolder) || selectedFolder
    const result = await scanDirectoryByPath(folderPath)

    if (result.songs.length > 0) {
      await addSongs(result.songs, result.lyrics)
    }

    setScannedCount(result.songs.length)
    setCompletedCount(result.songs.length)
    setScanning(false)
    setCompleted(true)
  }

  const startScanAll = async () => {
    setScanning(true)
    setCompleted(false)
    setScannedCount(0)
    setCompletedCount(0)

    let totalCount = 0
    for (const folder of folders) {
      const folderPath = folderPaths.get(folder) || folder
      const result = await scanDirectoryByPath(folderPath)
      if (result.songs.length > 0) {
        await addSongs(result.songs, result.lyrics)
      }
      totalCount += result.songs.length
      setScannedCount(totalCount)
    }

    setCompletedCount(totalCount)
    setScanning(false)
    setCompleted(true)
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
      <div className="page-content">
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <img src="/icons/back.svg" alt="back" width="24" height="24" />
              </button>
              <h2 style={{ fontSize: '18px', margin: 0 }}>{scanning ? '正在扫描' : '扫描音乐'}</h2>
            </div>
            {!scanning && !completed && (
              <button onClick={handleAddFolder} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>+</button>
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
              ? `共发现 ${completedCount} 首歌曲`
              : scanning
                ? `已发现 ${scannedCount} 首歌曲`
                : '点击右上角 + 选择文件夹'
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
                {scannedCount}
              </div>
            </div>
          </div>
        )}

        {/* Folder List */}
        {!scanning && !completed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {folders.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '16px 0' }}>
                暂无文件夹，点击右上角 + 添加
              </p>
            )}
            {folders.map(f => {
              const count = songs.filter(s => s.folder === f).length
              const isSwiped = swipedFolder === f
              return (
                <div
                  key={f}
                  style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}
                >
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
                      onClick={() => handleRemoveFolder(f)}
                    >
                      删除
                    </div>
                  )}
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
              onClick={startScan}
              disabled={!selectedFolder || scanning}
            >
              {scanning ? '扫描中...' : '开始扫描'}
            </button>
            <button
              className="btn"
              onClick={startScanAll}
              disabled={scanning || folders.length === 0}
            >
              全部扫描
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
