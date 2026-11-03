"""
API tests for validation, errors and CORS. They do NOT run the AI model.

For the few tests that need a "loaded" model, `StubModel` is injected into the app factory. It exists only in this
test file; the production app has no code path that returns a stand-in image.
"""
from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.config import Settings
from app.main import create_app


class StubModel:
    loaded = True
    device = "cpu"
    dtype = "float32"
    load_error = None

    def __init__(self) -> None:
        self.calls: list[tuple] = []

    def run(self, person, garment, category, photo_type, num_timesteps, seed):
        self.calls.append((person.size, garment.size, category, photo_type, num_timesteps, seed))
        return Image.new("RGB", (576, 864), (10, 20, 30))


class UnloadedModel(StubModel):
    loaded = False
    device = "unloaded"
    load_error = "The fashn-vton package is not installed."


def jpeg(size=(400, 600), color=(120, 80, 60), fmt="JPEG") -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format=fmt)
    return buf.getvalue()


def files(person: bytes, garment: bytes, person_type="image/jpeg", garment_type="image/jpeg"):
    return {
        "person_image": ("p.jpg", person, person_type),
        "garment_image": ("g.jpg", garment, garment_type),
    }


@pytest.fixture()
def stub():
    return StubModel()


@pytest.fixture()
def client(stub):
    app = create_app(Settings(max_upload_mb=1, allowed_origins=["https://example.github.io"]), model=stub)
    return TestClient(app)


def test_health_reports_loaded_model(client):
    body = client.get("/api/health").json()
    assert body["model_loaded"] is True and body["device"] == "cpu"


def test_health_reports_unloaded_model_with_reason():
    c = TestClient(create_app(Settings(), model=UnloadedModel()))
    body = c.get("/api/health").json()
    assert body["model_loaded"] is False and "fashn-vton" in body["detail"]


def test_try_on_503_when_model_unavailable():
    c = TestClient(create_app(Settings(), model=UnloadedModel()))
    r = c.post("/api/try-on", files=files(jpeg(), jpeg()), data={"category": "tops"})
    assert r.status_code == 503 and r.json()["detail"]["code"] == "model_unavailable"


def test_try_on_returns_png_from_model(client, stub):
    r = client.post("/api/try-on", files=files(jpeg(), jpeg()), data={"category": "one-pieces", "num_timesteps": "20"})
    assert r.status_code == 200
    assert r.headers["content-type"] == "image/png"
    assert r.headers["cache-control"] == "no-store"
    assert Image.open(io.BytesIO(r.content)).size == (576, 864)
    assert stub.calls[0][2:] == ("one-pieces", "model", 20, 42)


def test_timesteps_are_clamped(client, stub):
    client.post("/api/try-on", files=files(jpeg(), jpeg()), data={"category": "tops", "num_timesteps": "9999"})
    client.post("/api/try-on", files=files(jpeg(), jpeg()), data={"category": "tops", "num_timesteps": "1"})
    assert [c[4] for c in stub.calls] == [50, 10]


def test_rejects_non_image_bytes_even_with_image_content_type(client):
    r = client.post("/api/try-on", files=files(b"not an image at all", jpeg()), data={"category": "tops"})
    assert r.status_code == 415 and r.json()["detail"]["code"] == "unsupported_image"


def test_rejects_unsupported_format(client):
    gif = io.BytesIO()
    Image.new("RGB", (300, 300)).save(gif, format="GIF")
    r = client.post("/api/try-on", files=files(gif.getvalue(), jpeg()), data={"category": "tops"})
    assert r.status_code == 415


def test_rejects_tiny_image(client):
    r = client.post("/api/try-on", files=files(jpeg((50, 50)), jpeg()), data={"category": "tops"})
    assert r.status_code == 400 and r.json()["detail"]["code"] == "too_small"


def test_rejects_oversized_upload(client):
    big = jpeg((3000, 3000)) + b"\0" * (2 * 1024 * 1024)
    r = client.post("/api/try-on", files=files(big, jpeg()), data={"category": "tops"})
    assert r.status_code == 413


def test_rejects_invalid_category(client):
    r = client.post("/api/try-on", files=files(jpeg(), jpeg()), data={"category": "hats"})
    assert r.status_code == 422


def test_requires_both_images(client):
    r = client.post("/api/try-on", files={"person_image": ("p.jpg", jpeg(), "image/jpeg")}, data={"category": "tops"})
    assert r.status_code == 422


def test_cors_allows_configured_origin_only(client):
    ok = client.options(
        "/api/try-on",
        headers={"Origin": "https://example.github.io", "Access-Control-Request-Method": "POST"},
    )
    assert ok.headers.get("access-control-allow-origin") == "https://example.github.io"
    bad = client.options(
        "/api/try-on",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in bad.headers


def test_private_network_preflight_header(client):
    r = client.options(
        "/api/try-on",
        headers={
            "Origin": "https://example.github.io",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Private-Network": "true",
        },
    )
    assert r.headers.get("access-control-allow-private-network") == "true"


def test_busy_server_returns_429():
    stub = StubModel()
    app = create_app(Settings(max_waiting=0), model=stub)
    app.state.active = 1  # one request already running, none allowed to wait
    r = TestClient(app).post("/api/try-on", files=files(jpeg(), jpeg()), data={"category": "tops"})
    assert r.status_code == 429 and r.json()["detail"]["code"] == "busy"


def test_json_response_format_has_status_and_image(client):
    r = client.post("/api/try-on", files=files(jpeg(), jpeg()), data={"category": "tops", "response_format": "json"})
    assert r.status_code == 200
    body = r.json()
    assert body["processing_status"] == "completed"
    assert body["generated_image"].startswith("data:image/png;base64,")
    assert body["category"] == "tops" and body["model"] == "FASHN VTON v1.5"
