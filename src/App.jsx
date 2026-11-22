import { useEffect, useState, useRef } from 'react'
import Home from './components/Home.jsx'
import Editor from './components/Editor.jsx'
import Tutorial from './components/Tutorial.jsx'
import { Modal, Toast } from './components/Modal.jsx'
import { loadAll, saveCoreo, requestPersistence, isPersisted, exportJSON, parseImport, download, addBackup } from './storage.js'
import { samples, newCoreo, clone, uid } from './model.js'

const FIRST_RUN = 'coreoama-tutorial-visto'

export default function App() {
  const [coreos, setCoreos] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [help, setHelp] = useState(false)
  const [toastText, setToastText] = useState('')
  const [installEvt, setInstallEvt] = useState(null)
  const [iosHelp, setIosHelp] = useState(false)
  const [persisted, setPersisted] = useState(false)
  const tt = useRef(0)

  const toast = (t) => { setToastText(t); clearTimeout(tt.current); tt.current = setTimeout(() => setToastText(''), 2800) }

  useEffect(() => {
    (async () => {
      let list = await loadAll()
      if (!list.length) { list = samples(); for (const c of list) await saveCoreo(c) }
      setCoreos(list)
      await requestPersistence()
      setPersisted(await isPersisted())
      try { if (!localStorage.getItem(FIRST_RUN)) { setHelp(true); localStorage.setItem(FIRST_RUN, '1') } } catch { }
    })()
    const bip = (e) => { e.preventDefault(); setInstallEvt(e) }
    window.addEventListener('beforeinstallprompt', bip)
    window.addEventListener('appinstalled', () => setInstallEvt(null))
    const pop = () => setOpenId(null)
    window.addEventListener('popstate', pop)
    return () => { window.removeEventListener('beforeinstallprompt', bip); window.removeEventListener('popstate', pop) }
  }, [])

  const upsert = async (c) => {
    await saveCoreo(c)
    setCoreos((l) => { const i = l.findIndex((x) => x.id === c.id); if (i < 0) return [...l, c]; const n = l.slice(); n[i] = c; return n })
  }
  const open = (id) => { setOpenId(id); try { history.pushState({ coreo: id }, '') } catch { } }
  const close = () => { setOpenId(null); try { if (history.state?.coreo) history.back() } catch { } }

  const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone)
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const install = standalone ? null : installEvt ? async () => { installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null) } : isIos ? () => setIosHelp(true) : null

  if (!coreos) return <div className="boot">Cargando COREOAMA…</div>

  const current = openId && coreos.find((c) => c.id === openId)
  return (
    <>
      {current ? (
        <Editor key={current.id} initial={current} onSave={upsert} onBack={close} onHelp={() => setHelp(true)} toast={toast}
          onDuplicateCoreo={async (c) => { const n = clone(c); n.id = uid(); n.nombre += ' (copia)'; n.createdAt = n.updatedAt = Date.now(); await upsert(n); toast('Copia creada en Tus coreos') }} />
      ) : (
        <Home coreos={coreos} persisted={persisted} install={install} toast={toast} onHelp={() => setHelp(true)}
          onOpen={open}
          onCreate={async (nombre, descripcion) => { const c = newCoreo(nombre); c.descripcion = descripcion; await upsert(c); open(c.id) }}
          onDuplicate={async (c) => { const n = clone(c); n.id = uid(); n.nombre += ' (copia)'; n.createdAt = n.updatedAt = Date.now(); await upsert(n); toast('Coreografía duplicada') }}
          onTrash={async (id) => { const c = coreos.find((x) => x.id === id); await addBackup(c, 'Antes de ir a la papelera'); await upsert({ ...c, deletedAt: Date.now() }) }}
          onRestore={async (id) => { const c = coreos.find((x) => x.id === id); await upsert({ ...c, deletedAt: null, updatedAt: Date.now() }); toast('Coreografía recuperada') }}
          onExportAll={(list) => download(list.length === 1 ? `${list[0].nombre}.coreoama.json` : `coreoama-respaldo-${new Date().toISOString().slice(0, 10)}.json`, exportJSON(list))}
          onImport={async (text) => {
            try {
              const list = parseImport(text)
              if (!list.length) throw new Error()
              for (const c of list) {
                const exists = coreos.some((x) => x.id === c.id)
                await upsert({ ...c, id: exists ? uid() : c.id, nombre: exists ? c.nombre + ' (importada)' : c.nombre, deletedAt: c.deletedAt || null, updatedAt: Date.now() })
              }
              toast(list.length === 1 ? 'Coreografía importada' : `${list.length} coreografías importadas`)
            } catch { toast('Ese archivo no es una coreografía de COREOAMA') }
          }} />
      )}
      {help && <Tutorial onClose={() => setHelp(false)} />}
      {iosHelp && <Modal title="Instalar en iPhone / iPad" onClose={() => setIosHelp(false)}>
        <ol className="steps"><li>Abre COREOAMA en <b>Safari</b>.</li><li>Toca el botón <b>Compartir</b> (cuadro con flecha).</li><li>Elige <b>“Agregar a inicio”</b>.</li><li>Ábrela desde el ícono morado: funciona como app y sin internet.</li></ol>
      </Modal>}
      <Toast text={toastText} />
    </>
  )
}
