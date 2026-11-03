import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { checkBackend, generateTryOn, getApiUrl, setApiUrl, TryOnError, type BackendState } from '../ai/tryOnClient'
import { ImageError, prepareImage } from '../ai/imageUtils'
import {
  ArrowLeftIcon,
  BagIcon,
  CameraIcon,
  CheckIcon,
  CloseIcon,
  CompareIcon,
  DownloadIcon,
  ShieldIcon,
  SparkleIcon,
  SwitchCameraIcon,
  UploadIcon,
} from '../components/Icons'
import { SizeSelector } from '../components/Selectors'
import { asset } from '../config'
import { useStore } from '../context/StoreContext'
import { formatPrice, getProduct, PRODUCTS } from '../data/products'
import { useCamera } from '../hooks/useCamera'
import type { Gender, Product } from '../types'

interface TryOnResultItem {
  id: string
  product: Product
  url: string
}

const MAX_COMPARE = 3

function formatElapsed(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function FittingRoom() {
  const [params, setParams] = useSearchParams()
  const { addToCart, notify, selectedProductId, selectProduct } = useStore()
  const camera = useCamera()

  // ── Selected garment: URL param > shared selection > first product (kept in sync with shop and product page) ──
  const product: Product = getProduct(params.get('product') ?? '') ?? getProduct(selectedProductId ?? '') ?? PRODUCTS[0]
  useEffect(() => {
    selectProduct(product.id)
  }, [product.id, selectProduct])
  const chooseProduct = (p: Product) => {
    selectProduct(p.id)
    setParams({ product: p.id }, { replace: true })
    setSize(null)
  }

  // ── Photo (memory only; never stored) ──
  const [photo, setPhotoBlob] = useState<Blob | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoConfirmed, setPhotoConfirmed] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const setPhoto = useCallback((blob: Blob | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    const url = blob ? URL.createObjectURL(blob) : null
    urlRef.current = url
    setPhotoBlob(blob)
    setPhotoUrl(url)
    setPhotoConfirmed(false)
    setPhotoError(null)
  }, [])

  // ── AI backend ──
  const [backend, setBackend] = useState<BackendState>(() => (getApiUrl() ? { kind: 'checking', url: getApiUrl() } : { kind: 'unconfigured' }))
  const [urlDraft, setUrlDraft] = useState(getApiUrl())
  const [urlError, setUrlError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)

  const refreshBackend = useCallback(async (signal?: AbortSignal) => {
    const url = getApiUrl()
    setBackend(url ? { kind: 'checking', url } : { kind: 'unconfigured' })
    try {
      setBackend(await checkBackend(signal))
    } catch {
      /* aborted */
    }
  }, [])

  useEffect(() => {
    const c = new AbortController()
    void refreshBackend(c.signal)
    return () => c.abort()
  }, [refreshBackend])

  // ── Generation ──
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [runError, setRunError] = useState<string | null>(null)
  const [results, setResults] = useState<TryOnResultItem[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [comparing, setComparing] = useState(false)
  const [showBefore, setShowBefore] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const resultsRef = useRef<TryOnResultItem[]>([])
  resultsRef.current = results

  useEffect(() => {
    if (!running) return
    setElapsed(0)
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [running])

  // Release every object URL and abort any request when leaving the page.
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      resultsRef.current.forEach((r) => URL.revokeObjectURL(r.url))
      abortRef.current?.abort()
    }
  }, [])

  const current = results.find((r) => r.id === currentId) ?? null
  const aiReady = backend.kind === 'ready'
  const cameraLive = camera.status === 'active'

  const acceptPhoto = async (source: Blob) => {
    setPhotoError(null)
    try {
      const prepared = await prepareImage(source)
      camera.stop()
      setPhoto(prepared)
      setCurrentId(null)
      setComparing(false)
    } catch (err) {
      setPhotoError(err instanceof ImageError ? err.message : 'This image could not be used. Please try another one.')
    }
  }

  const capture = async () => {
    const blob = await camera.capture()
    if (!blob) {
      setPhotoError('Could not capture a frame. Please try again.')
      return
    }
    await acceptPhoto(blob)
  }

  const generate = async () => {
    if (!photo || !photoConfirmed || !consent || !aiReady) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setRunning(true)
    setRunError(null)
    setComparing(false)
    setShowBefore(false)
    try {
      const garmentRes = await fetch(asset(product.garmentImage))
      if (!garmentRes.ok) throw new TryOnError('The garment image could not be loaded.', 'server')
      const garment = await garmentRes.blob()
      const out = await generateTryOn({
        person: photo,
        garment,
        category: product.tryOnCategory,
        garmentPhotoType: product.garmentPhotoType,
        signal: controller.signal,
      })
      const item: TryOnResultItem = { id: `${product.id}-${Date.now()}`, product, url: URL.createObjectURL(out) }
      setResults((r) => [...r, item])
      setCurrentId(item.id)
    } catch (err) {
      if (err instanceof TryOnError && err.code === 'cancelled') return
      setRunError(err instanceof TryOnError ? err.message : 'Something went wrong while generating the preview.')
      if (err instanceof TryOnError && (err.code === 'network' || err.code === 'unavailable')) void refreshBackend()
    } finally {
      setRunning(false)
    }
  }

  const removeResult = (id: string) => {
    const r = results.find((x) => x.id === id)
    if (r) URL.revokeObjectURL(r.url)
    setResults((list) => list.filter((x) => x.id !== id))
    setCompareIds((ids) => ids.filter((x) => x !== id))
    if (currentId === id) setCurrentId(null)
  }

  const toggleCompare = (id: string) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= MAX_COMPARE ? ids : [...ids, id]))

  // ── Garment picker ──
  const [genderTab, setGenderTab] = useState<Gender | 'all'>('all')
  const pickerProducts = useMemo(() => PRODUCTS.filter((p) => genderTab === 'all' || p.gender === genderTab), [genderTab])
  const [size, setSize] = useState<string | null>(null)
  const pickerRef = useRef<HTMLElement | null>(null)

  const apiHost = backend.kind === 'unconfigured' ? '' : (() => { try { return new URL(backend.url).host } catch { return backend.url } })()
  const compared = compareIds.map((id) => results.find((r) => r.id === id)).filter((r): r is TryOnResultItem => !!r)

  const stepDot = (done: boolean, n: number) => (
    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${done ? 'bg-emerald-600 text-white' : 'bg-ink text-white'}`}>
      {done ? <CheckIcon width={13} height={13} /> : n}
    </span>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Virtual fitting room</p>
          <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">See it on you</h1>
          <p className="mt-3 text-ink/65">
            Add your photo, choose a garment from the catalog and generate a try-on preview. Previews are illustrations and do not
            guarantee size or fit.
          </p>
        </div>
        <BackendBadge backend={backend} onRetry={() => void refreshBackend()} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-14">
        {/* ───────────── Stage ───────────── */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="photo-bg relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl shadow-xl lg:max-w-none">
            {cameraLive && (
              <video
                ref={camera.videoRef}
                playsInline
                muted
                autoPlay
                className={`absolute inset-0 h-full w-full object-cover ${camera.facing === 'user' ? '-scale-x-100' : ''}`}
              />
            )}

            {!cameraLive && current && (
              <img src={current.url} alt={`AI try-on preview of ${current.product.name}`} className="absolute inset-0 h-full w-full object-contain bg-ink" />
            )}

            {/* The user's own photo. Never a side-by-side, overlay or composite: the only generated image is `current`. */}
            {!cameraLive && !current && photoUrl && (
              <img src={photoUrl} alt="Your photo" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
            )}
            {!cameraLive && !current && photoUrl && !aiReady && !running && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-4 pt-12 text-center text-xs text-white">
                No AI server is connected, so no try-on can be generated. This is only your own photo.
              </div>
            )}

            {!cameraLive && !current && !photoUrl && <EmptyStage requesting={camera.status === 'requesting'} />}

            {running && (
              <div className="absolute inset-0 bg-ink/45">
                <div className="scanline" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-5 text-white">
                  <p className="text-sm font-semibold">Generating your preview…</p>
                  <p className="mt-1 text-xs text-white/70">
                    {formatElapsed(elapsed)} elapsed. The AI model is running on the server; this can take from seconds (GPU) to many
                    minutes (CPU).
                  </p>
                  <button onClick={() => abortRef.current?.abort()} className="mt-3 rounded-full border border-white/40 px-4 py-1.5 text-xs font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Truthful label on every state */}
            <span
              className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white ${
                current ? 'bg-emerald-700/90' : !aiReady ? 'bg-rose-700/90' : 'glass-dark'
              }`}
            >
              {current ? 'AI-generated · FASHN VTON v1.5' : !aiReady ? 'AI not connected · no try-on' : 'Ready for AI try-on'}
            </span>
          </div>

          {cameraLive && (
            <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-4">
              <button onClick={() => camera.start(camera.facing === 'user' ? 'environment' : 'user')} className="grid h-12 w-12 place-items-center rounded-full border border-black/15 bg-white" aria-label="Switch camera">
                <SwitchCameraIcon />
              </button>
              <button onClick={capture} className="grid h-16 w-16 place-items-center rounded-full border-4 border-ink bg-white transition-transform active:scale-90" aria-label="Capture photo">
                <span className="h-11 w-11 rounded-full bg-ink" />
              </button>
              <button onClick={camera.stop} className="grid h-12 w-12 place-items-center rounded-full border border-black/15 bg-white" aria-label="Turn camera off">
                <CloseIcon />
              </button>
            </div>
          )}

          {/* Result actions */}
          {current && !running && (
            <div className="mx-auto mt-5 max-w-sm space-y-3 lg:max-w-none">
              <p role="status" className="rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm leading-relaxed text-ink/80">
                <strong className="block text-ink">Try-on preview: {current.product.name}</strong>
                Generated by FASHN VTON v1.5. This is an AI illustration. It does not guarantee your size, measurements or how the
                garment will physically fit.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white"
                >
                  <SparkleIcon width={16} height={16} /> Try Another Outfit
                </button>
                <button
                  onClick={() => {
                    setCurrentId(null)
                    setShowBefore(false)
                    setPhoto(null)
                  }}
                  className="flex items-center justify-center gap-2 rounded-full border border-ink px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                >
                  <CameraIcon width={16} height={16} /> Change My Photo
                </button>
                <a
                  href={current.url}
                  download={`wearfit-tryon-${current.product.id}.png`}
                  className="flex items-center justify-center gap-2 rounded-full border border-black/20 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                >
                  <DownloadIcon width={16} height={16} /> Download Result
                </a>
                <Link to="/shop" className="flex items-center justify-center gap-2 rounded-full border border-black/20 px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                  <ArrowLeftIcon width={16} height={16} /> Back to Products
                </Link>
              </div>
              {/* Optional, off by default: the generated photo above stays the main result. */}
              {photoUrl && (
                <button
                  onClick={() => setShowBefore((v) => !v)}
                  aria-expanded={showBefore}
                  className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-medium text-ink/70 underline-offset-4 hover:underline"
                >
                  <CompareIcon width={15} height={15} /> {showBefore ? "Hide before / after" : "Show before / after"}
                </button>
              )}
              {showBefore && photoUrl && (
                <div className="grid grid-cols-2 gap-2">
                  <figure>
                    <img src={photoUrl} alt="Your original photo" className="aspect-[3/4] w-full rounded-xl object-cover" />
                    <figcaption className="mt-1 text-center text-[11px] text-ink/55">Before (your photo)</figcaption>
                  </figure>
                  <figure>
                    <img src={current.url} alt="AI-generated try-on" className="aspect-[3/4] w-full rounded-xl bg-ink object-contain" />
                    <figcaption className="mt-1 text-center text-[11px] text-ink/55">After (AI-generated)</figcaption>
                  </figure>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ───────────── Steps ───────────── */}
        <div className="min-w-0 space-y-12">
          {/* Step 1 */}
          <section aria-labelledby="step-photo">
            <h2 id="step-photo" className="flex items-center gap-3 font-display text-2xl font-semibold">
              {stepDot(photoConfirmed, 1)} Your photo
            </h2>
            <p className="mt-2 text-sm text-ink/60">A clear, front-facing, full or half-length photo in good light works best.</p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setPhoto(null)
                  void camera.start()
                }}
                disabled={camera.status === 'requesting'}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[13px] font-semibold uppercase tracking-wider text-white disabled:opacity-60"
              >
                <CameraIcon width={18} height={18} />
                {camera.status === 'requesting' ? 'Waiting for permission…' : cameraLive ? 'Restart camera' : 'Take photo'}
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-ink px-6 py-3 text-[13px] font-semibold uppercase tracking-wider">
                <UploadIcon width={18} height={18} /> Upload photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void acceptPhoto(f)
                  e.target.value = ''
                }}
              />
            </div>

            {(camera.error || photoError) && (
              <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {photoError ?? camera.error?.message}
              </p>
            )}

            {photoUrl && !photoConfirmed && !cameraLive && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-white p-4">
                <img src={photoUrl} alt="Your photo preview" className="h-24 w-[4.5rem] rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Use this photo?</p>
                  <p className="text-xs text-ink/55">Nothing has been uploaded. It stays in your browser until you generate a try-on.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPhotoConfirmed(true)} className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white">
                    Use photo
                  </button>
                  <button onClick={() => setPhoto(null)} className="rounded-full border border-black/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider">
                    Retake
                  </button>
                </div>
              </div>
            )}
            {photoUrl && photoConfirmed && (
              <p className="mt-4 flex items-center gap-2 text-sm text-emerald-800">
                <CheckIcon width={16} height={16} /> Photo ready.{' '}
                <button onClick={() => setPhoto(null)} className="underline underline-offset-2">Remove</button>
              </p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-ink/50">
              The camera turns on only when you press “Take photo”. Photos are re-saved as a smaller image in memory (location data is
              removed), are never stored on this site, and disappear when you remove them or leave this page.
            </p>
          </section>

          {/* Step 2 */}
          <section ref={pickerRef} aria-labelledby="step-garment" className="scroll-mt-28">
            <h2 id="step-garment" className="flex items-center gap-3 font-display text-2xl font-semibold">
              {stepDot(true, 2)} Choose a garment
            </h2>
            <div className="mt-4 flex gap-2" role="group" aria-label="Filter garments">
              {(['all', 'women', 'men'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGenderTab(g)}
                  aria-pressed={genderTab === g}
                  className={`rounded-full border px-4 py-1.5 text-[13px] font-medium capitalize ${genderTab === g ? 'border-ink bg-ink text-white' : 'border-black/15 bg-white'}`}
                >
                  {g}
                </button>
              ))}
            </div>
            <ul className="mt-4 grid max-h-[26rem] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-5 lg:grid-cols-6">
              {pickerProducts.map((p) => {
                const selected = p.id === product.id
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => chooseProduct(p)}
                      aria-pressed={selected}
                      aria-label={p.name}
                      title={p.name}
                      className={`photo-bg block w-full overflow-hidden rounded-lg border-2 transition-all ${selected ? 'border-ink' : 'border-transparent opacity-85 hover:opacity-100'}`}
                    >
                      <img src={asset(p.image)} alt="" className="aspect-[4/5] w-full object-cover" loading="lazy" />
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="mt-5 flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <img src={asset(product.image)} alt={product.name} className="h-32 w-[6.4rem] shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/45">Selected garment</p>
                <h3 className="truncate text-lg font-medium">{product.name}</h3>
                <p className="text-sm text-ink/60">
                  {product.productType} · {product.colors[0].name} · {formatPrice(product.price)}
                </p>
                <p className="mt-1 text-xs text-ink/45">
                  AI input: {product.garmentPhotoType === 'flat-lay' ? 'garment-only photo' : 'model-worn photo'} · category “{product.tryOnCategory}”
                </p>
                <Link to={`/product/${product.id}`} className="link-underline mt-2 inline-block text-[13px] font-medium text-gold">
                  View product details
                </Link>
              </div>
            </div>
          </section>

          {/* Step 3 */}
          <section aria-labelledby="step-generate">
            <h2 id="step-generate" className="flex items-center gap-3 font-display text-2xl font-semibold">
              {stepDot(!!current, 3)} Generate try-on
            </h2>

            {!aiReady ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-relaxed text-rose-900">
                <p className="font-semibold">The AI server is not connected, so no try-on can be generated.</p>
                <p className="mt-2">
                  {backend.kind === 'unconfigured' && 'No AI server is configured. The try-on model runs on a separate server (see the README), which has to be connected first.'}
                  {backend.kind === 'checking' && 'Checking the AI server…'}
                  {backend.kind === 'unreachable' && backend.reason}
                  {backend.kind === 'model-unavailable' && backend.reason}
                </p>
                <p className="mt-2">
                  Nothing is uploaded and nothing is faked: this page never shows an overlay or a composite as a try-on. Connect an AI
                  server (see the README) to generate a real photo of you in this garment.
                </p>
                <button disabled className="mt-4 inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-gold px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-white opacity-40">
                  <SparkleIcon width={18} height={18} /> Generate AI try-on
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <label className="flex cursor-pointer gap-3 rounded-2xl border border-black/10 bg-white p-4 text-sm leading-relaxed">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-ink" />
                  <span>
                    <span className="flex items-center gap-1.5 font-semibold"><ShieldIcon width={16} height={16} className="text-gold" /> Consent to send my photo</span>
                    I agree to send my photo and the selected garment image to the AI server at <strong>{apiHost}</strong> to generate
                    this preview. It is processed in memory and not stored. I understand it leaves my device.
                  </span>
                </label>
                <button
                  onClick={generate}
                  disabled={!photo || !photoConfirmed || !consent || running}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  <SparkleIcon width={18} height={18} /> {running ? 'Generating…' : 'Generate AI try-on'}
                </button>
                {!photoConfirmed && <p className="text-xs text-ink/55">Add and confirm a photo (step 1) to continue.</p>}
                {photoConfirmed && !consent && <p className="text-xs text-ink/55">Tick the consent box to enable generation.</p>}
                <p className="text-xs text-ink/50">
                  Server: {backend.kind === 'ready' && `${backend.modelVersion} on ${backend.device.toUpperCase()}`}. Speed depends on that hardware.
                </p>
              </div>
            )}

            {runError && (
              <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{runError}</p>
            )}

            <details className="mt-6 text-sm">
              <summary className="cursor-pointer font-medium text-ink/70">Advanced: AI server address</summary>
              <form
                className="mt-3 flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  try {
                    setApiUrl(urlDraft)
                    setUrlError(null)
                    setConsent(false)
                    void refreshBackend()
                  } catch (err) {
                    setUrlError((err as Error).message)
                  }
                }}
              >
                <input
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  placeholder="https://your-ai-server.example.com"
                  aria-label="AI server URL"
                  className="min-w-0 flex-1 basis-64 rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-ink"
                />
                <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white">Connect</button>
              </form>
              {urlError && <p role="alert" className="mt-2 text-xs text-rose-700">{urlError}</p>}
              <p className="mt-2 text-xs text-ink/50">
                Only the address is saved in your browser, never photos. Over HTTPS this site can only reach <code>https://</code>{' '}
                servers or <code>http://localhost</code>.
              </p>
            </details>
          </section>

          {/* Results & compare */}
          {results.length > 0 && (
            <section aria-labelledby="step-results">
              <h2 id="step-results" className="font-display text-2xl font-semibold">Your try-ons this session</h2>
              <p className="mt-1 text-xs text-ink/50">Kept in memory only. They disappear when you leave or refresh this page.</p>
              <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {results.map((r) => (
                  <li key={r.id} className="w-28 shrink-0">
                    <button onClick={() => { setCurrentId(r.id); setComparing(false) }} aria-label={`Show try-on of ${r.product.name}`} className={`block w-full overflow-hidden rounded-lg border-2 ${currentId === r.id ? 'border-ink' : 'border-transparent'}`}>
                      <img src={r.url} alt="" className="aspect-[3/4] w-full object-cover" />
                    </button>
                    <p className="mt-1 truncate text-[11px]">{r.product.name}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <label className="flex cursor-pointer items-center gap-1">
                        <input type="checkbox" checked={compareIds.includes(r.id)} onChange={() => toggleCompare(r.id)} className="accent-ink" /> Compare
                      </label>
                      <button onClick={() => removeResult(r.id)} aria-label={`Delete try-on of ${r.product.name}`} className="text-ink/45 hover:text-rose-600">
                        <CloseIcon width={14} height={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setComparing((c) => !c)}
                disabled={compared.length < 2}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CompareIcon width={16} height={16} /> {comparing ? 'Hide comparison' : `Compare outfits (${compared.length}/${MAX_COMPARE})`}
              </button>
              {compared.length < 2 && <span className="ml-3 text-xs text-ink/50">Tick “Compare” on at least two results.</span>}

              {comparing && compared.length >= 2 && (
                <div className={`mt-5 grid gap-3 ${compared.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {compared.map((r) => (
                    <figure key={r.id}>
                      <img src={r.url} alt={`Try-on of ${r.product.name}`} className="aspect-[3/4] w-full rounded-xl bg-ink object-contain" />
                      <figcaption className="mt-2 text-xs">
                        <Link to={`/product/${r.product.id}`} className="font-medium hover:underline">{r.product.name}</Link>
                        <span className="block text-ink/55">{formatPrice(r.product.price)}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Add to bag */}
          <section aria-labelledby="step-buy" className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 id="step-buy" className="font-display text-xl font-semibold">Like {product.name}?</h2>
            <p className="mb-2 mt-3 text-sm font-medium">Size</p>
            <SizeSelector
              sizes={product.sizes}
              value={size}
              onChange={setSize}
              unavailable={product.stock === 'out-of-stock' ? product.sizes : (product.soldOutSizes ?? [])}
            />
            <button
              disabled={product.stock === 'out-of-stock'}
              onClick={() => {
                if (!size) {
                  notify('Please choose a size first')
                  return
                }
                addToCart({ productId: product.id, size, color: product.colors[0].name })
                notify('Added to bag')
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <BagIcon width={18} height={18} />
              {product.stock === 'out-of-stock' ? 'Out of stock' : `Add to bag · ${formatPrice(product.price)}`}
            </button>
            <p className="mt-3 text-xs text-ink/50">The try-on image does not confirm your size. Check the size options on the product page.</p>
          </section>
        </div>
      </div>
    </div>
  )
}

function BackendBadge({ backend, onRetry }: { backend: BackendState; onRetry: () => void }) {
  const base = 'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold'
  if (backend.kind === 'ready') {
    return (
      <span className={`${base} border-emerald-300 bg-emerald-50 text-emerald-900`}>
        <span className="h-2 w-2 rounded-full bg-emerald-600" /> AI server connected · {backend.device.toUpperCase()}
      </span>
    )
  }
  if (backend.kind === 'checking') {
    return <span className={`${base} border-black/15 bg-white text-ink/70`}>Checking AI server…</span>
  }
  return (
    <span className={`${base} border-rose-300 bg-rose-50 text-rose-900`}>
      <span className="h-2 w-2 rounded-full bg-rose-600" /> Demo mode · AI not connected
      {backend.kind !== 'unconfigured' && (
        <button onClick={onRetry} className="ml-1 underline underline-offset-2">Retry</button>
      )}
    </span>
  )
}

function EmptyStage({ requesting }: { requesting: boolean }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#e9e1d0] to-[#d9cfb9] p-6 text-center">
      <div>
        <svg viewBox="0 0 120 160" className="mx-auto h-36 w-auto text-ink/30" aria-hidden="true">
          <circle cx="60" cy="32" r="20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 5" />
          <path d="M20 150c0-34 16-60 40-60s40 26 40 60" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />
        </svg>
        <p className="mt-4 text-sm font-medium text-ink/70">{requesting ? 'Waiting for camera permission…' : 'Your photo appears here'}</p>
        <p className="mt-1 text-xs text-ink/50">Take a photo or upload one to begin.</p>
      </div>
    </div>
  )
}
