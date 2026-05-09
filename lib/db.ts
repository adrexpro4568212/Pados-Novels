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
