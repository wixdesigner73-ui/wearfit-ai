/**
 * Central, build-time configuration. Values come from Vite env vars (see .env.example).
 * Nothing here is secret: everything in a static frontend is public.
 */

/** ISO 4217 currency code used for display. Catalog base prices are authored in USD. */
export const CURRENCY: string = import.meta.env.VITE_CURRENCY || 'USD'

/** Multiplier applied to the USD base price when CURRENCY is not USD (display only). */
export const CURRENCY_RATE: number = Number(import.meta.env.VITE_CURRENCY_RATE) || 1

/**
 * Base URL of the FastAPI virtual try-on backend, e.g. "https://my-server.example.com".
 * Empty string = no backend configured, so the fitting room runs in clearly labeled DEMO mode.
 * Users can also paste a URL at runtime in the fitting room (stored in localStorage, URL only).
 */
export const DEFAULT_TRYON_API_URL: string = (import.meta.env.VITE_TRYON_API_URL || '').replace(/\/+$/, '')

/** Resolve a file in /public against the Vite base path (works on GitHub Pages sub-paths). */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

/**
 * Address the Contact page opens in the visitor's email app. Set VITE_CONTACT_EMAIL at build time.
 * The default is a deliberate placeholder so no personal address is published by accident.
 */
export const CONTACT_EMAIL: string = import.meta.env.VITE_CONTACT_EMAIL || 'hello@example.com'
export const CONTACT_EMAIL_IS_PLACEHOLDER: boolean = CONTACT_EMAIL === 'hello@example.com'
