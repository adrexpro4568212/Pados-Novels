import { describe, it, expect } from 'vitest'
import { countWords, countWordsInTiptap, formatDate, newId } from '@/lib/utils'

describe('countWords', () => {
  it('counts words in plain text', () => {
    expect(countWords('hello world foo')).toBe(3)
  })
  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0)
  })
  it('handles extra whitespace', () => {
    expect(countWords('  hello   world  ')).toBe(2)
  })
})

describe('countWordsInTiptap', () => {
  it('counts words in Tiptap JSON', () => {
    const json = JSON.stringify({
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello world test' }],
      }],
    })
    expect(countWordsInTiptap(json)).toBe(3)
  })
  it('returns 0 for empty string', () => {
    expect(countWordsInTiptap('')).toBe(0)
  })
  it('returns 0 for invalid JSON', () => {
    expect(countWordsInTiptap('not json')).toBe(0)
  })
})

describe('formatDate', () => {
  it('formats timestamp as relative string', () => {
    const now = Date.now()
    expect(formatDate(now)).toBe('hace un momento')
  })
})

describe('newId', () => {
  it('generates a non-empty string', () => {
    expect(typeof newId()).toBe('string')
    expect(newId().length).toBeGreaterThan(0)
  })
  it('generates unique ids', () => {
    expect(newId()).not.toBe(newId())
  })
})
