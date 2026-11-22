# COREOAMA 💜

App para **crear, editar y ensayar coreografías de baile**, pensada a partir de los bocetos de la profe: escenario visto desde arriba, formaciones paso a paso y una guía escrita en cada parte.

- 🎭 **Elenco con nombres editables**, colores, formas (círculo, cuadrado, triángulo), grupos y hacia dónde mira cada bailarín.
- 🗺️ **Escenario** con PÚBLICO y FONDO, cuadrícula, imán y vista de la formación anterior.
- 🪑 **Elementos**: mesas, cubos, sillas, flechas curvas de desplazamiento, filas, círculos, triángulos y textos.
- 🧩 **Formaciones automáticas**: fila, 2 filas, círculo, medio arco, triángulo, V y dispersos.
- ⏱️ **Línea de tiempo** con duración y transición de cada formación, reproducción animada y **música**.
- 📝 **Guía, conteos y notas** en cada formación y en la coreografía.
- 💾 **Nada se borra**: autoguardado, deshacer, historial de copias, papelera, almacenamiento permanente y respaldo en archivo.
- 📱💻 **App instalable** (PWA) en computador, Android e iPhone; funciona **sin internet**.
- 🖨️ Impresión / PDF con el formato del cuaderno.

👉 **Cómo usarla: [TUTORIAL.md](TUTORIAL.md)**

---

## Tecnología

- [React 19](https://react.dev) + [Vite](https://vite.dev)
- [react-icons](https://react-icons.github.io/react-icons/) (Lucide)
- IndexedDB para guardar las coreografías y la música en el dispositivo
- Service worker + manifest para instalarla y usarla sin conexión
- GitHub Pages para publicarla

```
COREOAMA/
├─ index.html
├─ public/                 íconos, manifest y service worker (modo app / sin internet)
├─ src/
│  ├─ App.jsx              navegación, instalación, importar/exportar
│  ├─ model.js             datos, formaciones automáticas, línea de tiempo, ejemplos
│  ├─ storage.js           guardado permanente (IndexedDB, historial, papelera)
│  ├─ styles.css           diseño claro con morado
│  └─ components/
│     ├─ Home.jsx          “Tus coreos” y papelera
│     ├─ Editor.jsx        editor, escenario interactivo, historial, impresión
│     ├─ Panels.jsx        bailarines, formación, selección
│     ├─ Timeline.jsx      línea de tiempo y reproducción
│     ├─ StageArt.jsx      dibujo del escenario, bailarines y elementos
│     ├─ Tutorial.jsx      tutorial dentro de la app
│     └─ Modal.jsx
├─ docs/                  app compilada que publica GitHub Pages
└─ setup/deploy.yml       (opcional) publicación automática con GitHub Actions
```

## Correr en tu computador (desarrollo)

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
npm run dev
```

Abre la dirección que aparece (por ejemplo `http://localhost:5173`). Con `npm run dev` también puedes abrirla desde el celular en la misma red wifi usando la dirección “Network” que muestra la terminal.

Para generar la versión final: `npm run build` (queda en `dist/`).

## Publicar (para instalarla en PC y celular)

La carpeta **`docs/`** tiene la app ya compilada y lista para GitHub Pages.

1. Sube el proyecto a GitHub (rama `main`).
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / carpeta `/docs` → Save**.
3. En 1–2 minutos queda en `https://<tu-usuario>.github.io/COREOAMA/`.
4. Abre esa dirección en el computador o el celular y toca **Instalar app** (ver [TUTORIAL.md](TUTORIAL.md)).

**Cuando cambies el código**, vuelve a compilar y sube los cambios:

```bash
npm run build:pages   # actualiza la carpeta docs/
```

Las actualizaciones llegan solas a quien tenga la app instalada (al abrirla con internet). **Las coreografías guardadas no se tocan al actualizar.**

> Opcional: en `setup/deploy.yml` hay un flujo de GitHub Actions que compila y publica solo en cada cambio. Para usarlo, cópialo a `.github/workflows/deploy.yml` y en Settings → Pages elige *Source: GitHub Actions*.

## Ideas para siguientes versiones

- Sincronizar entre dispositivos con una cuenta (Supabase / Firebase).
- Compartir una coreografía con un enlace de solo lectura para los alumnos.
- Vista 3D y exportar la reproducción como video.
- Versión de escritorio empaquetada (.exe) con Tauri o Electron.
