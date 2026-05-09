import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/lib/db'
import { createChapter } from '@/lib/hooks/use-chapters'
import { createScene, updateSceneContent, getScenesForNovel } from '@/lib/hooks/use-scenes'

beforeEach(async () => {
  await db.chapters.clear()
  await db.scenes.clear()
})

describe('createScene', () => {
  it('creates a scene under a chapter', async () => {
    const chapter = await createChapter({ novelId: 'novel-1', title: 'Cap 1' })
    const scene = await createScene({ novelId: 'novel-1', chapterId: chapter.id, title: 'Escena 1' })
    expect(scene.chapterId).toBe(chapter.id)
    expect(scene.wordCount).toBe(0)
  })
})

describe('updateSceneContent', () => {
  it('updates content and recalculates wordCount', async () => {
    const chapter = await createChapter({ novelId: 'novel-1', title: 'Cap 1' })
    const scene = await createScene({ novelId: 'novel-1', chapterId: chapter.id, title: 'Sc' })
    const content = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world test' }] }],
    })
    await updateSceneContent(scene.id, content)
    const updated = await db.scenes.get(scene.id)
    expect(updated?.wordCount).toBe(3)
  })
})

describe('getScenesForNovel', () => {
  it('returns all scenes for a novel', async () => {
    const ch = await createChapter({ novelId: 'novel-2', title: 'Ch' })
    await createScene({ novelId: 'novel-2', chapterId: ch.id, title: 'S1' })
    await createScene({ novelId: 'novel-2', chapterId: ch.id, title: 'S2' })
    const scenes = await getScenesForNovel('novel-2')
    expect(scenes).toHaveLength(2)
  })
})
