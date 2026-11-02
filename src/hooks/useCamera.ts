import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error'

export interface CameraError {
  kind: 'denied' | 'not-found' | 'in-use' | 'insecure' | 'unsupported' | 'unknown'
  message: string
}

function describeError(err: unknown): CameraError {
  const name = err instanceof DOMException || err instanceof Error ? err.name : ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
    case 'PermissionDeniedError':
      return {
        kind: 'denied',
        message:
          'Camera access was blocked. You can allow it from the lock icon in your browser address bar, or upload a photo instead.',
      }
    case 'NotFoundError':
    case 'OverconstrainedError':
    case 'DevicesNotFoundError':
      return { kind: 'not-found', message: 'No camera was found on this device. Please upload a photo instead.' }
    case 'NotReadableError':
    case 'AbortError':
    case 'TrackStartError':
      return {
        kind: 'in-use',
        message: 'The camera is busy or unavailable (another app may be using it). Close it and try again, or upload a photo.',
      }
    default:
      return { kind: 'unknown', message: 'Something went wrong starting the camera. Please try again or upload a photo.' }
  }
}

/**
 * Camera access that only ever starts from an explicit `start()` call (wired to a button click).
 * Nothing is requested on mount. Frames are captured to an in-memory Blob; nothing is stored.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<CameraError | null>(null)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('idle')
  }, [])

  const start = useCallback(
    async (facingMode: 'user' | 'environment' = facing) => {
      setError(null)

      if (!window.isSecureContext) {
        setError({ kind: 'insecure', message: 'Camera access needs a secure (HTTPS) page. Please upload a photo instead.' })
        setStatus('error')
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError({ kind: 'unsupported', message: 'This browser does not support camera access. Please upload a photo instead.' })
        setStatus('error')
        return
      }

      // Release any previous stream first (e.g. when switching cameras).
      streamRef.current?.getTracks().forEach((t) => t.stop())
      setStatus('requesting')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1600 } },
          audio: false,
        })
        streamRef.current = stream
        setFacing(facingMode)
        setStatus('active')
        // The <video> element is mounted once status is 'active'; attach in an effect below.
      } catch (err) {
        setError(describeError(err))
        setStatus('error')
      }
    },
    [facing],
  )

  // Attach the stream once the video element exists.
  useEffect(() => {
    if (status === 'active' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      void videoRef.current.play().catch(() => {
        /* autoplay can be interrupted; the user can still capture */
      })
    }
  }, [status])

  // Always release the camera when leaving the page.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // Mirror the front camera so the saved frame matches the mirrored preview.
    if (facing === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92))
  }, [facing])

  return { videoRef, status, error, facing, start, stop, capture }
}
