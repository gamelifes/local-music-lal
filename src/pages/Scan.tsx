import { useState } from 'react'
import { scanFolder } from '../lib/scanner'
import { useLibraryStore } from '../store/library'

interface ScanProps {
  onNavigate: (page: string) => void
}

export function Scan(_props: ScanProps) {
  const [scanning, setScanning] = useState(false)
  const [scannedCount, setScannedCount] = useState(0)
  const { addSongs } = useLibraryStore()

  const handleScan = async () => {
    setScanning(true)
    setScannedCount(0)

    const songs = await scanFolder((current) => {
      setScannedCount(current)
    })

    if (songs.length > 0) {
      await addSongs(songs)
    }

    setScanning(false)
  }

  return (
    <div className="page active">
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📁</div>

          {scanning ? (
            <>
              <div style={{ width: '160px', height: '160px', borderRadius: '50%', position: 'relative', margin: '32px 0', background: 'conic-gradient(var(--accent), var(--accent-glow), var(--accent))', animation: 'spin 3s linear infinite' }}>
                <div style={{ position: 'absolute', inset: '8px', borderRadius: '50%', background: 'var(--bg)' }}></div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'var(--text-secondary)', zIndex: 1 }}>{scannedCount}</div>
              </div>
              <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>正在扫描...</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>已发现 {scannedCount} 首歌曲</p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>选择扫描文件夹</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center' }}>选择或新增文件夹后自动扫描音频文件</p>
              <button
                onClick={handleScan}
                className="px-8 py-4 bg-amber-500 text-black rounded-full font-semibold text-base hover:bg-amber-400 transition-colors"
              >
                开始扫描
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
