import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getActiveAdapter, type TryOnResult } from '../ai'
import GarmentArt from '../components/GarmentArt'
import { BagIcon, CameraIcon, CloseIcon, SparkleIcon, SwitchCameraIcon, UploadIcon } from '../components/Icons'
import { ColorSelector, SizeSelector } from '../components/Selectors'
import { useStore } from '../context/StoreContext'
import { formatPrice, getProduct, PRODUCTS } from '../data/products'
import { useCamera } from '../hooks/useCamera'
import type { FitZone, Product } from '../types'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

interface Placement {
  x: number // centre, % of frame width
  y: number // centre, % of frame height
  size: number // garment width, % of frame width
  rotate: number // degrees
  opacity: number // 0.4 - 1
}

const DEFAULT_PLACEMENT: Record<FitZone, Placement> = {
  top: { x: 50, y: 40, size: 58, rotate: 0, opacity: 0.92 },
  bottom: { x: 50, y: 72, size: 46, rotate: 0, opacity: 0.92 },
  full: { x: 50, y: 58, size: 62, rotate: 0, opacity: 0.92 },
}

type RunState = 'idle' | 'processing' | 'done'

export default function FittingRoom() {
  const [params, setParams] = useSearchParams()
  const { addToCart, notify } = useStore()
  const camera = useCamera()
  const adapter = useMemo(() => getActiveAdapter(), [])

  const initialProduct = getProduct(params.get('product') ?? '') ?? PRODUCTS[0]
  const [product, setProduct] = useState<Product>(initialProduct)
  const [colorName, setColorName] = useState(
    initialProduct.colors.find((c) => c.name === params.get('color'))?.name ?? initialProduct.colors[0].name,
  )
  const [size, setSize] = useState<string | null>(null)
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT[initialProduct.fitZone])

  // The user's photo lives only in memory: a Blob plus a temporary object URL. Never stored or uploaded.
  const [photo, setPhotoBlob] = useState<Blob | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [runState, setRunState] = useState<RunState>('idle')
  const [result, setResult] = useState<TryOnResult | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const urlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)

  const color = product.colors.find((c) => c.name === colorName) ?? product.colors[0]
  const cameraLive = camera.status === 'active'
  const showOverlay = cameraLive || !!photoUrl

  const setPhoto = useCallback((blob: Blob | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    const url = blob ? URL.createObjectURL(blob) : null
    urlRef.current = url
    setPhotoBlob(blob)
    setPhotoUrl(url)
    setPhotoError(null)
    setRunState('idle')
    setResult(null)
  }, [])

  // Release the photo URL and abort any run when leaving the page.
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const chooseProduct = (p: Product) => {
    setProduct(p)
    setColorName(p.colors[0].name)
    setSize(null)
    setPlacement(DEFAULT_PLACEMENT[p.fitZone])
    setRunState('idle')
    setResult(null)
    setParams({ product: p.id }, { replace: true })
  }

  const handleFile = (file: File | undefined | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file (JPG, PNG or WebP).')
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setPhotoError('That image is larger than 20 MB. Please choose a smaller one.')
      return
    }
    camera.stop()
    setPhoto(file)
  }

  const capture = async () => {
    const blob = await camera.capture()
    if (!blob) {
      setPhotoError('Could not capture a frame. Please try again.')
      return
    }
    camera.stop()
    setPhoto(blob)
  }

  const runDemo = async () => {
    if (!photo) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setRunState('processing')
    try {
      const res = await adapter.run(
        {
          photo,
          garment: {
            productId: product.id,
            name: product.name,
            garment: product.garment,
            fitZone: product.fitZone,
            colorName: color.name,
            colorHex: color.hex,
          },
        },
        controller.signal,
      )
      setResult(res)
      setRunState('done')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setRunState('idle')
      notify('The preview could not be created. Please try again.')
    }
  }

  // Drag the garment to position it (pointer events work for mouse, touch and pen).
  const drag = useRef<{ startX: number; startY: number; origin: Placement } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startX: e.clientX, startY: e.clientY, origin: placement }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    const rect = frameRef.current?.getBoundingClientRect()
    if (!d || !rect) return
    const dx = ((e.clientX - d.startX) / rect.width) * 100
    const dy = ((e.clientY - d.startY) / rect.height) * 100
    setPlacement({
      ...d.origin,
      x: Math.min(100, Math.max(0, d.origin.x + dx)),
      y: Math.min(100, Math.max(0, d.origin.y + dy)),
    })
  }
  const endDrag = () => {
    drag.current = null
  }

  const patch = (p: Partial<Placement>) => setPlacement((prev) => ({ ...prev, ...p }))

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
          <SparkleIcon width={14} height={14} /> Demo mode
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Virtual fitting room</h1>
        <p className="mt-2 text-ink/70">
          Add a photo, pick a garment and position it. This is a <strong>demo overlay</strong>, not AI: the garment is a flat
          illustration placed over your photo. Real AI try-on is not connected yet.
        </p>
      </div>

      {/* grid-cols-1 (= minmax(0,1fr)) stops the horizontally scrolling garment strip from widening the page. */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-12">
        {/* ---------- Preview frame ---------- */}
        <div>
          <div
            ref={frameRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              handleFile(e.dataTransfer.files[0])
            }}
            className="relative mx-auto aspect-[3/4] w-full max-w-sm touch-pan-y select-none overflow-hidden rounded-3xl bg-ink-soft shadow-xl lg:max-w-none"
          >
            {cameraLive && (
              <video
                ref={camera.videoRef}
                playsInline
                muted
                autoPlay
                className={`absolute inset-0 h-full w-full object-cover ${camera.facing === 'user' ? '-scale-x-100' : ''}`}
              />
            )}
            {!cameraLive && photoUrl && (
              <img
                src={photoUrl}
                alt="Your photo preview"
                onError={() => {
                  setPhotoError('This image could not be displayed. Try a JPG or PNG file.')
                  setPhoto(null)
                }}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            )}

            {!cameraLive && !photoUrl && <EmptyFrame requesting={camera.status === 'requesting'} />}

            {/* Garment overlay (demo) */}
            {showOverlay && (
              <div
                role="img"
                aria-label={`${product.name} in ${color.name}, positioned over your photo. Drag to move.`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute cursor-grab touch-none active:cursor-grabbing"
                style={{
                  left: `${placement.x}%`,
                  top: `${placement.y}%`,
                  width: `${placement.size}%`,
                  transform: `translate(-50%, -50%) rotate(${placement.rotate}deg)`,
                  opacity: placement.opacity,
                  filter: 'drop-shadow(0 6px 10px rgb(0 0 0 / 0.35))',
                }}
              >
                <GarmentArt type={product.garment} color={color.hex} flat className="pointer-events-none block w-full" />
              </div>
            )}

            {runState === 'processing' && (
              <div className="pointer-events-none absolute inset-0 bg-ink/30">
                <div className="scanline" />
              </div>
            )}

            {/* Always-visible demo label */}
            <div className="glass-dark pointer-events-none absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              Demo preview · not AI
            </div>
          </div>

          {/* Camera controls */}
          {cameraLive && (
            <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-4">
              <button
                onClick={() => camera.start(camera.facing === 'user' ? 'environment' : 'user')}
                className="grid h-12 w-12 place-items-center rounded-full border border-black/15 bg-white"
                aria-label="Switch camera"
              >
                <SwitchCameraIcon />
              </button>
              <button
                onClick={capture}
                className="grid h-16 w-16 place-items-center rounded-full border-4 border-ink bg-white transition-transform active:scale-90"
                aria-label="Capture photo"
              >
                <span className="h-11 w-11 rounded-full bg-ink" />
              </button>
              <button
                onClick={camera.stop}
                className="grid h-12 w-12 place-items-center rounded-full border border-black/15 bg-white"
                aria-label="Turn camera off"
              >
                <CloseIcon />
              </button>
            </div>
          )}

          {/* Disclosure after the demo run */}
          {runState === 'done' && result && (
            <p role="status" className="mx-auto mt-4 max-w-sm rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm text-ink/80 lg:max-w-none">
              <strong className="block text-ink">{result.isAiGenerated ? 'AI-generated result' : 'Demo preview ready'}</strong>
              {result.disclosure}
            </p>
          )}
        </div>

        {/* ---------- Controls ---------- */}
        <div className="space-y-8">
          {/* Step 1 */}
          <section aria-labelledby="step-photo">
            <h2 id="step-photo" className="text-sm font-semibold uppercase tracking-wider text-ink/50">
              1 · Your photo
            </h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setPhoto(null)
                  void camera.start()
                }}
                disabled={camera.status === 'requesting'}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                <CameraIcon width={18} height={18} />
                {camera.status === 'requesting' ? 'Waiting for permission…' : cameraLive ? 'Restart camera' : 'Use camera'}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-ink px-5 py-3 text-sm font-semibold"
              >
                <UploadIcon width={18} height={18} />
                Upload photo
              </button>
              {photoUrl && (
                <button onClick={() => setPhoto(null)} className="inline-flex items-center gap-2 px-3 py-3 text-sm text-ink/60 hover:text-ink">
                  <CloseIcon width={16} height={16} />
                  Remove photo
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0])
                  e.target.value = '' // allow re-selecting the same file
                }}
              />
            </div>

            {(camera.error || photoError) && (
              <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {photoError ?? camera.error?.message}
              </p>
            )}

            <p className="mt-3 text-xs leading-relaxed text-ink/55">
              The camera starts only when you press “Use camera”. Your photo stays in this browser tab’s memory, is never uploaded
              or saved, and disappears when you remove it or leave the page.
            </p>
          </section>

          {/* Step 2 */}
          <section aria-labelledby="step-garment">
            <h2 id="step-garment" className="text-sm font-semibold uppercase tracking-wider text-ink/50">
              2 · Choose a garment
            </h2>
            <div className="scroll-hide -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {PRODUCTS.map((p) => {
                const selected = p.id === product.id
                return (
                  <button
                    key={p.id}
                    onClick={() => chooseProduct(p)}
                    aria-pressed={selected}
                    aria-label={p.name}
                    className={`studio grid h-24 w-20 shrink-0 place-items-center rounded-2xl border-2 transition-all ${
                      selected ? 'border-ink' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <GarmentArt type={p.garment} color={p.colors[0].hex} flat className="h-[80%] w-[80%]" />
                  </button>
                )
              })}
            </div>

            {/* Selected garment display */}
            <div className="mt-4 flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="studio grid h-28 w-24 shrink-0 place-items-center rounded-xl">
                <GarmentArt type={product.garment} color={color.hex} flat className="h-[85%] w-[85%]" title={`${product.name} in ${color.name}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">Selected garment</p>
                <h3 className="truncate text-lg font-semibold">{product.name}</h3>
                <p className="text-sm text-ink/60">
                  {color.name} · {formatPrice(product.price)}
                </p>
                <Link to={`/product/${product.id}`} className="mt-2 inline-block text-sm font-medium text-gold underline-offset-4 hover:underline">
                  View details
                </Link>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Color: {color.name}</p>
              <ColorSelector
                colors={product.colors}
                value={color.name}
                onChange={(name) => {
                  setColorName(name)
                  setRunState('idle')
                  setResult(null)
                  setParams({ product: product.id, color: name }, { replace: true })
                }}
              />
            </div>
          </section>

          {/* Step 3 */}
          <section aria-labelledby="step-adjust">
            <h2 id="step-adjust" className="text-sm font-semibold uppercase tracking-wider text-ink/50">
              3 · Position & preview
            </h2>
            <p className="mt-1 text-sm text-ink/60">Drag the garment on the photo, or fine-tune with the sliders.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Slider label="Size" min={25} max={100} value={placement.size} onChange={(v) => patch({ size: v })} />
              <Slider label="Rotate" min={-30} max={30} value={placement.rotate} unit="°" onChange={(v) => patch({ rotate: v })} />
              <Slider label="Left / right" min={0} max={100} value={placement.x} onChange={(v) => patch({ x: v })} />
              <Slider label="Up / down" min={0} max={100} value={placement.y} onChange={(v) => patch({ y: v })} />
              <Slider
                label="Opacity"
                min={40}
                max={100}
                value={Math.round(placement.opacity * 100)}
                onChange={(v) => patch({ opacity: v / 100 })}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={runDemo}
                disabled={!photo || runState === 'processing'}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
              >
                <SparkleIcon width={18} height={18} />
                {runState === 'processing' ? 'Preparing demo…' : 'Create demo preview'}
              </button>
              <button
                onClick={() => setPlacement(DEFAULT_PLACEMENT[product.fitZone])}
                className="rounded-full border border-black/15 px-5 py-3 text-sm font-semibold"
              >
                Reset position
              </button>
            </div>
            {!photo && <p className="mt-2 text-xs text-ink/50">Add a photo first to create a preview.</p>}
          </section>

          {/* Step 4 */}
          <section aria-labelledby="step-buy" className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 id="step-buy" className="text-sm font-semibold uppercase tracking-wider text-ink/50">
              Like it?
            </h2>
            <p className="mt-3 mb-2 text-sm font-medium">Size</p>
            <SizeSelector sizes={product.sizes} value={size} onChange={setSize} />
            <button
              onClick={() => {
                if (!size) {
                  notify('Please choose a size first')
                  return
                }
                addToCart({ productId: product.id, size, color: color.name })
                notify('Added to bag')
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-white"
            >
              <BagIcon width={18} height={18} />
              Add to bag · {formatPrice(product.price)}
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

function EmptyFrame({ requesting }: { requesting: boolean }) {
  return (
    <div className="bg-aurora grain absolute inset-0 grid place-items-center p-6 text-center">
      <div className="relative z-10 text-white">
        <svg viewBox="0 0 120 160" className="mx-auto h-40 w-auto opacity-70" aria-hidden="true">
          <circle cx="60" cy="32" r="20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 5" />
          <path
            d="M20 150c0-34 16-60 40-60s40 26 40 60"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 5"
            strokeLinecap="round"
          />
        </svg>
        <p className="mt-4 text-sm font-medium">{requesting ? 'Waiting for camera permission…' : 'Your photo appears here'}</p>
        <p className="mt-1 text-xs text-white/60">Use the camera, upload a photo, or drop an image on this frame.</p>
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  unit = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between font-medium">
        {label}
        <span className="text-ink/50">
          {Math.round(value)}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer accent-ink"
      />
    </label>
  )
}
