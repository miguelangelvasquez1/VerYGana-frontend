// app/raffles/[id]/live/page.tsx  (Server Component)
import { RaffleLiveClient } from './RaffleLiveClient'

interface Props {
  params: Promise<{ id: string }> 
}

export default async function RaffleLivePage({ params }: Props) {
  const { id } = await params
  // Fetch de datos estáticos de la rifa (título, imagen) desde el servidor
  const res = await fetch(
    `${process.env.API_URL}/api/raffles/${id}`,
    { cache: 'no-store' }
  )
  const raffle = await res.json()

  return <RaffleLiveClient raffleId={Number(id)} raffle={raffle} />
}