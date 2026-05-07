# Burndown — Sprint Tracker

Una herramienta minimalista para que equipos de desarrollo visualicen el progreso de sus sprints en tiempo real, sin depender de Jira ni de ninguna herramienta externa.

> Sin backend. Sin cuenta. Sin configuración. Solo abrís, cargás tu sprint y empezás a trackear.

---

## ¿Qué es un Burndown Chart?

Un burndown chart muestra cuánto trabajo **queda por hacer** a lo largo del tiempo. Tiene dos líneas:

- **Línea ideal** *(punteada)* — cómo debería bajar el trabajo si el equipo avanza a ritmo constante
- **Línea real** *(sólida)* — cómo está bajando el trabajo en la práctica

Cuando la línea real está **por debajo** de la ideal, el equipo va adelantado. Cuando está **por encima**, va retrasado.

```
Puntos
  │
80│╌╌╌╌╌╌ ideal
  │  ───── real
  │
 0└──────────────── Días
  inicio          fin
```

---

## Cómo usar la app

### 1. Crear un sprint

Al abrir la app por primera vez verás el formulario de configuración. Completá:

| Campo | Descripción |
|-------|-------------|
| **Sprint name** | El nombre de tu sprint (ej: `Sprint 12 — Auth & Pagos`) |
| **Start date** | Fecha de inicio del sprint |
| **End date** | Fecha de fin del sprint |
| **Total story points** | La suma de todos los puntos del sprint |

Una vez configurado, la app calcula automáticamente la línea ideal y ya podés empezar a loguear progreso.

---

### 2. Registrar el progreso diario

Cada día (o cuando quieras), cargás cuántos puntos **quedan pendientes**:

1. Completá la fecha y los puntos restantes en el formulario de la izquierda
2. Opcionalmente, escribí una **nota** para explicar qué pasó ese día  
   *(¿Se bloquearon stories? ¿Llegó scope nuevo? Anotalo acá)*
3. Hacé click en **Log day**

La línea real del chart se actualiza al instante.

> **Tip:** Si cargás el mismo día dos veces, el valor se sobreescribe — no se duplica.

---

### 3. Agregar o editar notas

Las notas te permiten contextualizar anomalías en el chart. Por ejemplo: *"Se agregaron 8 pts de scope nuevo"* o *"Bloqueados por dependencia externa"*.

Para agregar o editar una nota:
1. En la tabla de entries (abajo a la derecha), buscá el día
2. Hacé click en **+ note** (o en el texto de la nota si ya tiene una)
3. Se abre el modal de edición — escribí tu nota (máximo 280 caracteres)
4. Guardá con **Save note**

Las notas aparecen en el tooltip del chart al hacer hover sobre ese punto.

---

### 4. Compartir el estado con tu equipo

La app no tiene backend — el estado completo del sprint se **codifica en la URL**. Esto significa que podés compartir exactamente lo que estás viendo con un link.

1. Hacé click en el botón **Share**
2. La URL se actualiza automáticamente con el estado actual
3. Copiá el link y mandáselo a tu compañero
4. Tu compañero abre el link → ve exactamente tu sprint con todos los datos

> **Importante:** cada vez que actualizás el sprint (nuevo entry, nueva nota), el link cambia. Es un **snapshot** del estado actual, no un link vivo. El flujo de trabajo típico es:
> 1. Vos cargás el día → compartís el nuevo link
> 2. Tu compañero abre el link → agrega su nota → te manda el nuevo link

---

### 5. Editar el sprint

Si necesitás corregir el nombre, las fechas o el total de puntos:

1. Hacé click en **Edit** (arriba a la derecha)
2. Modificá lo que necesites
3. Guardá → los entries que ya cargaste se **preservan**

---

### 6. Reiniciar

Si querés empezar un sprint nuevo desde cero:

1. Hacé click en **Reset**
2. Confirmá en el diálogo → se borran el sprint y todos los entries

> ⚠️ Esta acción no se puede deshacer.

---

## Persistencia de datos

La app guarda el estado en **dos lugares** simultáneamente:

| Lugar | Cuándo se usa |
|-------|---------------|
| `localStorage` | Al cargar la app sin link — restaura tu último sprint |
| URL hash (`#...`) | Al abrir un link compartido — el link tiene prioridad sobre localStorage |

**Prioridad de carga:** link compartido → localStorage → formulario de nuevo sprint

---

## Instalación y desarrollo

### Requisitos

- Node.js 18+
- npm 9+

### Correr en local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abrí `http://localhost:5173` en tu browser.

### Build para producción

```bash
npm run build
```

Los archivos de salida quedan en `dist/`. Podés servir esa carpeta con cualquier hosting estático (Vercel, Netlify, GitHub Pages, nginx, etc.).

### Preview del build

```bash
npm run preview
```

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 |
| Lenguaje | TypeScript |
| Build tool | Vite |
| Chart | SVG puro (sin librerías) |
| Persistencia | localStorage + URL hash |
| Backend | Ninguno |
| Dependencias de runtime | Solo `react` + `react-dom` |

---

## Arquitectura

El proyecto sigue una arquitectura hexagonal (Clean Architecture):

```
src/
├── domain/          # Lógica de negocio pura, sin React
│   ├── entities/    # Sprint, DayEntry
│   └── usecases/    # calculateIdealLine, serializeState
├── infrastructure/  # Adaptadores al mundo exterior
│   ├── storage/     # localStorage
│   └── url/         # URL hash
├── application/     # Orquestación (useBurndown hook)
└── ui/              # Componentes React, estilos
```

---

## Licencia

MIT
