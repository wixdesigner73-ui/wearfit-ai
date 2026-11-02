"""
Smoke test: runs the REAL FASHN VTON v1.5 pipeline once on the example images shipped with the model repo
(or on images you pass in) and reports device, load time, inference time and the output path.

    python scripts/smoke_test.py --steps 8
    python scripts/smoke_test.py --person me.jpg --garment shirt.jpg --category tops --steps 30

Run it from the backend/ folder with the virtual environment active. Nothing is uploaded anywhere.
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
EXAMPLES = BACKEND_DIR / "vendor" / "fashn-vton-1.5" / "examples" / "data"


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--weights-dir", default=os.environ.get("FASHN_WEIGHTS_DIR", str(BACKEND_DIR / "weights")))
    p.add_argument("--person", default=str(EXAMPLES / "model.webp"))
    p.add_argument("--garment", default=str(EXAMPLES / "garment.webp"))
    p.add_argument("--category", default="tops", choices=["tops", "bottoms", "one-pieces"])
    p.add_argument("--photo-type", default="model", choices=["model", "flat-lay"])
    p.add_argument("--steps", type=int, default=30, help="diffusion steps (20 fast, 30 default, 50 best)")
    p.add_argument("--out", default=str(BACKEND_DIR / "smoke_output.png"))
    args = p.parse_args()

    import torch
    from PIL import Image

    from fashn_vton import TryOnPipeline

    print(f"python      : {sys.version.split()[0]}")
    print(f"torch       : {torch.__version__}  cuda_available={torch.cuda.is_available()}")
    if torch.cuda.is_available():
        props = torch.cuda.get_device_properties(0)
        print(f"gpu         : {props.name}  {props.total_memory / 2**30:.1f} GiB")
    print(f"weights     : {args.weights_dir}")

    t0 = time.perf_counter()
    pipeline = TryOnPipeline(weights_dir=args.weights_dir)
    t_load = time.perf_counter() - t0
    print(f"device/dtype: {pipeline.device} / {pipeline.inference_dtype}")
    print(f"load time   : {t_load:.1f}s")

    person = Image.open(args.person).convert("RGB")
    garment = Image.open(args.garment).convert("RGB")

    t1 = time.perf_counter()
    result = pipeline(
        person_image=person,
        garment_image=garment,
        category=args.category,
        garment_photo_type=args.photo_type,
        num_timesteps=args.steps,
    )
    t_run = time.perf_counter() - t1
    out = result.images[0]
    out.save(args.out)
    print(f"inference   : {t_run:.1f}s for {args.steps} steps ({t_run / args.steps:.1f}s/step)")
    print(f"output      : {args.out}  size={out.size}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
