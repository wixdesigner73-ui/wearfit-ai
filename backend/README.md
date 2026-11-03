# WearFit AI: virtual try-on backend

A small FastAPI service that runs the real **FASHN VTON v1.5** model ([repo](https://github.com/fashn-AI/fashn-vton-1.5)) and exposes it to the website.

```
POST /api/try-on   multipart/form-data -> image/png
GET  /api/health   model + device status (JSON)
```

It never returns a placeholder image. If the model is not loaded it answers **503** with the reason, and the website falls back to a clearly labeled DEMO mode.

## Hardware: read this first

| Where it runs | Works? | Speed |
| --- | --- | --- |
| NVIDIA GPU, ≥ 8 GB VRAM (RTX 3060 / T4 or better) | Yes, recommended | Seconds per image (FASHN reports ~5 s on an H100) |
| CPU only (any modern 4+ core, **≥ 16 GB RAM**) | Yes, for testing | **Minutes per image**: see [measured numbers](#measured-on-cpu) |
| Intel / AMD integrated graphics | CPU path only | Same as CPU |

FASHN's own docs state "~8 GB VRAM for inference" and bfloat16 on Ampere-or-newer NVIDIA GPUs (older GPUs and CPU use float32). The model is ~1 B parameters; weights are ~2.1 GB on disk, plus a ~244 MB human-parser model that is downloaded on first use.

## Install (Windows PowerShell; Linux/macOS commands are in comments)

Requires Python 3.10–3.12 and Git.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # Linux/macOS: source .venv/bin/activate

# 1) PyTorch: pick ONE
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu      # CPU only
# pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124   # NVIDIA GPU (match your CUDA)

# 2) The official FASHN code, then swap in the matching onnxruntime build
git clone --depth 1 https://github.com/fashn-AI/fashn-vton-1.5.git vendor/fashn-vton-1.5
pip install -e vendor/fashn-vton-1.5
pip uninstall -y onnxruntime-gpu ; pip install onnxruntime        # CPU-only machines. Keep onnxruntime-gpu on NVIDIA.

# 3) Model weights (~2.1 GB) into backend/weights
python vendor/fashn-vton-1.5/scripts/download_weights.py --weights-dir ./weights

# 4) This API's dependencies
pip install -r requirements.txt
```

### Check the model really runs

```powershell
python scripts/smoke_test.py --steps 8      # FASHN's own example images; prints device, timings, writes smoke_output.png
```

### Start the API

On Windows the quickest way is `.start.ps1` (checks the venv and weights, prints whether CUDA is available, sets CORS for the GitHub Pages origin). Manual equivalent:

```powershell
copy .env.example .env                      # then edit ALLOWED_ORIGINS (see CORS below)
$env:ALLOWED_ORIGINS = "http://localhost:5173,http://localhost:4173,https://YOUR-USERNAME.github.io"
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open <http://127.0.0.1:8000/api/health>. `"model_loaded": true` means it's ready (loading takes a minute; first run also downloads the human parser). Interactive docs: <http://127.0.0.1:8000/docs>.

### Tests (validation, errors, CORS: they do not run the AI model)

```powershell
pip install -r requirements-dev.txt
pytest tests -q
```

## API

`POST /api/try-on`: multipart form fields

| Field | Required | Notes |
| --- | --- | --- |
| `person_image` | yes | Customer photo, JPG/PNG/WebP, ≤ `MAX_UPLOAD_MB` (10), ≥ 200 px |
| `garment_image` | yes | Garment photo, same limits |
| `category` | yes | `tops` · `bottoms` · `one-pieces` (FASHN's supported categories) |
| `garment_photo_type` | no | `model` (worn by a person, default) or `flat-lay` (garment alone) |
| `num_timesteps` | no | Diffusion steps, clamped to 10–50 (default `DEFAULT_TIMESTEPS`=30) |
| `seed` | no | Default 42 |
| `response_format` | no | `image` (default: raw PNG) or `json`: `{processing_status: "completed", generated_image: "data:image/png;base64,…", model, device, category, num_timesteps, inference_seconds}` |

Success: `200 image/png` (576×864) with `Cache-Control: no-store`. Errors are JSON `{"detail": {"code", "message"}}`:
`400 too_small/empty_file` · `413 too_large/too_many_pixels` · `415 unsupported_image` · `422` bad field · `429 busy` · `503 model_unavailable` · `504 timeout` · `500 inference_failed`.

## Privacy behavior

- Uploads are read into memory, decoded, validated by content (not by filename/Content-Type) and processed; **nothing is saved to disk by this code** and image data is never logged.
- Starlette may spool a large upload to a temporary file; the request handler closes uploads in a `finally`, which deletes them immediately.
- One inference runs at a time; up to `MAX_WAITING_REQUESTS` (2) others wait; more get `429`.
- A timed-out request (`504`) still finishes in the background; later requests queue behind it.

## CORS, HTTPS and the GitHub Pages site

Browsers enforce two rules you must plan for:

1. **CORS:** set `ALLOWED_ORIGINS` to the exact origin of the website (e.g. `https://YOUR-USERNAME.github.io`, no path, no trailing slash).
2. **Mixed content:** the GitHub Pages site is HTTPS, so browsers block calls to a plain `http://` server, with one exception: `http://localhost` / `127.0.0.1` is allowed. So the simplest working setup is to run this API on your own GPU PC and, in the fitting room's *Advanced → AI server address*, enter `http://localhost:8000`. Chrome may show a "local network access" prompt; the API answers the required `Access-Control-Allow-Private-Network` preflight header. For other machines you need an HTTPS URL (a reverse proxy such as Caddy, or a tunnel you are allowed to run).

Setting the **repository variable** `TRYON_API_URL` (Settings → Secrets and variables → Actions → Variables) makes the deployed site use that URL by default. It is a public value, not a secret. Never put API keys in the frontend.

## Test the real model on a free GPU (notebook)

[`notebooks/wearfit_tryon_test.ipynb`](../notebooks/wearfit_tryon_test.ipynb) runs the real pipeline on **your photo** and real catalog garments (fetched from the live site) and shows photo | garment | AI result. Open it in Colab (GPU runtime) or Kaggle (GPU accelerator, Internet on). It is a **testing tool, not a backend**: it does not serve the website, sessions are temporary, and quotas change. It has been syntax-validated but was not executed in Colab/Kaggle by the author.

## Where can this run for free?

There is no free, always-on GPU host that I can recommend without caveats. The honest options:

| Option | Cost | Caveats |
| --- | --- | --- |
| **Your own PC with an NVIDIA GPU (≥ 8 GB)** | $0 | Best option. Site connects to `http://localhost:8000`. Only works while your PC runs the server. |
| **This machine, CPU only** | $0 | Works but is slow (minutes per image) and needs ≥ 16 GB RAM. Good for verification and demos. |
| **Kaggle / Google Colab notebook** | $0 | Interactive notebooks with quotas that change over time. **Colab's FAQ lists "web service offerings" and connecting to remote proxies as restricted, and free sessions get terminated when used that way**, so exposing this API from Colab to a public site is not a supported use. Using a notebook to run `scripts/smoke_test.py` or a handful of images yourself is fine. Check the current terms before relying on either. |
| Hugging Face Spaces / hosted GPU | Mostly paid | Free CPU Spaces are too small/slow for this model; GPU Spaces and ZeroGPU hosting require a paid plan. |

## Licensing: read before any commercial use

- FASHN VTON v1.5 **code and weights: Apache-2.0** (repository `LICENSE`, model card).
- DWPose and YOLOX (pose detection): Apache-2.0.
- **FASHN Human Parser** (a dependency of the pipeline): "inherits the **NVIDIA Source Code License for SegFormer**", which limits use of the work and derivatives to *"research or evaluation purposes only"* (SegFormer LICENSE §3.3). That restriction applies to this pipeline as installed, so treat this project as a **demo / evaluation**, and get legal advice (or contact FASHN) before using it in a commercial, revenue-generating store. This is not legal advice.

## Measured on CPU

On the development machine (Intel i5-10210U, 4 cores, 15.8 GB RAM, no NVIDIA GPU, float32):

- The real model **loads and produces valid output**. A run on FASHN's own example images (8 steps) generated a new 576x864 photo of the same person wearing the new garment (identity, pose and background preserved; garment replaced).
- Speed: **about 333 seconds per diffusion step** (measured from the sampler's progress bar), so **8 steps take about 44 minutes** and the default 30 steps would take roughly **2.8 hours** per image.
- **CPU-only is therefore a way to verify the pipeline, not a way to run the store.** Use an NVIDIA GPU with at least 8 GB VRAM (FASHN reports about 5 seconds per image on an H100).

## Measured on a free Kaggle GPU (Tesla T4)

`notebooks/kaggle/run_tryon.py` ran the real pipeline on a Kaggle T4 (14.6 GiB, bfloat16, 30 steps) with FASHN's example person photo and four real catalog garments fetched from the live site:

| Garment (category / photo type) | Result | Time |
| --- | --- | --- |
| Classic Heavyweight Tee (tops / flat-lay) | New 576x864 photo, same person, white short-sleeve top. **Flaw:** it came out with a collar (polo-like) although the garment photo is a round-neck tee. | 428 s |
| Signal Red Bomber (tops / model) | Red bomber with grey trim and zip, correct | 436 s |
| Straight-Fit Jeans (bottoms / model) | Blue jeans replaced the beige trousers, correct | 435 s |
| Lemon Collared Mini Dress (one-pieces / model) | Yellow dress with white collar; the visible beige trousers remain from the original photo | 435 s |

Face, pose, hat, boots and background were preserved in all four, and the four outputs differ from each other, so they are generated images, not overlays or composites. A T4 takes about 7 minutes per image; FASHN reports about 5 s on an H100. This was a one-person, one-photo test; garment fidelity is not guaranteed (see the tee). The website-to-API path was **not** exercised against a GPU server in this test.
