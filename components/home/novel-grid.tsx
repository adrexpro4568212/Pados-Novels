'use client'

import { useState } from 'react'
import { useNovels, deleteNovel, updateNovel } from '@/lib/hooks/use-novels'
import { NovelCard } from './novel-card'
import { NewNovelModal } from './new-novel-modal'
import { Button } from '@/components/ui/button'

export function NovelGrid() {
  const novels = useNovels() ?? []
  const [modalOpen, setModalOpen] = useState(false)

  async function handleDelete(id: string) {
    if (confirm('¿Eliminar esta novela y todo su contenido?')) {
      await deleteNovel(id)
    }
  }

  async function handleRename(id: string) {
    const name = prompt('Nuevo título:')
    if (name?.trim()) await updateNovel(id, { title: name.trim() })
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Mis Novelas
        </h2>
        <Button
          size="sm"
          onClick={() => setModalOpen(true)}
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          + Nueva
        </Button>
      </div>

      {novels.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
          <p className="text-4xl mb-3">✦</p>
          <p className="text-sm">No hay novelas todavía.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-3 text-sm underline"
            style={{ color: 'var(--accent)' }}
          >
            Crea la primera
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {novels.map(novel => (
            <NovelCard
              key={novel.id}
              novel={novel}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))}
        </div>
      )}

      <NewNovelModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
