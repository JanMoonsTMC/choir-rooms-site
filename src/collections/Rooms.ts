import type { CollectionConfig } from 'payload'
import { publicContent } from '../access'
import { checkUniqueSlug, preventDependentDeletion, requireExistingRelation } from '../lib/modelIntegrity'
import { positiveInteger, slug } from './fields'

// One of the practice rooms in the choir's house. Groups find a room by its size and its equipment
// (find a room), then book one of its time slots (book a room).
export const Rooms: CollectionConfig = {
  slug: 'rooms',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'capacity', 'price'],
  },
  access: publicContent,
  hooks: {
    beforeChange: [
      checkUniqueSlug,
      requireExistingRelation('features', 'features', 'A selected piece of equipment no longer exists. Choose the equipment again.'),
      requireExistingRelation('image', 'media', 'This image no longer exists. Choose another image.'),
    ],
    beforeDelete: [
      preventDependentDeletion(
        'timeSlots',
        'room',
        'This room still has time slots. Open Time Slots and delete them (move or delete their bookings first). Then delete the room.',
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
      name: 'capacity',
      label: 'Holds at most (people)',
      type: 'number',
      required: true,
      min: 1,
      validate: positiveInteger,
      admin: {
        description: 'The largest group the room takes. The room filter and the booking form both read it.',
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      label: 'Price per time slot (EUR)',
      admin: {
        description: 'What one two-hour time slot in this room costs. The choir sends an invoice; nobody pays online.',
      },
    },
    {
      name: 'location',
      label: 'Where in the house',
      type: 'text',
      required: true,
      admin: {
        description: 'For example: ground floor, at the back. Say whether there are stairs.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      admin: {
        description: 'One sentence: who the room suits. Not its size, price or equipment: those are fields.',
      },
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    // The many-to-many: a room has several pieces of equipment, and a piece of equipment (an upright
    // piano) is in several rooms. Stored only here; the equipment's "rooms" list reads it back.
    {
      name: 'features',
      label: 'Equipment',
      type: 'relationship',
      relationTo: 'features',
      hasMany: true,
    },
    // The reverse side of the one-to-many: this room's time slots, read from each slot's "room".
    {
      name: 'timeSlots',
      type: 'join',
      collection: 'timeSlots',
      on: 'room',
    },
  ],
}
