import { useEffect, useRef, useState } from 'react'

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:·'

function normalize(text: string, length: number) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .padEnd(length, ' ')
    .slice(0, length)
}

/**
 * A row of split-flap characters. The server renders the final text (so the
 * HTML is correct and readable); after hydration each character "spins"
 * through random glyphs before settling, like a station board.
 */
export function SplitFlap({
  text,
  length = text.length,
  delay = 0,
  className = '',
  label,
}: {
  text: string
  length?: number
  delay?: number
  className?: string
  label?: string
}) {
  const target = normalize(text, length)
  const [chars, setChars] = useState(target)
  const [settled, setSettled] = useState<Array<boolean>>(() =>
    Array(length).fill(true),
  )
  const first = useRef(true)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setChars(target)
      return
    }
    // Each position spins for a slightly different number of ticks so the
    // row settles left-to-right.
    const stopAt = Array.from(
      { length },
      (_, i) => 3 + i + Math.floor(Math.random() * 4),
    )
    let tick = 0
    let interval: ReturnType<typeof setInterval> | undefined
    const timeout = setTimeout(
      () => {
        interval = setInterval(() => {
          tick++
          setChars(
            Array.from(target, (c, i) =>
              tick >= stopAt[i]! || (c === ' ' && first.current)
                ? c
                : CHARSET[Math.floor(Math.random() * CHARSET.length)]!,
            ).join(''),
          )
          setSettled(Array.from(target, (_, i) => tick >= stopAt[i]!))
          if (tick >= Math.max(...stopAt)) {
            clearInterval(interval)
            first.current = false
          }
        }, 55)
      },
      first.current ? delay : 0,
    )
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [target, length, delay])

  return (
    <span
      role="text"
      aria-label={label ?? text}
      className={`inline-flex gap-[2px] ${className}`}
    >
      {Array.from(chars, (c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="flap"
          data-flipping={settled[i] ? undefined : 'true'}
        >
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  )
}
