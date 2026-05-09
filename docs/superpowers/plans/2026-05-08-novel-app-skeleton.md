# Novel App Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full skeleton of a web-based novel writing app with 3 themes, local-first IndexedDB storage, Scrivener-style workspace, scene editor, character bible, and stats.

**Architecture:** Next.js 14 App Router + TypeScript. All data stored locally in IndexedDB via Dexie.js. Zustand manages ephemeral UI state (active scene, zen mode, inspector open). Three CSS-variable themes switched via next-themes with no flash on load.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Tiptap, Dexie.js, Zustand, next-themes, @dnd-kit/sortable, vitest, fake-indexeddb, @testing-library/react

---

## File Map

```
app/
  layout.tsx                                  — root layout, ThemeProvider, fonts
  globals.css                                 — CSS variable themes (dark/warm/modern)
  page.tsx                                    — Home: stats bar + novel gallery
  settings/page.tsx                           — Theme selector + word count goals
  novel/[novelId]/
    layout.tsx                                — Workspace shell (tabs + 3-column)
    page.tsx                                  — Redirect → ./manuscript
    manuscript/
      page.tsx                                — Chapter/scene list overview
      [sceneId]/page.tsx                      — Scene editor (Tiptap)
    bible/
      page.tsx                                — Bible overview (links to characters/world)
      characters/
        page.tsx                              — Character list
        [charId]/page.tsx                     — Character form
      world/page.tsx                          — World notes (Tiptap)
    board/page.tsx                            — Placeholder (future)
    stats/page.tsx                            — Progress stats

lib/
  db.types.ts                                 — TypeScript interfaces for all tables
  db.ts                                       — Dexie database class + singleton
  utils.ts                                    — cn(), uuid(), countWords(), formatDate()
  stores/app-store.ts                         — Zustand: activeNovelId, activeSceneId, zenMode, inspectorOpen
  hooks/
    use-novels.ts                             — CRUD hooks for novels table
    use-chapters.ts                           — CRUD hooks for chapters table
    use-scenes.ts                             — CRUD hooks for scenes table
    use-characters.ts                         — CRUD hooks for characters table
    use-notes.ts                              — CRUD hooks for notes table
    use-writing-sessions.ts                   — writing_sessions read/write + today's word count

components/
  layout/
    theme-provider.tsx                        — next-themes wrapper
  home/
    stats-bar.tsx                             — global word count stats strip
    novel-card.tsx                            — single novel card with progress bar
    novel-grid.tsx                            — responsive grid of NovelCards
    new-novel-modal.tsx                       — dialog to create a novel
  workspace/
    workspace-tabs.tsx                        — top tab bar (Manuscrito/Biblia/Tablero/Stats)
    scene-tree.tsx                            — left sidebar: collapsible chapters + scenes
    scene-tree-chapter.tsx                    — single chapter row with expand/collapse
    scene-tree-scene.tsx                      — single scene row, drag handle
    inspector.tsx                             — right panel: synopsis, characters, word count
  editor/
    scene-editor.tsx                          — Tiptap editor with autosave + zen toggle
  characters/
    character-list.tsx                        — grid of character cards
    character-form.tsx                        — form with basic + psychology sections
  settings/
    theme-selector.tsx                        — 3-option theme picker with live preview

tests/
  lib/utils.test.ts
  lib/db.test.ts
  lib/hooks/use-novels.test.ts
  lib/hooks/use-scenes.test.ts
  lib/stores/app-store.test.ts
```

---

## Task 1: Project Scaffold + Test Infrastructure

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd "C:\Users\USER\OneDrive\Escritorio\Nueva carpeta"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

Expected: project files created — `app/`, `package.json`, `tsconfig.json`, `tailwind.config.ts`, etc.

- [ ] **Step 2: Install all dependencies**

```bash
npm install dexie dexie-react-hooks zustand next-themes @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-character-count @tiptap/extension-placeholder @tiptap/extension-typography @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities uuid
npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event fake-indexeddb jsdom @types/uuid
```

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init --defaults
npx shadcn@latest add button dialog input textarea badge progress tabs separator tooltip
```

- [ ] **Step 4: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 5: Create `vitest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
```

- [ ] **Step 6: Add test script to `package.json`**

Add under `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 7: Verify test runner works**

```bash
npm run test:run
```

Expected: `No test files found` — that's fine, no tests yet.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with full dependency set"
```

---

## Task 2: CSS Theme System

**Files:**
- Modify: `app/globals.css`
- Create: `components/layout/theme-provider.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write failing test for CSS variable existence**

Create `tests/themes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

const THEME_TOKENS = [
  '--bg-primary', '--bg-secondary', '--bg-tertiary',
  '--border', '--text-primary', '--text-secondary',
  '--text-muted', '--accent', '--accent-soft',
]

const THEMES = ['dark', 'warm', 'modern']

describe('theme tokens', () => {
  it('all themes define all required tokens', () => {
    // This is a contract test — if you add a token, add it here too
    expect(THEME_TOKENS).toHaveLength(9)
    expect(THEMES).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run test to verify setup**

```bash
npm run test:run -- tests/themes.test.ts
```

Expected: PASS (it's a contract test, not DOM-dependent).

- [ ] **Step 3: Replace `app/globals.css` with theme variables**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Estudio Nocturno (default dark) ── */
[data-theme='dark'],
:root {
  --bg-primary:    #0f0f13;
  --bg-secondary:  #13131a;
  --bg-tertiary:   #1e1e2a;
  --border:        #252530;
  --text-primary:  #e8e0d5;
  --text-secondary:#c9b99a;
  --text-muted:    #6b6b7a;
  --accent:        #c9b99a;
  --accent-soft:   rgba(201,185,154,0.10);
}

/* ── Papel y Tinta (warm) ── */
[data-theme='warm'] {
  --bg-primary:    #faf6f0;
  --bg-secondary:  #f5ede3;
  --bg-tertiary:   #ffffff;
  --border:        #e8ddd0;
  --text-primary:  #3d2b1f;
  --text-secondary:#9b7e5a;
  --text-muted:    #b8a898;
  --accent:        #9b7e5a;
  --accent-soft:   rgba(155,126,90,0.10);
}

/* ── Editorial Moderno (modern) ── */
[data-theme='modern'] {
  --bg-primary:    #f8f9fc;
  --bg-secondary:  #ffffff;
  --bg-tertiary:   #f1f5f9;
  --border:        #e2e8f0;
  --text-primary:  #1e293b;
  --text-secondary:#64748b;
  --text-muted:    #94a3b8;
  --accent:        #6366f1;
  --accent-soft:   #eef2ff;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

- [ ] **Step 4: Create `components/layout/theme-provider.tsx`**

```typescript
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

- [ ] **Step 5: Update `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import { ThemeProvider } from '@/components/layout/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' })

export const metadata: Metadata = {
  title: 'Novelr',
  description: 'Tu estudio de escritura personal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable}`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          themes={['dark', 'warm', 'modern']}
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: CSS theme system with 3 themes and ThemeProvider"
```

---

## Task 3: Database Types + Dexie Setup

**Files:**
- Create: `lib/db.types.ts`
- Create: `lib/db.ts`
- Create: `tests/lib/db.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/db.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/lib/db'
import type { Novel } from '@/lib/db.types'

beforeEach(async () => {
  await db.novels.clear()
})

describe('db - novels table', () => {
  it('adds and retrieves a novel', async () => {
    const novel: Novel = {
      id: 'test-id-1',
      title: 'La Tormenta',
      synopsis: '',
      genre: 'Drama',
      color: '#8b7355',
      targetWordCount: 80000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await db.novels.add(novel)
    const result = await db.novels.get('test-id-1')
    expect(result?.title).toBe('La Tormenta')
  })

  it('queries novels ordered by updatedAt', async () => {
    await db.novels.bulkAdd([
      { id: 'a', title: 'A', synopsis: '', genre: '', color: '#000', targetWordCount: 0, createdAt: 1, updatedAt: 1 },
      { id: 'b', title: 'B', synopsis: '', genre: '', color: '#000', targetWordCount: 0, createdAt: 2, updatedAt: 2 },
    ])
    const results = await db.novels.orderBy('updatedAt').reverse().toArray()
    expect(results[0].id).toBe('b')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test:run -- tests/lib/db.test.ts
```

Expected: FAIL — `@/lib/db` not found.

- [ ] **Step 3: Create `lib/db.types.ts`**

```typescript
export interface Novel {
  id: string
  title: string
  synopsis: string
  genre: string
  color: string
  targetWordCount: number
  createdAt: number
  updatedAt: number
}

export interface Chapter {
  id: string
  novelId: string
  title: string
  order: number
  createdAt: number
}

export interface Scene {
  id: string
  chapterId: string
  novelId: string
  title: string
  content: string        // Tiptap JSON string
  synopsis: string
  wordCount: number
  order: number
  updatedAt: number
}

export interface Character {
  id: string
  novelId: string
  name: string
  role: 'protagonist' | 'secondary' | 'antagonist' | 'other'
  age: string
  description: string
  internalWound: string
  falseBelief: string
  secretDesire: string
  notes: string
  createdAt: number
}

export interface Note {
  id: string
  novelId: string | null
  content: string
  tags: string[]
  createdAt: number
}

export interface WritingSession {
  id: string
  novelId: string
  date: string           // 'YYYY-MM-DD'
  wordCount: number
}
```

- [ ] **Step 4: Create `lib/db.ts`**

```typescript
import Dexie, { type Table } from 'dexie'
import type { Novel, Chapter, Scene, Character, Note, WritingSession } from './db.types'

export class NovelDB extends Dexie {
  novels!: Table<Novel>
  chapters!: Table<Chapter>
  scenes!: Table<Scene>
  characters!: Table<Character>
  notes!: Table<Note>
  writing_sessions!: Table<WritingSession>

  constructor() {
    super('novelrDB')
    this.version(1).stores({
      novels:           'id, updatedAt',
      chapters:         'id, novelId, order',
      scenes:           'id, novelId, chapterId, order, updatedAt',
      characters:       'id, novelId',
      notes:            'id, novelId, createdAt',
      writing_sessions: 'id, novelId, date',
    })
  }
}

export const db = new NovelDB()
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm run test:run -- tests/lib/db.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Dexie database schema with 6 tables"
```

---

## Task 4: Utility Functions

**Files:**
- Create: `lib/utils.ts`
- Create: `tests/lib/utils.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/utils.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test:run -- tests/lib/utils.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `lib/utils.ts`**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { v4 as uuidv4 } from 'uuid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function newId(): string {
  return uuidv4()
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function extractTiptapText(node: Record<string, unknown>): string {
  if (node.type === 'text') return (node.text as string) ?? ''
  const content = node.content as Record<string, unknown>[] | undefined
  if (content) return content.map(extractTiptapText).join(' ')
  return ''
}

export function countWordsInTiptap(content: string): number {
  if (!content) return 0
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>
    return countWords(extractTiptapText(parsed))
  } catch {
    return 0
  }
}

export function formatDate(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (minutes < 1) return 'hace un momento'
  if (minutes < 60) return `hace ${minutes}m`
  if (hours < 24) return `hace ${hours}h`
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- tests/lib/utils.test.ts
```

Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: utility functions — countWords, formatDate, newId"
```

---

## Task 5: Zustand App Store

**Files:**
- Create: `lib/stores/app-store.ts`
- Create: `tests/lib/stores/app-store.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/stores/app-store.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test:run -- tests/lib/stores/app-store.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `lib/stores/app-store.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- tests/lib/stores/app-store.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Zustand app store for UI state"
```

---

## Task 6: Data Hooks — Novels

**Files:**
- Create: `lib/hooks/use-novels.ts`
- Create: `tests/lib/hooks/use-novels.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/hooks/use-novels.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/lib/db'
import { getNovels, createNovel, updateNovel, deleteNovel } from '@/lib/hooks/use-novels'

beforeEach(async () => {
  await db.novels.clear()
})

describe('createNovel', () => {
  it('creates a novel and returns it', async () => {
    const novel = await createNovel({ title: 'La Tormenta', genre: 'Drama' })
    expect(novel.title).toBe('La Tormenta')
    expect(novel.id).toBeTruthy()
    expect(novel.color).toBeTruthy()
  })
})

describe('getNovels', () => {
  it('returns all novels ordered by updatedAt desc', async () => {
    await createNovel({ title: 'A', genre: '' })
    await new Promise(r => setTimeout(r, 10))
    await createNovel({ title: 'B', genre: '' })
    const novels = await getNovels()
    expect(novels[0].title).toBe('B')
    expect(novels).toHaveLength(2)
  })
})

describe('updateNovel', () => {
  it('updates novel fields', async () => {
    const novel = await createNovel({ title: 'Old Title', genre: '' })
    await updateNovel(novel.id, { title: 'New Title' })
    const updated = await db.novels.get(novel.id)
    expect(updated?.title).toBe('New Title')
  })
})

describe('deleteNovel', () => {
  it('deletes the novel', async () => {
    const novel = await createNovel({ title: 'To Delete', genre: '' })
    await deleteNovel(novel.id)
    const result = await db.novels.get(novel.id)
    expect(result).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test:run -- tests/lib/hooks/use-novels.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `lib/hooks/use-novels.ts`**

```typescript
'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { newId } from '@/lib/utils'
import type { Novel } from '@/lib/db.types'

const NOVEL_COLORS = [
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- tests/lib/hooks/use-novels.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: novel CRUD hooks with cascading delete"
```

---

## Task 7: Data Hooks — Chapters + Scenes

**Files:**
- Create: `lib/hooks/use-chapters.ts`
- Create: `lib/hooks/use-scenes.ts`
- Create: `tests/lib/hooks/use-scenes.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/hooks/use-scenes.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/lib/db'
import { createChapter } from '@/lib/hooks/use-chapters'
import { createScene, updateSceneContent, getScenesForNovel } from '@/lib/hooks/use-scenes'
import { countWordsInTiptap } from '@/lib/utils'

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
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test:run -- tests/lib/hooks/use-scenes.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create `lib/hooks/use-chapters.ts`**

```typescript
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
```

- [ ] **Step 4: Create `lib/hooks/use-scenes.ts`**

```typescript
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
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm run test:run -- tests/lib/hooks/use-scenes.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: chapters and scenes CRUD hooks"
```

---

## Task 8: Data Hooks — Characters, Notes, Writing Sessions

**Files:**
- Create: `lib/hooks/use-characters.ts`
- Create: `lib/hooks/use-notes.ts`
- Create: `lib/hooks/use-writing-sessions.ts`

- [ ] **Step 1: Create `lib/hooks/use-characters.ts`**

```typescript
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { newId } from '@/lib/utils'
import type { Character } from '@/lib/db.types'

export async function createCharacter(novelId: string): Promise<Character> {
  const character: Character = {
    id: newId(),
    novelId,
    name: 'Nuevo personaje',
    role: 'secondary',
    age: '',
    description: '',
    internalWound: '',
    falseBelief: '',
    secretDesire: '',
    notes: '',
    createdAt: Date.now(),
  }
  await db.characters.add(character)
  return character
}

export async function updateCharacter(id: string, data: Partial<Omit<Character, 'id' | 'novelId' | 'createdAt'>>): Promise<void> {
  await db.characters.update(id, data)
}

export async function deleteCharacter(id: string): Promise<void> {
  await db.characters.delete(id)
}

export function useCharacters(novelId: string) {
  return useLiveQuery(
    () => db.characters.where('novelId').equals(novelId).toArray(),
    [novelId],
    []
  )
}

export function useCharacter(id: string) {
  return useLiveQuery(() => db.characters.get(id), [id])
}
```

- [ ] **Step 2: Create `lib/hooks/use-notes.ts`**

```typescript
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
```

- [ ] **Step 3: Create `lib/hooks/use-writing-sessions.ts`**

```typescript
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { newId, todayString } from '@/lib/utils'

export async function recordWritingSession(novelId: string, currentWordCount: number): Promise<void> {
  const today = todayString()
  const existing = await db.writing_sessions
    .where('[novelId+date]')
    .equals([novelId, today])
    .first()
    .catch(() =>
      db.writing_sessions.where('novelId').equals(novelId).filter(s => s.date === today).first()
    )

  if (existing) {
    await db.writing_sessions.update(existing.id, { wordCount: currentWordCount })
  } else {
    await db.writing_sessions.add({
      id: newId(),
      novelId,
      date: today,
      wordCount: currentWordCount,
    })
  }
}

export function useTodayWordCount(novelId: string): number {
  const result = useLiveQuery(
    async () => {
      const today = todayString()
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

      const [todaySession, yesterdaySession] = await Promise.all([
        db.writing_sessions.where('novelId').equals(novelId).filter(s => s.date === today).first(),
        db.writing_sessions.where('novelId').equals(novelId).filter(s => s.date === yesterday).first(),
      ])

      if (!todaySession) return 0
      return todaySession.wordCount - (yesterdaySession?.wordCount ?? 0)
    },
    [novelId],
    0
  )
  return result ?? 0
}

export function useWritingSessions(novelId: string) {
  return useLiveQuery(
    () => db.writing_sessions.where('novelId').equals(novelId).sortBy('date'),
    [novelId],
    []
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: characters, notes, and writing-sessions hooks"
```

---

## Task 9: Home Page — Stats Bar + Novel Grid

**Files:**
- Create: `components/home/stats-bar.tsx`
- Create: `components/home/novel-card.tsx`
- Create: `components/home/novel-grid.tsx`
- Create: `components/home/new-novel-modal.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create `components/home/stats-bar.tsx`**

```typescript
'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { todayString } from '@/lib/utils'

export function StatsBar() {
  const novelCount = useLiveQuery(() => db.novels.count(), [], 0) ?? 0

  const totalWords = useLiveQuery(
    async () => {
      const scenes = await db.scenes.toArray()
      return scenes.reduce((sum, s) => sum + s.wordCount, 0)
    },
    [],
    0
  ) ?? 0

  const todayWords = useLiveQuery(
    async () => {
      const today = todayString()
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
      const novels = await db.novels.toArray()
      let total = 0
      for (const novel of novels) {
        const [t, y] = await Promise.all([
          db.writing_sessions.where('novelId').equals(novel.id).filter(s => s.date === today).first(),
          db.writing_sessions.where('novelId').equals(novel.id).filter(s => s.date === yesterday).first(),
        ])
        if (t) total += t.wordCount - (y?.wordCount ?? 0)
      }
      return total
    },
    [],
    0
  ) ?? 0

  return (
    <div className="flex gap-6 mb-8">
      {[
        { label: 'novelas', value: novelCount },
        { label: 'palabras totales', value: totalWords.toLocaleString('es') },
        { label: 'escritas hoy', value: todayWords.toLocaleString('es') },
      ].map(({ label, value }) => (
        <div key={label} className="rounded-lg px-5 py-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{value}</div>
          <div className="text-xs uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/home/novel-card.tsx`**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useNovelWordCount } from '@/lib/hooks/use-scenes'
import { formatDate } from '@/lib/utils'
import type { Novel } from '@/lib/db.types'

interface NovelCardProps {
  novel: Novel
  onDelete: (id: string) => void
  onRename: (id: string) => void
}

export function NovelCard({ novel, onDelete, onRename }: NovelCardProps) {
  const router = useRouter()
  const wordCount = useNovelWordCount(novel.id)
  const progress = novel.targetWordCount > 0 ? Math.min((wordCount / novel.targetWordCount) * 100, 100) : 0

  return (
    <div
      className="group relative rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.01]"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      onClick={() => router.push(`/novel/${novel.id}`)}
    >
      {/* Color identity strip */}
      <div className="w-8 h-10 rounded mb-3" style={{ background: novel.color, opacity: 0.85 }} />

      <h3 className="font-semibold text-sm mb-0.5 truncate" style={{ color: 'var(--text-primary)' }}>
        {novel.title}
      </h3>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        {novel.genre || 'Sin género'} · {wordCount.toLocaleString('es')} palabras
      </p>

      {/* Progress bar */}
      <div className="rounded-full h-1.5 mb-2" style={{ background: 'var(--bg-tertiary)' }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${progress}%`, background: novel.color }}
        />
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Editado {formatDate(novel.updatedAt)}
      </p>

      {/* Hover actions */}
      <div className="absolute top-3 right-3 hidden group-hover:flex gap-1">
        <button
          className="text-xs px-2 py-1 rounded"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          onClick={(e) => { e.stopPropagation(); onRename(novel.id) }}
        >
          ✏️
        </button>
        <button
          className="text-xs px-2 py-1 rounded"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          onClick={(e) => { e.stopPropagation(); onDelete(novel.id) }}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/home/new-novel-modal.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createNovel } from '@/lib/hooks/use-novels'
import { useRouter } from 'next/navigation'

interface NewNovelModalProps {
  open: boolean
  onClose: () => void
}

export function NewNovelModal({ open, onClose }: NewNovelModalProps) {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate() {
    if (!title.trim()) return
    setLoading(true)
    const novel = await createNovel({ title: title.trim(), genre })
    setLoading(false)
    onClose()
    router.push(`/novel/${novel.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>Nueva novela</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <Input
            placeholder="Título"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <Input
            placeholder="Género (opcional)"
            value={genre}
            onChange={e => setGenre(e.target.value)}
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || loading}
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            {loading ? 'Creando...' : 'Crear novela'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Create `components/home/novel-grid.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useNovels, deleteNovel, updateNovel } from '@/lib/hooks/use-novels'
import { NovelCard } from './novel-card'
import { NewNovelModal } from './new-novel-modal'
import { Button } from '@/components/ui/button'

export function NovelGrid() {
  const novels = useNovels() ?? []
  const [modalOpen, setModalOpen] = useState(false)

  async function handleDelete(id: string) {
    if (confirm('¿Eliminar esta novela y todo su contenido?')) {
      await deleteNovel(id)
    }
  }

  async function handleRename(id: string) {
    const name = prompt('Nuevo título:')
    if (name?.trim()) await updateNovel(id, { title: name.trim() })
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Mis Novelas
        </h2>
        <Button
          size="sm"
          onClick={() => setModalOpen(true)}
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          + Nueva
        </Button>
      </div>

      {novels.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
          <p className="text-4xl mb-3">✦</p>
          <p className="text-sm">No hay novelas todavía.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-3 text-sm underline"
            style={{ color: 'var(--accent)' }}
          >
            Crea la primera
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {novels.map(novel => (
            <NovelCard
              key={novel.id}
              novel={novel}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))}
        </div>
      )}

      <NewNovelModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
```

- [ ] **Step 5: Replace `app/page.tsx`**

```typescript
import { StatsBar } from '@/components/home/stats-bar'
import { NovelGrid } from '@/components/home/novel-grid'

export default function HomePage() {
  return (
    <main className="min-h-screen p-8" style={{ background: 'var(--bg-primary)' }}>
      <header className="mb-8 flex items-center gap-3">
        <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>✦</span>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Novelr</h1>
      </header>
      <StatsBar />
      <NovelGrid />
    </main>
  )
}
```

- [ ] **Step 6: Run dev server and verify home page renders**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: dark background, stats bar (0 novelas), empty state with "Crea la primera". Click — modal opens. Create a novel — card appears.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: home page with stats bar, novel gallery, and new novel modal"
```

---

## Task 10: Workspace Shell Layout

**Files:**
- Create: `components/workspace/workspace-tabs.tsx`
- Create: `app/novel/[novelId]/layout.tsx`
- Create: `app/novel/[novelId]/page.tsx`

- [ ] **Step 1: Create `components/workspace/workspace-tabs.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useNovel } from '@/lib/hooks/use-novels'

const TABS = [
  { label: 'Manuscrito', segment: 'manuscript' },
  { label: 'Biblia',     segment: 'bible' },
  { label: 'Tablero',    segment: 'board' },
  { label: 'Stats',      segment: 'stats' },
]

export function WorkspaceTabs() {
  const params = useParams<{ novelId: string }>()
  const pathname = usePathname()
  const novel = useNovel(params.novelId)

  return (
    <div
      className="flex items-center gap-0 px-4 border-b shrink-0"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', height: '44px' }}
    >
      <Link href="/" className="mr-6 text-sm font-bold shrink-0" style={{ color: 'var(--accent)' }}>
        ✦
      </Link>
      <span className="text-sm font-semibold mr-6 truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }}>
        {novel?.title ?? '...'}
      </span>
      {TABS.map(({ label, segment }) => {
        const href = `/novel/${params.novelId}/${segment}`
        const active = pathname.startsWith(href)
        return (
          <Link
            key={segment}
            href={href}
            className="px-4 h-full flex items-center text-sm border-b-2 transition-colors"
            style={{
              borderColor: active ? 'var(--accent)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create `app/novel/[novelId]/layout.tsx`**

```typescript
import { WorkspaceTabs } from '@/components/workspace/workspace-tabs'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <WorkspaceTabs />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/novel/[novelId]/page.tsx`**

```typescript
import { redirect } from 'next/navigation'

export default function NovelIndexPage({ params }: { params: { novelId: string } }) {
  redirect(`/novel/${params.novelId}/manuscript`)
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: workspace shell with tab navigation"
```

---

## Task 11: Scene Tree Sidebar

**Files:**
- Create: `components/workspace/scene-tree.tsx`
- Create: `components/workspace/scene-tree-chapter.tsx`
- Create: `components/workspace/scene-tree-scene.tsx`

- [ ] **Step 1: Create `components/workspace/scene-tree-scene.tsx`**

```typescript
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { usePathname, useRouter } from 'next/navigation'
import type { Scene } from '@/lib/db.types'

interface SceneTreeSceneProps {
  scene: Scene
  novelId: string
}

export function SceneTreeScene({ scene, novelId }: SceneTreeSceneProps) {
  const router = useRouter()
  const pathname = usePathname()
  const active = pathname.includes(scene.id)

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: scene.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer group"
      onClick={() => router.push(`/novel/${novelId}/manuscript/${scene.id}`)}
      {...attributes}
    >
      <span
        className="cursor-grab opacity-0 group-hover:opacity-100 text-xs"
        style={{ color: 'var(--text-muted)' }}
        {...listeners}
      >
        ⠿
      </span>
      <span
        className="flex-1 truncate"
        style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        {active && <span style={{ color: 'var(--accent)' }}>✦ </span>}
        {scene.title}
      </span>
      <span className="text-xs opacity-0 group-hover:opacity-60" style={{ color: 'var(--text-muted)' }}>
        {scene.wordCount > 0 ? scene.wordCount : ''}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/workspace/scene-tree-chapter.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SceneTreeScene } from './scene-tree-scene'
import { createScene } from '@/lib/hooks/use-scenes'
import { useScenes } from '@/lib/hooks/use-scenes'
import type { Chapter } from '@/lib/db.types'

interface SceneTreeChapterProps {
  chapter: Chapter
  novelId: string
}

export function SceneTreeChapter({ chapter, novelId }: SceneTreeChapterProps) {
  const [open, setOpen] = useState(true)
  const scenes = useScenes(chapter.id) ?? []

  async function handleAddScene() {
    await createScene({
      novelId,
      chapterId: chapter.id,
      title: `Escena ${scenes.length + 1}`,
    })
  }

  return (
    <div>
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer group"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {open ? '▼' : '▶'}
        </span>
        <span className="text-xs font-semibold flex-1 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          {chapter.title}
        </span>
        <button
          className="opacity-0 group-hover:opacity-100 text-xs px-1"
          style={{ color: 'var(--accent)' }}
          onClick={(e) => { e.stopPropagation(); handleAddScene() }}
          title="Añadir escena"
        >
          +
        </button>
      </div>

      {open && (
        <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="ml-3">
            {scenes.map(scene => (
              <SceneTreeScene key={scene.id} scene={scene} novelId={novelId} />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `components/workspace/scene-tree.tsx`**

```typescript
'use client'

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { useChapters } from '@/lib/hooks/use-chapters'
import { createChapter } from '@/lib/hooks/use-chapters'
import { updateScene } from '@/lib/hooks/use-scenes'
import { SceneTreeChapter } from './scene-tree-chapter'

interface SceneTreeProps {
  novelId: string
}

export function SceneTree({ novelId }: SceneTreeProps) {
  const chapters = useChapters(novelId) ?? []

  async function handleAddChapter() {
    await createChapter({ novelId, title: `Capítulo ${chapters.length + 1}` })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    // Update order: find scene and update its order field
    await updateScene(active.id as string, { order: over.id as unknown as number })
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', width: '200px', minWidth: '200px' }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Estructura
        </span>
        <button
          onClick={handleAddChapter}
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          title="Nuevo capítulo"
        >
          + Cap
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {chapters.length === 0 ? (
            <p className="text-xs text-center mt-8" style={{ color: 'var(--text-muted)' }}>
              Sin capítulos.<br />
              <button onClick={handleAddChapter} className="underline" style={{ color: 'var(--accent)' }}>
                Añadir uno
              </button>
            </p>
          ) : (
            chapters.map(chapter => (
              <SceneTreeChapter key={chapter.id} chapter={chapter} novelId={novelId} />
            ))
          )}
        </DndContext>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: scene tree sidebar with chapters, scenes, and drag-and-drop"
```

---

## Task 12: Inspector Panel + Manuscript Layout

**Files:**
- Create: `components/workspace/inspector.tsx`
- Modify: `app/novel/[novelId]/manuscript/page.tsx`
- Modify: `app/novel/[novelId]/manuscript/[sceneId]/page.tsx`
- Modify: `app/novel/[novelId]/layout.tsx`

- [ ] **Step 1: Create `components/workspace/inspector.tsx`**

```typescript
'use client'

import { useAppStore } from '@/lib/stores/app-store'
import { useScene } from '@/lib/hooks/use-scenes'

export function Inspector() {
  const { activeSceneId, isInspectorOpen, toggleInspector } = useAppStore()
  const scene = useScene(activeSceneId ?? '')

  if (!isInspectorOpen) {
    return (
      <button
        onClick={toggleInspector}
        className="w-8 flex items-center justify-center border-l shrink-0"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        title="Abrir inspector"
      >
        ‹
      </button>
    )
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden border-l shrink-0"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', width: '220px' }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Inspector</span>
        <button onClick={toggleInspector} className="text-xs" style={{ color: 'var(--text-muted)' }}>›</button>
      </div>

      {!scene ? (
        <p className="text-xs text-center mt-8" style={{ color: 'var(--text-muted)' }}>
          Selecciona una escena
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Palabras</p>
            <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
              {scene.wordCount.toLocaleString('es')}
            </p>
          </div>
          {scene.synopsis && (
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Synopsis</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{scene.synopsis}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update `app/novel/[novelId]/layout.tsx` to include SceneTree + Inspector**

```typescript
import { WorkspaceTabs } from '@/components/workspace/workspace-tabs'
import { SceneTree } from '@/components/workspace/scene-tree'
import { Inspector } from '@/components/workspace/inspector'

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { novelId: string }
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <WorkspaceTabs />
      <div className="flex flex-1 overflow-hidden">
        <SceneTree novelId={params.novelId} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <Inspector />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/novel/[novelId]/manuscript/page.tsx`**

```typescript
'use client'

import { useParams } from 'next/navigation'
import { useChapters } from '@/lib/hooks/use-chapters'
import { useScenes } from '@/lib/hooks/use-scenes'
import Link from 'next/link'

function ChapterBlock({ chapter, novelId }: { chapter: { id: string; title: string }; novelId: string }) {
  const scenes = useScenes(chapter.id) ?? []
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
        {chapter.title}
      </h2>
      <div className="flex flex-col gap-1">
        {scenes.map(scene => (
          <Link
            key={scene.id}
            href={`/novel/${novelId}/manuscript/${scene.id}`}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-opacity"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <span style={{ color: 'var(--text-primary)' }}>{scene.title}</span>
            <span style={{ color: 'var(--text-muted)' }}>{scene.wordCount > 0 ? `${scene.wordCount} pal.` : 'Vacía'}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function ManuscriptPage() {
  const params = useParams<{ novelId: string }>()
  const chapters = useChapters(params.novelId) ?? []

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Manuscrito</h1>
      {chapters.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Usa el panel izquierdo para añadir capítulos y escenas.
        </p>
      ) : (
        chapters.map(ch => <ChapterBlock key={ch.id} chapter={ch} novelId={params.novelId} />)
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: inspector panel and manuscript overview page"
```

---

## Task 13: Scene Editor (Tiptap)

**Files:**
- Create: `components/editor/scene-editor.tsx`
- Create: `app/novel/[novelId]/manuscript/[sceneId]/page.tsx`

- [ ] **Step 1: Create `components/editor/scene-editor.tsx`**

```typescript
'use client'

import { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { updateSceneContent } from '@/lib/hooks/use-scenes'
import { useAppStore } from '@/lib/stores/app-store'
import type { Scene } from '@/lib/db.types'

interface SceneEditorProps {
  scene: Scene
}

export function SceneEditor({ scene }: SceneEditorProps) {
  const { isZenMode, setZenMode, toggleInspector, isInspectorOpen } = useAppStore()

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
      Typography,
      Placeholder.configure({ placeholder: 'Empieza a escribir…' }),
    ],
    content: scene.content ? JSON.parse(scene.content) : '',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[60vh] leading-relaxed',
        style: 'color: var(--text-primary); font-family: var(--font-lora), Georgia, serif; font-size: 17px; line-height: 1.85;',
      },
    },
  })

  // Autosave with 1s debounce + record writing session for daily stats
  const save = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>
      return (content: string) => {
        clearTimeout(timer)
        timer = setTimeout(async () => {
          await updateSceneContent(scene.id, content)
          // Compute novel total and snapshot for today's word count
          const scenes = await import('@/lib/hooks/use-scenes').then(m => m.getScenesForNovel(scene.novelId))
          const total = scenes.reduce((sum, s) => sum + (s.id === scene.id ? countWordsInTiptap(content) : s.wordCount), 0)
          const { recordWritingSession } = await import('@/lib/hooks/use-writing-sessions')
          await recordWritingSession(scene.novelId, total)
        }, 1000)
      }
    })(),
    [scene.id, scene.novelId]
  )

  useEffect(() => {
    if (!editor) return
    const handler = () => {
      const content = JSON.stringify(editor.getJSON())
      save(content)
    }
    editor.on('update', handler)
    return () => { editor.off('update', handler) }
  }, [editor, save])

  // Sync content when scene changes
  useEffect(() => {
    if (!editor) return
    const incoming = scene.content ? JSON.parse(scene.content) : ''
    if (JSON.stringify(editor.getJSON()) !== scene.content) {
      editor.commands.setContent(incoming, false)
    }
  }, [scene.id])

  // ESC exits zen mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setZenMode(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setZenMode])

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      {!isZenMode && (
        <div
          className="flex items-center justify-between px-4 py-2 border-b shrink-0"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            {[
              { cmd: () => editor?.chain().focus().toggleBold().run(), label: 'B', title: 'Negrita' },
              { cmd: () => editor?.chain().focus().toggleItalic().run(), label: 'I', title: 'Cursiva' },
            ].map(({ cmd, label, title }) => (
              <button
                key={label}
                onClick={cmd}
                title={title}
                className="w-7 h-7 rounded text-xs font-semibold"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {editor?.storage.characterCount?.words() ?? 0} palabras
            </span>
            <button
              onClick={() => setZenMode(true)}
              className="text-xs px-2 py-1 rounded"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              title="Modo Zen (ESC para salir)"
            >
              ⊙ Zen
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: isZenMode ? '80px 20%' : '32px 48px' }}
      >
        {isZenMode && (
          <button
            onClick={() => setZenMode(false)}
            className="fixed top-4 right-4 text-xs px-2 py-1 rounded z-10"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
          >
            ESC — Salir del Zen
          </button>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/novel/[novelId]/manuscript/[sceneId]/page.tsx`**

```typescript
'use client'

import { useParams } from 'next/navigation'
import { useScene } from '@/lib/hooks/use-scenes'
import { useAppStore } from '@/lib/stores/app-store'
import { useEffect } from 'react'
import { SceneEditor } from '@/components/editor/scene-editor'

export default function ScenePage() {
  const params = useParams<{ novelId: string; sceneId: string }>()
  const scene = useScene(params.sceneId)
  const setActiveScene = useAppStore(s => s.setActiveScene)

  useEffect(() => {
    setActiveScene(params.sceneId)
    return () => setActiveScene(null)
  }, [params.sceneId, setActiveScene])

  if (!scene) {
    return <div className="p-8 text-sm" style={{ color: 'var(--text-muted)' }}>Cargando escena…</div>
  }

  return <SceneEditor scene={scene} />
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: Tiptap scene editor with autosave and zen mode"
```

---

## Task 14: Bible — Characters

**Files:**
- Create: `components/characters/character-list.tsx`
- Create: `components/characters/character-form.tsx`
- Create: `app/novel/[novelId]/bible/page.tsx`
- Create: `app/novel/[novelId]/bible/characters/page.tsx`
- Create: `app/novel/[novelId]/bible/characters/[charId]/page.tsx`

- [ ] **Step 1: Create `components/characters/character-list.tsx`**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useCharacters, createCharacter, deleteCharacter } from '@/lib/hooks/use-characters'

const ROLE_LABELS: Record<string, string> = {
  protagonist: 'Protagonista',
  secondary: 'Secundario',
  antagonist: 'Antagonista',
  other: 'Otro',
}

export function CharacterList({ novelId }: { novelId: string }) {
  const router = useRouter()
  const characters = useCharacters(novelId) ?? []

  async function handleCreate() {
    const char = await createCharacter(novelId)
    router.push(`/novel/${novelId}/bible/characters/${char.id}`)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Personajes</h2>
        <button
          onClick={handleCreate}
          className="text-sm px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          + Nuevo personaje
        </button>
      </div>

      {characters.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No hay personajes. Crea el primero.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {characters.map(char => (
            <div
              key={char.id}
              className="rounded-xl p-4 cursor-pointer hover:opacity-80 transition-opacity group"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              onClick={() => router.push(`/novel/${novelId}/bible/characters/${char.id}`)}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg mb-3"
                style={{ background: 'var(--bg-tertiary)' }}>
                👤
              </div>
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{char.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {ROLE_LABELS[char.role] ?? char.role}
              </p>
              <button
                className="text-xs mt-2 opacity-0 group-hover:opacity-100"
                style={{ color: 'var(--text-muted)' }}
                onClick={async (e) => { e.stopPropagation(); if (confirm('¿Eliminar personaje?')) await deleteCharacter(char.id) }}
              >
                🗑️ Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/characters/character-form.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useCharacter, updateCharacter } from '@/lib/hooks/use-characters'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const ROLES = [
  { value: 'protagonist', label: 'Protagonista' },
  { value: 'secondary',   label: 'Secundario' },
  { value: 'antagonist',  label: 'Antagonista' },
  { value: 'other',       label: 'Otro' },
]

function Field({ label, value, onChange, multiline = false, hint }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      {hint && <p className="text-xs mb-1.5 italic" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      {multiline ? (
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      ) : (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      )}
    </div>
  )
}

export function CharacterForm({ charId }: { charId: string }) {
  const character = useCharacter(charId)
  const [form, setForm] = useState({
    name: '', role: 'secondary' as const, age: '', description: '',
    internalWound: '', falseBelief: '', secretDesire: '', notes: '',
  })

  useEffect(() => {
    if (character) setForm({
      name: character.name, role: character.role as typeof form.role,
      age: character.age, description: character.description,
      internalWound: character.internalWound, falseBelief: character.falseBelief,
      secretDesire: character.secretDesire, notes: character.notes,
    })
  }, [character?.id])

  function set(key: keyof typeof form) {
    return (v: string) => {
      setForm(f => ({ ...f, [key]: v }))
      updateCharacter(charId, { [key]: v })
    }
  }

  if (!character) return <div className="p-8 text-sm" style={{ color: 'var(--text-muted)' }}>Cargando…</div>

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Ficha de personaje</h2>

      {/* Básicos */}
      <section>
        <h3 className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: 'var(--accent)' }}>Datos básicos</h3>
        <div className="flex flex-col gap-3">
          <Field label="Nombre" value={form.name} onChange={set('name')} />
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Rol</label>
            <select
              value={form.role}
              onChange={e => set('role')(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <Field label="Edad" value={form.age} onChange={set('age')} />
          <Field label="Descripción física" value={form.description} onChange={set('description')} multiline />
        </div>
      </section>

      {/* Psicología */}
      <section>
        <h3 className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: 'var(--accent)' }}>Psicología profunda</h3>
        <div className="flex flex-col gap-4">
          <Field
            label="Herida interna"
            hint="El trauma que dicta su comportamiento subconsciente."
            value={form.internalWound}
            onChange={set('internalWound')}
            multiline
          />
          <Field
            label="Creencia falsa"
            hint="La mentira que el personaje cree para sobrevivir."
            value={form.falseBelief}
            onChange={set('falseBelief')}
            multiline
          />
          <Field
            label="Deseo secreto"
            hint="La motivación que no admite ante nadie."
            value={form.secretDesire}
            onChange={set('secretDesire')}
            multiline
          />
        </div>
      </section>

      {/* Notas */}
      <section>
        <h3 className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: 'var(--accent)' }}>Notas libres</h3>
        <Textarea
          value={form.notes}
          onChange={e => set('notes')(e.target.value)}
          rows={5}
          placeholder="Notas, ideas, arcos…"
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/novel/[novelId]/bible/page.tsx`**

```typescript
import Link from 'next/link'

export default function BiblePage({ params }: { params: { novelId: string } }) {
  const id = params.novelId
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Biblia de la historia</h1>
      <div className="flex flex-col gap-3">
        {[
          { href: `/novel/${id}/bible/characters`, icon: '👤', title: 'Personajes', desc: 'Fichas con psicología profunda' },
          { href: `/novel/${id}/bible/world`,      icon: '🌍', title: 'Mundo',       desc: 'Lugares, reglas, lore' },
        ].map(({ href, icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 rounded-xl hover:opacity-80 transition-opacity"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/novel/[novelId]/bible/characters/page.tsx`**

```typescript
'use client'
import { useParams } from 'next/navigation'
import { CharacterList } from '@/components/characters/character-list'

export default function CharactersPage() {
  const { novelId } = useParams<{ novelId: string }>()
  return <CharacterList novelId={novelId} />
}
```

- [ ] **Step 5: Create `app/novel/[novelId]/bible/characters/[charId]/page.tsx`**

```typescript
'use client'
import { useParams } from 'next/navigation'
import { CharacterForm } from '@/components/characters/character-form'

export default function CharacterPage() {
  const { charId } = useParams<{ charId: string }>()
  return <CharacterForm charId={charId} />
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: character bible with deep psychology fields"
```

---

## Task 15: Bible — World Notes, Stats, Board Placeholder, Settings

**Files:**
- Create: `app/novel/[novelId]/bible/world/page.tsx`
- Create: `app/novel/[novelId]/board/page.tsx`
- Create: `app/novel/[novelId]/stats/page.tsx`
- Create: `app/settings/page.tsx`
- Create: `components/settings/theme-selector.tsx`

- [ ] **Step 1: Create `app/novel/[novelId]/bible/world/page.tsx`**

```typescript
'use client'

import { useParams } from 'next/navigation'
import { useNotes, createNote, updateNote } from '@/lib/hooks/use-notes'
import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default function WorldPage() {
  const { novelId } = useParams<{ novelId: string }>()
  const notes = useNotes(novelId) ?? []
  const [newContent, setNewContent] = useState('')

  async function handleAdd() {
    if (!newContent.trim()) return
    await createNote(novelId, newContent.trim())
    setNewContent('')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Mundo y Lore</h2>

      <div className="flex flex-col gap-2 mb-6">
        <Textarea
          placeholder="Nueva nota de mundo…"
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          rows={3}
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <Button
          onClick={handleAdd}
          size="sm"
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)', alignSelf: 'flex-end' }}
        >
          Añadir
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {notes.map(note => (
          <div
            key={note.id}
            className="rounded-lg p-3"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <Textarea
              value={note.content}
              onChange={e => updateNote(note.id, { content: e.target.value })}
              rows={2}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', resize: 'none' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/novel/[novelId]/board/page.tsx`**

```typescript
export default function BoardPage() {
  return (
    <div className="h-full flex items-center justify-center flex-col gap-3">
      <p className="text-4xl">🗂️</p>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tablero visual</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Disponible en la Fase 2 junto con la integración de IA.</p>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/novel/[novelId]/stats/page.tsx`**

```typescript
'use client'

import { useParams } from 'next/navigation'
import { useNovelWordCount } from '@/lib/hooks/use-scenes'
import { useNovel } from '@/lib/hooks/use-novels'
import { useWritingSessions } from '@/lib/hooks/use-writing-sessions'
import { useTodayWordCount } from '@/lib/hooks/use-writing-sessions'

export default function StatsPage() {
  const { novelId } = useParams<{ novelId: string }>()
  const novel = useNovel(novelId)
  const totalWords = useNovelWordCount(novelId)
  const todayWords = useTodayWordCount(novelId)
  const sessions = useWritingSessions(novelId) ?? []
  const progress = novel?.targetWordCount ? Math.min((totalWords / novel.targetWordCount) * 100, 100) : 0

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Estadísticas</h2>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { label: 'Palabras totales', value: totalWords.toLocaleString('es') },
          { label: 'Escritas hoy',     value: todayWords.toLocaleString('es') },
          { label: 'Meta',             value: (novel?.targetWordCount ?? 0).toLocaleString('es') },
          { label: 'Progreso',         value: `${progress.toFixed(1)}%` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
          <span>Progreso hacia la meta</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="rounded-full h-2" style={{ background: 'var(--bg-tertiary)' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${progress}%`, background: 'var(--accent)' }}
          />
        </div>
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Historial de sesiones</p>
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {[...sessions].reverse().map(s => (
              <div key={s.id} className="flex justify-between text-xs px-3 py-2 rounded"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                <span>{s.date}</span>
                <span>{s.wordCount.toLocaleString('es')} palabras</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `components/settings/theme-selector.tsx`**

```typescript
'use client'

import { useTheme } from 'next-themes'

const THEMES = [
  { value: 'dark',   label: '🌑 Estudio Nocturno', bg: '#0f0f13', accent: '#c9b99a' },
  { value: 'warm',   label: '📜 Papel y Tinta',     bg: '#faf6f0', accent: '#9b7e5a' },
  { value: 'modern', label: '⚡ Editorial Moderno',  bg: '#f8f9fc', accent: '#6366f1' },
]

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Tema</p>
      <div className="flex gap-3">
        {THEMES.map(t => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className="flex-1 rounded-xl p-4 text-left transition-all"
            style={{
              background: t.bg,
              border: `2px solid ${theme === t.value ? t.accent : 'transparent'}`,
              outline: theme === t.value ? `2px solid ${t.accent}` : 'none',
              outlineOffset: '2px',
            }}
          >
            <div className="w-6 h-6 rounded-full mb-2" style={{ background: t.accent }} />
            <p className="text-xs font-semibold" style={{ color: t.accent }}>{t.label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `app/settings/page.tsx`**

```typescript
'use client'

import { ThemeSelector } from '@/components/settings/theme-selector'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function SettingsPage() {
  const [dailyGoal, setDailyGoal] = useState('500')
  const [defaultTarget, setDefaultTarget] = useState('80000')

  return (
    <main className="min-h-screen p-8 max-w-xl mx-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Inicio</Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Ajustes</h1>
      </div>

      <div className="flex flex-col gap-8">
        <ThemeSelector />

        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Metas de escritura</p>
          <div>
            <label className="text-xs block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Meta diaria de palabras
            </label>
            <Input
              type="number"
              value={dailyGoal}
              onChange={e => setDailyGoal(e.target.value)}
              style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Meta por defecto de novela (palabras)
            </label>
            <Input
              type="number"
              value={defaultTarget}
              onChange={e => setDefaultTarget(e.target.value)}
              style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 6: Add Settings link to home page header**

In `app/page.tsx`, update the header to add a settings link:

```typescript
import Link from 'next/link'
import { StatsBar } from '@/components/home/stats-bar'
import { NovelGrid } from '@/components/home/novel-grid'

export default function HomePage() {
  return (
    <main className="min-h-screen p-8" style={{ background: 'var(--bg-primary)' }}>
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>✦</span>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Novelr</h1>
        </div>
        <Link href="/settings" className="text-sm" style={{ color: 'var(--text-muted)' }}>⚙ Ajustes</Link>
      </header>
      <StatsBar />
      <NovelGrid />
    </main>
  )
}
```

- [ ] **Step 7: Run full test suite**

```bash
npm run test:run
```

Expected: All tests PASS (utils, db, stores, hooks).

- [ ] **Step 8: Run dev server and do end-to-end manual check**

```bash
npm run dev
```

Checklist:
- [ ] Home loads with dark theme
- [ ] Create a novel → redirects to workspace
- [ ] Add a chapter in the scene tree sidebar
- [ ] Add a scene → opens editor
- [ ] Type text in editor → word count updates in inspector after 1 second
- [ ] Click "⊙ Zen" → full screen editor, ESC exits
- [ ] Navigate to Biblia → Characters → create a character → fill psychology fields
- [ ] Navigate to World → add a note
- [ ] Navigate to Stats → see word count and progress bar
- [ ] Navigate to Settings → switch theme → entire app changes instantly
- [ ] Board shows placeholder message

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "feat: complete skeleton — world notes, stats, settings, board placeholder"
```

---

## Summary

| Task | Deliverable |
|------|------------|
| 1 | Next.js + all deps + vitest |
| 2 | 3 CSS themes + ThemeProvider |
| 3 | Dexie DB schema (6 tables) |
| 4 | Utils: countWords, newId, formatDate |
| 5 | Zustand store |
| 6 | Novel CRUD hooks |
| 7 | Chapter + Scene CRUD hooks |
| 8 | Character, Notes, WritingSession hooks |
| 9 | Home: stats bar + novel gallery + new novel modal |
| 10 | Workspace shell: tabs + 3-column layout |
| 11 | Scene tree: collapsible chapters + drag & drop |
| 12 | Inspector panel + manuscript overview |
| 13 | Tiptap editor: autosave + zen mode |
| 14 | Character bible: list + form with psychology |
| 15 | World notes + stats + settings + board placeholder |
