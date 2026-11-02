"""Upload validation. Images are handled purely in memory and are never written to disk by this code."""
from __future__ import annotations

import io

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
CHUNK = 1024 * 1024


def fail(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message})


async def read_limited(upload: UploadFile, max_bytes: int, label: str) -> bytes:
    """Read an upload fully into memory, rejecting it as soon as it exceeds max_bytes."""
    buf = bytearray()
    while True:
        chunk = await upload.read(CHUNK)
        if not chunk:
            break
        buf.extend(chunk)
        if len(buf) > max_bytes:
            raise fail(413, "too_large", f"The {label} is larger than {max_bytes // (1024 * 1024)} MB.")
    if not buf:
        raise fail(400, "empty_file", f"The {label} is empty.")
    return bytes(buf)


def decode_image(data: bytes, label: str, *, min_side: int, max_side: int, max_pixels: int) -> Image.Image:
    """Validate by actually decoding the bytes (not by trusting the filename or Content-Type) and return RGB."""
    Image.MAX_IMAGE_PIXELS = max_pixels  # Pillow raises DecompressionBombError above 2x this value
    try:
        with Image.open(io.BytesIO(data)) as probe:
            fmt = probe.format
            width, height = probe.size
            probe.verify()  # cheap integrity check; the image must be re-opened afterwards
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, SyntaxError, ValueError):
        raise fail(415, "unsupported_image", f"The {label} is not a valid JPG, PNG or WebP image.") from None

    if fmt not in ALLOWED_FORMATS:
        raise fail(415, "unsupported_image", f"The {label} must be a JPG, PNG or WebP image (got {fmt}).")
    if width * height > max_pixels:
        raise fail(413, "too_many_pixels", f"The {label} has too many pixels ({width}x{height}).")
    if min(width, height) < min_side:
        raise fail(400, "too_small", f"The {label} is too small ({width}x{height}); use at least {min_side}px on each side.")

    try:
        with Image.open(io.BytesIO(data)) as img:
            img = ImageOps.exif_transpose(img)  # honour phone-camera rotation
            if img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGBA")
                background = Image.new("RGBA", img.size, (255, 255, 255, 255))
                img = Image.alpha_composite(background, img)
            rgb = img.convert("RGB")
    except (OSError, SyntaxError, ValueError, Image.DecompressionBombError):
        raise fail(415, "unsupported_image", f"The {label} could not be decoded.") from None

    longest = max(rgb.size)
    if longest > max_side:
        scale = max_side / longest
        rgb = rgb.resize((round(rgb.width * scale), round(rgb.height * scale)), Image.LANCZOS)
    return rgb
