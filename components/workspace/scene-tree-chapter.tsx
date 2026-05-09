'use client'

import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
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

  async function handleAddScene() {
    await createScene({
      novelId,
      chapterId: chapter.id,
      title: `Escena ${scenes.length + 1}`,
    })
  }

  return (
    <div>
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer group"
        onClick={() => setOpen(o => !o)}
      >
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
