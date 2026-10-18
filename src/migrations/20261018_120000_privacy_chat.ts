import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { PAGES } from '../seed/seed'

// A data migration, written by hand: it changes no table (its snapshot, the .json file next to it, is the
// previous one unchanged). Our privacy page must say that every public page now has the tawk.to chat
// window, what tawk.to stores, and that typing in it is optional (docs/decisions/integration.md). As with
// 20261018_000041_privacy_analytics: the live privacy page is a record that only the seed or /admin can
// change, and nobody can log in to the live /admin, so this writes our current privacy text over it,
// once, in the production build's migration step. On a database without a privacy page (a new one: the
// seed adds the page with this text) it does nothing.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const privacy = PAGES.find((page) => page.slug === 'privacy')
  const existing = (await payload.find({ collection: 'pages', where: { slug: { equals: 'privacy' } }, depth: 0, limit: 1, overrideAccess: true, req })).docs[0]
  if (!privacy || !existing) return
  await payload.update({ collection: 'pages', id: existing.id, data: { intro: privacy.intro, body: privacy.body }, overrideAccess: true, req })
  payload.logger.info('privacy_chat: the privacy page now describes the tawk.to chat window.')
}

// The new text stays when this migration is undone: take the chat out first (NEXT_PUBLIC_CHAT), then
// change the page in /admin.
export async function down(_args: MigrateDownArgs): Promise<void> {}
