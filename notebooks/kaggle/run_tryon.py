"""WearFit AI: unattended real FASHN VTON v1.5 inference on a Kaggle GPU (testing only, not a backend).

Person photo: the example model photo shipped with the official FASHN repo.
Garments: real catalog photos fetched from the public WearFit AI site.
"""
import io, os, subprocess, sys, time, urllib.request, zipfile
import torch
WORK = "/tmp/work"; OUT = "/kaggle/working/outputs"
os.makedirs(WORK, exist_ok=True); os.makedirs(OUT, exist_ok=True); os.chdir(WORK)

print("torch", torch.__version__, "| CUDA:", torch.cuda.is_available(), flush=True)
if torch.cuda.is_available():
    p = torch.cuda.get_device_properties(0)
    print("GPU:", p.name, f"{p.total_memory / 2**30:.1f} GiB", flush=True)

def sh(*a):
    print("$", " ".join(a), flush=True)
    subprocess.run(a, check=True)

sh("git", "clone", "--depth", "1", "https://github.com/fashn-AI/fashn-vton-1.5.git", "fashn-vton-1.5")
sh(sys.executable, "-m", "pip", "install", "-q", "-e", "./fashn-vton-1.5")
sh(sys.executable, "fashn-vton-1.5/scripts/download_weights.py", "--weights-dir", "./weights")

sys.path.insert(0, os.path.abspath("fashn-vton-1.5/src"))
from PIL import Image
from fashn_vton import TryOnPipeline

SITE = "https://wixdesigner73-ui.github.io/wearfit-ai"
CHOSEN = [
    ("classic-heavyweight-tee", "tops", "flat-lay"),
    ("signal-red-bomber", "tops", "model"),
    ("straight-fit-jeans", "bottoms", "model"),
    ("lemon-fitted-dress", "one-pieces", "model"),
]
person = Image.open("fashn-vton-1.5/examples/data/model.webp").convert("RGB")

pipe = TryOnPipeline(weights_dir="./weights")
print("device:", pipe.device, "| dtype:", pipe.inference_dtype, flush=True)

for slug, category, photo_type in CHOSEN:
    with urllib.request.urlopen(f"{SITE}/products/garment/{slug}.jpg", timeout=60) as r:
        garment = Image.open(io.BytesIO(r.read())).convert("RGB")
    garment.save(f"{OUT}/input_{slug}.jpg")
    t0 = time.perf_counter()
    out = pipe(person_image=person, garment_image=garment, category=category,
               garment_photo_type=photo_type, num_timesteps=30)
    out.images[0].save(f"{OUT}/{slug}.png")
    print(f"{slug}: {category}/{photo_type} -> {time.perf_counter() - t0:.1f}s size={out.images[0].size}", flush=True)

person.save(f"{OUT}/input_person.png")
print("DONE", flush=True)
