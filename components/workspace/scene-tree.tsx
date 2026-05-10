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
