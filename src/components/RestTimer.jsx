import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Timer, Play, Pause, RotateCcw } from 'lucide-react'

const PRESETS = [30, 60, 90, 120]

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // Web Audio indisponível — ignora silenciosamente.
  }
  if (navigator.vibrate) navigator.vibrate([200, 100, 200])
}

const RestTimer = forwardRef(function RestTimer(_props, ref) {
  const [duration, setDuration] = useState(60)
  const [remaining, setRemaining] = useState(60)
  const [running, setRunning] = useState(false)

  useImperativeHandle(ref, () => ({
    start(seconds) {
      const d = seconds ?? duration
      setDuration(d)
      setRemaining(d)
      setRunning(true)
    },
  }))

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false)
          beep()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running])

  function toggle() {
    if (remaining === 0) {
      setRemaining(duration)
      setRunning(true)
      return
    }
    setRunning((r) => !r)
  }

  function reset() {
    setRunning(false)
    setRemaining(duration)
  }

  function selectPreset(seconds) {
    setDuration(seconds)
    setRemaining(seconds)
    setRunning(true)
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const progress = duration > 0 ? Math.max(0, Math.min(1, (duration - remaining) / duration)) : 0

  return (
    <div className="card space-y-3">
      <p className="section-label flex items-center gap-1.5">
        <Timer size={14} />
        Cronômetro de descanso
      </p>
      <div className="flex items-center gap-4">
        <p className="text-3xl font-extrabold text-white tabular-nums w-24 shrink-0">
          {mm}:{ss}
        </p>
        <div className="flex-1 space-y-2">
          <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => selectPreset(p)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                  duration === p
                    ? 'bg-brand-500 text-neutral-950 border-brand-500'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-600'
                }`}
              >
                {p}s
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={toggle} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
          {running ? (
            <>
              <Pause size={14} /> Pausar
            </>
          ) : (
            <>
              <Play size={14} /> {remaining === 0 ? 'Reiniciar' : remaining === duration ? 'Iniciar' : 'Continuar'}
            </>
          )}
        </button>
        <button type="button" onClick={reset} className="btn-secondary flex items-center gap-1.5 px-3">
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  )
})

export default RestTimer
