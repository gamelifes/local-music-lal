import { useState, useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/player'
import { Layout } from '../components/Layout'

const DEMO_LYRICS = `[00:00.00]暂无歌词
[00:03.00]请播放一首歌曲
[00:06.00]歌词将在这里显示
[00:09.00]
[00:12.00]支持 LRC 格式歌词
[00:15.00]支持逐字高亮
[00:18.00]
[00:21.00]音乐是最好的陪伴
[00:24.00]让旋律带你飞翔
[00:27.00]
[00:30.00]♪ ♫ ♬`

export function Lyrics() {
  const currentSong = usePlayerStore((s) => s.currentSong)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const progress = usePlayerStore((s) => s.progress)
  const duration = usePlayerStore((s) => s.duration)

  const [lines, setLines] = useState<{ time: number; text: string }[]>([])
  const [activeLine, setActiveLine] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parsed = DEMO_LYRICS.split('\n')
      .map((line) => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/)
        if (match) {
          const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 100
          return { time, text: match[4] || '...' }
        }
        return null
      })
      .filter(Boolean) as { time: number; text: string }[]

    setLines(parsed)
  }, [currentSong])

  useEffect(() => {
    if (duration <= 0 || lines.length === 0) return
    const currentTime = (progress / 100) * duration
    let idx = -1
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTime >= lines[i].time) {
        idx = i
        break
      }
    }
    setActiveLine(idx)
  }, [progress, duration, lines])

  useEffect(() => {
    if (activeLine < 0 || !containerRef.current) return
    const container = containerRef.current
    const activeEl = container.children[activeLine] as HTMLElement
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [activeLine])

  return (
    <Layout title="歌词">
      <div className="flex flex-col h-[calc(100dvh-120px)]">
        {/* Song Info Header */}
        <div className="text-center py-4 px-4 border-b border-white/5">
          <p className="text-sm font-medium text-text truncate">
            {currentSong?.title || '未在播放'}
          </p>
          <p className="text-xs text-text-secondary truncate">
            {currentSong?.artist || '选择一首歌曲'}
          </p>
        </div>

        {/* Lyrics Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto scrollbar-hide px-6 py-8"
        >
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <p className="text-sm">暂无歌词</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lines.map((line, index) => (
                <div
                  key={index}
                  className={`text-center transition-all duration-300 ${
                    index === activeLine
                      ? 'text-lg font-bold text-accent scale-105'
                      : 'text-sm text-text-secondary/60'
                  }`}
                >
                  {line.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {isPlaying && (
          <div className="text-center py-2 text-xs text-text-secondary">
            {Math.floor((progress / 100) * duration)}s / {Math.floor(duration)}s
          </div>
        )}
      </div>
    </Layout>
  )
}
