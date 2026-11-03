"""Runtime configuration, read from environment variables (see backend/.env.example). No secrets are needed."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


def _csv(name: str, default: str) -> list[str]:
    return [item.strip().rstrip("/") for item in os.environ.get(name, default).split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    # Where model.safetensors and dwpose/ live (created by scripts/download_weights.py from the FASHN repo).
    weights_dir: Path = field(default_factory=lambda: Path(os.environ.get("FASHN_WEIGHTS_DIR", BACKEND_DIR / "weights")))
    # "cuda", "cpu" or empty for automatic selection.
    device: str | None = field(default_factory=lambda: os.environ.get("TRYON_DEVICE") or None)
    # Origins allowed to call this API from a browser. Add your GitHub Pages origin, e.g. https://USER.github.io
    allowed_origins: list[str] = field(
        default_factory=lambda: _csv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173")
    )
    max_upload_mb: int = field(default_factory=lambda: _int("MAX_UPLOAD_MB", 10))
    max_image_side: int = field(default_factory=lambda: _int("MAX_IMAGE_SIDE", 2048))
    min_image_side: int = field(default_factory=lambda: _int("MIN_IMAGE_SIDE", 200))
    # Guards against decompression bombs (pixels, not bytes).
    max_image_pixels: int = field(default_factory=lambda: _int("MAX_IMAGE_PIXELS", 40_000_000))
    # Diffusion steps: 20 = fast, 30 = balanced (model default), 50 = best. CPU users may want 15-20.
    default_timesteps: int = field(default_factory=lambda: _int("DEFAULT_TIMESTEPS", 30))
    # Lower bound for requested steps. 10 is sensible on GPU; CPU test runs may set MIN_TIMESTEPS=8 (quality drops).
    min_timesteps: int = field(default_factory=lambda: _int("MIN_TIMESTEPS", 10))
    max_timesteps: int = 50
    # Seconds before the API answers 504. CPU inference is slow, so the default is generous.
    timeout_seconds: int = field(default_factory=lambda: _int("TRYON_TIMEOUT_SECONDS", 1800))
    # Requests allowed to wait while one is running. Extra requests get HTTP 429.
    max_waiting: int = field(default_factory=lambda: _int("MAX_WAITING_REQUESTS", 2))
    load_on_startup: bool = field(default_factory=lambda: os.environ.get("LOAD_MODEL_ON_STARTUP", "1") != "0")

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


def get_settings() -> Settings:
    return Settings()
