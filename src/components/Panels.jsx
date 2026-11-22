import { useState } from 'react'
import { LuEye, LuEyeOff, LuTrash2, LuPlus, LuUsers, LuCopy, LuChevronLeft, LuChevronRight, LuFlipHorizontal, LuCircle, LuSquare, LuTriangle, LuUserMinus, LuArrowRightLeft } from 'react-icons/lu'
import { PALETTE, PROPS, FORMS, FACING, CX, CY } from '../model.js'
import { inkFor } from './StageArt.jsx'

export function Swatches({ value, onPick }) {
  return (
    <div className="swatches">
      {PALETTE.map((c) => (
        <button key={c} className={'sw' + (c === value ? ' on' : '')} style={{ background: c }} onClick={() => onPick(c)} aria-label={'Color ' + c} />
      ))}
      <label className="sw custom" title="Otro color">
        <input type="color" value={value && value.length === 7 ? value : '#7c3aed'} onChange={(e) => onPick(e.target.value)} aria-label="Otro color" />
      </label>
    </div>
  )
}

function Range({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <label className="fld">
      <span>{label} <b>{Math.round(value * 10) / 10}{unit}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </label>
  )
}

/* ---------------- Elenco (bailarines) ---------------- */
export function Roster({ c, F, sel, setSel, apply, recordOnce, onAddGroup, onAddDancer, askConfirm, showNames, setShowNames }) {
  const onStage = c.bailarines.filter((d) => F.posiciones[d.id]).length
  return (
    <section className="panel roster">
      <div className="p-head">
        <h3><LuUsers /> Bailarines</h3>
        <span className="muted">{onStage}/{c.bailarines.length} en escena</span>
      </div>
      <div className="row2">
        <button className="pri" onClick={onAddDancer}><LuPlus /> Bailarín</button>
        <button onClick={onAddGroup}><LuUsers /> Grupo</button>
      </div>
      <label className="check"><input type="checkbox" checked={showNames} onChange={(e) => setShowNames(e.target.checked)} /> Mostrar nombres en el escenario</label>
      {!c.bailarines.length && <p className="empty">Todavía no hay bailarines. Agrega uno o un grupo completo.</p>}
      <ol className="cast">
        {c.bailarines.map((d, i) => {
          const on = !!F.posiciones[d.id]
          return (
            <li key={d.id} className={(sel.includes(d.id) ? 'on ' : '') + (on ? '' : 'off')}>
              <button className={'badge ' + d.forma} style={{ background: d.color, color: inkFor(d.color) }} title={on ? 'Seleccionar' : 'Poner en el escenario'}
                onClick={() => { if (!on) apply((n, f) => { f.posiciones[d.id] = { x: CX, y: CY, mira: 'none' } }); setSel([d.id]) }}>{i + 1}</button>
              <div className="cast-name">
                <input value={d.nombre} aria-label={'Nombre del bailarín ' + (i + 1)}
                  onChange={(e) => { recordOnce('nombre' + d.id); const v = e.target.value; apply((n) => { n.bailarines.find((b) => b.id === d.id).nombre = v }, false) }} />
                {d.grupo && <small>{d.grupo}</small>}
              </div>
              <button className="icon-btn" title={on ? 'Quitar de esta formación' : 'Poner en esta formación'} aria-label={on ? 'Quitar de esta formación' : 'Poner en esta formación'}
                onClick={() => apply((n, f) => { if (f.posiciones[d.id]) delete f.posiciones[d.id]; else f.posiciones[d.id] = { x: CX, y: CY, mira: 'none' } })}>{on ? <LuEye /> : <LuEyeOff />}</button>
              <button className="icon-btn" title="Eliminar del elenco" aria-label="Eliminar del elenco"
                onClick={() => askConfirm({ title: '¿Eliminar a ' + d.nombre + '?', text: 'Se quitará del elenco y de todas las formaciones. Puedes deshacerlo con Deshacer, y queda en el historial de copias.', ok: 'Eliminar', danger: true, onOk: () => { apply((n) => { n.bailarines = n.bailarines.filter((b) => b.id !== d.id); n.formaciones.forEach((fm) => delete fm.posiciones[d.id]) }); setSel([]) } })}><LuTrash2 /></button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/* ---------------- Formación actual ---------------- */
export function FormationPanel({ c, fi, F, apply, recordOnce, onDup, onMove, onDelete }) {
  const set = (k, v, rec = true) => { if (rec) recordOnce('f' + k + F.id); apply((n, f) => { f[k] = v }, false) }
  const [notes, setNotes] = useState(false)
  return (
    <section className="panel fp">
      <div className="p-head">
        <h3>Formación {fi + 1} <span className="muted">de {c.formaciones.length}</span></h3>
        <div className="mini-btns">
          <button className="icon-btn" onClick={() => onMove(-1)} disabled={fi === 0} title="Mover antes" aria-label="Mover antes"><LuChevronLeft /></button>
          <button className="icon-btn" onClick={() => onMove(1)} disabled={fi === c.formaciones.length - 1} title="Mover después" aria-label="Mover después"><LuChevronRight /></button>
          <button className="icon-btn" onClick={onDup} title="Duplicar" aria-label="Duplicar formación"><LuCopy /></button>
          <button className="icon-btn" onClick={onDelete} title="Eliminar formación" aria-label="Eliminar formación"><LuTrash2 /></button>
        </div>
      </div>
      <label className="fld"><span>Nombre</span><input value={F.nombre} onChange={(e) => set('nombre', e.target.value)} /></label>
      <label className="fld"><span>Música / conteos</span><input value={F.conteo} placeholder="ej. 4 × 8 tiempos · coro" onChange={(e) => set('conteo', e.target.value)} /></label>
      <label className="fld"><span>Guía / indicaciones</span><textarea rows={5} value={F.guia} placeholder="Qué pasa aquí: quién entra, qué pasos hacen, hacia dónde se mueven…" onChange={(e) => set('guia', e.target.value)} /></label>
      <div className="row2">
        <label className="fld"><span>Duración (seg)</span><input type="number" min="1" max="300" value={F.duracion} onChange={(e) => set('duracion', Math.max(1, +e.target.value || 1))} /></label>
        <label className="fld"><span>Transición (seg)</span><input type="number" min="0" max="30" step="0.5" value={F.transicion} onChange={(e) => set('transicion', Math.max(0, +e.target.value || 0))} /></label>
      </div>
      <button className="link" onClick={() => setNotes(!notes)}>{notes ? 'Ocultar' : 'Ver'} notas de la coreografía</button>
      {notes && <>
        <label className="fld"><span>Descripción corta</span><input value={c.descripcion} onChange={(e) => { recordOnce('desc'); const v = e.target.value; apply((n) => { n.descripcion = v }, false) }} /></label>
        <label className="fld"><span>Notas generales (pasos, vestuario, personajes)</span><textarea rows={8} value={c.notas} onChange={(e) => { recordOnce('notas'); const v = e.target.value; apply((n) => { n.notas = v }, false) }} /></label>
      </>}
    </section>
  )
}

/* ---------------- Selección ---------------- */
export function Inspector({ c, F, sel, setSel, apply, recordOnce, onArrange, onMirror, onRemove, onDuplicate }) {
  if (!sel.length) return (
    <section className="panel insp">
      <div className="p-head"><h3>Selección</h3></div>
      <p className="empty">Toca un bailarín o un elemento del escenario para editarlo. Arrastra sobre un espacio vacío para seleccionar varios.</p>
    </section>
  )
  const dancers = sel.map((id) => c.bailarines.find((d) => d.id === id)).filter(Boolean)
  const els = sel.map((id) => F.elementos.find((e) => e.id === id)).filter(Boolean)
  const key = sel.join()
  const setD = (k, v, rec) => { rec ? recordOnce('d' + k + key) : null; apply((n) => n.bailarines.forEach((d) => { if (sel.includes(d.id)) d[k] = v }), !rec) }
  const setP = (k, v) => apply((n, f) => sel.forEach((id) => { if (f.posiciones[id]) f.posiciones[id][k] = v }))
  const setE = (k, v, rec) => {
    rec ? recordOnce('e' + k + key) : null
    apply((n, f) => f.elementos.forEach((e) => {
      if (!sel.includes(e.id)) return
      e[k] = v
      if (k === 'kind') { if (Object.values(PROPS).some((p) => p.label === e.label)) e.label = PROPS[v].label; e.color = PROPS[v].color }
    }), !rec)
  }
  const actions = (
    <div className="row-wrap">
      <button onClick={onMirror}><LuFlipHorizontal /> Espejo</button>
      {els.length > 0 && <button onClick={onDuplicate}><LuCopy /> Duplicar</button>}
      <button className="danger-btn" onClick={onRemove}>{dancers.length && !els.length ? <><LuUserMinus /> Quitar de la formación</> : <><LuTrash2 /> Eliminar</>}</button>
    </div>
  )

  if (sel.length > 1) return (
    <section className="panel insp">
      <div className="p-head"><h3>{sel.length} seleccionados</h3><button className="link" onClick={() => setSel([])}>Deseleccionar</button></div>
      {dancers.length > 1 && <>
        <span className="lbl">Organizar en formación</span>
        <div className="chips">{FORMS.map(([k, l]) => <button key={k} onClick={() => onArrange(k)}>{l}</button>)}</div>
      </>}
      {dancers.length > 0 && <>
        <span className="lbl">Color de los bailarines</span>
        <Swatches value="" onPick={(v) => setD('color', v)} />
        <span className="lbl">Hacia dónde miran</span>
        <select value="" onChange={(e) => setP('mira', e.target.value)}><option value="" disabled>Elegir…</option>{FACING.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </>}
      {actions}
    </section>
  )

  if (dancers.length) {
    const d = dancers[0], p = F.posiciones[d.id] || {}
    const same = c.bailarines.filter((b) => b.color === d.color && F.posiciones[b.id]).map((b) => b.id)
    return (
      <section className="panel insp">
        <div className="p-head"><h3>Bailarín {c.bailarines.indexOf(d) + 1}</h3></div>
        <label className="fld"><span>Nombre</span><input value={d.nombre} onChange={(e) => setD('nombre', e.target.value, true)} /></label>
        <label className="fld"><span>Grupo / personaje</span><input value={d.grupo} placeholder="ej. Grupo 1, Luciérnaga…" onChange={(e) => setD('grupo', e.target.value, true)} /></label>
        <span className="lbl">Color</span>
        <Swatches value={d.color} onPick={(v) => setD('color', v)} />
        <span className="lbl">Forma</span>
        <div className="seg">
          {[['circle', <LuCircle key="c" />, 'Círculo'], ['square', <LuSquare key="s" />, 'Cuadrado'], ['triangle', <LuTriangle key="t" />, 'Triángulo']].map(([k, ic, l]) =>
            <button key={k} className={d.forma === k ? 'on' : ''} onClick={() => setD('forma', k)} aria-label={l} title={l}>{ic}</button>)}
        </div>
        <label className="fld"><span>Hacia dónde mira</span><select value={p.mira || 'none'} onChange={(e) => setP('mira', e.target.value)}>{FACING.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        {same.length > 1 && <button className="wide" onClick={() => setSel(same)}><LuUsers /> Seleccionar su grupo ({same.length})</button>}
        {actions}
      </section>
    )
  }

  const e = els[0]
  if (!e) return null
  const title = { prop: 'Elemento', arrow: e.head === 'ninguna' ? 'Línea / fila' : 'Flecha de desplazamiento', circle: 'Círculo', triangle: 'Triángulo', text: 'Texto' }[e.type]
  return (
    <section className="panel insp">
      <div className="p-head"><h3>{title}</h3></div>
      {e.type === 'prop' && <>
        <label className="fld"><span>Tipo</span><select value={e.kind} onChange={(ev) => setE('kind', ev.target.value)}>{Object.entries(PROPS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
        <label className="fld"><span>Etiqueta</span><input value={e.label} onChange={(ev) => setE('label', ev.target.value, true)} /></label>
        <Range label="Ancho" value={e.w} min={24} max={700} onChange={(v) => setE('w', v, true)} />
        <Range label="Alto" value={e.h} min={24} max={500} onChange={(v) => setE('h', v, true)} />
        <Range label="Giro" value={e.rot || 0} min={-180} max={180} step={5} unit="°" onChange={(v) => setE('rot', v, true)} />
      </>}
      {e.type === 'arrow' && <>
        <p className="muted small">Arrastra los puntos morados para mover los extremos y la curva.</p>
        <label className="fld"><span>Puntas</span><select value={e.head} onChange={(ev) => setE('head', ev.target.value)}><option value="fin">Al final</option><option value="ambos">En ambos lados</option><option value="ninguna">Sin punta (fila)</option></select></label>
        <Range label="Curva" value={e.bend} min={-300} max={300} step={5} onChange={(v) => setE('bend', v, true)} />
        <Range label="Grosor" value={e.w} min={2} max={10} onChange={(v) => setE('w', v, true)} />
        <label className="check"><input type="checkbox" checked={!!e.dash} onChange={(ev) => setE('dash', ev.target.checked)} /> Punteada</label>
        <button className="wide" onClick={() => apply((n, f) => { const a = f.elementos.find((x) => x.id === e.id);[a.x, a.y, a.x2, a.y2] = [a.x2, a.y2, a.x, a.y]; a.bend = -a.bend })}><LuArrowRightLeft /> Invertir dirección</button>
      </>}
      {(e.type === 'circle' || e.type === 'triangle') && <>
        <Range label="Ancho" value={e.w} min={24} max={900} onChange={(v) => setE('w', v, true)} />
        <Range label="Alto" value={e.h} min={24} max={520} onChange={(v) => setE('h', v, true)} />
        <Range label="Giro" value={e.rot || 0} min={-180} max={180} step={5} unit="°" onChange={(v) => setE('rot', v, true)} />
        <label className="check"><input type="checkbox" checked={!!e.fill} onChange={(ev) => setE('fill', ev.target.checked)} /> Relleno suave</label>
      </>}
      {e.type === 'text' && <>
        <label className="fld"><span>Texto</span><input value={e.label} onChange={(ev) => setE('label', ev.target.value, true)} /></label>
        <Range label="Tamaño" value={e.size} min={16} max={90} onChange={(v) => setE('size', v, true)} />
      </>}
      <span className="lbl">Color</span>
      <Swatches value={e.color} onPick={(v) => setE('color', v)} />
      {actions}
    </section>
  )
}

/* ---------------- Diálogo: agregar grupo ---------------- */
export function GroupForm({ onAdd, onClose }) {
  const [n, setN] = useState(6), [color, setColor] = useState(PALETTE[1]), [form, setForm] = useState('dispersos')
  const [prefix, setPrefix] = useState('Bailarín'), [grupo, setGrupo] = useState('Grupo 1'), [forma, setForma] = useState('circle')
  return (
    <>
      <div className="row2">
        <label className="fld"><span>Cantidad</span><input type="number" min="1" max="60" value={n} onChange={(e) => setN(+e.target.value)} /></label>
        <label className="fld"><span>Formación inicial</span><select value={form} onChange={(e) => setForm(e.target.value)}>{FORMS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      </div>
      <div className="row2">
        <label className="fld"><span>Nombre base</span><input value={prefix} onChange={(e) => setPrefix(e.target.value)} /></label>
        <label className="fld"><span>Grupo</span><input value={grupo} onChange={(e) => setGrupo(e.target.value)} /></label>
      </div>
      <span className="lbl">Color del grupo</span>
      <Swatches value={color} onPick={setColor} />
      <span className="lbl">Forma</span>
      <div className="seg">
        {[['circle', <LuCircle key="c" />], ['square', <LuSquare key="s" />], ['triangle', <LuTriangle key="t" />]].map(([k, ic]) =>
          <button key={k} className={forma === k ? 'on' : ''} onClick={() => setForma(k)} aria-label={k}>{ic}</button>)}
      </div>
      <p className="muted small">Luego puedes cambiar el nombre de cada bailarín en la lista.</p>
      <div className="m-actions">
        <button onClick={onClose}>Cancelar</button>
        <button className="pri" onClick={() => { onAdd({ n: Math.max(1, Math.min(60, n || 1)), color, form, prefix: prefix.trim() || 'Bailarín', grupo, forma }); onClose() }}><LuPlus /> Agregar {n}</button>
      </div>
    </>
  )
}
