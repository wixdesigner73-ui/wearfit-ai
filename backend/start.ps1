# Starts the try-on API on this machine (use a PC with an NVIDIA GPU, >= 8 GB VRAM, for usable speed).
#   .\start.ps1                     -> http://127.0.0.1:8000
#   .\start.ps1 -Origins "https://YOUR-USERNAME.github.io"   (extra browser origin allowed to call the API)
param(
  [string]$Origins = "https://wixdesigner73-ui.github.io",
  [int]$Port = 8000
)
Set-Location $PSScriptRoot
if (-not (Test-Path .\.venv\Scripts\python.exe)) { Write-Error "No .venv found. Follow backend/README.md (Install) first."; exit 1 }
if (-not (Test-Path .\weights\model.safetensors)) { Write-Error "Model weights missing. Run the download_weights.py step in backend/README.md."; exit 1 }

$env:ALLOWED_ORIGINS = "http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,$Origins"
& .\.venv\Scripts\python.exe -c "import torch; print('torch', torch.__version__, '| CUDA:', torch.cuda.is_available()); print('NOTE: CPU-only inference takes a very long time.' if not torch.cuda.is_available() else 'GPU: ' + torch.cuda.get_device_name(0))"
Write-Host "Health check: http://127.0.0.1:$Port/api/health  (model_loaded must become true)"
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port $Port
