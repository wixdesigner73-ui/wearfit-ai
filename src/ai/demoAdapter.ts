import type { TryOnAdapter, TryOnRequest, TryOnResult } from './types'

export const DEMO_DISCLOSURE =
  'Demo preview only. The garment is a flat illustration placed over your photo — no AI model has analysed your body or generated this image.'

/**
 * Demo adapter. It performs NO AI inference and sends nothing anywhere.
 * It resolves immediately with a result that tells the UI to render the overlay preview
 * (the interactive positioning happens in the fitting-room component).
 */
export const demoAdapter: TryOnAdapter = {
  info: {
    id: 'demo-overlay',
    label: 'Demo overlay (no AI)',
    mode: 'demo',
    uploadsPhoto: false,
    description: 'Places a flat garment illustration over your photo, entirely in your browser.',
  },

  async isAvailable() {
    return true
  },

  async run(_request: TryOnRequest, signal?: AbortSignal): Promise<TryOnResult> {
    // Short pause so the UI can show its progress state; there is no real computation.
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, 700)
      signal?.addEventListener('abort', () => {
        window.clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })
    return { mode: 'demo', isAiGenerated: false, disclosure: DEMO_DISCLOSURE }
  },
}
