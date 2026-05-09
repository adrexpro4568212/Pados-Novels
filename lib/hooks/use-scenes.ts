import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { newId, countWordsInTiptap } from '@/lib/utils'
import type { Scene } from '@/lib/db.types'

export async function createScene(data: { novelId: string; chapterId: string; title: string }): Promise<Scene> {
  const existing = await db.scenes.where('chapterId').equals(data.chapterId).count()
  const scene: Scene = {
    id: newId(),
    novelId: data.novelId,
    chapterId: data.chapterId,
    title: data.title,
    content: '',
    synopsis: '',
    wordCount: 0,
    order: existing,
    updatedAt: Date.now(),
  }
  await db.scenes.add(scene)
  return scene
}

export async function updateSceneContent(id: string, content: string): Promise<void> {
  await db.scenes.update(id, {
    content,
    wordCount: countWordsInTiptap(content),
    updatedAt: Date.now(),
  })
}

export async function updateScene(id: string, data: Partial<Pick<Scene, 'title' | 'synopsis' | 'order'>>): Promise<void> {
  await db.scenes.update(id, data)
}

export async function deleteScene(id: string): Promise<void> {
  await db.scenes.delete(id)
}

export async function getScenesForNovel(novelId: string): Promise<Scene[]> {
  return db.scenes.where('novelId').equals(novelId).toArray()
}

export function useScenes(chapterId: string) {
  return useLiveQuery(
    () => db.scenes.where('chapterId').equals(chapterId).sortBy('order'),
    [chapterId],
    []
  )
}

export function useScene(sceneId: string) {
  return useLiveQuery(() => db.scenes.get(sceneId), [sceneId])
}

export function useNovelWordCount(novelId: string): number {
  const result = useLiveQuery(
    async () => {
      const scenes = await db.scenes.where('novelId').equals(novelId).toArray()
      return scenes.reduce((sum, s) => sum + s.wordCount, 0)
    },
    [novelId],
    0
  )
  return result ?? 0
}
