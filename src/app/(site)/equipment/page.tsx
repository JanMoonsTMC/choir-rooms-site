// The equipment list, /equipment: every piece of equipment in the house, with how many rooms have it,
// each linking to its own page. A group that needs one thing (a drum kit, step-free access) starts here.
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import { PageTitle } from '@/components/site/PageTitle'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Equipment',
  description: 'The equipment in the Riverside Voices practice rooms, and which rooms have it.',
}

export default async function EquipmentPage() {
  const payload = await getPayload({ config })
  // The join (features.rooms) gives each piece of equipment's rooms, read from the other side of the
  // many-to-many; only how many there are is shown here.
  const features = (
    await payload.find({ collection: 'features', sort: 'name', depth: 0, joins: { rooms: { limit: 100 } }, limit: 100 })
  ).docs

  return (
    <div className="pb-6">
      <PageTitle title="Equipment" intro="What our rooms have, from a grand piano to step-free access. Open a piece of equipment to see the rooms that have it." tone="plum" />
      {features.length === 0 ? (
        <p>The equipment will be listed here soon.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const count = feature.rooms?.docs?.length ?? 0
            return (
              <li key={feature.id} className="grid content-start gap-1 rounded-frame border-[1.5px] border-l-8 border-ink border-l-river bg-canvas p-5">
                <h2 className="text-xl">
                  <Link href={`/equipment/${feature.slug}`} className="text-ink underline decoration-ink/40 decoration-2 underline-offset-4 hover:decoration-link">
                    {feature.name}
                  </Link>
                </h2>
                <p className="text-ink-soft">{count === 0 ? 'In no room yet' : `In ${count} ${count === 1 ? 'room' : 'rooms'}`}</p>
                {feature.description && <p>{feature.description}</p>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
