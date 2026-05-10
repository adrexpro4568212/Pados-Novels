import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/lib/db'
import { createChapter, reorderChapters } from '@/lib/hooks/use-chapters'

beforeEach(async () => {
  await db.chapters.clear()
})

async function makeChapters(novelId: string, count: number) {
  const chapters = []
  for (let i = 0; i < count; i++) {
    chapters.push(await createChapter({ novelId, title: `Cap ${i + 1}` }))
  }
  // return sorted by order as they would come from useChapters
  return db.chapters.where('novelId').equals(novelId).sortBy('order')
}

describe('reorderChapters', () => {
  it('moves a chapter from index 0 to index 2 (of 3)', async () => {
    const chapters = await makeChapters('novel-1', 3)
    const [a, b, c] = chapters
    await reorderChapters(chapters, a.id, c.id)
    const result = await db.chapters.where('novelId').equals('novel-1').sortBy('order')
    expect(result.map(ch => ch.title)).toEqual(['Cap 2', 'Cap 3', 'Cap 1'])
  })

  it('does nothing when fromId equals toId', async () => {
    const chapters = await makeChapters('novel-1', 2)
    const [a] = chapters
    await reorderChapters(chapters, a.id, a.id)
    const result = await db.chapters.where('novelId').equals('novel-1').sortBy('order')
    expect(result.map(ch => ch.title)).toEqual(['Cap 1', 'Cap 2'])
  })

  it('moves the last chapter to first position', async () => {
    const chapters = await makeChapters('novel-1', 3)
    const [a, , c] = chapters
    await reorderChapters(chapters, c.id, a.id)
    const result = await db.chapters.where('novelId').equals('novel-1').sortBy('order')
    expect(result.map(ch => ch.title)).toEqual(['Cap 3', 'Cap 1', 'Cap 2'])
  })

  it('updates order fields sequentially starting from 0', async () => {
    const chapters = await makeChapters('novel-1', 3)
    const [a, , c] = chapters
    await reorderChapters(chapters, a.id, c.id)
    const result = await db.chapters.where('novelId').equals('novel-1').sortBy('order')
    expect(result.map(ch => ch.order)).toEqual([0, 1, 2])
  })
})
