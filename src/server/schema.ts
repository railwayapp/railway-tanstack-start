import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

export const departures = pgTable(
  'departures',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 24 }).notNull(),
    message: varchar('message', { length: 80 }).notNull(),
    destination: varchar('destination', { length: 32 }).notNull(),
    platform: integer('platform').notNull(),
    // Which Railway region served the request that created this row.
    region: varchar('region', { length: 32 }).notNull(),
    // Anonymous cookie-session id, so visitors can delete their own posts.
    ownerId: text('owner_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('departures_created_at_idx').on(t.createdAt),
    index('departures_destination_idx').on(t.destination),
  ],
)

export type DepartureRow = typeof departures.$inferSelect
