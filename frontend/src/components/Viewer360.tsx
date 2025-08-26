import { useCallback, useEffect, useRef, useState } from 'react'

/*
  Viewer360: image-based 360° product viewer

  Contract
  - inputs: frames (ordered URLs), className
  - output: renders an interactive viewer. Users can:
      - drag horizontally to rotate
      - scroll wheel or use left/right arrows to change frames
      - use a range input for accessibility
  - error modes: if frames is empty, show a placeholder box

  Design notes
  - We preload the current, previous, and next frames for snappy interactions
  - We debounce wheel events to avoid skipping too many frames on trackpads
  - We clamp frame index within [0, frames.length-1] and wrap around via modulo
*/

type Props = {
  frames: string[]
  className?: string
  alt?: string
}

export default function Viewer360({ frames, className, alt = '360° view' }: Props) {
  const total = frames.length
  const [idx, setIdx] = useState(0) // current frame index

  // refs to manage dragging state without re-renders
  const dragging = useRef(false)
  const startX = useRef(0)
  const lastIdx = useRef(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const wheelTimeout = useRef<number | null>(null)

  // Derived URLs to preload adjacent frames for smoother UX
  const currentSrc = frames[idx]
  const prevSrc = frames[(idx - 1 + total) % total]
  const nextSrc = frames[(idx + 1) % total]

  // Helper to rotate by delta steps with wrap-around
  const rotate = useCallback((delta: number) => {
    if (total === 0) return
    setIdx((cur) => (cur + delta + total) % total)
  }, [total])

  // Mouse/touch drag handlers
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onDown = (e: MouseEvent | TouchEvent) => {
      dragging.current = true
      startX.current = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      lastIdx.current = idx
    }
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return
      const x = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      const dx = x - startX.current
      // Sensitivity: 8px moves one frame; tweak as needed
      const deltaFrames = Math.round(dx / 8)
      const next = (lastIdx.current - deltaFrames + total) % total
      setIdx(next)
    }
    const onUp = () => { dragging.current = false }

    el.addEventListener('mousedown', onDown)
    el.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)

  el.addEventListener('touchstart', onDown as EventListener, { passive: true })
  el.addEventListener('touchmove', onMove as EventListener, { passive: true })
    window.addEventListener('touchend', onUp)

    return () => {
      el.removeEventListener('mousedown', onDown)
      el.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    el.removeEventListener('touchstart', onDown as EventListener)
    el.removeEventListener('touchmove', onMove as EventListener)
      window.removeEventListener('touchend', onUp)
    }
  }, [idx, total])

  // Wheel and keyboard support
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      // Normalize delta: scroll right to go next frame
      const direction = e.deltaY > 0 || e.deltaX > 0 ? 1 : -1
      rotate(direction)
      // Debounce further handling for 60ms to avoid rapid skipping
      if (wheelTimeout.current) window.clearTimeout(wheelTimeout.current)
      wheelTimeout.current = window.setTimeout(() => { wheelTimeout.current = null }, 60)
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') rotate(1)
      if (e.key === 'ArrowLeft') rotate(-1)
    }

  // Use passive: false to be able to preventDefault on wheel for smoother UX
    el.addEventListener('wheel', onWheel as EventListener, { passive: false })
    el.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('wheel', onWheel as EventListener)
      el.removeEventListener('keydown', onKey)
    }
  }, [total, rotate])

  if (total === 0) {
    return <div className={`aspect-[4/3] rounded-lg border bg-gray-50 ${className ?? ''}`} />
  }

  return (
    <div className={className}>
      {/* Main interactive canvas */}
      <div
        ref={containerRef}
        className="relative aspect-[4/3] select-none overflow-hidden rounded-lg border border-[var(--border)] bg-black/5 touch-pan-y"
        tabIndex={0} // enable keyboard handling
        aria-label="360 degree view"
      >
        {/* Current frame */}
        <img src={currentSrc} alt={alt} className="h-full w-full object-contain" draggable={false} />

        {/* Preload neighbors invisibly */}
        <link rel="preload" as="image" href={prevSrc} />
        <link rel="preload" as="image" href={nextSrc} />

        {/* Tooltip */}
  <div className="pointer-events-none absolute inset-x-0 bottom-0 m-3 rounded bg-black/50 px-2 py-1 text-xs text-white">
          Drag left/right or use arrow keys
        </div>
      </div>

      {/* Accessible range control mirrors frame index */}
      <input
        type="range"
        min={0}
        max={total - 1}
        value={idx}
        onChange={(e) => setIdx(Number(e.target.value))}
        className="mt-3 w-full [--thumb-size:24px] sm:[--thumb-size:18px]"
        aria-label="360 degree frame selector"
      />
    </div>
  )
}
