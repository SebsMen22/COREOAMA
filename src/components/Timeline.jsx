import { useEffect, useRef } from 'react'
import { LuPlay, LuPause, LuSkipBack, LuSkipForward, LuPlus, LuMusic } from 'react-icons/lu'
import { timeline, totalTime, fmtTime } from '../model.js'

const PXS = 18 // píxeles por segundo

export default function Timeline({ c, fi, time, playing, audioDur, onSelect, onSeek, onTogglePlay, onAdd }) {
  const tl = timeline(c)
  const total = totalTime(c)
  const span = Math.max(total, audioDur || 0, 20)
  const scroller = useRef(null)

  // Mantener visible la línea de reproducción y la formación activa
  useEffect(() => {
    const s = scroller.current
    if (!s) return
    const x = (playing ? time : tl[fi]?.start || 0) * PXS
    if (x < s.scrollLeft + 40 || x > s.scrollLeft + s.clientWidth - 120) s.scrollTo({ left: Math.max(0, x - 80), behavior: playing ? 'auto' : 'smooth' })
  }, [playing ? Math.floor(time) : fi])

  const ticks = []
  for (let t = 0; t <= span; t += 5) ticks.push(t)

  return (
    <div className="tl">
      <div className="tl-ctrl">
        <button className="icon-btn" onClick={() => onSelect(Math.max(0, fi - 1))} disabled={fi === 0} aria-label="Formación anterior" title="Anterior"><LuSkipBack /></button>
        <button className="play" onClick={onTogglePlay} aria-label={playing ? 'Pausar' : 'Reproducir'} title={playing ? 'Pausar (espacio)' : 'Reproducir (espacio)'}>{playing ? <LuPause /> : <LuPlay />}</button>
        <button className="icon-btn" onClick={() => onSelect(Math.min(c.formaciones.length - 1, fi + 1))} disabled={fi === c.formaciones.length - 1} aria-label="Formación siguiente" title="Siguiente"><LuSkipForward /></button>
        <span className="tl-time">{fmtTime(time)} <i>/ {fmtTime(total)}</i></span>
        {c.musica && <span className="tl-music" title={c.musica.nombre}><LuMusic /> {c.musica.nombre}</span>}
      </div>
      <div className="tl-scroll" ref={scroller}>
        <div className="tl-track" style={{ width: span * PXS + 190 }}>
          <div className="tl-ruler" onPointerDown={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek((e.clientX - r.left) / PXS) }}>
            {ticks.map((t) => <span key={t} style={{ left: t * PXS }}>{fmtTime(t)}</span>)}
          </div>
          {audioDur > 0 && <div className="tl-audio" style={{ width: audioDur * PXS }} />}
          <div className="tl-chips">
            {c.formaciones.map((f, i) => {
              const s = tl[i]
              return (
                <button key={f.id} className={'chip' + (i === fi ? ' on' : '')} style={{ left: s.start * PXS, width: Math.max(28, (s.end - s.start) * PXS - 3) }}
                  onClick={() => onSelect(i)} title={`${i + 1}. ${f.nombre} · ${f.duracion}s`}>
                  <span className="chip-hold" style={{ width: Math.max(26, (s.hold - s.start) * PXS) }}><b>{i + 1}</b> {f.nombre}</span>
                  {s.end > s.hold && <span className="chip-trans" />}
                </button>
              )
            })}
            <button className="chip-add" style={{ left: total * PXS + 8 }} onClick={onAdd}><LuPlus /> Añadir formación</button>
          </div>
          <div className="tl-head" style={{ left: time * PXS }}><span /></div>
        </div>
      </div>
    </div>
  )
}
