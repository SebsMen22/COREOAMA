import { useRef, useState } from 'react'
import { LuPlus, LuSearch, LuTrash2, LuCopy, LuDownload, LuUpload, LuArchiveRestore, LuCircleHelp, LuMonitorSmartphone, LuShieldCheck, LuEllipsisVertical, LuUsers, LuLayers } from 'react-icons/lu'
import { Mini } from './StageArt.jsx'
import { Modal, Confirm } from './Modal.jsx'
import { timeAgo, fmtTime, totalTime } from '../model.js'

export function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#a855f7" /></linearGradient></defs>
      <rect width="40" height="40" rx="11" fill="url(#lg)" />
      <path d="M8 31h24" stroke="#fff" strokeOpacity=".6" strokeWidth="1.6" strokeLinecap="round" />
      {[[20, 10.5], [15.2, 16.8], [24.8, 16.8], [10.4, 23], [20, 23], [29.6, 23]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.7" fill={i ? '#fff' : '#fbcfe8'} />)}
    </svg>
  )
}

export default function Home({ coreos, onOpen, onCreate, onDuplicate, onTrash, onRestore, onImport, onExportAll, onHelp, install, persisted, toast }) {
  const [tab, setTab] = useState('activas')
  const [q, setQ] = useState('')
  const [menu, setMenu] = useState(null)
  const [dialog, setDialog] = useState(null)
  const fileRef = useRef(null)
  const active = coreos.filter((c) => !c.deletedAt).sort((a, b) => b.updatedAt - a.updatedAt)
  const trash = coreos.filter((c) => c.deletedAt).sort((a, b) => b.deletedAt - a.deletedAt)
  const list = (tab === 'activas' ? active : trash).filter((c) => (c.nombre + ' ' + c.descripcion).toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="home" onClick={() => setMenu(null)}>
      <header className="home-top">
        <div className="brand"><Logo /><b>COREOAMA</b></div>
        <div className="sp" />
        {install && <button onClick={install}><LuMonitorSmartphone /> <span className="hide-xs">Instalar app</span></button>}
        <button className="icon-btn" onClick={onHelp} aria-label="Tutorial" title="Tutorial"><LuCircleHelp /></button>
      </header>

      <section className="home-hero">
        <div>
          <h1>Tus coreos</h1>
          <p>Dibuja formaciones, escribe la guía de cada parte y ensaya con la música.</p>
        </div>
        <button className="pri big" onClick={() => setDialog('new')}><LuPlus /> Nueva coreografía</button>
      </section>

      <div className="home-bar">
        <div className="seg tabs">
          <button className={tab === 'activas' ? 'on' : ''} onClick={() => setTab('activas')}>Coreografías <i>{active.length}</i></button>
          <button className={tab === 'papelera' ? 'on' : ''} onClick={() => setTab('papelera')}><LuTrash2 /> Papelera <i>{trash.length}</i></button>
        </div>
        <label className="search"><LuSearch /><input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar coreografía" /></label>
      </div>

      {tab === 'papelera' && <p className="note"><LuShieldCheck /> Lo que está aquí no se ha borrado: tócalo para recuperarlo.</p>}

      <div className="cards">
        {!list.length && <div className="empty-card">{tab === 'activas' ? (q ? 'Nada coincide con tu búsqueda.' : 'Aún no tienes coreografías. ¡Crea la primera!') : 'La papelera está vacía.'}</div>}
        {list.map((c) => (
          <article key={c.id} className="card" onClick={() => (tab === 'activas' ? onOpen(c.id) : onRestore(c.id))} tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') tab === 'activas' ? onOpen(c.id) : onRestore(c.id) }}>
            <Mini coreo={c} formacion={c.formaciones[0]} className="card-mini" />
            <div className="card-body">
              <h3>{c.nombre || 'Sin nombre'}</h3>
              {c.descripcion && <p>{c.descripcion}</p>}
              <div className="card-meta">
                <span><LuLayers /> {c.formaciones.length}</span>
                <span><LuUsers /> {c.bailarines.length}</span>
                <span>{fmtTime(totalTime(c))}</span>
                <span className="muted">{tab === 'activas' ? timeAgo(c.updatedAt) : 'en papelera ' + timeAgo(c.deletedAt)}</span>
              </div>
            </div>
            {tab === 'activas' ? (
              <div className="card-menu" onClick={(e) => e.stopPropagation()}>
                <button className="icon-btn" aria-label="Opciones" onClick={() => setMenu(menu === c.id ? null : c.id)}><LuEllipsisVertical /></button>
                {menu === c.id && <div className="menu">
                  <button className="menu-item" onClick={() => { setMenu(null); onDuplicate(c) }}><LuCopy /> Duplicar</button>
                  <button className="menu-item" onClick={() => { setMenu(null); onExportAll([c]) }}><LuDownload /> Exportar</button>
                  <button className="menu-item danger" onClick={() => { setMenu(null); setDialog({ trash: c }) }}><LuTrash2 /> Mover a la papelera</button>
                </div>}
              </div>
            ) : <button className="restore" onClick={(e) => { e.stopPropagation(); onRestore(c.id) }}><LuArchiveRestore /> Recuperar</button>}
          </article>
        ))}
      </div>

      <footer className="home-foot">
        <div className="safe"><LuShieldCheck /> {persisted ? 'Almacenamiento permanente activado en este dispositivo.' : 'Todo se guarda automáticamente en este dispositivo.'} Haz un respaldo de vez en cuando.</div>
        <div className="row-wrap">
          <button onClick={() => onExportAll(active.concat(trash))}><LuDownload /> Respaldo de todo</button>
          <button onClick={() => fileRef.current.click()}><LuUpload /> Importar</button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={async (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onImport(await f.text()) }} />
        </div>
      </footer>

      {dialog === 'new' && <NewDialog onClose={() => setDialog(null)} onCreate={onCreate} />}
      {dialog?.trash && <Confirm title="¿Mover a la papelera?" text={`“${dialog.trash.nombre}” irá a la Papelera. No se borra: puedes recuperarla cuando quieras.`} ok="Mover a la papelera"
        onOk={() => { onTrash(dialog.trash.id); toast('Movida a la papelera') }} onClose={() => setDialog(null)} />}
    </div>
  )
}

function NewDialog({ onClose, onCreate }) {
  const [nombre, setNombre] = useState(''), [desc, setDesc] = useState('')
  return (
    <Modal title="Nueva coreografía" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onCreate(nombre.trim() || 'Nueva coreografía', desc.trim()); onClose() }}>
        <label className="fld"><span>Nombre</span><input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="ej. Pantano" /></label>
        <label className="fld"><span>Descripción (opcional)</span><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="ej. Escena 3 · grupo infantil" /></label>
        <div className="m-actions"><button type="button" onClick={onClose}>Cancelar</button><button className="pri" type="submit"><LuPlus /> Crear</button></div>
      </form>
    </Modal>
  )
}
