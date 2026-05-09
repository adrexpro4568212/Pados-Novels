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
