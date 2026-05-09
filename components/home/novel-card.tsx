'use client'

import { useRouter } from 'next/navigation'
import { useNovelWordCount } from '@/lib/hooks/use-scenes'
import { formatDate } from '@/lib/utils'
import type { Novel } from '@/lib/db.types'

interface NovelCardProps {
  novel: Novel
  onDelete: (id: string) => void
  onRename: (id: string) => void
}

export function NovelCard({ novel, onDelete, onRename }: NovelCardProps) {
  const router = useRouter()
  const wordCount = useNovelWordCount(novel.id)
  const progress = novel.targetWordCount > 0 ? Math.min((wordCount / novel.targetWordCount) * 100, 100) : 0

  return (
    <div
      className="group relative rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.01]"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      onClick={() => router.push(`/novel/${novel.id}`)}
    >
      {/* Color identity strip */}
      <div className="w-8 h-10 rounded mb-3" style={{ background: novel.color, opacity: 0.85 }} />

      <h3 className="font-semibold text-sm mb-0.5 truncate" style={{ color: 'var(--text-primary)' }}>
        {novel.title}
      </h3>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        {novel.genre || 'Sin género'} · {wordCount.toLocaleString('es')} palabras
      </p>

      {/* Progress bar */}
      <div className="rounded-full h-1.5 mb-2" style={{ background: 'var(--bg-tertiary)' }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${progress}%`, background: novel.color }}
        />
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Editado {formatDate(novel.updatedAt)}
      </p>

      {/* Hover actions */}
      <div className="absolute top-3 right-3 hidden group-hover:flex gap-1">
        <button
          className="text-xs px-2 py-1 rounded"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          onClick={(e) => { e.stopPropagation(); onRename(novel.id) }}
        >
          ✏️
        </button>
        <button
          className="text-xs px-2 py-1 rounded"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          onClick={(e) => { e.stopPropagation(); onDelete(novel.id) }}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
