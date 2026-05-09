import { useLiveQuery } from 'dexie-react-hooks'
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
