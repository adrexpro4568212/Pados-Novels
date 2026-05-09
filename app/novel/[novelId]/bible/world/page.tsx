'use client'

import { useParams } from 'next/navigation'
import { useNotes, createNote, updateNote, deleteNote } from '@/lib/hooks/use-notes'
import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

function NoteItem({ note }: { note: { id: string; content: string } }) {
  const [content, setContent] = useState(note.content)

  useEffect(() => {
    setContent(note.content)
  }, [note.id])

  useEffect(() => {
    const t = setTimeout(() => updateNote(note.id, { content }), 500)
    return () => clearTimeout(t)
  }, [content, note.id])

  return (
    <div className="rounded-lg p-3 group relative" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={2}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', resize: 'none' }}
      />
      <button
        type="button"
        aria-label="Eliminar nota"
        className="absolute top-2 right-2 text-xs opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        style={{ color: 'var(--text-muted)' }}
        onClick={() => { if (confirm('¿Eliminar esta nota?')) deleteNote(note.id) }}
      >
        🗑️
      </button>
    </div>
  )
}

export default function WorldPage() {
  const { novelId } = useParams<{ novelId: string }>()
  const notes = useNotes(novelId) ?? []
  const [newContent, setNewContent] = useState('')

  async function handleAdd() {
    if (!newContent.trim()) return
    await createNote(novelId, newContent.trim())
    setNewContent('')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Mundo y Lore</h2>

      <div className="flex flex-col gap-2 mb-6">
        <Textarea
          placeholder="Nueva nota de mundo…"
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          rows={3}
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <Button
          onClick={handleAdd}
          size="sm"
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)', alignSelf: 'flex-end' }}
        >
          Añadir
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {notes.map(note => <NoteItem key={note.id} note={note} />)}
      </div>
    </div>
  )
}
