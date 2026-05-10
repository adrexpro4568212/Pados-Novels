'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useNovel } from '@/lib/hooks/use-novels'
import { buildBackup, downloadBackup } from '@/lib/backup'

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

  async function handleExport() {
    try {
      const backup = await buildBackup(params.novelId)
      downloadBackup(backup)
    } catch {
      alert('Error al exportar la novela. Intenta de nuevo.')
    }
  }

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

      <div className="ml-auto">
        <button
          type="button"
          onClick={handleExport}
          title="Exportar backup de esta novela"
          className="text-xs px-3 py-1 rounded"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
        >
          ⬇ Exportar
        </button>
      </div>
    </div>
  )
}
