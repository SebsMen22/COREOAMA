// Sincronización entre dispositivos con Firebase (cuenta de Google + Firestore).
//
// Cómo funciona:
// - La app SIEMPRE guarda primero en el dispositivo (IndexedDB), así funciona sin internet.
// - Con sesión iniciada, cada cambio se sube a Firestore en  usuarios/{uid}/coreos/{id}.
// - Los cambios de otro dispositivo llegan en vivo. Gana la versión más reciente;
//   si había cambios locales sin subir, esa versión se guarda en el Historial (nada se pierde).
// - Nunca se borran documentos en la nube: la Papelera solo marca "deletedAt".
// - La música no se sube (se queda en cada dispositivo).

import { firebaseConfig } from './firebase-config.js'

const SDK = 'https://www.gstatic.com/firebasejs/12.11.0/'
const ON_KEY = 'coreoama-sync-activa'
const SYNCED_KEY = 'coreoama-sync-versiones'
const PUSH_DELAY = 1200

let fb = null
let handlers = null
let uid = null
let unsubSnap = null
let authWatching = false
let state = { status: 'off', user: null, error: '', last: 0 }
const listeners = new Set()
const timers = {}
let synced = {}
try { synced = JSON.parse(localStorage.getItem(SYNCED_KEY) || '{}') } catch { synced = {} }

const saveSynced = () => { try { localStorage.setItem(SYNCED_KEY, JSON.stringify(synced)) } catch { } }
function setState(p) { state = { ...state, ...p }; listeners.forEach((f) => f(state)) }
export function onSyncState(fn) { listeners.add(fn); fn(state); return () => listeners.delete(fn) }
export const syncConfigured = () => !!firebaseConfig?.apiKey

async function load() {
  if (fb) return fb
  // Permite pruebas sin internet: window.__COREOAMA_FAKE_FIREBASE
  if (window.__COREOAMA_FAKE_FIREBASE) { fb = window.__COREOAMA_FAKE_FIREBASE; return fb }
  const [appM, authM, fsM] = await Promise.all(
    ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map((f) => import(/* @vite-ignore */ SDK + f)),
  )
  const app = appM.initializeApp(firebaseConfig)
  fb = { auth: authM.getAuth(app), db: fsM.getFirestore(app), A: authM, F: fsM }
  return fb
}

function watchAuth() {
  if (authWatching) return
  authWatching = true
  fb.A.onAuthStateChanged(fb.auth, (u) => {
    if (u) begin(u)
    else { stop(); uid = null; setState({ status: 'off', user: null }) }
  })
}

/** Se llama al abrir la app. h = { getLocal(): coreos[], applyRemote(remote, localSinSubir) } */
export async function startSync(h) {
  handlers = h
  window.addEventListener('online', () => { if (uid) { setState({ status: 'ok' }); pushPending() } })
  window.addEventListener('offline', () => { if (uid) setState({ status: 'offline' }) })
  if (!syncConfigured()) return
  let on = false
  try { on = localStorage.getItem(ON_KEY) === '1' } catch { }
  if (!on) return
  setState({ status: 'connecting' })
  try { await load(); watchAuth() } catch { setState({ status: 'offline' }) }
}

export async function signIn() {
  if (!syncConfigured()) throw new Error('Falta configurar Firebase')
  setState({ status: 'connecting', error: '' })
  try {
    await load()
    watchAuth()
    try { localStorage.setItem(ON_KEY, '1') } catch { }
    const provider = new fb.A.GoogleAuthProvider()
    try { await fb.A.signInWithPopup(fb.auth, provider) }
    catch (e) {
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') await fb.A.signInWithRedirect(fb.auth, provider)
      else throw e
    }
  } catch (e) {
    setState({ status: uid ? state.status : 'off', error: e?.code || e?.message || 'error' })
    throw e
  }
}

export async function signOut() {
  try { localStorage.removeItem(ON_KEY) } catch { }
  if (fb) await fb.A.signOut(fb.auth)
  stop(); uid = null
  setState({ status: 'off', user: null })
}

function stop() { if (unsubSnap) { unsubSnap(); unsubSnap = null } }

function begin(u) {
  if (uid === u.uid && unsubSnap) return
  stop()
  uid = u.uid
  setState({ status: 'syncing', error: '', user: { name: u.displayName || u.email || 'Mi cuenta', email: u.email || '', photo: u.photoURL || '' } })
  const { F, db } = fb
  let first = true
  unsubSnap = F.onSnapshot(F.collection(db, 'usuarios', uid, 'coreos'), async (snap) => {
    const local = new Map(handlers.getLocal().map((c) => [c.id, c]))
    for (const ch of snap.docChanges()) {
      if (ch.type === 'removed' || ch.doc.metadata?.hasPendingWrites) continue
      const d = ch.doc.data()
      const l = local.get(ch.doc.id)
      if (l && l.updatedAt >= d.updatedAt) { if (l.updatedAt === d.updatedAt) synced[l.id] = l.updatedAt; continue }
      let remote
      try { remote = JSON.parse(d.json) } catch { continue }
      const unsent = l && l.updatedAt > (synced[l.id] || 0) ? l : null
      await handlers.applyRemote(remote, unsent)
      synced[remote.id] = remote.updatedAt
    }
    if (first) {
      first = false
      const remoteAt = new Map(snap.docs.map((d) => [d.id, d.data().updatedAt || 0]))
      for (const c of handlers.getLocal()) if (!remoteAt.has(c.id) || c.updatedAt > remoteAt.get(c.id)) pushCoreo(c, 0)
    }
    saveSynced()
    if (!Object.keys(timers).length) setState({ status: navigator.onLine ? 'ok' : 'offline', last: Date.now() })
  }, (err) => setState({ status: 'error', error: err?.code || err?.message || 'error' }))
}

/** Sube una coreografía (con una pequeña espera para agrupar cambios seguidos). */
export function pushCoreo(c, delay = PUSH_DELAY) {
  if (!uid || !fb) return
  clearTimeout(timers[c.id]?.t)
  timers[c.id] = { c, t: setTimeout(() => upload(c), delay) }
  setState({ status: navigator.onLine ? 'syncing' : 'offline' })
}

async function upload(c) {
  const { F, db } = fb
  try {
    await F.setDoc(F.doc(db, 'usuarios', uid, 'coreos', c.id), {
      json: JSON.stringify(c), updatedAt: c.updatedAt, nombre: c.nombre || '', deletedAt: c.deletedAt || null,
    })
    synced[c.id] = c.updatedAt
    saveSynced()
    if (timers[c.id]?.c === c) delete timers[c.id]
    if (!Object.keys(timers).length) setState({ status: 'ok', last: Date.now(), error: '' })
  } catch (e) {
    setState({ status: navigator.onLine ? 'error' : 'offline', error: e?.code || e?.message || 'error' })
  }
}
function pushPending() { Object.values(timers).forEach(({ c }) => pushCoreo(c, 0)) }
