import { create } from 'zustand'

interface AppState {
  activeNovelId: string | null
  activeSceneId: string | null
  isInspectorOpen: boolean
  isZenMode: boolean
  setActiveNovel: (id: string | null) => void
  setActiveScene: (id: string | null) => void
  toggleInspector: () => void
  setZenMode: (zen: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeNovelId: null,
  activeSceneId: null,
  isInspectorOpen: true,
  isZenMode: false,
  setActiveNovel: (id) => set({ activeNovelId: id }),
  setActiveScene: (id) => set({ activeSceneId: id }),
  toggleInspector: () => set((s) => ({ isInspectorOpen: !s.isInspectorOpen })),
  setZenMode: (zen) => set({ isZenMode: zen }),
}))
