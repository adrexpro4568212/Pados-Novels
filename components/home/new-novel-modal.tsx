'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createNovel } from '@/lib/hooks/use-novels'
import { useRouter } from 'next/navigation'

interface NewNovelModalProps {
  open: boolean
  onClose: () => void
}

export function NewNovelModal({ open, onClose }: NewNovelModalProps) {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate() {
    if (!title.trim()) return
    setLoading(true)
    const novel = await createNovel({ title: title.trim(), genre })
    setLoading(false)
    onClose()
    router.push(`/novel/${novel.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>Nueva novela</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <Input
            placeholder="Título"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <Input
            placeholder="Género (opcional)"
            value={genre}
            onChange={e => setGenre(e.target.value)}
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || loading}
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            {loading ? 'Creando...' : 'Crear novela'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
