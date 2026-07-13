import { useState } from 'react'
import { useLibraryStore } from '../store/library'
import { pickDirectory, scanDirectoryByPath } from '../lib/scanner'

interface ScanProps {
  onNavigate: (page: string) => void
}

interface FolderEntry {
  folder: string
  path?: string
}

export function Scan({ onNavigate }: ScanProps) {
  const { songs, addSongs, folders, removeFolder, selectedScanFolders, toggleSelectedScanFolder, setSelectedScanFolders } = useLibraryStore()
  const [scanning, setScanning] = useState(false)
  const [scannedCount, setScannedCount] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [swipedFolder, setSwipedFolder] = useState<string | null>(null)
  const [swipeStart, setSwipeStart] = useState({ x: 0, y: 0 })

  const handleRemoveFolder = async (f: string) => {
    await removeFolder(f)
    setSwipedFolder(null)
  }

  const handleAddFolder = async () => {
    const picked = await pickDirectory()
    if (picked) {
      const isNew = !folders.some(f => f.folder === picked.folderName)
      if (isNew) {
        const { addFolder } = useLibraryStore.getState()
        await addFolder(picked.folderName, picked.path)
      }
      if (!selectedScanFolders.includes(picked.folderName)) {
        await toggleSelectedScanFolder(picked.folderName)
      }
    }
  }

  const handleSelectFolder = (entry: FolderEntry) => {
    toggleSelectedScanFolder(entry.folder)
  }

const handleScanAll = async () => {
     if (scanning || folders.length === 0) return
     setScanning(true)
     setCompleted(false)
     setScannedCount(0)
     setCompletedCount(0)
     let total = 0
     for (const entry of folders) {
       let pathToScan = entry.path
       if (!pathToScan) {
         const existingSong = songs.find(s => s.folder === entry.folder)
         if (existingSong) pathToScan = existingSong.filePath.replace(/\/[^/]+$/, '')
         if (!pathToScan) continue
       }
         const result = await scanDirectoryByPath(pathToScan, entry.folder, (count) => {
           setScannedCount(total + count)
         })
         await addSongs(result.songs, result.lyrics)
         total += result.songs.length
         setScannedCount(total)
     }
     setCompletedCount(total)
     setScanning(false)
     setCompleted(true)
   }


const startScan = async () => {
     if (selectedScanFolders.length === 0) return
     setScanning(true)
     setCompleted(false)
     setScannedCount(0)
     let total = 0
     for (const folderName of selectedScanFolders) {
       const entry = folders.find(f => f.folder === folderName)
       if (!entry) continue
       let pathToScan = entry.path
       if (!pathToScan) {
         const existingSong = songs.find(s => s.folder === folderName)
         if (existingSong) pathToScan = existingSong.filePath.replace(/\/[^/]+$/, '')
         if (!pathToScan) continue
       }
        const result = await scanDirectoryByPath(pathToScan, folderName, (count) => {
          setScannedCount(total + count)
        })
        await addSongs(result.songs, result.lyrics)
        total += result.songs.length
        setScannedCount(total)
     }
     setCompletedCount(total)
     setScanning(false)
     setCompleted(true)
   }


  const handleTouchStart = (_folder: string, x: number, y: number) => setSwipeStart({ x, y })
  const handleTouchEnd = (folder: string, x: number, _y: number) => setSwipedFolder(x - swipeStart.x < -60 ? folder : null)
  const handleMouseDown = (_folder: string, x: number, y: number) => setSwipeStart({ x, y })
  const handleMouseUp = (folder: string, x: number, _y: number) => setSwipedFolder(x - swipeStart.x < -60 ? folder : null)

  return (
    <div className="page active">
      <div className="page-content">
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <img src="/icons/back.svg" alt="back" width="24" height="24" />
              </button>
              <h2 style={{ fontSize: '18px', margin: 0 }}>扫描音乐</h2>
            </div>
            {!scanning && !completed && (
              <button onClick={handleAddFolder} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>+</button>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>{completed ? '✅' : scanning ? '📡' : '📁'}</div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>
            {completed ? '扫描完成' : scanning ? '正在扫描...' : selectedScanFolders.length > 0 ? `已选 ${selectedScanFolders.length} 个文件夹` : '选择扫描文件夹'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {completed ? `共发现 ${completedCount} 首歌曲` : scanning ? `已发现 ${scannedCount} 首歌曲` : '点击右上角 + 添加文件夹，然后点击开始扫描'}
          </p>
        </div>

        {scanning && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ width: '160px', height: '160px', borderRadius: '50%', position: 'relative', background: 'conic-gradient(var(--accent), var(--accent-glow), var(--accent))', animation: 'spin 3s linear infinite' }}>
              <div style={{ position: 'absolute', inset: '8px', borderRadius: '50%', background: 'var(--bg)' }}></div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'var(--text-secondary)', zIndex: 1 }}>{scannedCount}</div>
            </div>
          </div>
        )}

        {!scanning && !completed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {folders.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '16px 0' }}>暂无文件夹，点击右上角 + 添加</p>
            )}
            {folders.map(entry => {
              const count = songs.filter(s => s.folder === entry.folder).length
              const isSwiped = swipedFolder === entry.folder
              const isSelected = selectedScanFolders.includes(entry.folder)
              return (
                <div key={entry.folder} style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
                  {isSwiped && (
                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '80px', background: '#ff4d4d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', zIndex: 1 }} onClick={() => handleRemoveFolder(entry.folder)}>删除</div>
                  )}
                  <div
                    onClick={() => { if (!isSwiped) handleSelectFolder(entry) }}
                    className={`group-header${isSelected ? ' selected' : ''}`}
                    style={{
                      margin: 0,
                      transform: isSwiped ? 'translateX(-80px)' : 'translateX(0)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onTouchStart={(e) => handleTouchStart(entry.folder, e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchEnd={(e) => handleTouchEnd(entry.folder, e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
                    onMouseDown={(e) => handleMouseDown(entry.folder, e.clientX, e.clientY)}
                    onMouseUp={(e) => handleMouseUp(entry.folder, e.clientX, e.clientY)}
                  >
                    <div className="group-cover">📁</div>
                    <div className="group-info">
                      <div className="group-name">{entry.folder}</div>
                      <div className="group-count">{count} 首歌曲</div>
                      {entry.path && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.path}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {completed && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <button className="btn primary" onClick={() => onNavigate('home')}>查看歌曲</button>
            <button className="btn" onClick={() => { setCompleted(false); setSelectedScanFolders([]) }}>重新扫描</button>
          </div>
        )}

        {!completed && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={startScan} disabled={selectedScanFolders.length === 0 || scanning}>{scanning ? '扫描中...' : '开始扫描'}</button>
            <button className="btn" onClick={handleScanAll} disabled={scanning}>全部扫描 ({folders.length})</button>
            {scanning && <button className="btn" onClick={() => setScanning(false)}>停止</button>}
          </div>
        )}
      </div>
    </div>
  )
}
