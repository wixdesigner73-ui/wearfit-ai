# WearFit AI

A static, premium-feeling fashion storefront built with **React + TypeScript + Vite + Tailwind CSS**, plus a **virtual fitting room running in clearly labeled demo mode**.

- No backend, no paid APIs, no secret keys, no paid assets.
- Product visuals are original SVG illustrations; sample data is fictional and local.
- Deploys for free to **GitHub Pages**.

> **Important: the fitting room is NOT AI.** In demo mode it places a flat garment illustration over your photo, and you position it by hand. The UI says so everywhere. No real try-on model is connected or tested. See [Connecting a real model later](#connecting-a-real-model-later).

## Features

- Home, product catalog, product detail pages, wishlist, shopping cart (drawer)
- Category filters, search, sorting; size and color selectors
- Cart and wishlist persist in your browser's `localStorage` (never photos)
- Virtual fitting room: camera capture, photo upload (or drag & drop), preview, selected-garment panel, drag/scale/rotate controls
- Mobile-first layout with a bottom tab bar; respects safe areas and `prefers-reduced-motion`

## Privacy behavior of the fitting room

- The camera is requested **only after you click "Use camera"** — never on page load.
- Permission denied, no camera, camera busy, insecure context and unsupported browser each show a friendly message and point to photo upload.
- Photos exist only in memory (a `Blob` and a temporary object URL). They are **not** written to `localStorage`, `sessionStorage`, IndexedDB or any server, and are released when you remove the photo or leave the page.
- The camera stream is stopped on capture, on cancel and on leaving the page.

## Project structure

```
src/
  ai/            TryOnAdapter interface, demo adapter, registry, remote adapter TEMPLATE (unused)
  components/    Header, Footer, CartDrawer, ProductCard, Selectors, GarmentArt (SVG art), Icons, Toast
  context/       StoreContext (cart + wishlist)
  data/          products.ts (local sample catalog)
  hooks/         useCamera.ts
  pages/         Home, Shop, ProductDetail, Wishlist, FittingRoom, NotFound
.github/workflows/deploy.yml   GitHub Pages deployment
vite.config.ts                 base path logic
```

Routing uses `HashRouter` (URLs look like `.../wearfit-ai/#/shop`), so deep links and page refreshes work on GitHub Pages without server rewrites.

## Local setup

Requires Node.js 20.19+ or 22.12+ (Vite 8).

```bash
npm install
npm run dev        # http://localhost:5173  (served from "/")
```

## Build

```bash
npm run build      # type-checks, then builds into dist/
npm run preview    # serves dist/ exactly as production would (with the base path)
```

### The Vite base path

GitHub Pages serves a project site at `https://<user>.github.io/<repo>/`, so asset URLs must start with `/<repo>/`. `vite.config.ts` handles this:

| Situation | Base |
| --- | --- |
| `npm run dev` | `/` |
| GitHub Actions deploy | set automatically to `/<repo-name>/` (or `/` for a `<user>.github.io` repo) |
| Local `npm run build` / `preview` | `DEFAULT_BASE` in `vite.config.ts` (`/wearfit-ai/`) |

If your repository is named something other than `wearfit-ai`, either change `DEFAULT_BASE`, or set `BASE_PATH` for a local build:

```powershell
# PowerShell
$env:BASE_PATH = "/my-repo-name/"; npm run build
```
```bash
# macOS / Linux
BASE_PATH=/my-repo-name/ npm run build
# Git Bash on Windows rewrites leading "/" paths; prefix with MSYS_NO_PATHCONV=1
```

The deployed site does not depend on `DEFAULT_BASE`; CI always derives the base from the repository name.

## Publish to GitHub (step by step)

1. **Create an empty repository** on GitHub (github.com → New). Don't add a README or .gitignore. Any name works, e.g. `wearfit-ai`. Keep the default branch name `main`.
2. **Upload this project** from the project folder:
   ```bash
   git init -b main
   git add .
   git commit -m "Initial commit: WearFit AI"
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
   (`node_modules/` and `dist/` are git-ignored; `package-lock.json` should be committed.)
3. **Enable Pages with GitHub Actions:** repository → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. **Deploy:** the push in step 2 triggers the *Deploy to GitHub Pages* workflow. Watch it under the **Actions** tab. If you enabled Pages after pushing, open Actions → *Deploy to GitHub Pages* → **Run workflow**.
5. **Open your site** at `https://<your-username>.github.io/<your-repo>/` (the URL is also shown in the deploy job summary).

Every later push to `main` redeploys automatically.

Notes:
- GitHub Pages on a free account requires a **public** repository (private Pages needs a paid plan).
- The camera API requires HTTPS; GitHub Pages provides it.
- Fonts (Inter, Playfair Display) load from Google Fonts. To avoid any third-party request, remove the font `<link>` tags in `index.html`; the CSS falls back to system fonts.

## Connecting a real model later

All fitting-room logic talks to the `TryOnAdapter` interface in [`src/ai/types.ts`](src/ai/types.ts). Today only `demoAdapter` exists, and its results are `isAiGenerated: false`.

To integrate a genuine try-on model:

1. Copy [`src/ai/remoteAdapter.example.ts`](src/ai/remoteAdapter.example.ts) to `remoteAdapter.ts` and implement it against a model/service you are licensed to use.
2. Register it in [`src/ai/index.ts`](src/ai/index.ts).
3. Extend the `FittingRoom` page to render `result.imageBlob` (it currently renders only the demo overlay), add an explicit consent step, since photos would leave the device.
4. **Never put secret API keys in this frontend.** Anything in a static site is public; route requests through your own server or proxy.
5. Test output quality properly. Only then should the UI call the result AI-generated.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and production build to `dist/` |
| `npm run preview` | Serve the production build locally |
