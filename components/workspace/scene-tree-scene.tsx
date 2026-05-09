'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { usePathname, useRouter } from 'next/navigation'
import type { Scene } from '@/lib/db.types'

interface SceneTreeSceneProps {
  scene: Scene
  novelId: string
}

export function SceneTreeScene({ scene, novelId }: SceneTreeSceneProps) {
  const router = useRouter()
  const pathname = usePathname()
  const active = pathname.includes(scene.id)

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: scene.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer group"
      onClick={() => router.push(`/novel/${novelId}/manuscript/${scene.id}`)}
      {...attributes}
    >
      <span
        className="cursor-grab opacity-0 group-hover:opacity-100 text-xs"
        style={{ color: 'var(--text-muted)' }}
        {...listeners}
      >
        ⠿
      </span>
      <span
        className="flex-1 truncate"
        style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        {active && <span style={{ color: 'var(--accent)' }}>✦ </span>}
        {scene.title}
      </span>
      <span className="text-xs opacity-0 group-hover:opacity-60" style={{ color: 'var(--text-muted)' }}>
        {scene.wordCount > 0 ? scene.wordCount : ''}
      </span>
    </div>
  )
}
