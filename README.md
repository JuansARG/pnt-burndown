# Burndown — Sprint Tracker

**🚀 [Abrí la app acá → juansarg.github.io/pnt-burndown](https://juansarg.github.io/pnt-burndown)**

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
| **Total story points** | La suma de todos los puntos del sprint |

#### Modo de duración: **Dates** vs **Duration**

El formulario tiene un toggle para elegir cómo definir la duración del sprint:

**Dates** — ingresás fecha de inicio y fecha de fin exactas:

| Campo | Descripción |
|-------|-------------|
| **Start date** | Fecha de inicio del sprint |
| **End date** | Fecha de fin del sprint |

**Duration** — ingresás días hábiles y la app calcula la fecha de fin automáticamente, salteando feriados:

| Campo | Descripción |
|-------|-------------|
| **Start date** | Fecha de inicio del sprint |
| **Working days** | Cantidad de días hábiles del sprint (ej: `10` para dos semanas) |
| **Holidays** | Feriados a excluir del cómputo (formato `YYYY-MM-DD`) |

> La fecha de fin calculada se muestra en tiempo real mientras escribís. Los feriados que agregues se saltean al contar los días hábiles.

Una vez configurado, la app calcula automáticamente la línea ideal y ya podés empezar a loguear progreso.

---

### 2. Registrar el progreso diario

Cada día (o cuando quieras), cargás datos desde el formulario de la izquierda. Hay **tres modos** de registro:

#### Modo **Remaining** (default)
Ingresás cuántos puntos **quedan pendientes** al final del día.

#### Modo **Burned**
Ingresás cuántos puntos **se quemaron** ese día. La app calcula automáticamente los remaining restando del último valor conocido.

#### Modo **Scope change**
Registrás cambios de scope: sumás o restás puntos al total del sprint. Útil cuando llegan stories nuevas o se sacan del sprint.

| Campo | Descripción |
|-------|-------------|
| **Date** | Fecha del registro |
| **Remaining / Burned / Delta** | Según el modo activo |
| **Note** (opcional) | Contexto: ¿por qué se bloquearon? ¿llegó scope nuevo? Máximo 280 caracteres |

> **Tip:** Si cargás el mismo día dos veces, el valor se sobreescribe — no se duplica.

---

### 3. Ver y editar entries

En la tabla de entries (abajo a la derecha) se listan todos los días logueados y los scope changes, ordenados por fecha:

- **Editar fecha**: Hacé click en la fecha de una entry (aparece `✎`) y seleccioná otra fecha del calendario
- **Editar puntos**: Hacé click en los puntos de una entry (aparece `✎`), escribí el valor correcto y presioná **Enter** o click fuera
- **Agregar/editar nota**: Hacé click en `+ note` o en el texto de la nota existente. Se abre un modal de edición
- **Eliminar entry o scope change**: Hacé click en `×` al final de la fila

El chart se actualiza inmediatamente con cualquier cambio.

---

### 4. Compartir el estado con tu equipo

La app no tiene backend — el estado completo del sprint se **codifica en la URL**. Esto significa que podés compartir exactamente lo que estás viendo con un link.

1. Hacé click en el botón **Share snapshot**
2. Se genera una URL compacta con el estado actual
3. Copiá el link y compartilo
4. Tu compañero abre el link → ve exactamente tu sprint con todos los datos

> **Importante:** cada vez que actualizás el sprint, el link cambia. Es un **snapshot** del estado actual, no un link vivo. El flujo típico es: vos cargás el día → compartís el nuevo link → tu compañero abre → agrega su nota → te manda el nuevo link.

---

### 5. Alternar eje del chart

Arriba del chart hay un toggle **Date / Day** para cambiar cómo se muestra el eje X:

- **Date**: muestra fechas reales (`5/12`, `5/13`...) con saltos visibles para fines de semana y feriados
- **Day**: muestra días consecutivos (`Day 1`, `Day 2`...) sin saltos, útil para ver el ritmo independientemente de los fines de semana

---

### 6. Editar el sprint

Si necesitás corregir el nombre, las fechas o el total de puntos:

1. Hacé click en **Edit** (arriba a la derecha)
2. Modificá lo que necesites
3. Guardá → los entries que ya cargaste se **preservan**

---

### 7. Reiniciar

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

### Deploy a GitHub Pages

```bash
npm run deploy
```

Esto construye el proyecto y lo publica automáticamente en la rama `gh-pages`.

También podés usar `npm run publish:app` para commitear, pushear y deployar todo de una:

```bash
npm run publish:app
```

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
| Dependencias de runtime | `react`, `react-dom`, `lz-string` |

---

## Arquitectura

El proyecto sigue una arquitectura hexagonal (Clean Architecture):

```
src/
├── domain/          # Lógica de negocio pura, sin React
│   ├── entities/    # Sprint, DayEntry, ScopeChange
│   └── usecases/    # calculateIdealLine, serializeState, workingDays
├── infrastructure/  # Adaptadores al mundo exterior
│   ├── storage/     # localStorage
│   └── url/         # URL hash
├── application/     # Orquestación (useBurndown hook)
└── ui/              # Componentes React, estilos
```

---

## Historial de cambios

Este es un registro de las decisiones y features que fuimos agregando. No es un changelog de versiones, es un diario de por qué existe cada feature.

| Fecha | Cambio | Motivación |
|-------|--------|------------|
| Mayo 2026 | **Serialización compacta de URLs** | Los links compartidos eran demasiado largos (~1000 caracteres). Se agregó `lz-string` con arrays posicionales para reducirlos a ~200 caracteres sin perder backward compat. |
| Mayo 2026 | **Scope changes** | Los sprints reales cambian de scope. Agregamos tracking de deltas de scope (positivo/negativo) con fecha y nota. |
| Mayo 2026 | **Modo Duration + Working days** | Configurar sprints por "10 días hábiles" es más natural que calcular fechas a mano. La app calcula automáticamente la fecha de fin, respetando feriados. |
| Mayo 2026 | **Holidays** | Para equipos que trabajan en países con feriados variables, agregamos la posibilidad de definir feriados que se saltean al computar días hábiles. |
| Mayo 2026 | **Burned points mode** | A veces es más natural decir "hoy quemamos 15 puntos" que "quedan 67 puntos". Agregamos un toggle para registrar burned en lugar de remaining. |
| Mayo 2026 | **Axis toggle (Date / Day)** | Ver el eje como "día 1, día 2..." en lugar de fechas ayuda a visualizar el ritmo independientemente de fines de semana. |
| Mayo 2026 | **Inline editing** | Editar fecha y puntos directamente desde la tabla de entries, sin tener que re-cargar el formulario lateral. |
| Mayo 2026 | **Notas con modal** | Las notas permiten contextualizar anomalías en el chart. Agregamos un modal dedicado para editar notas de hasta 280 caracteres. |
| Mayo 2026 | **Validación de fechas duplicadas** | Evitar que al editar la fecha de una entry se pise otra existente, con feedback visual de error. |
| Abril 2026 | **Setup inicial + deploy** | Vite + React 19 + TypeScript + GitHub Pages. Arquitectura hexagonal desde el día 0. |

---

## Licencia

MIT
