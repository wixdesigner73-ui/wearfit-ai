import { useId } from 'react'
import type { GarmentType } from '../types'

/** Darken (negative) or lighten (positive) a #rrggbb color. amount is -1..1. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const mix = (channel: number) => {
    const target = amount < 0 ? 0 : 255
    return Math.round(channel + (target - channel) * Math.abs(amount))
  }
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

interface Shape {
  body: string
  /** Secondary parts drawn slightly darker (hood, waistband, collar...). */
  accents: { d: string; amount: number }[]
  /** Thin detail lines (zips, seams, drawstrings). */
  lines: string[]
}

// Original, hand-drawn flat garment silhouettes on a 200x240 canvas.
const SHAPES: Record<GarmentType, Shape> = {
  tee: {
    body: 'M72 26 L28 52 L44 92 L64 82 L64 212 L136 212 L136 82 L156 92 L172 52 L128 26 Q100 50 72 26 Z',
    accents: [{ d: 'M72 26 Q100 50 128 26 L124 24 Q100 42 76 24 Z', amount: -0.28 }],
    lines: ['M64 82 L64 212', 'M136 82 L136 212'],
  },
  hoodie: {
    body: 'M66 42 L20 72 L26 178 L52 180 L58 104 L58 214 L142 214 L142 104 L148 180 L174 178 L180 72 L134 42 Q100 64 66 42 Z',
    accents: [
      { d: 'M66 42 Q68 12 100 12 Q132 12 134 42 Q100 66 66 42 Z', amount: -0.18 },
      { d: 'M70 168 L130 168 L138 198 L62 198 Z', amount: -0.12 },
      { d: 'M58 205 L142 205 L142 214 L58 214 Z', amount: -0.15 },
    ],
    lines: ['M90 50 L88 90', 'M110 50 L112 90', 'M100 168 L100 198'],
  },
  jacket: {
    body: 'M64 36 L18 68 L24 184 L50 186 L58 104 L58 214 L142 214 L142 104 L150 186 L176 184 L182 68 L136 36 L100 62 Z',
    accents: [
      { d: 'M64 36 L88 20 L100 42 L100 62 Z', amount: -0.2 },
      { d: 'M136 36 L112 20 L100 42 L100 62 Z', amount: -0.2 },
      { d: 'M66 150 L90 150 L90 176 L66 176 Z', amount: -0.12 },
      { d: 'M110 150 L134 150 L134 176 L110 176 Z', amount: -0.12 },
    ],
    lines: ['M100 62 L100 214', 'M58 104 L58 214', 'M142 104 L142 214'],
  },
  dress: {
    body: 'M78 22 Q100 46 122 22 L138 30 L132 82 L156 218 L44 218 L68 82 L62 30 Z',
    accents: [
      { d: 'M68 82 L132 82 L134 96 L66 96 Z', amount: -0.2 },
      { d: 'M78 22 Q100 46 122 22 L119 20 Q100 36 81 20 Z', amount: -0.25 },
    ],
    lines: ['M82 96 L66 218', 'M100 96 L100 218', 'M118 96 L134 218'],
  },
  pants: {
    body: 'M58 18 L142 18 L152 224 L108 224 L100 84 L92 224 L48 224 Z',
    accents: [{ d: 'M58 18 L142 18 L143 36 L57 36 Z', amount: -0.22 }],
    lines: ['M100 36 L100 84', 'M74 36 L70 224', 'M126 36 L130 224'],
  },
  shorts: {
    body: 'M56 28 L144 28 L156 140 L108 140 L100 88 L92 140 L44 140 Z',
    accents: [{ d: 'M56 28 L144 28 L145 46 L55 46 Z', amount: -0.22 }],
    lines: ['M100 46 L100 88', 'M76 46 L72 140', 'M124 46 L128 140'],
  },
}

interface GarmentArtProps {
  type: GarmentType
  color: string
  className?: string
  /** Remove the drop shadow, e.g. when overlaying on a photo. */
  flat?: boolean
  title?: string
}

export default function GarmentArt({ type, color, className, flat, title }: GarmentArtProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const shape = SHAPES[type]
  const stroke = shade(color, -0.35)
  const lineColor = shade(color, -0.3)

  return (
    <svg
      viewBox="0 0 200 240"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <path d={shape.body} />
        </clipPath>
        {!flat && (
          <filter id={`shadow-${uid}`} x="-20%" y="-10%" width="140%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.28" />
          </filter>
        )}
      </defs>
      <g filter={flat ? undefined : `url(#shadow-${uid})`}>
        <path d={shape.body} fill={color} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        <g clipPath={`url(#clip-${uid})`}>
          {shape.accents.map((a, i) => (
            <path key={i} d={a.d} fill={shade(color, a.amount)} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
          ))}
          {shape.lines.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={lineColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
          ))}
          <path d={shape.body} fill={`url(#sheen-${uid})`} />
        </g>
      </g>
    </svg>
  )
}
