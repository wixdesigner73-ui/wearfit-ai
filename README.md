# WearFit AI

A fashion e-commerce storefront (React + TypeScript + Vite + Tailwind) with a **virtual fitting room** backed by a separate Python FastAPI service that runs the open-source **FASHN VTON v1.5** model.

- **Frontend** (this folder): static site, deploys to GitHub Pages.
- **AI backend** ([`backend/`](backend/README.md)): FastAPI + the real model. GitHub Pages **cannot** host it.

> **Being honest about what works.** The website is live on GitHub Pages and fully functional. The AI try-on only works when the backend is running somewhere the browser can reach. A live frontend does **not** mean an AI backend is deployed. Without a backend, the fitting room shows a clearly labeled **"Demo — not AI"** state and uploads nothing.

## Status at a glance

| Feature | Status |
| --- | --- |
| Storefront: 26 products (13 men / 13 women), search, category filters, sizes, colors, stock, wishlist, cart, related products | Working (static) |
| Real product photography (Pexels, stored locally) | Working |
| Home, Shop, Men, Women, Product, Wishlist, Cart, About, Contact, Fitting room | Working |
| Camera capture (only after a click), photo upload, preview + confirm, consent step | Working |
| FastAPI backend with `POST /api/try-on`, validation, timeouts, queueing | Working: 14 automated tests |
| **Real FASHN VTON v1.5 inference** | Needs a machine that runs the backend. See [backend/README.md](backend/README.md) for hardware. Verified status is recorded below. |
| Checkout / payments | **Not implemented** (by design: cart is localStorage only; no orders can be placed) |
| Contact form | Opens your email app (`mailto:`); there is no server to receive messages |
| Color variants | Listed as options, but only the pictured color has a photo. The UI says so |

## Project structure

```
src/
  ai/            tryOnClient.ts (talks to the backend), imageUtils.ts (validate + downscale + strip EXIF)
  components/    Header, Footer, ProductCard, CartDrawer, Selectors, Toast, Icons
  context/       StoreContext (cart, wishlist, shared product selection)
  data/          products.ts (the catalog)
  hooks/         useCamera.ts
  pages/         Home, Shop (also /men, /women), ProductDetail, Cart, Wishlist, FittingRoom, About, Contact
  config.ts      env-driven settings (API URL, currency, contact email, asset() base-path helper)
public/products/          listing photos (4:5 WebP)
public/products/garment/  garment photos used as AI input (original framing)
public/CREDITS.md         photo sources
backend/                  FastAPI service + FASHN integration (own README)
.github/workflows/deploy.yml
```

## Local setup

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev          # http://localhost:5173 (served from "/")
npm run build        # type-check + production build into dist/
npm run preview      # serve dist/ with the production base path
```

To use a real AI backend locally, run it ([backend/README.md](backend/README.md)) and set `VITE_TRYON_API_URL=http://localhost:8000` in `.env.local` (see `.env.example`), or paste the URL into the fitting room's *Advanced → AI server address*.

## Configuration (`.env.local` or GitHub Actions repository *variables*)

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_TRYON_API_URL` | Backend base URL. Empty = demo mode | empty |
| `VITE_CURRENCY` / `VITE_CURRENCY_RATE` | Display currency and USD→currency rate | `USD` / `1` |
| `VITE_CONTACT_EMAIL` | Where the Contact page's `mailto:` goes | placeholder (page warns) |

All of these are public build-time values. **Never put secrets in the frontend.** In GitHub Actions they come from repository variables named `TRYON_API_URL`, `CONTACT_EMAIL`, `CURRENCY`, `CURRENCY_RATE`.

## Fitting-room flow

1. **Photo:** *Take photo* (camera starts only on click; denied/missing/busy camera shows a friendly message) or *Upload*. Images are validated (JPG/PNG/WebP, ≤ 20 MB, ≥ 200 px), re-encoded locally to ≤ 1536 px (this strips GPS/EXIF data) and shown for confirmation.
2. **Garment:** pick any catalog item. The selection is shared with the shop and product pages (URL `?product=` + session storage).
3. **Generate:** only available when the backend is connected. A consent checkbox names the server host before anything is sent. A loading state with a timer and Cancel button is shown while the model runs.
4. **Result:** download, try another garment, change photo, compare up to 3 results side by side, or return to the product page. Results live in memory only.

In demo mode (no backend) nothing is uploaded; once you confirm a photo the stage shows it beside the garment photo, labeled "Side-by-side comparison only. No AI was used."

AI previews are illustrations. They do **not** guarantee size, measurements or physical fit.

## Product photography

Photos come from [Pexels](https://www.pexels.com/license/) (free to use, attribution not required but listed in [`public/CREDITS.md`](public/CREDITS.md)). Each listing image is a 4:5 crop; the original framing is kept as the AI garment input. Where a clean garment-only shot existed (white tee, beige blazer on a hanger) it is tagged `flat-lay`; for everything else the garment image is a model-worn studio photo (`model`), which FASHN accepts as garment input. The ideal catalog would have a clean flat-lay **and** a lifestyle photo per product; free stock sites don't have matched pairs, so each product has one photo. Product names, prices and descriptions are fictional.

## Deployment to GitHub Pages

The Vite `base` is set per build: the workflow passes `BASE_PATH=/<repo-name>/` (or `/` for `<user>.github.io` repos). Local `npm run build` falls back to `DEFAULT_BASE` in `vite.config.ts` (`/wearfit-ai/`). Routing is hash-based, so deep links and refreshes work on static hosting. Product images are resolved through `asset()` so they respect the base path.

One-time repository settings: **Settings → Pages → Source: GitHub Actions**. Pushing to `main` deploys.

Optional: to point the live site at your AI server by default, add a repository *variable* `TRYON_API_URL` (e.g. `https://my-ai-server.example.com`) and re-run the workflow. Remember the server must allow your Pages origin via `ALLOWED_ORIGINS` and be reachable over HTTPS (or be `http://localhost` on the visitor's own machine).

```bash
git add . && git commit -m "Describe your change" && git push
```

## Licenses and limits

- Code: your project. Dependencies are open-source.
- Photos: Pexels license (see credits).
- FASHN VTON v1.5 code and weights: Apache-2.0. **However**, its human-parser dependency inherits NVIDIA's SegFormer license (*research or evaluation purposes only*). Treat the AI feature as a demo/evaluation and obtain legal advice before commercial use. Details in [backend/README.md](backend/README.md#licensing-read-before-any-commercial-use).
- No paid APIs, subscriptions or services are used. Free GPU hosting has quotas and terms that change; none is promised.
