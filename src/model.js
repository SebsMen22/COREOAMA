// Modelo de datos de COREOAMA
// Una coreografía tiene un elenco (bailarines con nombre editable) y una lista de
// formaciones. Cada formación guarda dónde está cada bailarín y los elementos
// del escenario (mesas, flechas, figuras, textos) más su texto de guía.

export const uid = () => Math.random().toString(36).slice(2, 10)

// Sistema de coordenadas del escenario (SVG)
export const W = 1000
export const H = 620
export const X0 = 30
export const Y0 = 44
export const X1 = 970
export const Y1 = 556
export const CX = W / 2
export const CY = (Y0 + Y1) / 2

export const PALETTE = ['#7c3aed', '#ec4899', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e', '#64748b', '#a855f7', '#0ea5e9']

export const PROPS = {
  mesa: { label: 'Mesa', color: '#ead7bd', w: 170, h: 100 },
  cubo: { label: 'Cubo', color: '#fde7a7', w: 100, h: 100 },
  silla: { label: 'Silla', color: '#dcc2a3', w: 60, h: 60 },
  otro: { label: 'Elemento', color: '#e2e8f0', w: 120, h: 80 },
}

export const FORMS = [
  ['fila', 'Fila'], ['filas', '2 filas'], ['circulo', 'Círculo'], ['arco', 'Medio arco'],
  ['triangulo', 'Triángulo'], ['v', 'V'], ['dispersos', 'Dispersos'],
]

export const FACING = [
  ['none', 'Sin indicar'], ['down', 'Al público (de frente)'], ['up', 'De espaldas'],
  ['left', 'Hacia la izquierda'], ['right', 'Hacia la derecha'],
]

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const clone = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)))

/** Puntos de una formación de n bailarines alrededor de (cx, cy). */
export function formationPoints(kind, n, cx = CX, cy = CY, s = 1) {
  const p = []
  if (kind === 'fila') {
    const sp = Math.min(85, 860 / Math.max(1, n - 1))
    for (let i = 0; i < n; i++) p.push([(i - (n - 1) / 2) * sp, 0])
  } else if (kind === 'filas') {
    const a = Math.ceil(n / 2)
    for (let i = 0; i < n; i++) {
      const r = i < a ? 0 : 1, k = r ? i - a : i, c = r ? n - a : a
      p.push([(k - (c - 1) / 2) * 95, r ? 45 : -45])
    }
  } else if (kind === 'circulo') {
    const r = Math.max(70, (n * 75) / (2 * Math.PI))
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
      p.push([r * Math.cos(a), r * Math.sin(a)])
    }
  } else if (kind === 'arco') {
    const r = Math.max(130, (n * 80) / Math.PI)
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (n < 2 ? Math.PI / 2 : (i * Math.PI) / (n - 1))
      p.push([r * Math.cos(a), r * 0.75 * Math.sin(a) + r * 0.35])
    }
  } else if (kind === 'triangulo') {
    const rows = []
    let left = n, k = 1
    while (left > 0) { rows.push(Math.min(k, left)); left -= k; k++ }
    rows.reverse()
    rows.forEach((c, ri) => { for (let j = 0; j < c; j++) p.push([(j - (c - 1) / 2) * 78, (ri - (rows.length - 1) / 2) * 66]) })
  } else if (kind === 'v') {
    const half = Math.ceil((n - 1) / 2)
    for (let i = 0; i < n; i++) {
      const st = Math.ceil(i / 2), sd = i % 2 ? -1 : 1
      p.push([sd * st * 62, half * 28 - st * 56])
    }
  } else {
    const cols = Math.min(n, Math.max(1, Math.ceil(Math.sqrt(n * 1.8)))), rn = Math.ceil(n / cols)
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols
      p.push([(c - (cols - 1) / 2) * 115 + (rn > 1 ? (r % 2 ? 28 : -28) : 0), (r - (rn - 1) / 2) * 95])
    }
  }
  return p.map(([x, y]) => [clamp(cx + x * s, X0 + 22, X1 - 22), clamp(cy + y * s, Y0 + 22, Y1 - 22)])
}

export function newFormation(n = 1, base) {
  return {
    id: uid(),
    nombre: 'Formación ' + n,
    conteo: '',
    guia: '',
    duracion: 8,
    transicion: 2,
    posiciones: base ? clone(base.posiciones) : {},
    elementos: base ? clone(base.elementos) : [],
  }
}

export function newCoreo(nombre = 'Nueva coreografía') {
  const now = Date.now()
  return {
    id: uid(), nombre, descripcion: '', notas: '',
    createdAt: now, updatedAt: now, deletedAt: null,
    bailarines: [], formaciones: [newFormation(1)], musica: null,
  }
}

export function newDancer(c, extra = {}) {
  const n = c.bailarines.length + 1
  return { id: uid(), nombre: 'Bailarín ' + n, color: PALETTE[0], forma: 'circle', grupo: '', ...extra }
}

/** Línea de tiempo: dónde empieza y termina cada formación, en segundos. */
export function timeline(c) {
  let t = 0
  return c.formaciones.map((f, i) => {
    const last = i === c.formaciones.length - 1
    const seg = { start: t, hold: t + f.duracion, end: t + f.duracion + (last ? 0 : f.transicion) }
    t = seg.end
    return seg
  })
}
export const totalTime = (c) => { const tl = timeline(c); return tl.length ? tl[tl.length - 1].end : 0 }

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const NUM = ['x', 'y', 'x2', 'y2', 'bend', 'w', 'h', 'rot', 'size']

function lerpEls(A, B, t) {
  const am = new Map(A.map((e) => [e.id, e])), bs = new Set(B.map((e) => e.id)), out = []
  B.forEach((b) => {
    const a = am.get(b.id)
    if (a && a.type === b.type) {
      const e = { ...b }
      NUM.forEach((k) => { if (typeof a[k] === 'number' && typeof b[k] === 'number') e[k] = a[k] + (b[k] - a[k]) * t })
      out.push(e)
    } else out.push({ ...b, _op: t })
  })
  A.forEach((a) => { if (!bs.has(a.id)) out.push({ ...a, _op: 1 - t }) })
  return out
}
function lerpPos(A, B, t) {
  const out = {}
  for (const id of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const a = A[id], b = B[id]
    if (a && b) out[id] = { ...b, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    else if (b) out[id] = { ...b, _op: t }
    else out[id] = { ...a, _op: 1 - t }
  }
  return out
}

/** Escena (posiciones + elementos) en el segundo t, con transiciones suaves. */
export function sceneAt(c, t) {
  const tl = timeline(c), F = c.formaciones
  let i = tl.findIndex((s) => t < s.end)
  if (i < 0) i = F.length - 1
  const s = tl[i]
  if (t <= s.hold || i === F.length - 1) return { index: i, posiciones: F[i].posiciones, elementos: F[i].elementos }
  const p = ease(clamp((t - s.hold) / (s.end - s.hold || 1), 0, 1))
  return { index: i, moving: true, posiciones: lerpPos(F[i].posiciones, F[i + 1].posiciones, p), elementos: lerpEls(F[i].elementos, F[i + 1].elementos, p) }
}

export const fmtTime = (s) => {
  s = Math.max(0, Math.round(s))
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
}

export function timeAgo(ts) {
  const d = (Date.now() - ts) / 1000
  if (d < 60) return 'hace un momento'
  if (d < 3600) return `hace ${Math.floor(d / 60)} min`
  if (d < 86400) return `hace ${Math.floor(d / 3600)} h`
  const n = Math.floor(d / 86400)
  return n === 1 ? 'ayer' : `hace ${n} días`
}

/* ---------- Coreografías de ejemplo (bocetos de la profe) ---------- */
export function samples() {
  const mk = (nombre, descripcion, notas, cast, forms) => {
    const now = Date.now()
    const bailarines = cast.map(([key, nombre, color, forma = 'circle', grupo = '']) => ({ id: key, nombre, color, forma, grupo }))
    return {
      id: uid(), nombre, descripcion, notas, createdAt: now, updatedAt: now, deletedAt: null, musica: null,
      bailarines,
      formaciones: forms.map(([n, guia, items, dur = 8]) => {
        const posiciones = {}, elementos = []
        items.flat().forEach((it) => (it.pos ? (posiciones[it.id] = it.pos) : elementos.push(it)))
        return { id: uid(), nombre: n, conteo: '', guia, duracion: dur, transicion: 2, posiciones, elementos }
      }),
    }
  }
  const D = (id, x, y, mira = 'none') => ({ id, pos: { x, y, mira } })
  const G = (ids, k, cx, cy, s = 1, mira) => formationPoints(k, ids.length, cx, cy, s).map(([x, y], i) => D(ids[i], x, y, mira))
  const PR = (id, kind, x, y, w, h, rot = 0, label) => ({ id: id || uid(), type: 'prop', kind, x, y, w, h, rot, label: label ?? PROPS[kind].label, color: PROPS[kind].color })
  const A = (x, y, x2, y2, bend = 0, color = '#2e1065', head = 'fin') => ({ id: uid(), type: 'arrow', x, y, x2, y2, bend, color, head, dash: false, w: 4 })
  const S = (type, x, y, w, h, color) => ({ id: uid(), type, x, y, w, h, rot: 0, color, fill: false })
  const ids = (p, n) => Array.from({ length: n }, (_, i) => p + (i + 1))
  const group = (keys, prefix, color, forma, grupo) => keys.map((k, i) => [k, `${prefix} ${i + 1}`, color, forma, grupo])

  const cb = ids('c', 6)
  const llegada = mk('Llegada', 'Tiana, Mamá y el cuerpo de baile con mesas y cubos.',
    `Vestuario: todos de amarillo (tonos).

Pasos:
1. Saltar en un pie y en el otro, alternando, con juego de brazos (como rock and roll).
2. Movimiento de piernas como champeta, uniendo rodillas.
3. Traslado del peso del cuerpo con punta de pie (alternado). Brazos en círculo hacia arriba y abajo, como caracol.

Juego con sillas y mesas, manteles, pañoletas (si se puede).`,
    [['tiana', 'Tiana', '#f59e0b'], ['mama', 'Mamá', '#14b8a6'], ...group(cb, 'Bailarín', '#ec4899', 'circle', 'Cuerpo de baile')],
    [
      ['Tiana y Mamá', 'Inicio: Tiana y Mamá en el centro del escenario.', [D('tiana', 440, 300), D('mama', 560, 300)], 6],
      ['Entran las mesas', 'Entran las mesas.\nTiana baila; el cuerpo de baile juega con los elementos (mesas, sillas, manteles, pañoletas).\nLimpian.', [PR('mesa', 'mesa', 220, 220, 170, 110, -8), PR('cubos', 'cubo', 790, 330, 170, 120, 22, 'Cubos'), D('tiana', 450, 330), D('mama', 540, 330), G(cb, 'dispersos', 500, 170, 0.9)]],
      ['Tiana sube a los cubos', 'Tiana sube a los cubos y baila.\nLos chicos bailan alrededor.', [PR('mesa', 'mesa', 170, 300, 150, 100, -12), PR('cubos', 'cubo', 650, 300, 180, 140, 25, 'Cubos'), D('tiana', 650, 300), G(cb, 'circulo', 650, 300, 2.1)]],
      ['Cubos atrás – pirámide', 'Los cubos pasan atrás.\nIntentar hacer una pirámide (Δ) para que Tiana salte.', [PR('cubos', 'cubo', 500, 95, 460, 70, 0, 'Cubos'), S('triangle', 500, 300, 260, 200, '#7c3aed'), D('tiana', 500, 265), G(cb, 'fila', 500, 460)]],
    ])

  const a = ids('a', 5), b = ids('b', 5), all = [...a, ...b]
  const evangeline = mk('Evangeline', 'Ray, Tiana y el Príncipe con dos grupos de baile.', 'Cuerpo de baile en dos grupos (rosado y azul).\nPersonajes: Tiana, Príncipe, Ray.',
    [['tiana', 'Tiana', '#f59e0b'], ['principe', 'Príncipe', '#7c3aed'], ['ray', 'Ray', '#f97316'], ...group(a, 'Rosa', '#ec4899', 'circle', 'Grupo rosado'), ...group(b, 'Azul', '#3b82f6', 'circle', 'Grupo azul')],
    [
      ['Entrada en 4 filas', 'Entran en 4 filas de derecha a izquierda, 2 veces.\nA la 3.ª vez se ubican en el centro.', [G(a.slice(0, 3), 'fila', 800, 115), G(b.slice(0, 3), 'fila', 200, 225), G(a.slice(3), 'fila', 820, 335), G(b.slice(3), 'fila', 180, 445), A(660, 115, 420, 115), A(340, 225, 580, 225), A(700, 335, 460, 335), A(300, 445, 540, 445)]],
      ['Secuencia de brazos', 'Todos realizan la secuencia de brazos.', [G(all, 'dispersos', 500, 300)]],
      ['Un grupo en el centro', 'Salen y se queda 1 grupo en el centro.\nEntra el otro grupo y realiza su secuencia.', [G(a, 'dispersos', 500, 300)]],
      ['Medio arco', 'Sale el otro grupo y realiza su secuencia.\nTerminan en medio arco.', [G(all, 'arco', 500, 255, 1.15)]],
      ['Ray toca a Tiana', 'Se pone Ray y toca a Tiana.\nEntra el Príncipe y se encuentra con Tiana en el centro.', [G(all, 'arco', 500, 255, 1.15), D('tiana', 440, 405), D('ray', 360, 355), D('principe', 880, 455), A(840, 455, 540, 415, 20, '#7c3aed')]],
      ['Swing', 'El cuerpo de baile realiza swing.\nTiana y el Príncipe bailan en el centro.', [G(a, 'fila', 500, 125), G(b, 'fila', 500, 475), D('tiana', 460, 300), D('principe', 540, 300)]],
      ['Tiana en la esquina', 'El cuerpo de baile se ubica atrás, al centro.\nTiana (princesa) se ubica en la esquina.', [G(all, 'dispersos', 500, 165, 0.85), D('tiana', 880, 485, 'down')]],
      ['Entra Ray cargado', 'Entra Ray cargado y se desplaza por el escenario.', [G(all, 'dispersos', 500, 165, 0.85), D('tiana', 880, 485, 'down'), D('ray', 330, 335), A(90, 85, 300, 315, -70, '#f97316')]],
      ['Final', 'Final: cuerpo de baile al centro.\nTiana en una esquina, Ray en la otra.', [G(all, 'v', 500, 235), D('tiana', 880, 485, 'down'), D('ray', 130, 475, 'down')]],
    ])

  const p1 = ids('p', 6), p2 = ids('q', 6)
  const pantano = mk('Pantano', 'Luciérnagas, cocodrilo y dos grupos que giran.',
    `Personajes: luciérnagas, Príncipe, Tiana, tortugas, mosquitos.
Cocodrilo: Louis · Luciérnaga: Ray.
Grupo 1 = pequeños (rosado) · Grupo 2 = grandes (azul).

Idea: todos juntos para ir donde Mamá Odie.`,
    [['tiana', 'Tiana', '#f59e0b'], ['principe', 'Príncipe', '#7c3aed'], ['louis', 'Louis', '#22c55e', 'square'], ['ray', 'Ray', '#f97316', 'triangle'], ...group(p1, 'Pequeño', '#ec4899', 'circle', 'Grupo 1'), ...group(p2, 'Grande', '#3b82f6', 'circle', 'Grupo 2')],
    [
      ['Cruzan de lado a lado', 'Se cruzan de un lado hacia el otro (2 veces).', [G(p1.slice(0, 3), 'fila', 190, 170), G(p2.slice(0, 3), 'fila', 810, 170), G(p1.slice(3), 'fila', 190, 390), G(p2.slice(3), 'fila', 810, 390), A(340, 250, 560, 250), A(660, 310, 440, 310), A(340, 460, 560, 460)]],
      ['Dos círculos', 'Forman 2 círculos rodeando a los personajes principales y al cocodrilo.', [S('circle', 290, 300, 320, 320, '#ec4899'), S('circle', 710, 300, 320, 320, '#3b82f6'), G(p1, 'circulo', 290, 300, 1.9), G(p2, 'circulo', 710, 300, 1.9), D('tiana', 255, 300), D('principe', 325, 300), D('louis', 675, 300), D('ray', 745, 300)]],
      ['Salen – forman filas', 'Salen del círculo y forman filas.\nCuerpo de baile hace pasos básicos (menearlo).\nGrupo 1 al frente con su propia secuencia; Grupo 2 atrás.', [G(p2, 'fila', 500, 125), G(p1, 'filas', 500, 390)]],
      ['Grupo 1: su secuencia', 'Grupo 1 realiza su secuencia.\nGrupo 2 hace cuerpo de baile.', [G(p2, 'fila', 500, 115), G(p1, 'dispersos', 500, 370)]],
      ['Círculos que giran', 'Grupo 2 forma un círculo grande y Grupo 1 queda en el centro.\nGiran en sentido contrario.\n• Grandes por fuera, de espaldas.\n• Pequeños por dentro, de frente.', [G(p2, 'circulo', 500, 300, 2.6, 'up'), G(p1, 'circulo', 500, 300, 1.15, 'down'), A(380, 80, 620, 80, -40, '#3b82f6'), A(620, 525, 380, 525, -40, '#3b82f6'), A(560, 190, 440, 190, 25, '#ec4899'), A(440, 410, 560, 410, 25, '#ec4899')]],
      ['Grupo 2 pasa a cuerpo de baile', 'Grupo 2 pasa a cuerpo de baile.\nGrupo 1 realiza su secuencia.', [G(p2, 'fila', 500, 115), G(p1, 'dispersos', 500, 360)]],
      ['Triángulo', 'Todos se unen y forman un triángulo.', [G([...p2, ...p1], 'triangulo', 500, 285)]],
      ['Filas – salto', 'Forman filas y realizan la secuencia de salto (mínimo).', [G(p2, 'fila', 500, 195), G(p1, 'fila', 500, 385)]],
      ['Salida', 'Salen del escenario, cada uno por el lado donde inicia la siguiente escena.', [G(p2, 'fila', 500, 195), G(p1, 'fila', 500, 385), A(250, 285, 60, 285), A(750, 285, 940, 285)]],
    ])
  return [llegada, evangeline, pantano]
}
