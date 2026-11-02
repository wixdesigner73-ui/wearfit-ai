import type { ColorOption } from '../types'
import { CheckIcon } from './Icons'

export function ColorSelector({
  colors,
  value,
  onChange,
}: {
  colors: ColorOption[]
  value: string
  onChange: (name: string) => void
}) {
  return (
    <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-3">
      {colors.map((c) => {
        const selected = c.name === value
        return (
          <button
            key={c.name}
            role="radio"
            aria-checked={selected}
            aria-label={c.name}
            title={c.name}
            onClick={() => onChange(c.name)}
            className={`relative grid h-10 w-10 place-items-center rounded-full border transition-all ${
              selected ? 'scale-110 border-ink ring-2 ring-ink ring-offset-2 ring-offset-cream' : 'border-black/15 hover:scale-105'
            }`}
            style={{ background: c.hex }}
          >
            {selected && <CheckIcon width={16} height={16} className="text-white mix-blend-difference" />}
          </button>
        )
      })}
    </div>
  )
}

export function SizeSelector({
  sizes,
  value,
  onChange,
}: {
  sizes: string[]
  value: string | null
  onChange: (size: string) => void
}) {
  return (
    <div role="radiogroup" aria-label="Size" className="flex flex-wrap gap-2">
      {sizes.map((s) => {
        const selected = s === value
        return (
          <button
            key={s}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(s)}
            className={`h-11 min-w-12 rounded-xl border px-3 text-sm font-medium transition-colors ${
              selected ? 'border-ink bg-ink text-white' : 'border-black/15 bg-white hover:border-ink'
            }`}
          >
            {s}
          </button>
        )
      })}
    </div>
  )
}
