# Diseño: Esqueleto Base — App de Gestión y Escritura de Novelas

**Fecha:** 2026-05-08  
**Estado:** Aprobado  
**Alcance:** Esqueleto base web (sin IA, sin módulo editorial)

---

## 1. Contexto y Objetivo

Aplicación web para escritores de novelas que centraliza el ciclo de vida completo de una obra: escritura por escenas, organización de capítulos, fichas de personajes, biblia del mundo y estadísticas de progreso.

**Fuera de alcance en esta fase:**
- Integración de IA (se añade tras completar el esqueleto)
- Módulo de búsqueda de editoriales por país/región (se añade al final)
- OCR de notas físicas
- Sincronización entre dispositivos
- Autenticación / cuentas de usuario

---

## 2. Stack Tecnológico

| Capa | Tecnología | Motivo |
|------|-----------|--------|
| Framework | Next.js 14 (App Router) + TypeScript | Routing robusto, SSR opcional, ecosystem maduro |
| Estilos | Tailwind CSS | Utilidades, consistencia, fácil theming con variables CSS |
| Componentes UI | shadcn/ui | Accesibles, sin estilo forzado, fácil de customizar |
| Editor de texto | Tiptap | Rich text extensible, output JSON serializable, soporte por escenas |
| Base de datos | Dexie.js (IndexedDB) | GB de almacenamiento local, offline, preparado para sync posterior |
| Estado global | Zustand | Liviano, sin boilerplate, para tema activo y novela abierta |
| Temas | next-themes | Cambio de tema sin parpadeo al cargar la página |

---

## 3. Estructura de Rutas

```
app/
├── page.tsx                          → / — Home: galería de novelas + dashboard de stats
├── novel/
│   └── [novelId]/
│       ├── layout.tsx                → Workspace shell (sidebar árbol + tabs superiores)
│       ├── page.tsx                  → Redirige a ./manuscript
│       ├── manuscript/
│       │   ├── page.tsx              → Vista de capítulos y escenas
│       │   └── [sceneId]/
│       │       └── page.tsx          → Editor de escena (Tiptap)
│       ├── bible/
│       │   ├── page.tsx              → Biblia general
│       │   ├── characters/
│       │   │   ├── page.tsx          → Lista de personajes
│       │   │   └── [charId]/
│       │   │       └── page.tsx      → Ficha de personaje
│       │   └── world/
│       │       └── page.tsx          → Notas de mundo y lugares
│       ├── board/
│       │   └── page.tsx              → Tablero visual (placeholder en esta fase)
│       └── stats/
│           └── page.tsx              → Estadísticas de la novela
└── settings/
    └── page.tsx                      → Preferencias: tema, metas de escritura
```

---

## 4. Modelo de Datos (Dexie / IndexedDB)

### Tabla: `novels`
```typescript
{
  id: string            // uuid v4
  title: string
  synopsis: string
  genre: string
  color: string         // color hex de identidad visual en la galería
  targetWordCount: number
  createdAt: number     // timestamp
  updatedAt: number
}
```

### Tabla: `chapters`
```typescript
{
  id: string
  novelId: string       // FK → novels
  title: string
  order: number         // para drag & drop
  createdAt: number
}
```

### Tabla: `scenes`
```typescript
{
  id: string
  chapterId: string     // FK → chapters
  novelId: string       // índice directo para queries de novela completa
  title: string
  content: string       // JSON serializado de Tiptap
  synopsis: string      // resumen corto, visible en el inspector
  wordCount: number     // calculado automáticamente al guardar
  order: number         // para drag & drop dentro del capítulo
  updatedAt: number
}
```

### Tabla: `characters`
```typescript
{
  id: string
  novelId: string       // FK → novels
  name: string
  role: string          // 'protagonist' | 'secondary' | 'antagonist' | 'other'
  age: string
  description: string
  internalWound: string // Herida interna: trauma que dicta el comportamiento
  falseBelief: string   // Creencia falsa que el personaje usa para sobrevivir
  secretDesire: string  // Motivación que el personaje no admite ante nadie
  notes: string
  createdAt: number
}
```

### Tabla: `notes`
```typescript
{
  id: string
  novelId: string | null  // null = nota global sin novela asignada
  content: string
  tags: string[]
  createdAt: number
}
```

### Índices Dexie
```typescript
db.version(1).stores({
  novels:     '++id, updatedAt',
  chapters:   '++id, novelId, order',
  scenes:     '++id, novelId, chapterId, order, updatedAt',
  characters: '++id, novelId',
  notes:      '++id, novelId, createdAt',
})
```

---

## 5. Sistema de Temas

Tres temas seleccionables por el usuario desde Ajustes. Gestionados con `next-themes` (`data-theme` en `<html>`).

### Tokens CSS compartidos
Todos los componentes usan exclusivamente estas variables — nunca colores directos:

```css
/* Variables definidas por cada tema */
--bg-primary        /* fondo base de la app */
--bg-secondary      /* paneles, sidebars */
--bg-tertiary       /* tarjetas, inputs */
--border            /* líneas divisoras */
--text-primary      /* texto principal */
--text-secondary    /* texto de apoyo */
--text-muted        /* texto deshabilitado / placeholders */
--accent            /* color de énfasis (botones, selección activa) */
--accent-soft       /* versión translúcida del acento */
```

### Valores por tema

| Token | 🌑 Estudio Nocturno | 📜 Papel y Tinta | ⚡ Editorial Moderno |
|-------|-------------------|-----------------|-------------------|
| `--bg-primary` | `#0f0f13` | `#faf6f0` | `#f8f9fc` |
| `--bg-secondary` | `#13131a` | `#f5ede3` | `#ffffff` |
| `--bg-tertiary` | `#1e1e2a` | `#fff` | `#f1f5f9` |
| `--border` | `#252530` | `#e8ddd0` | `#e2e8f0` |
| `--text-primary` | `#e8e0d5` | `#3d2b1f` | `#1e293b` |
| `--text-secondary` | `#c9b99a` | `#9b7e5a` | `#64748b` |
| `--text-muted` | `#6b6b7a` | `#b8a898` | `#94a3b8` |
| `--accent` | `#c9b99a` | `#9b7e5a` | `#6366f1` |
| `--accent-soft` | `#c9b99a1a` | `#9b7e5a1a` | `#eef2ff` |

---

## 6. Pantalla de Inicio (`/`)

Combinación de galería visual + dashboard de estadísticas:

**Parte superior — Stats globales:**
- Total de novelas activas
- Total de palabras escritas (suma de todas las novelas)
- Palabras escritas hoy (suma de escenas con `updatedAt` en fecha actual)

**Parte principal — Galería de novelas:**
- Tarjetas con color de identidad, título, género, conteo de palabras
- Barra de progreso hacia `targetWordCount`
- Fecha de última edición
- Botón "Nueva novela" (abre modal de creación)

**Interacciones:**
- Click en tarjeta → abre workspace de esa novela
- Hover → muestra opciones (renombrar, eliminar)

---

## 7. Workspace por Novela (`/novel/[novelId]/layout.tsx`)

Shell permanente que envuelve todas las rutas de una novela.

### Estructura visual
```
┌─────────────────────────────────────────────────────┐
│  ✦ [Título novela]  │ Manuscrito │ Biblia │ Stats   │  ← Tab bar superior
├──────────────┬──────────────────────┬───────────────┤
│ Árbol escenas│                      │  Inspector    │
│              │   Área activa        │               │
│ ▼ Cap. I     │   (editor / lista /  │  Synopsis     │
│   Escena 1   │    personajes…)      │  Personajes   │
│   Escena 2   │                      │  WordCount    │
│ ▼ Cap. II    │                      │               │
│   Escena 1 ✦ │                      │               │
└──────────────┴──────────────────────┴───────────────┘
```

- **Sidebar izquierdo:** árbol colapsable de capítulos y escenas. Drag & drop de orden. Botones de añadir capítulo / escena.
- **Área central:** renderiza el `children` de Next.js (editor, listas, fichas).
- **Inspector derecho:** contextual — muestra datos de la escena activa (synopsis, personajes vinculados, conteo de palabras). Se puede colapsar.

### Tabs superiores
| Tab | Ruta | Contenido |
|-----|------|-----------|
| Manuscrito | `/manuscript` | Árbol + editor de escenas |
| Biblia | `/bible` | Personajes y notas de mundo |
| Tablero | `/board` | Placeholder (fase futura) |
| Stats | `/stats` | Gráficas de progreso |

---

## 8. Editor de Escena

Basado en Tiptap con estas extensiones en el esqueleto:
- `StarterKit` — párrafos, negrita, cursiva, listas, headings
- `CharacterCount` — conteo de palabras en tiempo real (visible en inspector)
- `Placeholder` — texto guía "Empieza a escribir..."
- `Typography` — comillas tipográficas, elipsis

**Guardado:** automático con debounce de 1 segundo. Actualiza `scene.content`, `scene.wordCount` y `scene.updatedAt` en IndexedDB.

**Modo Zen:** botón que oculta sidebar y inspector, expande el editor a pantalla completa. ESC para salir.

---

## 9. Ficha de Personaje

Formulario con secciones expandibles:

1. **Datos básicos:** nombre, rol, edad, descripción física
2. **Psicología profunda** (del documento original):
   - Herida interna
   - Creencia falsa
   - Deseo secreto
3. **Notas libres:** campo Tiptap básico

---

## 10. Ajustes (`/settings`)

- Selector de tema (3 opciones con preview)
- Meta de palabras diaria (para el contador "hoy")
- Meta de palabras total por defecto para novelas nuevas

---

## 11. Fases de Desarrollo

| Fase | Contenido |
|------|-----------|
| **Esqueleto base** (esta fase) | Stack, temas, home, workspace, editor, biblia, personajes, stats básicas |
| **Fase 2** | Integración de IA (OpenRouter: mentores virtuales, análisis de estilo) |
| **Fase 3** | Módulo editorial: buscador de editoriales por país/región, generador de query letters |

---

## 12. Decisiones de No-Alcance (YAGNI)

- Sin autenticación ni cuentas de usuario (app 100% gratuita, datos locales)
- Sin backend en esta fase
- Sin sync entre dispositivos (la arquitectura Dexie lo permite en fase posterior)
- Sin OCR (fase posterior, junto con IA)
- El tab "Tablero" existe en la navegación pero muestra un placeholder hasta fase 2
