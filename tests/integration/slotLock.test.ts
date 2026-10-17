import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { commitTransaction, createLocalReq, initTransaction, killTransaction } from 'payload'
import { lockTimeSlot } from '../../src/lib/slotLock'
import { getTestPayload, resetCollections } from '../setup/payload'
import { roomData, slotData } from '../setup/rooms'

const clean = ['bookings', 'timeSlots', 'rooms']

describe('lockTimeSlot', () => {
  beforeEach(() => resetCollections(clean))
  afterAll(() => resetCollections(clean))

  it('throws when the request has no database transaction, instead of silently locking nothing', async () => {
    const p = await getTestPayload()
    const req = await createLocalReq({}, p)
    expect(req.transactionID).toBeUndefined()
    await expect(lockTimeSlot(req, 1)).rejects.toThrow(/transaction/)
  })

  it('throws when the transaction it names is already finished', async () => {
    const p = await getTestPayload()
    const req = await createLocalReq({}, p)
    req.transactionID = 'no-such-transaction'
    await expect(lockTimeSlot(req, 1)).rejects.toThrow(/transaction/)
  })

  it('locks an existing time slot inside a transaction', async () => {
    const p = await getTestPayload()
    const room = await p.create({ collection: 'rooms', data: roomData })
    const slot = await p.create({ collection: 'timeSlots', data: slotData(room.id, '2026-10-10T17:00:00Z', 2) })
    const req = await createLocalReq({}, p)
    expect(await initTransaction(req)).toBe(true)
    try {
      await expect(lockTimeSlot(req, slot.id)).resolves.toBeUndefined()
      await commitTransaction(req)
    } catch (error) {
      await killTransaction(req)
      throw error
    }
  })
})
