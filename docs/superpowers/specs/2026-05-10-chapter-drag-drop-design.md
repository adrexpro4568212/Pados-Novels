# Diseño: Drag & Drop de Capítulos

**Fecha:** 2026-05-10
**Estado:** Aprobado
**Alcance:** Reordenar capítulos arrastrándolos en el árbol del manuscrito, con feedback visual amigable durante el arrastre

---

## 1. Objetivo

Permitir al usuario reordenar capítulos en la barra lateral del workspace arrastrándolos con un handle ⠿ (igual al que ya tienen las escenas). El cambio de orden persiste en Dexie a través del campo `order` ya existente en `Chapter`.

---

## 2. Modelo de datos

Sin cambios. `Chapter` ya tiene:

```typescript
interface Chapter {
  id: string
  novelId: string
  title: string
  order: number      // campo usado para ordenar — ya existe
  createdAt: number
}
```

`updateChapter(id, { order })` ya existe en `lib/hooks/use-chapters.ts` y soporta actualizar el campo `order`. No se requiere migración de Dexie.

---

## 3. Lógica de reordenación

### Detección en `handleDragEnd`

El `DndContext` existente en `scene-tree.tsx` ya gestiona el drag de escenas. Se extiende para detectar si el ítem arrastrado es un capítulo:

```
en handleDragEnd(event):
  si active.id está en chapters.map(c => c.id):
    → drag de capítulo: reordenar capítulos
  sino:
    → drag de escena: lógica existente (sin cambios)
```

### Reordenación de capítulos

```typescript
const oldIndex = chapters.findIndex(c => c.id === active.id)
const newIndex = chapters.findIndex(c => c.id === over.id)
const reordered = arrayMove(chapters, oldIndex, newIndex)
await Promise.all(
  reordered.map((chapter, index) => updateChapter(chapter.id, { order: index }))
)
```

`arrayMove` es la misma utilidad de `@dnd-kit/sortable` ya usada para escenas.

---

## 4. Componentes

### `scene-tree.tsx`

Tres adiciones:

1. **`SortableContext` para capítulos** — envuelve el listado de capítulos con `items={chapters.map(c => c.id)}` y `strategy={verticalListSortingStrategy}`.

2. **Estado `activeChapterId`** — `useState<string | null>(null)`, se fija en `onDragStart` y se limpia en `onDragEnd`. Permite saber qué capítulo se está moviendo.

3. **`DragOverlay`** — renderiza una copia visual del capítulo activo que sigue el cursor durante el arrastre. Estilos: fondo `var(--bg-secondary)`, borde `1px solid var(--accent)`, `opacity: 0.9`, `border-radius: 6px`. Usa un componente auxiliar `ChapterDragPreview` que muestra el título del capítulo con el mismo estilo que la fila real.

### `scene-tree-chapter.tsx`

Cuatro adiciones:

1. **`useSortable({ id: chapter.id })`** — igual que `SceneTreeScene`. Provee `attributes`, `listeners`, `setNodeRef`, `transform`, `transition`, `isDragging`.

2. **Estilos de transformación** — el row recibe `ref={setNodeRef}` y `style={{ transform: CSS.Transform.toString(transform), transition }}`.

3. **Opacidad durante arrastre** — cuando `isDragging === true`, el row original baja a `opacity: 0.3` (placeholder semitransparente; el `DragOverlay` es el elemento visual principal).

4. **Handle ⠿** — span con `{...listeners}` y `{...attributes}`, `cursor: grab`, que aparece con `opacity-0 group-hover:opacity-100` (mismo patrón que `SceneTreeScene`). El handle está al inicio de la fila, antes del ícono de colapso. El click en el título del capítulo sigue expandiendo/colapsando sin interferencia.

---

## 5. Feedback visual durante el arrastre

```
Reposo:
  [⠿]  ▼  CAPÍTULO 1                    +       ← ⠿ solo visible en hover

Arrastre activo:
  [placeholder a 30% opacity en su posición original]
  [ghost flotando: fondo + borde accent, 90% opacity, sigue el cursor]

Zona de drop:
  @dnd-kit desplaza los demás capítulos automáticamente para indicar dónde caerá
```

No se implementa ningún indicador de zona de drop adicional — el desplazamiento automático de `@dnd-kit/sortable` es suficiente feedback.

---

## 6. Archivos

### Modificados

```
components/workspace/scene-tree.tsx
  - Añadir: import DragOverlay, onDragStart handler
  - Añadir: SortableContext para capítulos
  - Añadir: estado activeChapterId
  - Modificar: handleDragEnd — detectar capítulos antes de lógica de escenas
  - Añadir: <DragOverlay> con <ChapterDragPreview>

components/workspace/scene-tree-chapter.tsx
  - Añadir: useSortable({ id: chapter.id })
  - Añadir: ref, style (transform + transition) en el row
  - Añadir: isDragging → opacity: 0.3
  - Añadir: handle ⠿ con listeners/attributes
```

### Sin cambios

```
lib/hooks/use-chapters.ts    — updateChapter ya soporta { order }
lib/db.types.ts              — Chapter ya tiene order: number
```

---

## 7. Tests

Función `handleDragEnd` para capítulos, testeable con fake-indexeddb (mismo patrón que el resto del proyecto):

| Caso | Esperado |
|------|----------|
| Mover capítulo del índice 0 al 2 (de 3) | orders actualizados: [1,2,0] → reordenado correctamente |
| Soltar en la misma posición (`active.id === over.id`) | sin cambios en DB |
| active.id es una escena (no capítulo) | lógica de escenas se ejecuta, no la de capítulos |
| Mover primer capítulo al último | todos los orders recalculados en orden |

---

## 8. Fuera de alcance

- Mover escenas entre capítulos (cross-chapter drag)
- Drag & drop en vista móvil (sin handle táctil específico)
- Reordenación de escenas entre capítulos distintos
- Undo/redo del reordenado
