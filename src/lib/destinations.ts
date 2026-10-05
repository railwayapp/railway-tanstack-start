import { z } from 'zod'

// Shared between client and server: used for the post form, the
// `?dest=` search param validation, and the server function validator.
export const DESTINATIONS = [
  'Amsterdam',
  'Berlin',
  'Chicago',
  'Lisbon',
  'London',
  'Mexico City',
  'New York',
  'Paris',
  'San Francisco',
  'São Paulo',
  'Singapore',
  'Sydney',
  'Tokyo',
  'Toronto',
] as const

export const destinationSchema = z.enum(DESTINATIONS)
export type Destination = z.infer<typeof destinationSchema>

export const MAX_NAME = 24
export const MAX_MESSAGE = 80

export const newDepartureSchema = z.object({
  name: z.string().trim().min(1, 'Add your name').max(MAX_NAME),
  message: z.string().trim().min(1, 'Say something').max(MAX_MESSAGE),
  destination: destinationSchema,
})
export type NewDeparture = z.infer<typeof newDepartureSchema>

export type Departure = {
  id: number
  name: string
  message: string
  destination: Destination
  platform: number
  region: string
  createdAt: string
  mine: boolean
}

export type DepartureStatus = 'boarding' | 'departed'

export function statusOf(createdAt: string, now = Date.now()): DepartureStatus {
  return now - new Date(createdAt).getTime() < 5 * 60_000
    ? 'boarding'
    : 'departed'
}
