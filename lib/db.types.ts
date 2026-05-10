export interface Novel {
  id: string
  title: string
  synopsis: string
  genre: string
  color: string
  targetWordCount: number
  createdAt: number
  updatedAt: number
  streakMinWords?: number   // mínimo de palabras/día para racha. Default: 50
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
