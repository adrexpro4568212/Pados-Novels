'use client'

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useChapters, createChapter } from '@/lib/hooks/use-chapters'
import { updateScene } from '@/lib/hooks/use-scenes'
import { db } from '@/lib/db'
import { SceneTreeChapter } from './scene-tree-chapter'

interface SceneTreeProps {
  novelId: string
}

export function SceneTree({ novelId }: SceneTreeProps) {
  const chapters = useChapters(novelId) ?? []

  async function handleAddChapter() {
    await createChapter({ novelId, title: `Capítulo ${chapters.length + 1}` })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

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
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
        </DndContext>
      </div>
    </div>
  )
}
