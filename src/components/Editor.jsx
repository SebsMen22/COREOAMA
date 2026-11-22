import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LuArrowLeft, LuUndo2, LuRedo2, LuCircleHelp, LuEllipsisVertical, LuMousePointer2, LuCircleUser, LuRectangleHorizontal,
  LuBox, LuArmchair, LuMoveUpRight, LuMinus, LuCircleDashed, LuTriangle, LuType, LuMagnet, LuGhost, LuMaximize2,
  LuMinimize2, LuMusic, LuHistory, LuPrinter, LuDownload, LuCopy, LuCheck, LuLoader, LuPencil, LuTrash2, LuUsers, LuLayers, LuSlidersHorizontal,
} from 'react-icons/lu'
import { W, H, CX, CY, PALETTE, PROPS, clone, uid, newFormation, newDancer, formationPoints, timeline, totalTime, sceneAt, clamp } from '../model.js'
import { GridDefs, StageBase, Scene, Mini, arrowCtrl } from './StageArt.jsx'
import { Roster, FormationPanel, Inspector, GroupForm } from './Panels.jsx'
import Timeline from './Timeline.jsx'
import { Modal, Confirm } from './Modal.jsx'
import { listBackups, addBackup, putAudio, getAudio, download, slug, exportJSON } from '../storage.js'

const TOOLS = [
  ['select', 'Mover', LuMousePointer2], ['dancer', 'Bailarín', LuCircleUser], ['mesa', 'Mesa', LuRectangleHorizontal],
  ['cubo', 'Cubo', LuBox], ['silla', 'Silla', LuArmchair], ['arrow', 'Flecha', LuMoveUpRight], ['line', 'Fila', LuMinus],
  ['circle', 'Círculo', LuCircleDashed], ['triangle', 'Triángulo', LuTriangle], ['text', 'Texto', LuType],
]

export default function Editor({ initial, onSave, onBack, onHelp, onDuplicateCoreo, toast }) {
  const [c, setC] = useState(initial)
  const cRef = useRef(initial)
  const hist = useRef([]), fut = useRef([])
  const [fi, setFiRaw] = useState(0)
  const fiRef = useRef(0)
  const setFi = (i) => { fiRef.current = i; setFiRaw(i) }
  const [sel, setSel] = useState([])
  const [tool, setTool] = useState('select')
  const [tcolor, setTcolor] = useState(PALETTE[0])
  const [snapOn, setSnapOn] = useState(false)
  const [ghostOn, setGhostOn] = useState(false)
  const [showNames, setShowNames] = useState(true)
  const [tab, setTab] = useState('formacion')
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [focus, setFocus] = useState(false)
  const [menu, setMenu] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [saved, setSaved] = useState(true)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioDur, setAudioDur] = useState(0)
  const [printing, setPrinting] = useState(false)
  const audioRef = useRef(null)

  const F = c.formaciones[clamp(fi, 0, c.formaciones.length - 1)]

  /* ---------- cambios, deshacer y autoguardado ---------- */
  const commit = (n) => { cRef.current = n; setC(n) }
  const record = () => { hist.current.push(cRef.current); if (hist.current.length > 150) hist.current.shift(); fut.current = [] }
  const apply = useCallback((fn, rec = true) => {
    if (rec) record()
    const n = clone(cRef.current)
    fn(n, n.formaciones[clamp(fiRef.current, 0, n.formaciones.length - 1)])
    n.updatedAt = Date.now()
    commit(n)
  }, [])
  const rk = useRef({ k: '', t: 0 })
  const recordOnce = (k) => { const now = Date.now(); if (k !== rk.current.k || now - rk.current.t > 1500) record(); rk.current = { k, t: now } }
  const undo = () => { if (!hist.current.length) return; fut.current.push(cRef.current); const p = hist.current.pop(); commit(p); setSel([]); if (fiRef.current >= p.formaciones.length) setFi(p.formaciones.length - 1) }
  const redo = () => { if (!fut.current.length) return; hist.current.push(cRef.current); const n = fut.current.pop(); commit(n); setSel([]); if (fiRef.current >= n.formaciones.length) setFi(n.formaciones.length - 1) }

  useEffect(() => {
    if (c === initial) return
    setSaved(false)
    const t = setTimeout(async () => { await onSave(c); setSaved(true) }, 450)
    return () => clearTimeout(t)
  }, [c])
  useEffect(() => {
    const flush = () => { if (document.visibilityState === 'hidden') onSave(cRef.current) }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', flush)
    return () => { document.removeEventListener('visibilitychange', flush); window.removeEventListener('pagehide', flush) }
  }, [])
  const goBack = async () => { setPlaying(false); await onSave(cRef.current); onBack() }

  /* ---------- música ---------- */
  useEffect(() => {
    let url
    if (c.musica) getAudio(c.id).then((b) => { if (b) { url = URL.createObjectURL(b); setAudioUrl(url) } })
    return () => url && URL.revokeObjectURL(url)
  }, [])
  useEffect(() => {
    if (!audioUrl) { audioRef.current = null; setAudioDur(0); return }
    const a = new Audio(audioUrl)
    a.preload = 'auto'
    a.onloadedmetadata = () => setAudioDur(a.duration || 0)
    audioRef.current = a
    return () => a.pause()
  }, [audioUrl])
  async function loadMusic(file) {
    if (!file) return
    await putAudio(c.id, file)
    apply((n) => { n.musica = { nombre: file.name } })
    setAudioUrl(URL.createObjectURL(file))
    toast('Música guardada con la coreografía')
  }

  /* ---------- reproducción ---------- */
  const tl = timeline(c)
  const selectFormation = (i) => { setPlaying(false); setFi(i); setSel([]); setTime(timeline(cRef.current)[i]?.start || 0) }
  useEffect(() => {
    if (!playing) return
    let raf
    const a = audioRef.current
    const total = totalTime(cRef.current)
    const start = time >= total - 0.05 ? 0 : time
    const t0 = performance.now()
    if (a) { try { a.currentTime = start } catch { } a.play().catch(() => { }) }
    const loop = () => {
      const t = a && !a.paused ? a.currentTime : start + (performance.now() - t0) / 1000
      if (t >= total) { setTime(total); setFi(cRef.current.formaciones.length - 1); setPlaying(false); return }
      setTime(t)
      const i = sceneAt(cRef.current, t).index
      if (i !== fiRef.current) setFi(i)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); if (a) a.pause() }
  }, [playing])
  const togglePlay = () => { setSel([]); setTool('select'); setPlaying((p) => !p) }
  const seek = (t) => { setPlaying(false); const tt = clamp(t, 0, totalTime(cRef.current)); setTime(tt); setFi(sceneAt(cRef.current, tt).index) }
  const playScene = playing ? sceneAt(c, time) : null

  /* ---------- formaciones ---------- */
  const addFormation = () => {
    const i = fiRef.current
    apply((n) => { const f = newFormation(i + 2, n.formaciones[i]); n.formaciones.splice(i + 1, 0, f) })
    selectFormation(i + 1)
    toast('Nueva formación: mueve a los bailarines a su nueva posición')
  }
  const dupFormation = () => { const i = fiRef.current; apply((n) => { const f = clone(n.formaciones[i]); f.id = uid(); f.nombre += ' (copia)'; n.formaciones.splice(i + 1, 0, f) }); selectFormation(i + 1) }
  const moveFormation = (d) => { const i = fiRef.current, j = i + d; apply((n) => { const a = n.formaciones;[a[i], a[j]] = [a[j], a[i]] }); setFi(j) }
  const deleteFormation = () => setDialog({
    type: 'confirm', title: '¿Eliminar esta formación?', ok: 'Eliminar', danger: true,
    text: `Se eliminará “${F.nombre}”. Puedes recuperarla con Deshacer o desde el historial de copias.`,
    onOk: () => { const i = fiRef.current; apply((n) => { n.formaciones.splice(i, 1); if (!n.formaciones.length) n.formaciones.push(newFormation(1)) }); selectFormation(Math.max(0, i - 1)) },
  })

  /* ---------- herramientas sobre la selección ---------- */
  const removeSel = () => { if (!sel.length) return; apply((n, f) => { sel.forEach((id) => delete f.posiciones[id]); f.elementos = f.elementos.filter((e) => !sel.includes(e.id)) }); setSel([]) }
  const dupSel = () => {
    const ids = []
    apply((n, f) => f.elementos.filter((e) => sel.includes(e.id)).forEach((e) => { const k = clone(e); k.id = uid(); k.x += 30; k.y += 30; if (k.type === 'arrow') { k.x2 += 30; k.y2 += 30 } f.elementos.push(k); ids.push(k.id) }))
    if (ids.length) setSel(ids)
  }
  const mirror = () => apply((n, f) => sel.forEach((id) => {
    const p = f.posiciones[id]
    if (p) { p.x = W - p.x; if (p.mira === 'left') p.mira = 'right'; else if (p.mira === 'right') p.mira = 'left'; return }
    const e = f.elementos.find((x) => x.id === id)
    if (!e) return
    e.x = W - e.x
    if (e.type === 'arrow') { e.x2 = W - e.x2; e.bend = -e.bend }
    if (e.rot) e.rot = -e.rot
  }))
  const arrange = (kind) => apply((n, f) => {
    const ds = sel.filter((id) => f.posiciones[id])
    if (!ds.length) return
    const ps = ds.map((id) => f.posiciones[id])
    const cx = ps.reduce((s, p) => s + p.x, 0) / ps.length, cy = ps.reduce((s, p) => s + p.y, 0) / ps.length
    const order = n.bailarines.map((d) => d.id).filter((id) => ds.includes(id))
    formationPoints(kind, order.length, cx, cy).forEach(([x, y], i) => { f.posiciones[order[i]].x = x; f.posiciones[order[i]].y = y })
  })
  const addGroup = ({ n: count, color, form, prefix, grupo, forma }) => {
    const ids = []
    apply((n, f) => {
      const pts = formationPoints(form, count)
      for (let i = 0; i < count; i++) {
        const d = newDancer(n, { color, forma, grupo, nombre: `${prefix} ${i + 1}` })
        n.bailarines.push(d); f.posiciones[d.id] = { x: pts[i][0], y: pts[i][1], mira: 'none' }; ids.push(d.id)
      }
    })
    setSel(ids)
  }
  const addDancer = () => {
    let id
    apply((n, f) => { const d = newDancer(n, { color: tcolor }); n.bailarines.push(d); f.posiciones[d.id] = { x: CX + (Math.random() - 0.5) * 120, y: CY + (Math.random() - 0.5) * 80, mira: 'none' }; id = d.id })
    setSel([id]); setTab('bailarines')
  }

  /* ---------- colocar elementos con una herramienta ---------- */
  function place(p) {
    const x = Math.round(p.x), y = Math.round(p.y)
    if (tool === 'dancer') {
      let id
      apply((n, f) => {
        let d = n.bailarines.find((b) => !f.posiciones[b.id])
        if (!d) { d = newDancer(n, { color: tcolor }); n.bailarines.push(d) }
        f.posiciones[d.id] = { x, y, mira: 'none' }; id = d.id
      })
      setSel([id]); return
    }
    let e
    if (PROPS[tool]) { const pr = PROPS[tool]; e = { id: uid(), type: 'prop', kind: tool, x, y, w: pr.w, h: pr.h, rot: 0, label: pr.label, color: pr.color } }
    else if (tool === 'arrow' || tool === 'line') e = { id: uid(), type: 'arrow', x: x - 90, y, x2: x + 90, y2: y, bend: 0, color: tool === 'line' ? '#64748b' : '#2e1065', head: tool === 'line' ? 'ninguna' : 'fin', dash: tool === 'line', w: 4 }
    else if (tool === 'circle') e = { id: uid(), type: 'circle', x, y, w: 260, h: 260, rot: 0, color: tcolor, fill: false }
    else if (tool === 'triangle') e = { id: uid(), type: 'triangle', x, y, w: 260, h: 220, rot: 0, color: tcolor, fill: false }
    else if (tool === 'text') e = { id: uid(), type: 'text', x, y, label: 'Texto', size: 34, color: '#2e1065' }
    if (!e) return
    apply((n, f) => { f.elementos.push(e) })
    setSel([e.id]); setTool('select'); setTab('seleccion')
  }

  /* ---------- teclado ---------- */
  useEffect(() => {
    const k = (e) => {
      if (dialog || printing) return
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)
      const mod = e.ctrlKey || e.metaKey, key = e.key.toLowerCase()
      if (mod && key === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); return }
      if (mod && key === 'y' && !typing) { e.preventDefault(); redo(); return }
      if (typing) return
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && sel.length) { e.preventDefault(); removeSel() }
      else if (mod && key === 'd') { e.preventDefault(); dupSel() }
      else if (e.key === 'Escape') { setSel([]); setTool('select') }
      else if (e.key === 'PageDown') selectFormation(Math.min(c.formaciones.length - 1, fi + 1))
      else if (e.key === 'PageUp') selectFormation(Math.max(0, fi - 1))
      else if (e.key.startsWith('Arrow') && sel.length) {
        e.preventDefault(); recordOnce('nudge')
        const s = e.shiftKey ? 20 : 4, dx = e.key === 'ArrowLeft' ? -s : e.key === 'ArrowRight' ? s : 0, dy = e.key === 'ArrowUp' ? -s : e.key === 'ArrowDown' ? s : 0
        apply((n, f) => sel.forEach((id) => { const t = f.posiciones[id] || f.elementos.find((x) => x.id === id); if (!t) return; t.x += dx; t.y += dy; if (t.type === 'arrow') { t.x2 += dx; t.y2 += dy } }), false)
      }
    }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  })

  /* ---------- impresión ---------- */
  useEffect(() => {
    if (!printing) return
    const done = () => setPrinting(false)
    window.addEventListener('afterprint', done)
    const t = setTimeout(() => window.print(), 300)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', done) }
  }, [printing])

  const ghost = ghostOn && !playing && fi > 0 ? c.formaciones[fi - 1].posiciones : null
  const selName = sel.length === 1 ? (c.bailarines.find((d) => d.id === sel[0])?.nombre || { prop: 'Elemento', arrow: 'Flecha', circle: 'Círculo', triangle: 'Triángulo', text: 'Texto' }[F.elementos.find((e) => e.id === sel[0])?.type] || '') : `${sel.length} elementos`
  const cur = playScene ? c.formaciones[playScene.index] : F

  return (
    <div className={'ed' + (focus ? ' focus' : '')} data-tab={tab}>
      <header className="ed-top">
        <button className="icon-btn" onClick={goBack} aria-label="Volver a mis coreografías" title="Mis coreografías"><LuArrowLeft /></button>
        <input className="ed-title" value={c.nombre} aria-label="Nombre de la coreografía"
          onChange={(e) => { recordOnce('nombre'); const v = e.target.value; apply((n) => { n.nombre = v }, false) }} />
        <span className={'saved' + (saved ? ' ok' : '')} title={saved ? 'Todo está guardado en este dispositivo' : 'Guardando…'}>{saved ? <><LuCheck /> <i>Guardado</i></> : <><LuLoader className="spin" /> <i>Guardando</i></>}</span>
        <div className="sp" />
        <button className="icon-btn" onClick={undo} disabled={!hist.current.length} aria-label="Deshacer" title="Deshacer (Ctrl+Z)"><LuUndo2 /></button>
        <button className="icon-btn" onClick={redo} disabled={!fut.current.length} aria-label="Rehacer" title="Rehacer (Ctrl+Y)"><LuRedo2 /></button>
        <button className="icon-btn hide-sm" onClick={() => setFocus(!focus)} aria-label="Modo escenario grande" title="Escenario grande">{focus ? <LuMinimize2 /> : <LuMaximize2 />}</button>
        <button className="icon-btn" onClick={onHelp} aria-label="Ayuda" title="Tutorial"><LuCircleHelp /></button>
        <div className="menu-wrap">
          <button className="icon-btn" onClick={() => setMenu(!menu)} aria-label="Más opciones" aria-expanded={menu}><LuEllipsisVertical /></button>
          {menu && <div className="menu" onClick={() => setMenu(false)}>
            <label className="menu-item"><LuMusic /> {c.musica ? 'Cambiar música' : 'Agregar música'}<input type="file" accept="audio/*" hidden onChange={(e) => loadMusic(e.target.files[0])} /></label>
            <button className="menu-item" onClick={() => setDialog({ type: 'history' })}><LuHistory /> Historial de copias</button>
            <button className="menu-item" onClick={() => setPrinting(true)}><LuPrinter /> Imprimir / guardar PDF</button>
            <button className="menu-item" onClick={() => download(slug(c.nombre) + '.coreoama.json', exportJSON([cRef.current]))}><LuDownload /> Exportar esta coreografía</button>
            <button className="menu-item" onClick={() => onDuplicateCoreo(cRef.current)}><LuCopy /> Duplicar coreografía</button>
          </div>}
        </div>
      </header>

      <div className="ed-body">
        <aside className="ed-left">
          <Roster c={c} F={F} sel={sel} setSel={(s) => { setSel(s); setTool('select') }} apply={apply} recordOnce={recordOnce}
            onAddGroup={() => setDialog({ type: 'group' })} onAddDancer={addDancer} askConfirm={(d) => setDialog({ type: 'confirm', ...d })}
            showNames={showNames} setShowNames={setShowNames} />
        </aside>

        <main className="ed-center">
          <div className="tools" role="toolbar" aria-label="Herramientas">
            {TOOLS.map(([k, l, Ic]) => (
              <button key={k} className={'tool' + (tool === k ? ' on' : '')} onClick={() => { setTool(k); if (k !== 'select') setSel([]); setPlaying(false) }} title={l}><Ic /><span>{l}</span></button>
            ))}
            <span className="tool-sep" />
            <div className="tool-colors">
              {PALETTE.slice(0, 6).map((col) => <button key={col} className={'sw' + (col === tcolor ? ' on' : '')} style={{ background: col }} aria-label={'Color ' + col}
                onClick={() => { setTcolor(col); if (sel.length) apply((n, f) => { n.bailarines.forEach((d) => { if (sel.includes(d.id)) d.color = col }); f.elementos.forEach((e) => { if (sel.includes(e.id) && e.type !== 'prop') e.color = col }) }) }} />)}
            </div>
            <span className="tool-sep" />
            <button className={'tool' + (snapOn ? ' on' : '')} onClick={() => setSnapOn(!snapOn)} title="Ajustar a la cuadrícula"><LuMagnet /><span>Imán</span></button>
            <button className={'tool' + (ghostOn ? ' on' : '')} onClick={() => setGhostOn(!ghostOn)} title="Ver la formación anterior"><LuGhost /><span>Anterior</span></button>
          </div>

          <EditorStage c={c} F={F} sel={sel} setSel={setSel} tool={tool} apply={apply} record={record} snapOn={snapOn}
            onPlace={place} ghost={ghost} showNames={showNames} scene={playScene} />

          {!playScene && <div className="selbar">
            {tool !== 'select'
              ? <><span className="hint">Toca el escenario para agregar: <b>{TOOLS.find((t) => t[0] === tool)[1]}</b>{tool === 'dancer' ? ' (primero entran los que no están en escena)' : ''}</span><button onClick={() => setTool('select')}>Listo</button></>
              : sel.length
                ? <><span className="hint"><b>{selName}</b> {sel.length > 1 ? 'seleccionados' : 'seleccionado'}</span><button onClick={removeSel}><LuTrash2 /> Quitar</button><button className="pri" onClick={() => setTab('seleccion')}><LuPencil /> Editar</button></>
                : <span className="hint">Arrastra a los bailarines · toca uno para editarlo · arrastra en vacío para seleccionar varios</span>}
          </div>}
          {(playing || playScene) && <div className="now-guide"><b>{cur.nombre}</b>{cur.conteo && <i> · {cur.conteo}</i>}<p>{cur.guia}</p></div>}

          <Timeline c={c} fi={fi} time={time} playing={playing} audioDur={audioDur}
            onSelect={selectFormation} onSeek={seek} onTogglePlay={togglePlay} onAdd={addFormation} />

          <nav className="ed-tabs" aria-label="Paneles">
            <button className={tab === 'bailarines' ? 'on' : ''} onClick={() => setTab('bailarines')}><LuUsers /> Bailarines</button>
            <button className={tab === 'formacion' ? 'on' : ''} onClick={() => setTab('formacion')}><LuLayers /> Formación</button>
            <button className={tab === 'seleccion' ? 'on' : ''} onClick={() => setTab('seleccion')}><LuSlidersHorizontal /> Selección{sel.length ? ` (${sel.length})` : ''}</button>
          </nav>
        </main>

        <aside className="ed-right">
          <FormationPanel c={c} fi={clamp(fi, 0, c.formaciones.length - 1)} F={F} apply={apply} recordOnce={recordOnce} onDup={dupFormation} onMove={moveFormation} onDelete={deleteFormation} />
          <Inspector c={c} F={F} sel={sel} setSel={setSel} apply={apply} recordOnce={recordOnce} onArrange={arrange} onMirror={mirror} onRemove={removeSel} onDuplicate={dupSel} />
        </aside>
      </div>

      {dialog?.type === 'confirm' && <Confirm {...dialog} onClose={() => setDialog(null)} />}
      {dialog?.type === 'group' && <Modal title="Agregar grupo de bailarines" onClose={() => setDialog(null)}><GroupForm onAdd={addGroup} onClose={() => setDialog(null)} /></Modal>}
      {dialog?.type === 'history' && <HistoryDialog c={c} onClose={() => setDialog(null)} onRestore={async (b) => {
        await addBackup(cRef.current, 'Antes de restaurar')
        record(); commit({ ...clone(b.data), id: cRef.current.id, deletedAt: null, updatedAt: Date.now() }); setFi(0); setSel([])
        toast('Versión restaurada. La anterior quedó guardada en el historial.')
      }} />}
      {printing && <PrintView c={c} />}
    </div>
  )
}

/* ---------------- Escenario interactivo ---------------- */
function EditorStage({ c, F, sel, setSel, tool, apply, record, snapOn, onPlace, ghost, showNames, scene }) {
  const ref = useRef(null)
  const drag = useRef(null)
  const [box, setBox] = useState(null)
  const pt = (ev) => { const m = ref.current.getScreenCTM().inverse(); const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m); return { x: p.x, y: p.y } }
  const target = (f, id) => f.posiciones[id] || f.elementos.find((e) => e.id === id)

  const down = (ev) => {
    if (scene || ev.button > 0) return
    const p = pt(ev), h = ev.target.closest('[data-h]'), g = ev.target.closest('[data-id]')
    if (h && sel.length === 1) drag.current = { mode: 'h', h: h.dataset.h, id: sel[0], start: p }
    else if (g) {
      const id = g.dataset.id
      if (ev.shiftKey || ev.ctrlKey || ev.metaKey) { setSel(sel.includes(id) ? sel.filter((i) => i !== id) : [...sel, id]); return }
      const ids = sel.includes(id) ? sel : [id]
      if (!sel.includes(id)) setSel(ids)
      drag.current = { mode: 'move', start: p, ids, orig: Object.fromEntries(ids.map((i) => [i, clone(target(F, i) || null)])) }
    } else if (tool !== 'select') { onPlace(p); return }
    else { setSel([]); drag.current = { mode: 'box', start: p } }
    try { ref.current.setPointerCapture(ev.pointerId) } catch { }
  }
  const move = (ev) => {
    const d = drag.current
    if (!d) return
    const p = pt(ev)
    let dx = p.x - d.start.x, dy = p.y - d.start.y
    if (!d.moved) { if (Math.hypot(dx, dy) < 3) return; d.moved = true; if (d.mode !== 'box') record() }
    if (d.mode === 'move') {
      const o0 = d.orig[d.ids[0]]
      if (snapOn && o0) { dx = Math.round((o0.x + dx) / 20) * 20 - o0.x; dy = Math.round((o0.y + dy) / 20) * 20 - o0.y }
      apply((n, f) => d.ids.forEach((id) => {
        const o = d.orig[id], t = target(f, id)
        if (!o || !t) return
        t.x = clamp(o.x + dx, -40, W + 40); t.y = clamp(o.y + dy, -40, H + 40)
        if (t.type === 'arrow') { t.x2 = o.x2 + dx; t.y2 = o.y2 + dy }
      }), false)
    } else if (d.mode === 'h') {
      apply((n, f) => {
        const e = f.elementos.find((x) => x.id === d.id)
        if (!e) return
        const q = snapOn && d.h !== 'bend' ? { x: Math.round(p.x / 20) * 20, y: Math.round(p.y / 20) * 20 } : p
        if (d.h === 'p1') { e.x = q.x; e.y = q.y }
        else if (d.h === 'p2') { e.x2 = q.x; e.y2 = q.y }
        else if (d.h === 'bend') { const k = arrowCtrl({ ...e, bend: 0 }); e.bend = Math.round((p.x - k.mx) * k.nx + (p.y - k.my) * k.ny) }
        else {
          const a = (-(e.rot || 0) * Math.PI) / 180, rx = p.x - e.x, ry = p.y - e.y
          e.w = Math.max(24, Math.round(2 * Math.abs(rx * Math.cos(a) - ry * Math.sin(a))))
          e.h = Math.max(24, Math.round(2 * Math.abs(rx * Math.sin(a) + ry * Math.cos(a))))
        }
      }, false)
    } else setBox({ x0: Math.min(d.start.x, p.x), y0: Math.min(d.start.y, p.y), x1: Math.max(d.start.x, p.x), y1: Math.max(d.start.y, p.y) })
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    if (d?.mode === 'box' && box) {
      const inside = (x, y) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1
      setSel([
        ...c.bailarines.filter((b) => F.posiciones[b.id] && inside(F.posiciones[b.id].x, F.posiciones[b.id].y)).map((b) => b.id),
        ...F.elementos.filter((e) => inside(e.type === 'arrow' ? (e.x + e.x2) / 2 : e.x, e.type === 'arrow' ? (e.y + e.y2) / 2 : e.y)).map((e) => e.id),
      ])
    }
    setBox(null)
  }

  let handles = null
  if (!scene && sel.length === 1) {
    const e = F.elementos.find((x) => x.id === sel[0])
    const Hd = ({ x, y, h }) => <g data-h={h}><circle cx={x} cy={y} r="26" fill="transparent" /><circle cx={x} cy={y} r="11" className="hdl" /></g>
    if (e?.type === 'arrow') { const k = arrowCtrl(e); handles = <><Hd x={e.x} y={e.y} h="p1" /><Hd x={e.x2} y={e.y2} h="p2" /><Hd x={k.hx} y={k.hy} h="bend" /></> }
    else if (e && e.type !== 'text') {
      const a = ((e.rot || 0) * Math.PI) / 180, lx = e.w / 2, ly = e.h / 2
      handles = <Hd x={e.x + lx * Math.cos(a) - ly * Math.sin(a)} y={e.y + lx * Math.sin(a) + ly * Math.cos(a)} h="size" />
    }
  }

  return (
    <div className={'stage-box' + (tool !== 'select' ? ' placing' : '') + (scene ? ' playing' : '')}>
      <svg ref={ref} className="stage" viewBox={`0 0 ${W} ${H}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} role="application" aria-label="Escenario">
        <GridDefs />
        <StageBase />
        <Scene coreo={c} posiciones={scene ? scene.posiciones : F.posiciones} elementos={scene ? scene.elementos : F.elementos} sel={scene ? [] : sel} showNames={showNames} ghost={ghost} />
        {handles}
        {box && <rect x={box.x0} y={box.y0} width={box.x1 - box.x0} height={box.y1 - box.y0} fill="#7c3aed18" stroke="#7c3aed" strokeDasharray="6 4" />}
      </svg>
    </div>
  )
}

/* ---------------- Historial de copias ---------------- */
function HistoryDialog({ c, onClose, onRestore }) {
  const [list, setList] = useState(null)
  useEffect(() => { listBackups(c.id).then(setList) }, [])
  return (
    <Modal title="Historial de copias" onClose={onClose} wide>
      <p className="muted">COREOAMA guarda una copia automática de esta coreografía cada pocos minutos mientras trabajas. Puedes volver a cualquiera; la versión actual también queda guardada.</p>
      {!list ? <p>Cargando…</p> : !list.length ? <p className="empty">Aún no hay copias. Se crean solas mientras editas.</p> :
        <ul className="hist">
          {list.map((b) => (
            <li key={b.key}>
              <Mini coreo={b.data} formacion={b.data.formaciones[0]} className="hist-mini" />
              <div><b>{new Date(b.at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</b><small>{b.motivo} · {b.data.formaciones.length} formaciones · {b.data.bailarines.length} bailarines</small></div>
              <button onClick={() => { onRestore(b); onClose() }}>Restaurar</button>
            </li>
          ))}
        </ul>}
    </Modal>
  )
}

/* ---------------- Vista para imprimir ---------------- */
function PrintView({ c }) {
  return (
    <div className="print-view">
      <h1>{c.nombre}</h1>
      {c.descripcion && <p className="pv-desc">{c.descripcion}</p>}
      {c.notas && <div className="pv-notes">{c.notas}</div>}
      <div className="pv-cast">{c.bailarines.map((d, i) => <span key={d.id}><i style={{ background: d.color }} />{i + 1}. {d.nombre}</span>)}</div>
      {c.formaciones.map((f, i) => (
        <section key={f.id} className="pv-row">
          <svg viewBox={`0 0 ${W} ${H}`}><GridDefs /><StageBase /><Scene coreo={c} posiciones={f.posiciones} elementos={f.elementos} /></svg>
          <div><h2>{i + 1}. {f.nombre}</h2>{f.conteo && <small>{f.conteo}</small>}<p>{f.guia}</p></div>
        </section>
      ))}
    </div>
  )
}
