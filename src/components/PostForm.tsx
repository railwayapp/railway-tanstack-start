import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import type { Departure, NewDeparture } from '~/lib/destinations'
import {
  DESTINATIONS,
  MAX_MESSAGE,
  MAX_NAME,
  newDepartureSchema,
} from '~/lib/destinations'
import { createDeparture } from '~/server/departures.functions'

type ListData = {
  items: Array<Departure>
  total: number
  page: number
  pageCount: number
}
type ListKey = ['departures', { dest?: string; page?: number }]

let tempId = -1

export function usePostDeparture() {
  const queryClient = useQueryClient()
  const post = useServerFn(createDeparture)

  return useMutation({
    mutationFn: (data: NewDeparture) => post({ data }),

    // Optimistic update: put the new row at the top of every cached first
    // page it belongs on, before the server responds.
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['departures'] })
      const snapshot = queryClient.getQueriesData<ListData>({
        queryKey: ['departures'],
      })
      const optimistic: Departure = {
        ...input,
        id: tempId--,
        platform: 0,
        region: '…',
        createdAt: new Date().toISOString(),
        mine: true,
      }
      for (const [key, data] of snapshot) {
        const opts = (key as ListKey)[1]
        if (!data || (opts.page ?? 1) !== 1) continue
        if (opts.dest && opts.dest !== input.destination) continue
        queryClient.setQueryData<ListData>(key, {
          ...data,
          total: data.total + 1,
          items: [optimistic, ...data.items].slice(0, data.items.length || 1),
        })
      }
      return { snapshot, optimisticId: optimistic.id }
    },
    onError: (_err, _input, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['departures'] }),
  })
}

export function PostForm({
  onPosted,
}: {
  onPosted?: (d: Departure) => void
}) {
  const mutation = usePostDeparture()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    // The same zod schema the server function validates with.
    const parsed = newDepartureSchema.safeParse(
      Object.fromEntries(new FormData(form)),
    )
    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
        ),
      )
      return
    }
    setFieldErrors({})
    mutation.mutate(parsed.data, {
      onSuccess: (d) => {
        setMessage('')
        form.reset()
        onPosted?.(d)
      },
    })
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5" noValidate>
      <div>
        <h3 className="text-[17px] font-semibold">Post a departure</h3>
        <p className="mt-1 text-[14px] text-fg-muted">
          Leave a message on the board. It’s stored in Postgres via a server
          function.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-[13px] font-medium text-fg-muted">Name</span>
        <input
          name="name"
          maxLength={MAX_NAME}
          autoComplete="nickname"
          placeholder="Ada"
          className="field"
          aria-invalid={Boolean(fieldErrors.name)}
        />
        {fieldErrors.name && (
          <span className="text-[12px] text-danger">{fieldErrors.name}</span>
        )}
      </label>

      <label className="block space-y-1.5">
        <span className="text-[13px] font-medium text-fg-muted">
          Destination
        </span>
        <select name="destination" className="field" defaultValue="Tokyo">
          {DESTINATIONS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="flex justify-between text-[13px] font-medium text-fg-muted">
          Message
          <span className="font-mono text-[11px] text-fg-subtle tabular-nums">
            {message.length}/{MAX_MESSAGE}
          </span>
        </span>
        <textarea
          name="message"
          rows={2}
          maxLength={MAX_MESSAGE}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Just shipped my first TanStack Start app"
          className="field resize-none"
          aria-invalid={Boolean(fieldErrors.message)}
        />
        {fieldErrors.message && (
          <span className="text-[12px] text-danger">
            {fieldErrors.message}
          </span>
        )}
      </label>

      {mutation.isError && (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger"
        >
          {mutation.error.message}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Boarding…' : 'Depart'}
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </button>
    </form>
  )
}
