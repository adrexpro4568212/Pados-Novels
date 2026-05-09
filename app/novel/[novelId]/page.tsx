import { redirect } from 'next/navigation'

export default async function NovelIndexPage({ params }: { params: Promise<{ novelId: string }> }) {
  const { novelId } = await params
  redirect(`/novel/${novelId}/manuscript`)
}
