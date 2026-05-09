'use client'

import { useParams } from 'next/navigation'
import { useChapters } from '@/lib/hooks/use-chapters'
import { useScenes } from '@/lib/hooks/use-scenes'
import Link from 'next/link'

function ChapterBlock({ chapter, novelId }: { chapter: { id: string; title: string }; novelId: string }) {
  const scenes = useScenes(chapter.id) ?? []
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
        {chapter.title}
      </h2>
      <div className="flex flex-col gap-1">
        {scenes.map(scene => (
          <Link
            key={scene.id}
            href={`/novel/${novelId}/manuscript/${scene.id}`}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-opacity"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <span style={{ color: 'var(--text-primary)' }}>{scene.title}</span>
            <span style={{ color: 'var(--text-muted)' }}>{scene.wordCount > 0 ? `${scene.wordCount} pal.` : 'Vacía'}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function ManuscriptPage() {
  const params = useParams<{ novelId: string }>()
  const chapters = useChapters(params.novelId) ?? []

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Manuscrito</h1>
      {chapters.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Usa el panel izquierdo para añadir capítulos y escenas.
        </p>
      ) : (
        chapters.map(ch => <ChapterBlock key={ch.id} chapter={ch} novelId={params.novelId} />)
      )}
    </div>
  )
}
