/**
 * Contract between the UI and any virtual try-on engine.
 *
 * The UI only talks to this interface. To integrate a real model later, implement
 * `TryOnAdapter` in a new file (e.g. `remoteAdapter.ts`) and register it in `./index.ts`.
 * Nothing in the UI needs to change.
 */

export type TryOnMode = 'demo' | 'ai'

export interface TryOnGarment {
  productId: string
  name: string
  garment: string
  /** Where the garment is worn: used for placement in demo mode and as a hint for real models. */
  fitZone: 'top' | 'bottom' | 'full'
  colorName: string
  colorHex: string
}

export interface TryOnRequest {
  /** The user's photo. Kept in memory only — adapters must not persist or upload it unless the user explicitly opts in. */
  photo: Blob
  garment: TryOnGarment
}

export interface TryOnResult {
  /** 'demo' = client-side overlay preview. 'ai' is reserved for a real, tested model. */
  mode: TryOnMode
  /** True only when a real model produced `imageBlob`. Always false for the demo adapter. */
  isAiGenerated: boolean
  /** Human-readable note shown to the user next to the result. */
  disclosure: string
  /** Only present for real model output. The demo adapter leaves this undefined. */
  imageBlob?: Blob
}

export interface AdapterInfo {
  id: string
  label: string
  mode: TryOnMode
  /** Whether photos leave the device when using this adapter. */
  uploadsPhoto: boolean
  description: string
}

export interface TryOnAdapter {
  info: AdapterInfo
  /** Resolves true when the adapter can run right now (model loaded, endpoint reachable, ...). */
  isAvailable(): Promise<boolean>
  run(request: TryOnRequest, signal?: AbortSignal): Promise<TryOnResult>
}
