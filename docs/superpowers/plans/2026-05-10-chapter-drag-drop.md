# Chapter Drag & Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow the user to reorder chapters by dragging them in the manuscript sidebar, with a ⠿ grab handle (hover-only) and a ghost overlay during the drag.

**Architecture:** Extend the existing `DndContext` in `SceneTree` to also sort chapters — a `SortableContext` for chapters wraps the list, `SceneTreeChapter` gains `useSortable`, and `handleDragEnd` detects chapter drags by checking if `active.id` is a chapter ID. A `DragOverlay` renders a floating ghost during the drag. The reorder logic is extracted to a testable `reorderChapters` helper in `use-chapters.ts`.

**Tech Stack:** `@dnd-kit/core` (already installed — `DndContext`, `DragOverlay`, `DragStartEvent`), `@dnd-kit/sortable` (already installed — `useSortable`, `SortableContext`, `arrayMove`, `verticalListSortingStrategy`), Dexie.js (`updateChapter`), React (`useState`), Vitest + fake-indexeddb.

---

## File Map

```
lib/hooks/use-chapters.ts                  — ADD: export reorderChapters()
tests/lib/hooks/use-chapters.test.ts       — CREATE: tests for reorderChapters
components/workspace/scene-tree-chapter.tsx — MODIFY: add useSortable + drag handle
components/workspace/scene-tree.tsx         — MODIFY: SortableContext + DragOverlay + updated handleDragEnd
```

---

### Task 1: `reorderChapters` helper + tests

**Files:**
- Modify: `lib/hooks/use-chapters.ts`
- Create: `tests/lib/hooks/use-chapters.test.ts`

- [ ] **Step 1: Create the test file with a failing test**

```typescript
// tests/lib/hooks/use-chapters.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/lib/db'
import { createChapter, reorderChapters } from '@/lib/hooks/use-chapters'

beforeEach(async () => {
  await db.chapters.clear()
})

async function makeChapters(novelId: string, count: number) {
  const chapters = []
  for (let i = 0; i < count; i++) {
    chapters.push(await createChapter({ novelId, title: `Cap ${i + 1}` }))
  }
  // return sorted by order as they would come from useChapters
  return db.chapters.where('novelId').equals(novelId).sortBy('order')
}

describe('reorderChapters', () => {
  it('moves a chapter from index 0 to index 2 (of 3)', async () => {
    const chapters = await makeChapters('novel-1', 3)
    const [a, b, c] = chapters
    await reorderChapters(chapters, a.id, c.id)
    const result = await db.chapters.where('novelId').equals('novel-1').sortBy('order')
    expect(result.map(ch => ch.title)).toEqual(['Cap 2', 'Cap 3', 'Cap 1'])
  })

  it('does nothing when fromId equals toId', async () => {
    const chapters = await makeChapters('novel-1', 2)
    const [a] = chapters
    await reorderChapters(chapters, a.id, a.id)
    const result = await db.chapters.where('novelId').equals('novel-1').sortBy('order')
    expect(result.map(ch => ch.title)).toEqual(['Cap 1', 'Cap 2'])
  })

  it('moves the last chapter to first position', async () => {
    const chapters = await makeChapters('novel-1', 3)
    const [a, , c] = chapters
    await reorderChapters(chapters, c.id, a.id)
    const result = await db.chapters.where('novelId').equals('novel-1').sortBy('order')
    expect(result.map(ch => ch.title)).toEqual(['Cap 3', 'Cap 1', 'Cap 2'])
  })

  it('updates order fields sequentially starting from 0', async () => {
    const chapters = await makeChapters('novel-1', 3)
    const [a, , c] = chapters
    await reorderChapters(chapters, a.id, c.id)
    const result = await db.chapters.where('novelId').equals('novel-1').sortBy('order')
    expect(result.map(ch => ch.order)).toEqual([0, 1, 2])
  })
})
```

- [ ] **Step 2: Run the test — expect it to fail with "reorderChapters is not exported"**

```bash
npx vitest run tests/lib/hooks/use-chapters.test.ts --reporter=verbose
```

Expected: FAIL — `reorderChapters` is not a function (not yet exported).

- [ ] **Step 3: Add `reorderChapters` to `lib/hooks/use-chapters.ts`**

Add this function at the end of the file (after `useChapters`). Do not change any existing code:

```typescript
import { arrayMove } from '@dnd-kit/sortable'
import type { Chapter } from '@/lib/db.types'

// ... existing code unchanged above ...

/**
 * Reorders chapters in Dexie after a drag-and-drop.
 * chapters: the current sorted array (from useChapters)
 * fromId:   the id of the chapter being dragged
 * toId:     the id of the chapter it was dropped onto
 */
export async function reorderChapters(
  chapters: Chapter[],
  fromId: string,
  toId: string
): Promise<void> {
  if (fromId === toId) return
  const oldIndex = chapters.findIndex(c => c.id === fromId)
  const newIndex = chapters.findIndex(c => c.id === toId)
  if (oldIndex === -1 || newIndex === -1) return
  const reordered = arrayMove(chapters, oldIndex, newIndex)
  await Promise.all(
    reordered.map((chapter, index) => updateChapter(chapter.id, { order: index }))
  )
}
```

Note: `arrayMove` is already available from `@dnd-kit/sortable` (already installed). Add the import at the top of the file:

```typescript
import { arrayMove } from '@dnd-kit/sortable'
```

- [ ] **Step 4: Run the tests — expect all 4 to pass**

```bash
npx vitest run tests/lib/hooks/use-chapters.test.ts --reporter=verbose
```

Expected: 4 tests PASS.

- [ ] **Step 5: Run the full test suite to confirm nothing broke**

```bash
npx vitest run --reporter=verbose
```

Expected: all tests pass (previous count was 41).

- [ ] **Step 6: Commit**

```bash
git add lib/hooks/use-chapters.ts tests/lib/hooks/use-chapters.test.ts
git commit -m "feat: reorderChapters helper + tests"
```

---

### Task 2: Make `SceneTreeChapter` sortable

**Files:**
- Modify: `components/workspace/scene-tree-chapter.tsx`

This task makes the chapter row draggable. The chapter's click-to-expand still works because the drag `listeners` are placed only on the ⠿ handle span, not on the title row.

- [ ] **Step 1: Replace the full content of `components/workspace/scene-tree-chapter.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SceneTreeScene } from './scene-tree-scene'
import { createScene, useScenes } from '@/lib/hooks/use-scenes'
import type { Chapter } from '@/lib/db.types'

interface SceneTreeChapterProps {
  chapter: Chapter
  novelId: string
}

export function SceneTreeChapter({ chapter, novelId }: SceneTreeChapterProps) {
  const [open, setOpen] = useState(true)
  const scenes = useScenes(chapter.id) ?? []

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id })

  async function handleAddScene() {
    await createScene({
      novelId,
      chapterId: chapter.id,
      title: `Escena ${scenes.length + 1}`,
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
    >
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer group"
        onClick={() => setOpen(o => !o)}
      >
        {/* Drag handle — only this element activates the drag */}
        <span
          className="cursor-grab opacity-0 group-hover:opacity-100 text-xs"
          style={{ color: 'var(--text-muted)', touchAction: 'none' }}
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
        >
          ⠿
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {open ? '▼' : '▶'}
        </span>
        <span className="text-xs font-semibold flex-1 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          {chapter.title}
        </span>
        <button
          className="opacity-0 group-hover:opacity-100 text-xs px-1"
          style={{ color: 'var(--accent)' }}
          onClick={(e) => { e.stopPropagation(); handleAddScene() }}
          title="Añadir escena"
        >
          +
        </button>
      </div>

      {open && (
        <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="ml-3">
            {scenes.map(scene => (
              <SceneTreeScene key={scene.id} scene={scene} novelId={novelId} />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}
```

Key changes vs. the original:
- Outer `<div>` now has `ref={setNodeRef}` + `transform`/`transition`/`opacity` styles
- New ⠿ span before the collapse arrow, with `{...listeners}` and `{...attributes}`
- `onClick={e => e.stopPropagation()}` on the handle so clicking it doesn't toggle collapse

- [ ] **Step 2: Verify the app still compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/workspace/scene-tree-chapter.tsx
git commit -m "feat: make SceneTreeChapter sortable with drag handle"
```

---

### Task 3: Wire up chapter sorting in `SceneTree` + `DragOverlay`

**Files:**
- Modify: `components/workspace/scene-tree.tsx`

This is the final wiring: `SortableContext` for the chapter list, updated `handleDragEnd` that routes to `reorderChapters` for chapter drags, and a `DragOverlay` ghost.

- [ ] **Step 1: Replace the full content of `components/workspace/scene-tree.tsx`**

```tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useChapters, createChapter, reorderChapters } from '@/lib/hooks/use-chapters'
import { updateScene } from '@/lib/hooks/use-scenes'
import { db } from '@/lib/db'
import { SceneTreeChapter } from './scene-tree-chapter'

interface SceneTreeProps {
  novelId: string
}

export function SceneTree({ novelId }: SceneTreeProps) {
  const chapters = useChapters(novelId) ?? []
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)

  const activeChapter = activeChapterId
    ? chapters.find(c => c.id === activeChapterId) ?? null
    : null

  async function handleAddChapter() {
    await createChapter({ novelId, title: `Capítulo ${chapters.length + 1}` })
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    if (chapters.some(c => c.id === id)) {
      setActiveChapterId(id)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveChapterId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Chapter drag
    if (chapters.some(c => c.id === active.id)) {
      await reorderChapters(chapters, String(active.id), String(over.id))
      return
    }

    // Scene drag (existing logic — unchanged)
    for (const chapter of chapters) {
      const chapterScenes = await db.scenes
        .where('chapterId').equals(chapter.id)
        .sortBy('order')

      const oldIndex = chapterScenes.findIndex(s => s.id === active.id)
      const newIndex = chapterScenes.findIndex(s => s.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(chapterScenes, oldIndex, newIndex)
        await Promise.all(
          reordered.map((scene, index) => updateScene(scene.id, { order: index }))
        )
        break
      }
    }
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', width: '200px', minWidth: '200px' }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Estructura
        </span>
        <button
          onClick={handleAddChapter}
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          title="Nuevo capítulo"
        >
          + Cap
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={chapters.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {chapters.length === 0 ? (
              <p className="text-xs text-center mt-8" style={{ color: 'var(--text-muted)' }}>
                Sin capítulos.<br />
                <button onClick={handleAddChapter} className="underline" style={{ color: 'var(--accent)' }}>
                  Añadir uno
                </button>
              </p>
            ) : (
              chapters.map(chapter => (
                <SceneTreeChapter key={chapter.id} chapter={chapter} novelId={novelId} />
              ))
            )}
          </SortableContext>

          {/* Ghost overlay shown while dragging a chapter */}
          <DragOverlay>
            {activeChapter ? (
              <div
                className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-semibold uppercase tracking-wide"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--accent)',
                  color: 'var(--text-secondary)',
                  opacity: 0.9,
                  width: '184px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  cursor: 'grabbing',
                }}
              >
                <span style={{ color: 'var(--accent)' }}>⠿</span>
                <span style={{ color: 'var(--text-muted)' }}>▼</span>
                <span className="flex-1 truncate">{activeChapter.title}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
```

Key changes vs. the original:
- Added `useState` import
- Added `DragOverlay`, `DragStartEvent` imports from `@dnd-kit/core`
- Added `SortableContext`, `verticalListSortingStrategy` imports from `@dnd-kit/sortable`
- Added `reorderChapters` import from `use-chapters`
- Added `activeChapterId` state + `handleDragStart`
- `handleDragEnd` now checks for chapter drag first (early return after reorder)
- `SortableContext` wraps the chapters list
- `DragOverlay` renders the ghost when a chapter is being dragged

- [ ] **Step 2: Verify the app compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run --reporter=verbose
```

Expected: all tests pass (45 total: 41 existing + 4 new from Task 1).

- [ ] **Step 4: Commit**

```bash
git add components/workspace/scene-tree.tsx
git commit -m "feat: chapter drag & drop with DragOverlay ghost"
```

---

## Self-Review Checklist

After all tasks complete, manually verify in the browser:

- [ ] Hovering over a chapter row shows the ⠿ handle
- [ ] Dragging the ⠿ handle moves the ghost overlay
- [ ] Dropping reorders the chapter in the list and persists after page reload
- [ ] Clicking the chapter title still expands/collapses (⠿ click does not trigger collapse)
- [ ] Scene drag within a chapter still works
- [ ] Empty chapter list shows "Sin capítulos" correctly
