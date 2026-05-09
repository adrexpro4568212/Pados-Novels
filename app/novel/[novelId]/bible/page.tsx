import Link from 'next/link'

export default async function BiblePage({ params }: { params: Promise<{ novelId: string }> }) {
  const { novelId } = await params
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Biblia de la historia</h1>
      <div className="flex flex-col gap-3">
        {[
          { href: `/novel/${novelId}/bible/characters`, icon: '👤', title: 'Personajes', desc: 'Fichas con psicología profunda' },
          { href: `/novel/${novelId}/bible/world`,      icon: '🌍', title: 'Mundo',       desc: 'Lugares, reglas, lore' },
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
