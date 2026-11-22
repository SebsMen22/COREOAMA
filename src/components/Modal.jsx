import { useEffect, useRef } from 'react'
import { LuX } from 'react-icons/lu'

export function Modal({ title, onClose, children, wide, actions }) {
  const ref = useRef(null)
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', k)
    ref.current?.querySelector('input,textarea,button.pri')?.focus()
    return () => document.removeEventListener('keydown', k)
  }, [])
  return (
    <div className="m-bg" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className={'m-card' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="m-head">
          <h2>{title}</h2>
          {onClose && <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><LuX /></button>}
        </div>
        <div className="m-body">{children}</div>
        {actions && <div className="m-actions">{actions}</div>}
      </div>
    </div>
  )
}

export function Confirm({ title, text, ok = 'Aceptar', danger, onOk, onClose }) {
  return (
    <Modal title={title} onClose={onClose} actions={<>
      <button onClick={onClose}>Cancelar</button>
      <button className={danger ? 'danger-btn' : 'pri'} onClick={() => { onOk(); onClose() }}>{ok}</button>
    </>}>
      <p>{text}</p>
    </Modal>
  )
}

export function Toast({ text }) {
  return text ? <div className="toast" role="status">{text}</div> : null
}
