import { useState } from 'react'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'
import { Modal } from './Modal.jsx'

// Tutorial dentro de la app (el mismo contenido está más completo en TUTORIAL.md)
export const STEPS = [
  {
    t: '¡Bienvenida a COREOAMA!',
    p: 'Aquí dibujas tus coreografías como en el cuaderno: un escenario visto desde arriba, dividido en formaciones, con indicaciones escritas en cada una. Ya vienen 3 ejemplos (Llegada, Evangeline y Pantano) para que explores.',
    art: 'hello',
  },
  {
    t: '1. Crea o abre una coreografía',
    p: 'En “Tus coreos” toca “Nueva coreografía” o abre una existente. Todo se guarda solo, cada vez que cambias algo. Verás “Guardado ✓” arriba.',
    art: 'list',
  },
  {
    t: '2. Arma tu elenco',
    p: 'En el panel “Bailarines” agrega bailarines uno por uno o un grupo completo. Toca el nombre para cambiarlo (por ejemplo “Tiana” o “Sofía”). El ojo pone o quita a alguien de la formación actual.',
    art: 'cast',
  },
  {
    t: '3. Ubica a los bailarines',
    p: 'Arrástralos en el escenario. “PÚBLICO” está abajo y “FONDO” arriba. Para mover varios, arrastra sobre un espacio vacío para seleccionarlos y luego elige una formación: fila, círculo, medio arco, triángulo, V…',
    art: 'stage',
  },
  {
    t: '4. Agrega elementos',
    p: 'Con la barra de herramientas pon mesas, cubos, sillas, flechas de desplazamiento (curvas), filas, círculos, triángulos y textos. Toca la herramienta y luego el escenario.',
    art: 'tools',
  },
  {
    t: '5. Formaciones y guía',
    p: 'Abajo está la línea de tiempo. “Añadir formación” copia las posiciones actuales para que solo muevas lo que cambia. En el panel “Formación” escribe el nombre, los conteos y las indicaciones de cada parte.',
    art: 'timeline',
  },
  {
    t: '6. Reproduce',
    p: 'Toca ▶ y los bailarines se deslizan de una formación a la siguiente. Puedes agregar la canción desde el menú ⋮ → “Agregar música” para ensayar con el tiempo real.',
    art: 'play',
  },
  {
    t: '7. Nada se pierde',
    p: 'Si eliminas una coreografía va a la Papelera y la puedes recuperar. Además hay un “Historial de copias” automático y puedes exportar todo a un archivo como respaldo o para pasarlo a otro dispositivo.',
    art: 'safe',
  },
]

function Art({ kind }) {
  const dots = (pts, col = '#7c3aed') => pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill={col} stroke="#fff" strokeWidth="2.5" />)
  return (
    <svg viewBox="0 0 240 130" className="tut-art" aria-hidden="true">
      <rect x="6" y="6" width="228" height="118" rx="14" fill="#f5f0ff" stroke="#c4b5fd" strokeWidth="2" />
      {kind === 'hello' && <>{dots([[120, 40], [96, 62], [144, 62], [72, 84], [120, 84], [168, 84]])}<circle cx="120" cy="40" r="9" fill="#ec4899" stroke="#fff" strokeWidth="2.5" /></>}
      {kind === 'list' && [0, 1, 2].map((i) => <g key={i}><rect x="30" y={22 + i * 32} width="180" height="24" rx="7" fill="#fff" stroke="#ddd6fe" /><rect x="38" y={27 + i * 32} width="30" height="14" rx="3" fill="#ede9fe" /><rect x="76" y={30 + i * 32} width={90 - i * 20} height="8" rx="4" fill="#a78bfa" /></g>)}
      {kind === 'cast' && [0, 1, 2].map((i) => <g key={i}><circle cx="44" cy={34 + i * 30} r="10" fill={['#7c3aed', '#ec4899', '#3b82f6'][i]} /><rect x="64" y={28 + i * 30} width="120" height="13" rx="4" fill="#fff" stroke="#ddd6fe" /><text x="70" y={38 + i * 30} fontSize="10" fill="#4c1d95">{['Tiana', 'Sofía', 'Mateo'][i]}</text></g>)}
      {kind === 'stage' && <>{dots([[60, 60], [90, 80], [130, 50]])}<path d="M140 52 Q170 40 190 70" stroke="#7c3aed" strokeWidth="3" fill="none" strokeDasharray="5 4" /><circle cx="190" cy="70" r="9" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeDasharray="4 3" /><text x="120" y="118" fontSize="9" textAnchor="middle" fill="#6d28d9" fontWeight="700">PÚBLICO</text></>}
      {kind === 'tools' && <><rect x="40" y="40" width="60" height="36" rx="8" fill="#ead7bd" stroke="#5b4636" strokeWidth="2" /><rect x="120" y="36" width="40" height="40" fill="#fde7a7" stroke="#5b4636" strokeWidth="2" /><path d="M60 100 Q120 80 190 96" stroke="#2e1065" strokeWidth="3" fill="none" /><polygon points="190,96 178,88 180,102" fill="#2e1065" /><circle cx="195" cy="45" r="20" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeDasharray="5 4" /></>}
      {kind === 'timeline' && <><line x1="20" y1="78" x2="220" y2="78" stroke="#ddd6fe" strokeWidth="2" />{[0, 1, 2].map((i) => <rect key={i} x={24 + i * 64} y="58" width="58" height="34" rx="8" fill={i === 1 ? '#7c3aed' : '#ede9fe'} />)}<line x1="120" y1="42" x2="120" y2="104" stroke="#ec4899" strokeWidth="3" /></>}
      {kind === 'play' && <><circle cx="120" cy="65" r="30" fill="#7c3aed" /><polygon points="111,50 111,80 137,65" fill="#fff" /></>}
      {kind === 'safe' && <><path d="M120 24 L160 38 V66 C160 90 140 104 120 110 C100 104 80 90 80 66 V38 Z" fill="#ede9fe" stroke="#7c3aed" strokeWidth="3" /><path d="M104 66 l11 11 l22 -24" stroke="#7c3aed" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>}
    </svg>
  )
}

export default function Tutorial({ onClose }) {
  const [i, setI] = useState(0)
  const s = STEPS[i], last = i === STEPS.length - 1
  return (
    <Modal title="Cómo usar COREOAMA" onClose={onClose} actions={<>
      <span className="tut-dots">{STEPS.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</span>
      <button onClick={() => setI(i - 1)} disabled={i === 0}><LuChevronLeft /> Atrás</button>
      <button className="pri" onClick={() => (last ? onClose() : setI(i + 1))}>{last ? '¡A crear!' : <>Siguiente <LuChevronRight /></>}</button>
    </>}>
      <Art kind={s.art} />
      <h3 className="tut-t">{s.t}</h3>
      <p className="tut-p">{s.p}</p>
    </Modal>
  )
}
