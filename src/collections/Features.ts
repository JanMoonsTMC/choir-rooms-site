import type { CollectionConfig } from 'payload'
import { publicContent } from '../access'
import { checkUniqueSlug, preventDependentDeletion } from '../lib/modelIntegrity'
import { slug } from './fields'

// A piece of equipment or a quality a room can have, such as a grand piano or step-free access. Users
// filter the rooms by it, and each one has its own page listing the rooms that have it.
export const Features: CollectionConfig = {
  slug: 'features',
  labels: { singular: 'Equipment', plural: 'Equipment' },
  admin: {
    useAsTitle: 'name',
  },
  access: publicContent,
  hooks: {
    beforeChange: [checkUniqueSlug],
    beforeDelete: [
      preventDependentDeletion(
        'rooms',
        'features',
        'This equipment is still listed for rooms (see its Rooms list). Remove it from each room, then delete it.',
      ),
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    slug,
    {
      name: 'description',
      type: 'textarea',
    },
    // The reverse side of the many-to-many: read from each room's "features". Nothing is stored twice.
    {
      name: 'rooms',
      type: 'join',
      collection: 'rooms',
      on: 'features',
    },
  ],
}
