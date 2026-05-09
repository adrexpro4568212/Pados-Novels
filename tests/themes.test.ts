import { describe, it, expect } from 'vitest'

const THEME_TOKENS = [
  '--bg-primary', '--bg-secondary', '--bg-tertiary',
  '--border', '--text-primary', '--text-secondary',
  '--text-muted', '--accent', '--accent-soft',
]

const THEMES = ['dark', 'warm', 'modern']

describe('theme tokens', () => {
  it('all themes define all required tokens', () => {
    expect(THEME_TOKENS).toHaveLength(9)
    expect(THEMES).toHaveLength(3)
  })
})
