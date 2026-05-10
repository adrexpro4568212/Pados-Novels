'use client'

import { useState } from 'react'
import { useNovels, deleteNovel, updateNovel } from '@/lib/hooks/use-novels'
import { buildBackup, downloadBackup } from '@/lib/backup'
import { NovelCard } from './novel-card'
import { NewNovelModal } from './new-novel-modal'
import { ImportNovelModal } from './import-novel-modal'
import { Button } from '@/components/ui/button'

export function NovelGrid() {
  const novels = useNovels() ?? []
  const [newOpen, setNewOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  async function handleDelete(id: string) {
    if (confirm('¿Eliminar esta novela y todo su contenido?')) {
      await deleteNovel(id)
    }
  }

  async function handleRename(id: string) {
    const name = prompt('Nuevo título:')
    if (name?.trim()) await updateNovel(id, { title: name.trim() })
  }

  async function handleExport(id: string) {
    try {
      const backup = await buildBackup(id)
      downloadBackup(backup)
    } catch {
      alert('Error al exportar la novela. Intenta de nuevo.')
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Mis Novelas
        </h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={() => setImportOpen(true)}
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            ⬆ Importar
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={() => setNewOpen(true)}
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            + Nueva
          </Button>
        </div>
      </div>

      {novels.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
          <p className="text-4xl mb-3">✦</p>
          <p className="text-sm">No hay novelas todavía.</p>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
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
              onExport={handleExport}
            />
          ))}
        </div>
      )}

      <NewNovelModal open={newOpen} onClose={() => setNewOpen(false)} />
      <ImportNovelModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  )
}
