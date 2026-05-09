import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/lib/stores/app-store'

beforeEach(() => {
  useAppStore.setState({
    activeNovelId: null,
    activeSceneId: null,
    isInspectorOpen: true,
    isZenMode: false,
  })
})

describe('useAppStore', () => {
  it('sets active novel', () => {
    useAppStore.getState().setActiveNovel('novel-1')
    expect(useAppStore.getState().activeNovelId).toBe('novel-1')
  })

  it('sets active scene', () => {
    useAppStore.getState().setActiveScene('scene-1')
    expect(useAppStore.getState().activeSceneId).toBe('scene-1')
  })

  it('toggles inspector', () => {
    expect(useAppStore.getState().isInspectorOpen).toBe(true)
    useAppStore.getState().toggleInspector()
    expect(useAppStore.getState().isInspectorOpen).toBe(false)
  })

  it('sets zen mode', () => {
    useAppStore.getState().setZenMode(true)
    expect(useAppStore.getState().isZenMode).toBe(true)
  })
})
