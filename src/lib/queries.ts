import { queryOptions } from '@tanstack/react-query'
import type { Destination } from './destinations'
import { getDeparture, listDepartures } from '~/server/departures'
import { getInfra } from '~/server/infra'

// Query options are shared by route loaders (prefetch during SSR) and
// components (useSuspenseQuery), so data is fetched once on the server and
// hydrated on the client with no waterfall or refetch.

export const departuresQuery = (opts: {
  dest?: Destination
  page?: number
  pageSize?: number
}) =>
  queryOptions({
    queryKey: ['departures', opts],
    queryFn: () => listDepartures({ data: opts }),
  })

export const departureQuery = (id: number) =>
  queryOptions({
    queryKey: ['departure', id],
    queryFn: () => getDeparture({ data: { id } }),
  })

export const infraQuery = () =>
  queryOptions({
    queryKey: ['infra'],
    queryFn: () => getInfra(),
    staleTime: 10_000,
  })
