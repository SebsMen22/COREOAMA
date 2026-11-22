import { useState } from 'react'
import { LuCloud, LuCloudOff, LuRefreshCw, LuLogOut, LuCircleAlert, LuCheck } from 'react-icons/lu'
import { signIn, signOut, syncConfigured } from '../sync.js'
import { Modal } from './Modal.jsx'

const TEXT = {
  ok: 'Sincronizado',
  syncing: 'Sincronizando…',
  connecting: 'Conectando…',
  offline: 'Sin internet: se sincroniza al volver',
  error: 'No se pudo sincronizar',
  off: 'Sin sincronizar',
}

const ERRORS = {
  'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
  'auth/cancelled-popup-request': 'Se canceló el inicio de sesión.',
  'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase (Authentication → Configuración → Dominios autorizados).',
  'auth/operation-not-allowed': 'Falta activar Google en Firebase (Authentication → Método de acceso).',
  'auth/network-request-failed': 'No hay conexión a internet.',
  'permission-denied': 'Firestore rechazó el acceso: revisa las reglas de la base de datos.',
}
export const errorText = (e) => ERRORS[e] || (e ? 'Detalle: ' + e : '')

export function SyncIcon({ status }) {
  if (status === 'ok') return <LuCloud className="sync-ic ok" />
  if (status === 'syncing' || status === 'connecting') return <LuRefreshCw className="sync-ic spin" />
  if (status === 'error') return <LuCircleAlert className="sync-ic err" />
  return <LuCloudOff className="sync-ic off" />
}

/** Botón de cuenta para la pantalla de inicio */
export default function Account({ sync, toast }) {
  const [open, setOpen] = useState(false)
  if (!syncConfigured()) return null
  const login = async () => {
    try { await signIn(); toast('¡Listo! Tus coreos se sincronizan con esta cuenta') }
    catch (e) { toast(errorText(e?.code) || 'No se pudo iniciar sesión') }
  }
  if (!sync.user) return (
    <button className="acc-btn" onClick={login} disabled={sync.status === 'connecting'} title="Inicia sesión para tener tus coreos en el PC y el celular">
      {sync.status === 'connecting' ? <LuRefreshCw className="spin" /> : <LuCloud />}<span className="hide-xs">Sincronizar</span>
    </button>
  )
  return (
    <>
      <button className="acc-btn on" onClick={() => setOpen(true)} title={TEXT[sync.status] || ''}>
        {sync.user.photo ? <img src={sync.user.photo} alt="" referrerPolicy="no-referrer" /> : <span className="acc-ini">{sync.user.name[0]}</span>}
        <SyncIcon status={sync.status} />
      </button>
      {open && (
        <Modal title="Sincronización" onClose={() => setOpen(false)} actions={<>
          <button onClick={() => { signOut(); setOpen(false); toast('Sesión cerrada. Tus coreos siguen guardadas en este dispositivo.') }}><LuLogOut /> Cerrar sesión</button>
          <button className="pri" onClick={() => setOpen(false)}><LuCheck /> Listo</button>
        </>}>
          <div className="acc-card">
            {sync.user.photo ? <img src={sync.user.photo} alt="" referrerPolicy="no-referrer" /> : <span className="acc-ini big">{sync.user.name[0]}</span>}
            <div><b>{sync.user.name}</b><small>{sync.user.email}</small></div>
          </div>
          <p className={'acc-status ' + sync.status}><SyncIcon status={sync.status} /> {TEXT[sync.status]}{sync.last ? ` · ${new Date(sync.last).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
          {sync.status === 'error' && <p className="muted small">{errorText(sync.error)}</p>}
          <p className="muted small">Inicia sesión con esta misma cuenta en el computador y en el celular: lo que hagas en uno aparece en el otro. Todo se sigue guardando en cada dispositivo, así funciona sin internet. Si dos dispositivos cambian la misma coreo sin conexión, queda la más reciente y la otra se guarda en el Historial de copias. La música se queda en cada dispositivo.</p>
        </Modal>
      )}
    </>
  )
}
