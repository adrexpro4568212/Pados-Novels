import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
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
