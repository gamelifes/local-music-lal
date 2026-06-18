import { useRef, useEffect } from 'react'

interface EqCurveProps {
  values: number[]
  onChange: (values: number[]) => void
}

export function EqCurve({ values, onChange }: EqCurveProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragging = useRef<number>(-1)
  const dragStartY = useRef<number>(0)
  const PAD_X = 24
  const PAD_Y = 20
  const barCount = 32
  const barGap = 2

  const getCanvasSize = () => {
    const wrap = wrapRef.current
    if (!wrap) return { w: 320, h: 200 }
    return { w: wrap.clientWidth, h: wrap.clientHeight }
  }

  const getPointX = (i: number) => {
    const { w } = getCanvasSize()
    return PAD_X + (i / (values.length - 1)) * (w - PAD_X * 2)
  }

  const getPointY = (v: number) => {
    const { h } = getCanvasSize()
    return PAD_Y + ((12 - v) / 24) * (h - PAD_Y * 2)
  }

  const getValueFromY = (y: number) => {
    const { h } = getCanvasSize()
    return Math.round(((1 - (y - PAD_Y) / (h - PAD_Y * 2)) * 24 - 12) * 2) / 2
  }

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { w: W, h: H } = getCanvasSize()
    if (W < 10 || H < 10) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = PAD_Y + (i / 4) * (H - PAD_Y * 2)
      ctx.beginPath()
      ctx.moveTo(PAD_X, y)
      ctx.lineTo(W - PAD_X, y)
      ctx.stroke()
    }

    // 0dB line
    const zeroY = getPointY(0)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(PAD_X, zeroY)
    ctx.lineTo(W - PAD_X, zeroY)
    ctx.stroke()
    ctx.setLineDash([])

    // Bar frequency background
    const barW = (W - PAD_X * 2) / barCount - barGap
    for (let i = 0; i < barCount; i++) {
      const x = PAD_X + i * ((W - PAD_X * 2) / barCount)
      const normalizedI = i / (barCount - 1)
      const segIdx = normalizedI * (values.length - 1)
      const segFloor = Math.floor(segIdx)
      const segFrac = segIdx - segFloor
      const v = segFloor < values.length - 1
        ? values[segFloor] * (1 - segFrac) + values[segFloor + 1] * segFrac
        : values[values.length - 1]
      const barH = Math.max(4, ((v + 12) / 24) * (H - PAD_Y * 2) * 0.8)
      const barY = H - PAD_Y - barH
      const alpha = 0.15 + ((v + 12) / 24) * 0.25
      ctx.fillStyle = `rgba(232,180,60,${alpha})`
      ctx.beginPath()
      ctx.roundRect(x, barY, barW, barH, 2)
      ctx.fill()
    }

    // EQ curve fill
    ctx.beginPath()
    ctx.moveTo(getPointX(0), getPointY(values[0]))
    for (let i = 1; i < values.length; i++) {
      const x0 = getPointX(i - 1), y0 = getPointY(values[i - 1])
      const x1 = getPointX(i), y1 = getPointY(values[i])
      const cpx = (x0 + x1) / 2
      ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1)
    }
    ctx.lineTo(getPointX(values.length - 1), H - PAD_Y)
    ctx.lineTo(getPointX(0), H - PAD_Y)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, 'rgba(232,180,60,0.25)')
    grad.addColorStop(1, 'rgba(232,180,60,0.02)')
    ctx.fillStyle = grad
    ctx.fill()

    // EQ curve stroke
    ctx.beginPath()
    ctx.moveTo(getPointX(0), getPointY(values[0]))
    for (let i = 1; i < values.length; i++) {
      const x0 = getPointX(i - 1), y0 = getPointY(values[i - 1])
      const x1 = getPointX(i), y1 = getPointY(values[i])
      const cpx = (x0 + x1) / 2
      ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1)
    }
    ctx.strokeStyle = '#e8b43c'
    ctx.lineWidth = 2.5
    ctx.shadowColor = 'rgba(232,180,60,0.5)'
    ctx.shadowBlur = 8
    ctx.stroke()
    ctx.shadowBlur = 0

    // Control points
    values.forEach((v, i) => {
      const x = getPointX(i), y = getPointY(v)
      ctx.beginPath()
      ctx.arc(x, y, 10, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(232,180,60,0.15)'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x, y, 7, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#e8b43c'
      ctx.fill()
    })

    // Frequency labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '10px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    const labels = ['60', '230', '910', '3.6k', '14k']
    labels.forEach((label, i) => {
      ctx.fillText(label + 'Hz', getPointX(i), H - 4)
    })
  }

  const getPos = (e: MouseEvent | TouchEvent) => {
    const touch = 'touches' in e ? e.touches[0] : e
    if ('offsetX' in touch) {
      return { x: (touch as MouseEvent).offsetX, y: (touch as MouseEvent).offsetY }
    }
    const wrap = wrapRef.current
    if (!wrap) return { x: 0, y: 0 }
    const rect = wrap.getBoundingClientRect()
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  }

  const findClosest = (x: number, y: number) => {
    let closest = -1, minDist = 50
    values.forEach((v, i) => {
      const dx = x - getPointX(i), dy = y - getPointY(v)
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    return closest
  }

  const handleDown = (e: MouseEvent | TouchEvent) => {
    const { x, y } = getPos(e)
    const idx = findClosest(x, y)
    if (idx >= 0) {
      e.preventDefault()
      e.stopPropagation()
      dragging.current = idx
      dragStartY.current = y
    }
  }

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (dragging.current < 0) return
    e.preventDefault()
    const { y } = getPos(e)
    if (Math.abs(y - dragStartY.current) < 3) return
    const newVal = getValueFromY(y)
    const clamped = Math.max(-12, Math.min(12, newVal))
    if (values[dragging.current] !== clamped) {
      const newValues = [...values]
      newValues[dragging.current] = clamped
      onChange(newValues)
    }
  }

  const handleUp = () => { dragging.current = -1 }

  useEffect(() => { draw() }, [values])

  useEffect(() => {
    const timer = setTimeout(() => draw(), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const ro = new ResizeObserver(() => draw())
    if (wrapRef.current) ro.observe(wrapRef.current)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchend', handleUp)
    return () => {
      ro.disconnect()
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchend', handleUp)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className="eq-canvas-wrap"
      onMouseDown={handleDown as any}
      onMouseMove={handleMove as any}
      onTouchStart={handleDown as any}
      onTouchMove={handleMove as any}
    >
      <canvas ref={canvasRef} className="eq-canvas" style={{ pointerEvents: 'none' }} />
    </div>
  )
}
