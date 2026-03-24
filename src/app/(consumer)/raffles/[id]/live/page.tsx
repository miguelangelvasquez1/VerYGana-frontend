// app/raffles/[id]/live/page.tsx  (Server Component)
import { RaffleLiveClient } from './RaffleLiveClient'

interface Props {
  params: { id: string }
}

export default async function RaffleLivePage({ params }: Props) {
  // Fetch de datos estáticos de la rifa (título, imagen) desde el servidor
  const res = await fetch(
    `${process.env.API_URL}/api/raffles/${params.id}`,
    { cache: 'no-store' }
  )
  const raffle = await res.json()

  return <RaffleLiveClient raffleId={Number(params.id)} raffle={raffle} />
}