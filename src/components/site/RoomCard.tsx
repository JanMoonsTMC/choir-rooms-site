// What this is: one room in a list: its picture (left on wide screens, on top on phones), its name as
// the link to its page, how many people it holds, its price per time slot, its one-line summary and
// its equipment. Every value comes from the room's own record, so a change in /admin shows here at once.
import type { Room } from '@/payload-types'
import { capacityLabel, formatPrice, imageFrom } from '@/lib/format'
import { FeatureList } from './FeatureList'
import { FramedCard } from './FramedCard'

type RoomCardProps = {
  room: Room
  // The end of the address the list was opened with (the filters). The link to the room carries it, so
  // the room's page can link back to the same filtered list.
  query?: string
  headingLevel?: 'h2' | 'h3'
}

export function RoomCard({ room, query = '', headingLevel = 'h3' }: RoomCardProps) {
  return (
    <FramedCard title={room.name} href={`/rooms/${room.slug}${query}`} image={imageFrom(room.image)} accent="plum" headingLevel={headingLevel}>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
        <dt className="text-ink-soft">Size</dt>
        <dd className="font-semibold">{capacityLabel(room.capacity)}</dd>
        <dt className="text-ink-soft">Price</dt>
        <dd className="font-semibold">{`${formatPrice(room.price)} per time slot`}</dd>
      </dl>
      <p>{room.summary}</p>
      <FeatureList features={room.features} />
    </FramedCard>
  )
}
