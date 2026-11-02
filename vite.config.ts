import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves project sites from https://<user>.github.io/<repo>/
// so production builds need that sub-path as the base.
//  - CI sets BASE_PATH automatically from the repository name.
//  - Locally, `npm run build` falls back to DEFAULT_BASE (change it if your repo has another name).
//  - `npm run dev` always serves from "/".
const DEFAULT_BASE = '/wearfit-ai/'

function normalizeBase(value: string): string {
  let base = value.trim()
  if (!base.startsWith('/')) base = `/${base}`
  if (!base.endsWith('/')) base = `${base}/`
  return base
}

export default defineConfig(({ command, isPreview }) => ({
  // `vite preview` also reports command === 'serve', so exclude it: previews should mimic production.
  base: command === 'serve' && !isPreview ? '/' : normalizeBase(process.env.BASE_PATH ?? DEFAULT_BASE),
  plugins: [react(), tailwindcss()],
}))
