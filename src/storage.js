// Guardado permanente de COREOAMA.
// - IndexedDB guarda cada coreografía apenas cambia (autoguardado).
// - Cada 3 minutos de trabajo se guarda una copia en el historial (hasta 80 por coreo).
// - Nada se borra: "eliminar" solo manda la coreo a la Papelera, de donde se recupera.
// - Además se pide al navegador "almacenamiento persistente" para que no limpie los datos.

const DB_NAME = 'coreoama'
const VERSION = 1
const BACKUP_EVERY = 3 * 60 * 1000
const MAX_BACKUPS = 80
const LS_KEY = 'coreoama-espejo'

let dbp = null
function openDb() {
  if (dbp) return dbp
  dbp = new Promise((res, rej) => {
    if (!('indexedDB' in window)) return rej(new Error('sin indexedDB'))
    const r = indexedDB.open(DB_NAME, VERSION)
    r.onupgradeneeded = () => {
      const d = r.result
      if (!d.objectStoreNames.contains('coreos')) d.createObjectStore('coreos', { keyPath: 'id' })
      if (!d.objectStoreNames.contains('backups')) {
        const b = d.createObjectStore('backups', { keyPath: 'key', autoIncrement: true })
        b.createIndex('coreoId', 'coreoId')
      }
      if (!d.objectStoreNames.contains('audio')) d.createObjectStore('audio')
    }
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
  return dbp
}
const wrap = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error) })
async function store(name, mode = 'readonly') { return (await openDb()).transaction(name, mode).objectStore(name) }

// Espejo en localStorage como segunda copia de seguridad (si cabe)
function mirror(list) { try { localStorage.setItem(LS_KEY, JSON.stringify(list)) } catch { /* sin espacio: IndexedDB sigue siendo la copia principal */ } }
function readMirror() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }

let cache = []
const lastBackup = {}

export async function requestPersistence() {
  try { if (navigator.storage?.persist) return await navigator.storage.persist() } catch { }
  return false
}
export async function isPersisted() {
  try { return !!(await navigator.storage?.persisted?.()) } catch { return false }
}

export async function loadAll() {
  try {
    cache = await wrap((await store('coreos')).getAll())
    if (!cache.length) {
      const m = readMirror()
      if (m.length) { cache = m; for (const c of m) await wrap((await store('coreos', 'readwrite')).put(c)) }
    }
  } catch { cache = readMirror() }
  return cache
}

export async function saveCoreo(c) {
  const i = cache.findIndex((x) => x.id === c.id)
  if (i >= 0) cache[i] = c; else cache.push(c)
  mirror(cache)
  try {
    await wrap((await store('coreos', 'readwrite')).put(c))
    const now = Date.now()
    if (!lastBackup[c.id] || now - lastBackup[c.id] > BACKUP_EVERY) {
      lastBackup[c.id] = now
      await addBackup(c, 'Autoguardado')
    }
  } catch { /* el espejo en localStorage ya la guardó */ }
}

export async function addBackup(c, motivo) {
  try {
    await wrap((await store('backups', 'readwrite')).add({ coreoId: c.id, at: Date.now(), motivo, nombre: c.nombre, data: c }))
    const s = await store('backups', 'readwrite')
    const keys = await wrap(s.index('coreoId').getAllKeys(c.id))
    if (keys.length > MAX_BACKUPS) for (const k of keys.slice(0, keys.length - MAX_BACKUPS)) s.delete(k)
  } catch { }
}

export async function listBackups(coreoId) {
  try {
    const all = await wrap((await store('backups')).index('coreoId').getAll(coreoId))
    return all.sort((a, b) => b.at - a.at)
  } catch { return [] }
}

export async function putAudio(key, blob) { await wrap((await store('audio', 'readwrite')).put(blob, key)) }
export async function getAudio(key) { try { return await wrap((await store('audio')).get(key)) } catch { return null } }

export function exportJSON(coreos) {
  return JSON.stringify({ app: 'COREOAMA', version: 1, exportado: new Date().toISOString(), coreos }, null, 1)
}
export function parseImport(text) {
  const d = JSON.parse(text)
  const list = d.coreos || (d.coreo ? [d.coreo] : Array.isArray(d) ? d : [])
  return list.filter((c) => c && Array.isArray(c.formaciones) && Array.isArray(c.bailarines))
}
export function download(name, text, type = 'application/json') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1000)
}
export const slug = (s) => (s || 'coreografia').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
