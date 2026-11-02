"""Wraps the real FASHN VTON v1.5 pipeline. There is deliberately no fallback that fabricates a result."""
from __future__ import annotations

import logging
import threading
from typing import Literal, Optional

from PIL import Image

log = logging.getLogger("tryon.model")

Category = Literal["tops", "bottoms", "one-pieces"]
PhotoType = Literal["model", "flat-lay"]
MODEL_NAME = "FASHN VTON v1.5"


class ModelManager:
    """Loads the pipeline once and serialises inference (one image at a time; the model is memory hungry)."""

    def __init__(self, weights_dir, device: Optional[str] = None) -> None:
        self._weights_dir = str(weights_dir)
        self._device_pref = device
        self._pipeline = None
        self._lock = threading.Lock()  # one inference at a time
        self.load_error: Optional[str] = None

    # ---- status ----
    @property
    def loaded(self) -> bool:
        return self._pipeline is not None

    @property
    def device(self) -> str:
        return str(self._pipeline.device) if self._pipeline is not None else "unloaded"

    @property
    def dtype(self) -> str:
        return str(self._pipeline.inference_dtype).replace("torch.", "") if self._pipeline is not None else ""

    # ---- lifecycle ----
    def load(self) -> None:
        """Load weights. Records `load_error` instead of raising so the API can still start and explain itself."""
        try:
            from fashn_vton import TryOnPipeline  # imported lazily: heavy, and only present on machines that installed it
        except ImportError as exc:
            self.load_error = (
                "The fashn-vton package is not installed in this environment. "
                f"See backend/README.md for installation. ({exc})"
            )
            log.error(self.load_error)
            return
        try:
            log.info("Loading %s from %s ...", MODEL_NAME, self._weights_dir)
            self._pipeline = TryOnPipeline(weights_dir=self._weights_dir, device=self._device_pref)
            self.load_error = None
            log.info("Model ready on %s (%s)", self.device, self.dtype)
        except Exception as exc:  # noqa: BLE001 - surfaced to /api/health, never swallowed silently
            self._pipeline = None
            self.load_error = f"The model could not be loaded: {exc}"
            log.exception("Model load failed")

    # ---- inference ----
    def run(
        self,
        person: Image.Image,
        garment: Image.Image,
        category: Category,
        photo_type: PhotoType,
        num_timesteps: int,
        seed: int,
    ) -> Image.Image:
        if self._pipeline is None:
            raise RuntimeError("model not loaded")
        with self._lock:
            result = self._pipeline(
                person_image=person,
                garment_image=garment,
                category=category,
                garment_photo_type=photo_type,
                num_timesteps=num_timesteps,
                seed=seed,
            )
        return result.images[0]
