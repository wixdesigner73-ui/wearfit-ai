/**
 * Client for the separate FastAPI virtual try-on backend (see /backend).
 *
 * The frontend NEVER fabricates a result: `generateTryOn` returns the image the backend produced by running
 * FASHN VTON v1.5, or throws a `TryOnError`. When no backend is reachable the UI falls back to a clearly
 * labeled DEMO mode that does not upload anything.
 */
import { DEFAULT_TRYON_API_URL } from '../config'
import type { GarmentPhotoType, TryOnCategory } from '../types'

const STORAGE_KEY = 'wearfit.tryonApiUrl.v1'

export type BackendState =
  | { kind: 'unconfigured' }
  | { kind: 'checking'; url: string }
  | { kind: 'ready'; url: string; device: string; modelVersion: string }
  | { kind: 'model-unavailable'; url: string; reason: string }
  | { kind: 'unreachable'; url: string; reason: string }

export class TryOnError extends Error {
  constructor(
    message: string,
    public readonly code: 'network' | 'timeout' | 'cancelled' | 'busy' | 'invalid-image' | 'unavailable' | 'server',
  ) {
    super(message)
    this.name = 'TryOnError'
  }
}

/** URL precedence: user-entered (localStorage) > build-time VITE_TRYON_API_URL > none. */
export function getApiUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_TRYON_API_URL
}

/** Normalises and stores a user-entered URL. Pass '' to clear. Returns the normalised value or throws. */
export function setApiUrl(raw: string): string {
  const value = raw.trim().replace(/\/+$/, '')
  if (value) {
    let parsed: URL
    try {
      parsed = new URL(value)
    } catch {
      throw new Error('Enter a full URL such as https://my-server.example.com')
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('The URL must start with http:// or https://')
  }
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  return value
}

interface HealthResponse {
  status: string
  model_loaded: boolean
  device?: string
  model?: string
  detail?: string
}

export async function checkBackend(signal?: AbortSignal): Promise<BackendState> {
  const url = getApiUrl()
  if (!url) return { kind: 'unconfigured' }
  try {
    const res = await fetch(`${url}/api/health`, { signal, headers: { Accept: 'application/json' } })
    if (!res.ok) return { kind: 'unreachable', url, reason: `Server answered with HTTP ${res.status}.` }
    const body = (await res.json()) as HealthResponse
    if (!body.model_loaded) {
      return { kind: 'model-unavailable', url, reason: body.detail || 'The server is running but the try-on model is not loaded.' }
    }
    return { kind: 'ready', url, device: body.device ?? 'unknown', modelVersion: body.model ?? 'FASHN VTON v1.5' }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    const insecure = location.protocol === 'https:' && url.startsWith('http://') && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(url)
    return {
      kind: 'unreachable',
      url,
      reason: insecure
        ? 'This site is served over HTTPS, so browsers block calls to a plain http:// server. Use an https:// URL (or http://localhost).'
        : 'Could not reach the server. Check that it is running and that this site is allowed by its CORS settings.',
    }
  }
}

export interface TryOnParams {
  /** The customer's photo (already downscaled / re-encoded by `prepareImage`). */
  person: Blob
  /** The garment photograph from the catalog. */
  garment: Blob
  category: TryOnCategory
  garmentPhotoType: GarmentPhotoType
  /** Optional sampling steps (backend clamps to its allowed range). */
  numTimesteps?: number
  signal?: AbortSignal
  /** Hard client-side timeout. CPU inference can be very slow, so this is generous. */
  timeoutMs?: number
}

export async function generateTryOn(p: TryOnParams): Promise<Blob> {
  const url = getApiUrl()
  if (!url) throw new TryOnError('No AI server is configured.', 'unavailable')

  const form = new FormData()
  form.append('person_image', p.person, 'person.jpg')
  form.append('garment_image', p.garment, 'garment.jpg')
  form.append('category', p.category)
  form.append('garment_photo_type', p.garmentPhotoType)
  if (p.numTimesteps) form.append('num_timesteps', String(p.numTimesteps))

  const controller = new AbortController()
  let timedOut = false
  const timer = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, p.timeoutMs ?? 20 * 60 * 1000)
  const onAbort = () => controller.abort()
  p.signal?.addEventListener('abort', onAbort)

  try {
    const res = await fetch(`${url}/api/try-on`, { method: 'POST', body: form, signal: controller.signal })
    if (!res.ok) throw await toError(res)
    const type = res.headers.get('content-type') ?? ''
    if (!type.startsWith('image/')) throw new TryOnError('The server returned an unexpected response.', 'server')
    return await res.blob()
  } catch (err) {
    if (err instanceof TryOnError) throw err
    if ((err as Error).name === 'AbortError') {
      throw timedOut
        ? new TryOnError('The AI server took too long to respond. Try again, or use a machine with a GPU.', 'timeout')
        : new TryOnError('Cancelled.', 'cancelled')
    }
    throw new TryOnError('Could not reach the AI server. Check your connection and the server URL.', 'network')
  } finally {
    window.clearTimeout(timer)
    p.signal?.removeEventListener('abort', onAbort)
  }
}

async function toError(res: Response): Promise<TryOnError> {
  let message = `The server returned HTTP ${res.status}.`
  try {
    const body = await res.json()
    const detail = body?.detail
    message = typeof detail === 'string' ? detail : detail?.message || message
  } catch {
    /* non-JSON body */
  }
  if (res.status === 429 || res.status === 503) {
    return new TryOnError(message, res.status === 429 ? 'busy' : 'unavailable')
  }
  if (res.status === 504) return new TryOnError(message, 'timeout')
  if (res.status === 400 || res.status === 413 || res.status === 415 || res.status === 422) return new TryOnError(message, 'invalid-image')
  return new TryOnError(message, 'server')
}
