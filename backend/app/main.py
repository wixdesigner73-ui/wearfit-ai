"""
WearFit AI virtual try-on API.

    POST /api/try-on   multipart: person_image, garment_image, category, [garment_photo_type, num_timesteps, seed]
    GET  /api/health   model / device status

The endpoint runs the real FASHN VTON v1.5 model. If the model is not available it answers 503 with an explanation;
it never returns a placeholder or fabricated image. Photos are processed in memory and are not saved or logged.
"""
from __future__ import annotations

import asyncio
import io
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from .config import Settings, get_settings
from .images import decode_image, fail, read_limited
from .model import MODEL_NAME, Category, ModelManager, PhotoType

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("tryon.api")


def create_app(settings: Optional[Settings] = None, model: Optional[ModelManager] = None) -> FastAPI:
    """App factory. `model` can be injected (the unit tests do this); production uses the real FASHN pipeline."""
    cfg = settings or get_settings()
    manager = model or ModelManager(cfg.weights_dir, cfg.device)
    # One worker thread: a timed-out job keeps running to completion, so later requests queue behind it
    # instead of piling a second model run on top of the first.
    executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="tryon")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        if model is None and cfg.load_on_startup:
            # Load in a thread so the server starts answering /api/health immediately.
            asyncio.get_running_loop().run_in_executor(None, manager.load)
        yield
        executor.shutdown(wait=False, cancel_futures=True)

    app = FastAPI(title="WearFit AI try-on API", version="1.0.0", lifespan=lifespan)
    app.state.settings = cfg
    app.state.model = manager
    app.state.active = 0  # requests currently running or waiting

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.allowed_origins,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Inference-Seconds", "X-Model"],
        max_age=600,
    )

    @app.middleware("http")
    async def guards(request: Request, call_next):
        # Reject oversized bodies before they are read.
        length = request.headers.get("content-length")
        limit = 2 * cfg.max_upload_bytes + 1024 * 1024
        if length and length.isdigit() and int(length) > limit:
            return JSONResponse(
                status_code=413,
                content={"detail": {"code": "too_large", "message": f"Upload exceeds {limit // (1024 * 1024)} MB."}},
            )
        response = await call_next(request)
        # Chrome's "Private Network Access": an https site (GitHub Pages) calling http://localhost needs this opt-in.
        if request.headers.get("access-control-request-private-network") == "true":
            response.headers["Access-Control-Allow-Private-Network"] = "true"
        return response

    @app.get("/api/health")
    async def health():
        body: dict = {"status": "ok", "model": MODEL_NAME, "model_loaded": manager.loaded, "device": manager.device}
        if manager.loaded:
            body["dtype"] = manager.dtype
        else:
            body["detail"] = manager.load_error or "The model is still loading. Try again in a minute."
        return body

    @app.post("/api/try-on")
    async def try_on(
        person_image: UploadFile = File(..., description="Customer photograph (JPG/PNG/WebP)"),
        garment_image: UploadFile = File(..., description="Garment photograph (JPG/PNG/WebP)"),
        category: Category = Form(..., description="tops | bottoms | one-pieces"),
        garment_photo_type: PhotoType = Form("model", description="model = garment worn by a person; flat-lay = garment only"),
        num_timesteps: Optional[int] = Form(None, description="Diffusion steps (clamped to the server's allowed range)"),
        seed: int = Form(42),
    ):
        if not manager.loaded:
            raise fail(
                503,
                "model_unavailable",
                manager.load_error or "The try-on model is still loading. Please try again in a minute.",
            )
        if app.state.active > cfg.max_waiting:
            raise fail(429, "busy", "The AI server is busy with other requests. Please try again shortly.")

        app.state.active += 1
        try:
            person_bytes = await read_limited(person_image, cfg.max_upload_bytes, "photo")
            garment_bytes = await read_limited(garment_image, cfg.max_upload_bytes, "garment image")
            limits = dict(min_side=cfg.min_image_side, max_side=cfg.max_image_side, max_pixels=cfg.max_image_pixels)
            person = decode_image(person_bytes, "photo", **limits)
            garment = decode_image(garment_bytes, "garment image", **limits)
            del person_bytes, garment_bytes  # raw bytes no longer needed

            steps = max(cfg.min_timesteps, min(cfg.max_timesteps, num_timesteps or cfg.default_timesteps))
            started = time.perf_counter()
            loop = asyncio.get_running_loop()
            try:
                output = await asyncio.wait_for(
                    loop.run_in_executor(executor, manager.run, person, garment, category, garment_photo_type, steps, seed),
                    timeout=cfg.timeout_seconds,
                )
            except asyncio.TimeoutError:
                raise fail(
                    504,
                    "timeout",
                    f"Generating the preview took longer than {cfg.timeout_seconds} seconds. "
                    "A GPU server is much faster; you can also lower DEFAULT_TIMESTEPS.",
                ) from None
            except Exception:  # noqa: BLE001
                log.exception("Inference failed")  # stack trace only; no image data or filenames are logged
                raise fail(500, "inference_failed", "The model failed to process these images. Try a different photo.") from None

            elapsed = time.perf_counter() - started
            png = io.BytesIO()
            output.save(png, format="PNG")
            log.info("try-on finished: category=%s steps=%d device=%s %.1fs", category, steps, manager.device, elapsed)
            return Response(
                content=png.getvalue(),
                media_type="image/png",
                headers={
                    "Cache-Control": "no-store",
                    "X-Inference-Seconds": f"{elapsed:.1f}",
                    "X-Model": MODEL_NAME,
                },
            )
        finally:
            app.state.active -= 1
            # Close uploads so any spooled temporary files are deleted immediately.
            await person_image.close()
            await garment_image.close()

    return app


app = create_app()
