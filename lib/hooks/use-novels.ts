'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { newId } from '@/lib/utils'
import type { Novel } from '@/lib/db.types'

export const NOVEL_COLORS = [
  '#8b7355', '#4a6b8b', '#6b4a8b', '#4a8b6b', '#8b4a4a',
  '#6b8b4a', '#4a6b8b', '#8b6b4a', '#4a8b8b', '#8b4a6b',
]

function randomColor(): string {
  return NOVEL_COLORS[Math.floor(Math.random() * NOVEL_COLORS.length)]
}

export async function createNovel(data: { title: string; genre: string }): Promise<Novel> {
  const novel: Novel = {
    id: newId(),
    title: data.title,
    synopsis: '',
    genre: data.genre,
    color: randomColor(),
    targetWordCount: 80000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  await db.novels.add(novel)
  return novel
}

export async function getNovels(): Promise<Novel[]> {
  return db.novels.orderBy('updatedAt').reverse().toArray()
}

export async function updateNovel(id: string, data: Partial<Omit<Novel, 'id' | 'createdAt'>>): Promise<void> {
  await db.novels.update(id, { ...data, updatedAt: Date.now() })
}

export async function deleteNovel(id: string): Promise<void> {
  await db.transaction('rw', [db.novels, db.chapters, db.scenes, db.characters, db.notes, db.writing_sessions], async () => {
    const chapters = await db.chapters.where('novelId').equals(id).toArray()
    const chapterIds = chapters.map(c => c.id)
    await db.scenes.where('novelId').equals(id).delete()
    await db.chapters.bulkDelete(chapterIds)
    await db.characters.where('novelId').equals(id).delete()
    await db.notes.where('novelId').equals(id).delete()
    await db.writing_sessions.where('novelId').equals(id).delete()
    await db.novels.delete(id)
  })
}

export function useNovels() {
  return useLiveQuery(() => db.novels.orderBy('updatedAt').reverse().toArray(), [], [])
}

export function useNovel(id: string) {
  return useLiveQuery(() => db.novels.get(id), [id])
}
