import { W, H, X0, Y0, X1, Y1, CX, CY } from '../model.js'

// Dibujo del escenario y sus piezas (se usa en el editor, miniaturas, reproducción e impresión)

const f1 = (v) => Math.round(v * 10) / 10
export const inkFor = (c) => {
  const n = parseInt((c || '#000000').slice(1), 16)
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 170 ? '#1e1530' : '#fff'
}

export function arrowCtrl(e) {
  const mx = (e.x + e.x2) / 2, my = (e.y + e.y2) / 2, dx = e.x2 - e.x, dy = e.y2 - e.y
  const l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l
  return { mx, my, nx, ny, cx: mx + nx * e.bend * 2, cy: my + ny * e.bend * 2, hx: mx + nx * e.bend, hy: my + ny * e.bend }
}

function Head({ x, y, tx, ty, s, c }) {
  const l = Math.hypot(tx, ty) || 1, ux = tx / l, uy = ty / l, px = -uy, py = ux
  return <polygon points={`${x},${y} ${x - ux * s + px * s * 0.55},${y - uy * s + py * s * 0.55} ${x - ux * s - px * s * 0.55},${y - uy * s - py * s * 0.55}`} fill={c} />
}

export function StageBase({ mini }) {
  return (
    <g>
      <rect width={W} height={H} fill="#fbf9ff" />
      <rect x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0} rx="22" fill="url(#coreo-grid)" />
      <rect x={X0} y={Y0} width="80" height={Y1 - Y0} fill="#7c3aed" opacity=".05" />
      <rect x={X1 - 80} y={Y0} width="80" height={Y1 - Y0} fill="#7c3aed" opacity=".05" />
      <rect x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0} rx="22" fill="none" stroke="#7c3aed" strokeWidth={mini ? 6 : 3} />
      <path d={`M${CX - 11} ${CY - 11}l22 22M${CX + 11} ${CY - 11}l-22 22`} stroke="#c4b5fd" strokeWidth="3" />
      {!mini && (
        <>
          <text x={CX} y="29" className="stage-lab">FONDO</text>
          <text x={CX} y="588" className="stage-lab strong">PÚBLICO</text>
        </>
      )}
    </g>
  )
}

export function GridDefs() {
  return (
    <defs>
      <pattern id="coreo-grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="#fdfcff" />
        <path d="M40 0H0V40" fill="none" stroke="#e9e3f7" strokeWidth="1.5" />
      </pattern>
    </defs>
  )
}

export function DancerMark({ d, p, num, selected, showNames, ghost }) {
  const r = 21, c = d.color, op = p._op != null ? p._op : 1
  const fd = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[p.mira]
  let face = null
  if (fd && !ghost) {
    const [dx, dy] = fd, px = -dy, py = dx, t = r + 13, b = r - 2
    face = <polygon points={`${dx * t},${dy * t} ${dx * b + px * 9},${dy * b + py * 9} ${dx * b - px * 9},${dy * b - py * 9}`} fill={c} stroke="#fff" strokeWidth="2" />
  }
  const common = { fill: ghost ? 'none' : c, stroke: ghost ? c : '#fff', strokeWidth: ghost ? 2.5 : 3, strokeDasharray: ghost ? '5 4' : undefined }
  const shape = d.forma === 'square'
    ? <rect x={-r + 1} y={-r + 1} width={2 * r - 2} height={2 * r - 2} rx="7" {...common} />
    : d.forma === 'triangle'
      ? <polygon points={`0,${-r - 4} ${r + 3},${r - 2} ${-r - 3},${r - 2}`} strokeLinejoin="round" {...common} />
      : <circle r={r} {...common} />
  return (
    <g className={ghost ? 'ghost' : 'el'} data-id={ghost ? undefined : d.id} transform={`translate(${f1(p.x)} ${f1(p.y)})`} opacity={ghost ? 0.55 : op < 1 ? f1(op) : undefined}>
      {selected && <circle r={r + 9} className="halo" />}
      {face}
      {shape}
      {!ghost && <text className="d-num" dy=".36em" y={d.forma === 'triangle' ? 4 : 0} fill={inkFor(c)}>{num}</text>}
      {!ghost && showNames && d.nombre && <text className="d-name" y={r + 20}>{d.nombre}</text>}
    </g>
  )
}

export function ElementMark({ e, selected }) {
  const op = e._op != null && e._op < 1 ? f1(e._op) : undefined
  if (e.type === 'prop') {
    const { w, h } = e
    const lines = []
    if (e.kind === 'cubo') {
      const nx = Math.max(1, Math.round(w / Math.max(45, h * 0.8))), ny = Math.max(1, Math.round(h / Math.max(45, w / nx)))
      for (let i = 1; i < nx; i++) lines.push(<line key={'x' + i} x1={-w / 2 + (w * i) / nx} y1={-h / 2} x2={-w / 2 + (w * i) / nx} y2={h / 2} stroke="#5b4636" strokeWidth="1.5" />)
      for (let i = 1; i < ny; i++) lines.push(<line key={'y' + i} x1={-w / 2} y1={-h / 2 + (h * i) / ny} x2={w / 2} y2={-h / 2 + (h * i) / ny} stroke="#5b4636" strokeWidth="1.5" />)
    }
    return (
      <g className="el" data-id={e.id} transform={`translate(${f1(e.x)} ${f1(e.y)}) rotate(${e.rot || 0})`} opacity={op}>
        {selected && <rect x={-w / 2 - 8} y={-h / 2 - 8} width={w + 16} height={h + 16} rx="8" className="halo" />}
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={e.kind === 'mesa' ? 14 : 5} fill={e.color} stroke="#5b4636" strokeWidth="2.5" />
        {e.kind === 'silla' && <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.28} fill="#5b463655" />}
        {lines}
        <text className="p-lab" dy=".35em">{e.label}</text>
      </g>
    )
  }
  if (e.type === 'circle' || e.type === 'triangle') {
    const { w, h } = e
    const st = { stroke: e.color, strokeWidth: 3.5, strokeDasharray: '12 8', fill: e.fill ? e.color : 'none', fillOpacity: 0.14 }
    const pts = `0,${-h / 2} ${w / 2},${h / 2} ${-w / 2},${h / 2}`
    return (
      <g className="el" data-id={e.id} transform={`translate(${f1(e.x)} ${f1(e.y)}) rotate(${e.rot || 0})`} opacity={op}>
        {selected && <rect x={-w / 2 - 8} y={-h / 2 - 8} width={w + 16} height={h + 16} rx="8" className="halo" />}
        {e.type === 'circle'
          ? <><ellipse rx={w / 2} ry={h / 2} {...st} /><ellipse rx={w / 2} ry={h / 2} fill="none" stroke="transparent" strokeWidth="22" /></>
          : <><polygon points={pts} strokeLinejoin="round" {...st} /><polygon points={pts} fill="none" stroke="transparent" strokeWidth="22" /></>}
      </g>
    )
  }
  if (e.type === 'arrow') {
    const k = arrowCtrl(e), d = `M${f1(e.x)} ${f1(e.y)} Q${f1(k.cx)} ${f1(k.cy)} ${f1(e.x2)} ${f1(e.y2)}`, s = 14 + e.w * 2
    return (
      <g className="el" data-id={e.id} opacity={op}>
        <path d={d} stroke="transparent" strokeWidth="26" fill="none" />
        {selected && <path d={d} stroke="#a78bfa" strokeOpacity=".45" strokeWidth={e.w + 12} fill="none" strokeLinecap="round" />}
        <path d={d} stroke={e.color} strokeWidth={e.w} fill="none" strokeLinecap="round" strokeDasharray={e.dash ? '14 10' : undefined} />
        {(e.head === 'fin' || e.head === 'ambos') && <Head x={e.x2} y={e.y2} tx={e.x2 - k.cx} ty={e.y2 - k.cy} s={s} c={e.color} />}
        {e.head === 'ambos' && <Head x={e.x} y={e.y} tx={e.x - k.cx} ty={e.y - k.cy} s={s} c={e.color} />}
      </g>
    )
  }
  if (e.type === 'text') {
    const tw = Math.max(30, (e.label || '').length * e.size * 0.5)
    return (
      <g className="el" data-id={e.id} transform={`translate(${f1(e.x)} ${f1(e.y)})`} opacity={op}>
        {selected && <rect x={-tw / 2 - 8} y={-e.size * 0.65} width={tw + 16} height={e.size * 1.3} rx="8" className="halo" />}
        <rect x={-tw / 2} y={-e.size * 0.6} width={tw} height={e.size * 1.2} fill="transparent" />
        <text className="f-txt" dy=".35em" fill={e.color} style={{ fontSize: e.size }}>{e.label}</text>
      </g>
    )
  }
  return null
}

const ORDER = { circle: 0, triangle: 0, arrow: 1, prop: 2, text: 4 }

/** Escena completa: elementos + bailarines (y opcionalmente la formación anterior como fantasma). */
export function Scene({ coreo, posiciones, elementos, sel = [], showNames = true, ghost }) {
  const nums = new Map(coreo.bailarines.map((d, i) => [d.id, i + 1]))
  const els = [...elementos].sort((a, b) => (ORDER[a.type] ?? 3) - (ORDER[b.type] ?? 3))
  return (
    <>
      {els.filter((e) => e.type !== 'text').map((e) => <ElementMark key={e.id} e={e} selected={sel.includes(e.id)} />)}
      {ghost && coreo.bailarines.map((d) => {
        const g = ghost[d.id], p = posiciones[d.id]
        if (!g) return null
        return (
          <g key={'g' + d.id}>
            {p && Math.hypot(p.x - g.x, p.y - g.y) > 6 && <line x1={g.x} y1={g.y} x2={p.x} y2={p.y} stroke={d.color} strokeWidth="2" strokeDasharray="4 5" opacity=".6" />}
            <DancerMark d={d} p={g} ghost />
          </g>
        )
      })}
      {coreo.bailarines.map((d) => posiciones[d.id] && (
        <DancerMark key={d.id} d={d} p={posiciones[d.id]} num={nums.get(d.id)} selected={sel.includes(d.id)} showNames={showNames} />
      ))}
      {els.filter((e) => e.type === 'text').map((e) => <ElementMark key={e.id} e={e} selected={sel.includes(e.id)} />)}
    </>
  )
}

/** Miniatura no interactiva de una formación. */
export function Mini({ coreo, formacion, className }) {
  if (!formacion) return null
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true">
      <GridDefs />
      <StageBase mini />
      <Scene coreo={coreo} posiciones={formacion.posiciones} elementos={formacion.elementos} showNames={false} />
    </svg>
  )
}
