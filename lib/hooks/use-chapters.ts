import { useLiveQuery } from 'dexie-react-hooks'
import { arrayMove } from '@dnd-kit/sortable'
import { db } from '@/lib/db'
import { newId } from '@/lib/utils'
import type { Chapter } from '@/lib/db.types'

export async function createChapter(data: { novelId: string; title: string }): Promise<Chapter> {
  const existing = await db.chapters.where('novelId').equals(data.novelId).count()
  const chapter: Chapter = {
    id: newId(),
    novelId: data.novelId,
    title: data.title,
    order: existing,
    createdAt: Date.now(),
  }
  await db.chapters.add(chapter)
  return chapter
}

export async function updateChapter(id: string, data: Partial<Pick<Chapter, 'title' | 'order'>>): Promise<void> {
  await db.chapters.update(id, data)
}

export async function deleteChapter(id: string): Promise<void> {
  await db.transaction('rw', [db.chapters, db.scenes], async () => {
    await db.scenes.where('chapterId').equals(id).delete()
    await db.chapters.delete(id)
  })
}

export function useChapters(novelId: string) {
  return useLiveQuery(
    () => db.chapters.where('novelId').equals(novelId).sortBy('order'),
    [novelId],
    []
  )
}

/**
 * Reorders chapters in Dexie after a drag-and-drop.
 * chapters: the current sorted array (from useChapters)
 * fromId:   the id of the chapter being dragged
 * toId:     the id of the chapter it was dropped onto
 */
export async function reorderChapters(
  chapters: Chapter[],
  fromId: string,
  toId: string
): Promise<void> {
  if (fromId === toId) return
  const oldIndex = chapters.findIndex(c => c.id === fromId)
  const newIndex = chapters.findIndex(c => c.id === toId)
  if (oldIndex === -1 || newIndex === -1) return
  const reordered = arrayMove(chapters, oldIndex, newIndex)
  await Promise.all(
    reordered.map((chapter, index) => updateChapter(chapter.id, { order: index }))
  )
}
