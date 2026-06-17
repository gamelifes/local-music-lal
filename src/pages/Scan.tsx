import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLibraryStore } from '../store/library'
import { scanFolder } from '../lib/scanner'
import { Layout } from '../components/Layout'

type ScanStatus = 'idle' | 'scanning' | 'done' | 'error'

export function Scan() {
  const navigate = useNavigate()
  const addSongs = useLibraryStore((s) => s.addSongs)
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [found, setFound] = useState(0)
  const [added, setAdded] = useState(0)
  const progressRef = useRef(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleScan = async () => {
    setStatus('scanning')
    setFound(0)
    setAdded(0)
    progressRef.current = 0

    intervalRef.current = window.setInterval(() => {
      setFound(progressRef.current)
    }, 200)

    try {
      const songs = await scanFolder((current) => {
        progressRef.current = current
      })

      if (intervalRef.current) clearInterval(intervalRef.current)
      setFound(songs.length)

      if (songs.length > 0) {
        await addSongs(songs)
        setAdded(songs.length)
      }
      setStatus('done')
    } catch {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setStatus('error')
    }
  }

  return (
    <Layout title="扫描音乐">
      <div className="flex flex-col items-center justify-center px-6 py-12">
        {/* Scan Animation */}
        <div className="relative mb-10">
          <div
            className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
              status === 'scanning'
                ? 'border-accent/60 animate-[spin_3s_linear_infinite]'
                : status === 'done'
                ? 'border-green-500/60'
                : 'border-white/10'
            }`}
          >
            <div
              className={`w-28 h-28 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                status === 'scanning'
                  ? 'border-accent/30 animate-[spin_2s_linear_infinite_reverse]'
                  : status === 'done'
                  ? 'border-green-500/30'
                  : 'border-white/5'
              }`}
            >
              <div className="text-center">
                {status === 'scanning' ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" className="animate-pulse">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ) : status === 'done' ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
            </div>
          </div>
          {status === 'scanning' && (
            <div className="absolute inset-0 rounded-full border border-accent/10 animate-[ping_2s_ease-out_infinite]" />
          )}
        </div>

        {/* Status Text */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold text-text mb-1">
            {status === 'idle' && '选择文件夹开始扫描'}
            {status === 'scanning' && '正在扫描...'}
            {status === 'done' && '扫描完成'}
            {status === 'error' && '扫描失败'}
          </h2>
          <p className="text-sm text-text-secondary">
            {status === 'idle' && '支持 MP3, FLAC, WAV, OGG, AAC 等格式'}
            {status === 'scanning' && `已发现 ${found} 首歌曲`}
            {status === 'done' && `已添加 ${added} 首歌曲到库`}
            {status === 'error' && '请重试或选择其他文件夹'}
          </p>
        </div>

        {/* Progress Bar */}
        {status === 'scanning' && (
          <div className="w-full max-w-xs mb-8">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '100%' }} />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {(status === 'idle' || status === 'error') && (
            <button
              onClick={handleScan}
              className="w-full py-3 bg-accent text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              选择文件夹
            </button>
          )}
          {status === 'scanning' && (
            <button
              onClick={() => {
                if (intervalRef.current) clearInterval(intervalRef.current)
                setStatus('idle')
              }}
              className="w-full py-3 bg-white/10 text-text font-medium rounded-xl hover:bg-white/15 transition-colors"
            >
              取消
            </button>
          )}
          {status === 'done' && (
            <>
              <button
                onClick={handleScan}
                className="w-full py-3 bg-white/10 text-text font-medium rounded-xl hover:bg-white/15 transition-colors"
              >
                继续扫描
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-accent text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                返回首页
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
