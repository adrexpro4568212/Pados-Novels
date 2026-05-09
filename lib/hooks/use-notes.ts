import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { newId } from '@/lib/utils'
import type { Note } from '@/lib/db.types'

export async function createNote(novelId: string | null, content = ''): Promise<Note> {
  const note: Note = {
    id: newId(),
    novelId,
    content,
    tags: [],
    createdAt: Date.now(),
  }
  await db.notes.add(note)
  return note
}

export async function updateNote(id: string, data: Partial<Pick<Note, 'content' | 'tags'>>): Promise<void> {
  await db.notes.update(id, data)
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id)
}

export function useNotes(novelId: string) {
  return useLiveQuery(
    () => db.notes.where('novelId').equals(novelId).reverse().sortBy('createdAt'),
    [novelId],
    []
  )
}
