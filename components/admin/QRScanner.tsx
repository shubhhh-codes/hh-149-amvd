/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 *
 * Production QR Scanner — UPI-grade performance
 *
 * Primary path:  BarcodeDetector API  (hardware-accelerated, ~5–20 ms decode)
 *   getUserMedia → <video> → requestVideoFrameCallback → OffscreenCanvas ROI
 *   → BarcodeDetector.detect()
 *
 * Fallback path: html5-qrcode  (browsers without BarcodeDetector)
 *   Html5Qrcode.start() with experimentalFeatures.useBarCodeDetectorIfSupported
 *
 * Both paths share:
 *   • AsyncMutex — exactly one lifecycle op at a time
 *   • State machine — idle | starting | running | stopping | destroyed
 *   • Duplicate suppression — ignore same payload for 1 s
 *   • Single-retry management — never two retries running at once
 *   • visibilitychange — pause/resume without recreating the stream
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { toast } from 'react-toastify';

// ─────────────────────────────────────────────────────────────────────────────
// BarcodeDetector types  (not universally in TS stdlib yet)
// ─────────────────────────────────────────────────────────────────────────────
interface BDResult {
  rawValue: string;
  format: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
}
interface BDInstance { detect(src: CanvasImageSource): Promise<BDResult[]>; }
interface BDCtor {
  new(opts?: { formats: string[] }): BDInstance;
  getSupportedFormats(): Promise<string[]>;
}
declare global { interface Window { BarcodeDetector?: BDCtor; } }

// ─────────────────────────────────────────────────────────────────────────────
// AsyncMutex — one camera operation at a time, chain never breaks on throw
// ─────────────────────────────────────────────────────────────────────────────
class AsyncMutex {
  private q: Promise<void> = Promise.resolve();
  run<T>(task: () => Promise<T>): Promise<T> {
    const r = this.q.then(task);
    this.q = r.then(() => undefined, () => undefined);
    return r;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const DUPLICATE_MS           = 1000;   // suppress identical payload for 1 s
const ROI_RATIO              = 0.70;   // initial center ROI (70 % of frame)
const ROI_RATIO_WIDE         = 1.00;   // expand after N idle frames
const ROI_EXPAND_FRAMES      = 60;     // ~2 s at 30 fps
const BRIGHTNESS_EVERY       = 30;     // sample every N frames
const LOW_LIGHT_LUM          = 45;     // 0–255 luminance → underexposed
const OVEREXPOSE_LUM         = 210;    // 0–255 luminance → overexposed
const DARK_FRAMES_THRESHOLD  = 3;      // consecutive dark samples before showing torch hint
const EXP_COMP_NUDGE         = 0.5;    // EV nudge for underexposed scenes (small, safe)
const AUTO_ZOOM_QR_RATIO     = 0.15;   // zoom in if QR < 15 % of frame width
const MOTION_BLUR_SKIP_DELTA = 40;     // per-pixel delta above which frame is too blurry
const PREFERRED_CAMERA_KEY   = 'preferred_camera';
const PAYLOAD_MIN_LEN        = 4;      // shortest sensible booking ID
const PAYLOAD_MAX_LEN        = 512;    // reject absurdly long blobs

// ─────────────────────────────────────────────────────────────────────────────
// Camera capability cache
// ─────────────────────────────────────────────────────────────────────────────
interface CameraCapabilities {
  hasAutofocus:          boolean;
  hasContinuousAF:       boolean;
  hasZoom:               boolean;
  hasTorch:              boolean;
  hasExposureComp:       boolean;
  hasFocusDistance:      boolean;
  hasImageStabilization: boolean;
  hasPointsOfInterest:   boolean;
  zoomMin:               number;
  zoomMax:               number;
  expCompMin:            number;
  expCompMax:            number;
}

const DEFAULT_CAPS: CameraCapabilities = {
  hasAutofocus: false, hasContinuousAF: false, hasZoom: false,
  hasTorch: false, hasExposureComp: false, hasFocusDistance: false,
  hasImageStabilization: false, hasPointsOfInterest: false,
  zoomMin: 1, zoomMax: 1, expCompMin: 0, expCompMax: 0,
};

/** Interrogate a MediaStreamTrack and return structured capability flags */
function detectCapabilities(track: MediaStreamTrack): CameraCapabilities {
  try {
    const c = track.getCapabilities() as any;
    return {
      hasAutofocus:          !!(c.focusMode),
      hasContinuousAF:       !!(c.focusMode?.includes('continuous')),
      hasZoom:               !!(c.zoom),
      hasTorch:              !!(c.torch),
      hasExposureComp:       !!(c.exposureCompensation),
      hasFocusDistance:      !!(c.focusDistance),
      hasImageStabilization: !!(c.imageStabilization),
      hasPointsOfInterest:   !!(c.pointsOfInterest),
      zoomMin:               c.zoom?.min ?? 1,
      zoomMax:               c.zoom?.max ?? 1,
      expCompMin:            c.exposureCompensation?.min ?? 0,
      expCompMax:            c.exposureCompensation?.max ?? 0,
    };
  } catch (_) {
    return { ...DEFAULT_CAPS };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload validation — reject obvious garbage before hitting the API
// ─────────────────────────────────────────────────────────────────────────────
function isValidPayload(text: string): boolean {
  if (!text || text.length < PAYLOAD_MIN_LEN || text.length > PAYLOAD_MAX_LEN) return false;
  // Must be printable ASCII / UTF-8 — no null bytes or control chars
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text)) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type ScannerState = 'idle' | 'starting' | 'running' | 'stopping' | 'destroyed';

interface ScannedBooking {
  bookingId: string;
  fullName: string;
  email: string;
  phone: string;
  bookingType: string;
  numberOfTickets: number;
  checkedInCount: number;
  cart: any[];
  amountPaid: number;
  attended: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function hasBarcodeDetector(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

/** Build getUserMedia constraints: prefer 720p @ 30–60 fps, continuous AF */
function videoConstraints(deviceId?: string | null): MediaTrackConstraints {
  const base: MediaTrackConstraints = {
    width:     { min: 640,  ideal: 1280, max: 1920 },
    height:    { min: 480,  ideal: 720,  max: 1080 },
    frameRate: { min: 15,   ideal: 30,   max: 60   },
  };
  if (deviceId) base.deviceId = { exact: deviceId };
  else          base.facingMode = 'environment';
  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function QRScanner({ onClose }: { onClose?: () => void }) {

  // ── UI state ───────────────────────────────────────────────────────────────
  const [scannedBooking,   setScannedBooking]   = useState<ScannedBooking | null>(null);
  const [errorMsg,         setErrorMsg]         = useState('');
  const [loading,          setLoading]          = useState(false);
  const [checkInLoading,   setCheckInLoading]   = useState(false);
  const [checkInQuantity,  setCheckInQuantity]  = useState(1);
  const [permissionError,  setPermissionError]  = useState(false);
  const [cameras,          setCameras]          = useState<CameraDevice[]>([]);
  const [activeCameraId,   setActiveCameraId]   = useState<string | null>(null);
  const [torchSupported,   setTorchSupported]   = useState(false);
  const [torchOn,          setTorchOn]          = useState(false);
  const [isLowLight,       setIsLowLight]       = useState(false);
  const [previewReady,     setPreviewReady]      = useState(false);

  // ── Stable refs (no re-renders) ────────────────────────────────────────────
  // Lifecycle
  const scannerState   = useRef<ScannerState>('idle');
  const mutex          = useRef(new AsyncMutex());
  const hasInitialized = useRef(false);
  const isDestroyed    = useRef(false);
  const retryTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useBD          = useRef(false);   // true = BarcodeDetector path

  // Stale-closure-safe mirrors of React state
  const latestLoading       = useRef(false);
  const latestScannedBkg    = useRef<ScannedBooking | null>(null);
  const activeCameraIdRef   = useRef<string | null>(null);

  useEffect(() => { latestLoading.current    = loading;        }, [loading]);
  useEffect(() => { latestScannedBkg.current = scannedBooking; }, [scannedBooking]);
  useEffect(() => { activeCameraIdRef.current = activeCameraId; }, [activeCameraId]);

  // BarcodeDetector path — video / stream / detector
  const videoRef      = useRef<HTMLVideoElement | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const trackRef      = useRef<MediaStreamTrack | null>(null);
  const detectorRef   = useRef<BDInstance | null>(null);
  const roiCanvas     = useRef<OffscreenCanvas | null>(null);
  const roiCtx        = useRef<OffscreenCanvasRenderingContext2D | null>(null); // cached ctx
  const luxCanvas     = useRef<OffscreenCanvas | null>(null);
  const luxCtx        = useRef<OffscreenCanvasRenderingContext2D | null>(null); // cached ctx
  const prevCanvas    = useRef<OffscreenCanvas | null>(null); // previous frame for motion-blur delta
  const prevCtx       = useRef<OffscreenCanvasRenderingContext2D | null>(null);
  const isDecoding    = useRef(false);
  const expandROI     = useRef(false);
  const noDetectCtr   = useRef(0);
  const luxFrameCtr   = useRef(0);
  const zoomNow       = useRef(1);
  const zoomMax       = useRef(1);
  const rvfcHandle    = useRef(0);
  // P1 — structured capability cache
  const caps          = useRef<CameraCapabilities>({ ...DEFAULT_CAPS });
  // P3 — consecutive dark/over frame counter before showing torch hint
  const darkFramesCtr = useRef(0);
  // P7 — dynamic tracked ROI (null = use center ratio)
  const trackROI      = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  // P4 — motion-blur detection (reusable 16×16 Uint8Array, zero alloc per frame)
  const motionBuf     = useRef<Uint8Array | null>(null);
  // P9 — dev metrics (only populated in non-production)
  const metrics       = useRef({
    decodeCount: 0, decodeTimeSum: 0, decodeTimeP95Buf: [] as number[],
    droppedFrames: 0, skippedFrames: 0, successCount: 0, failCount: 0,
    lastLum: 0, lastROIRatio: ROI_RATIO,
  });

  // html5-qrcode fallback
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Duplicate suppression
  const lastDecoded = useRef({ text: '', at: 0 });

  // Scan-frame ref for GPU-based scan-line animation
  const frameBoxRef = useRef<HTMLDivElement | null>(null);

  // ── Logging ────────────────────────────────────────────────────────────────
  const log = (msg: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[QR|${scannerState.current}] ${msg}`);
    }
  };

  // ── Haptics ────────────────────────────────────────────────────────────────
  const haptic = useCallback((type: 'detect' | 'success' | 'warning' | 'error') => {
    if (!navigator.vibrate) return;
    const p: Record<string, number[]> = {
      detect: [10], success: [20], warning: [20, 50, 20], error: [30],
    };
    try { navigator.vibrate(p[type]); } catch (_) {}
  }, []);

  // ── Retry helpers ──────────────────────────────────────────────────────────
  const cancelRetry = useCallback(() => {
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
  }, []);

  // ── Scan-line CSS variable (GPU-accelerated transform, not top) ─────────────
  const updateScanLineVar = useCallback(() => {
    const el = frameBoxRef.current;
    if (!el) return;
    el.style.setProperty('--sh', `${el.offsetHeight - 2}px`);
  }, []);

  useEffect(() => {
    updateScanLineVar();
    window.addEventListener('resize', updateScanLineVar);
    return () => window.removeEventListener('resize', updateScanLineVar);
  }, [updateScanLineVar]);

  // ═══════════════════════════════════════════════════════════════════════════
  // NETWORK — scan a decoded QR string (shared by both camera paths)
  // ═══════════════════════════════════════════════════════════════════════════
  /**
   * Called once per valid unique QR decode.
   * `stopFn`  — stops camera before the network request
   * `retryFn` — restarts scanner after 3 s on transient failure
   */
  const processDecode = useCallback(async (
    text: string,
    stopFn: () => Promise<void>,
    retryFn: () => Promise<void>,
  ) => {
    // P11 — Payload validation: reject obvious garbage before hitting the API
    if (!isValidPayload(text)) {
      log(`DECODE skip — invalid payload (len=${text?.length})`);
      return;
    }

    // Duplicate suppression — 1 s window
    const now = Date.now();
    if (text === lastDecoded.current.text && now - lastDecoded.current.at < DUPLICATE_MS) return;
    lastDecoded.current = { text, at: now };

    if (latestLoading.current || latestScannedBkg.current) return;
    if (isDestroyed.current) return;

    haptic('detect');
    cancelRetry();

    try {
      setLoading(true);
      setErrorMsg('');
      await stopFn();

      const res  = await fetch('/api/admin/bookings/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        haptic('warning');
        setErrorMsg(data.message || 'Invalid Ticket');
        cancelRetry();
        retryTimer.current = setTimeout(async () => {
          retryTimer.current = null;
          if (isDestroyed.current) return;
          setErrorMsg('');
          await retryFn();
        }, 3000);
        return;
      }

      haptic('success');
      const remaining = data.numberOfTickets - (data.checkedInCount ?? 0);
      setScannedBooking(data);
      setCheckInQuantity(remaining > 0 ? remaining : 0);
      if (remaining <= 0) { haptic('warning'); setErrorMsg('Ticket Fully Used (0 Seats Remaining)'); }

    } catch {
      haptic('error');
      setErrorMsg('Failed to process QR code');
      cancelRetry();
      retryTimer.current = setTimeout(async () => {
        retryTimer.current = null;
        if (isDestroyed.current) return;
        setErrorMsg('');
        await retryFn();
      }, 3000);
    } finally {
      setLoading(false);
    }
  }, [cancelRetry, haptic]);

  // ═══════════════════════════════════════════════════════════════════════════
  // BARCODE DETECTOR PATH
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * P3 — Sample center 16×16 pixels for luminance.
   * Uses cached context + reused Uint8Array → zero allocation per call.
   * Requires N consecutive dark samples before surfacing torch hint.
   */
  const sampleLuminance = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    try {
      // Lazy-create canvas + cache context once
      if (!luxCanvas.current) {
        luxCanvas.current = new OffscreenCanvas(16, 16);
        luxCtx.current = luxCanvas.current.getContext('2d');
      }
      const ctx = luxCtx.current;
      if (!ctx) return;
      const vw = video.videoWidth, vh = video.videoHeight;
      ctx.drawImage(video, (vw >> 1) - 8, (vh >> 1) - 8, 16, 16, 0, 0, 16, 16);
      // Reuse fixed 256-byte buffer (getImageData still allocates internally, but
      // we avoid creating a new JS array wrapper each call by reading into the same var)
      const d = ctx.getImageData(0, 0, 16, 16).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4)
        sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const lum = sum / 256; // average over 256 pixels (16×16)
      metrics.current.lastLum = lum;

      const dark = lum < LOW_LIGHT_LUM;
      const over = lum > OVEREXPOSE_LUM;

      if (dark) {
        darkFramesCtr.current++;
        // Only surface torch suggestion after sustained darkness
        if (darkFramesCtr.current >= DARK_FRAMES_THRESHOLD) setIsLowLight(true);
        // P3 — apply small exposure compensation if supported and not already torching
        if (caps.current.hasExposureComp && !torchOn) {
          const nudge = Math.min(EXP_COMP_NUDGE, caps.current.expCompMax);
          if (nudge > 0) {
            trackRef.current?.applyConstraints({ advanced: [{ exposureCompensation: nudge } as any] })
              .catch(() => {});
          }
        }
      } else {
        darkFramesCtr.current = 0;
        setIsLowLight(false);
        // Reset exposure compensation when scene is bright enough
        if (over && caps.current.hasExposureComp) {
          trackRef.current?.applyConstraints({ advanced: [{ exposureCompensation: 0 } as any] })
            .catch(() => {});
        }
      }
    } catch (_) {}
  }, [torchOn]);

  /** Apply zoom-in when QR is detected but too small to decode reliably */
  const nudgeZoom = useCallback(async (bbWidth: number, frameWidth: number) => {
    if (!caps.current.hasZoom) return;
    if (bbWidth / frameWidth >= AUTO_ZOOM_QR_RATIO) return;
    if (zoomNow.current >= zoomMax.current) return;
    const next = Math.min(zoomNow.current * 1.5, zoomMax.current);
    try {
      await trackRef.current?.applyConstraints({ advanced: [{ zoom: next } as any] });
      zoomNow.current = next;
    } catch (_) {}
  }, []);

  /**
   * P2 — Steer the AF region toward the detected QR centre.
   * Uses pointsOfInterest if supported; silently no-ops otherwise.
   * Never interrupts CAF — just shifts its focus point.
   */
  const steerFocusToQR = useCallback((hit: BDResult, frameW: number, frameH: number) => {
    if (!caps.current.hasPointsOfInterest) return;
    // BarcodeDetector returns corner points; derive centroid (normalised 0–1)
    const pts = hit.cornerPoints;
    if (!pts || pts.length === 0) return;
    let cx = 0, cy = 0;
    for (const p of pts) { cx += p.x; cy += p.y; }
    cx = cx / pts.length / frameW;
    cy = cy / pts.length / frameH;
    // Clamp to [0.1, 0.9] to avoid edge artefacts
    cx = Math.max(0.1, Math.min(0.9, cx));
    cy = Math.max(0.1, Math.min(0.9, cy));
    trackRef.current?.applyConstraints({
      advanced: [{ pointsOfInterest: [{ x: cx, y: cy }] } as any],
    }).catch(() => {});
  }, []);

  /** Silently stop the BD stream without going through the mutex (called from inside mutex) */
  const _bdStopRaw = useCallback(async () => {
    // Cancel frame loop
    const video = videoRef.current;
    if (video && 'requestVideoFrameCallback' in video && rvfcHandle.current) {
      try { (video as any).cancelVideoFrameCallback(rvfcHandle.current); } catch (_) {}
    } else if (rvfcHandle.current) {
      cancelAnimationFrame(rvfcHandle.current);
    }
    rvfcHandle.current = 0;
    isDecoding.current = false;

    // Release stream
    if (video) { try { video.pause(); } catch (_) {} video.srcObject = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    trackRef.current  = null;

    scannerState.current = 'idle';
    setPreviewReady(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  /** Forward-declared so the frame loop can reference the latest version */
  const startBDRef = useRef<((deviceId?: string | null) => Promise<void>) | null>(null);

  /**
   * P4 — Motion-blur / frozen-frame detection via 16×16 thumbnail delta.
   * Returns true if the frame should be skipped (too blurry or frozen).
   * Zero heap allocation: reuses motionBuf Uint8Array.
   */
  const shouldSkipFrame = useCallback((): boolean => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return false;
    try {
      if (!prevCanvas.current) {
        prevCanvas.current = new OffscreenCanvas(16, 16);
        prevCtx.current    = prevCanvas.current.getContext('2d');
        motionBuf.current  = new Uint8Array(16 * 16); // stores previous lum values
      }
      const ctx = prevCtx.current;
      if (!ctx) return false;
      const vw = video.videoWidth, vh = video.videoHeight;
      ctx.drawImage(video, (vw >> 1) - 8, (vh >> 1) - 8, 16, 16, 0, 0, 16, 16);
      const d    = ctx.getImageData(0, 0, 16, 16).data;
      const prev = motionBuf.current!;
      let delta  = 0;
      for (let i = 0, j = 0; i < d.length; i += 4, j++) {
        const lum = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8; // fast integer lum
        delta += Math.abs(lum - prev[j]);
        prev[j] = lum;
      }
      const avgDelta = delta / 256; // 16×16 pixels
      // Skip if average per-pixel delta is huge (severe motion blur)
      if (avgDelta > MOTION_BLUR_SKIP_DELTA) {
        metrics.current.skippedFrames++;
        return true;
      }
    } catch (_) {}
    return false;
  }, []);

  /** One frame of decode — called from the rVFC/rAF loop */
  const processFrame = useCallback(async () => {
    const video    = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.readyState < 2) return;

    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return;

    // P4 — skip severely blurred frames (e.g., camera panning)
    if (shouldSkipFrame()) return;

    // P9 — dev metrics: record frame start
    const frameStart = process.env.NODE_ENV !== 'production' ? performance.now() : 0;

    // Periodic brightness check (P3)
    if (++luxFrameCtr.current % BRIGHTNESS_EVERY === 0) sampleLuminance();

    // P7 — Dynamic ROI: use tracked QR bbox if available, else center ratio
    let rx: number, ry: number, rw: number, rh: number;
    if (trackROI.current) {
      // Shrink ROI around the last detected QR with 20% padding
      const pad = 0.20;
      const tr  = trackROI.current;
      rw = Math.floor(Math.min(vw, tr.w * (1 + pad * 2)));
      rh = Math.floor(Math.min(vh, tr.h * (1 + pad * 2)));
      rx = Math.max(0, Math.floor(tr.x - tr.w * pad));
      ry = Math.max(0, Math.floor(tr.y - tr.h * pad));
      metrics.current.lastROIRatio = rw / vw;
    } else {
      const ratio = expandROI.current ? ROI_RATIO_WIDE : ROI_RATIO;
      rw = Math.floor(vw * ratio); rh = Math.floor(vh * ratio);
      rx = (vw - rw) >> 1;         ry = (vh - rh) >> 1;
      metrics.current.lastROIRatio = ratio;
    }

    // Ensure ROI canvas is correct size; reuse context
    if (!roiCanvas.current) {
      roiCanvas.current = new OffscreenCanvas(rw, rh);
      roiCtx.current    = roiCanvas.current.getContext('2d');
    } else if (roiCanvas.current.width !== rw || roiCanvas.current.height !== rh) {
      roiCanvas.current.width  = rw;
      roiCanvas.current.height = rh;
      roiCtx.current = roiCanvas.current.getContext('2d'); // re-fetch after resize
    }
    const ctx = roiCtx.current;
    if (!ctx) return;
    ctx.drawImage(video, rx, ry, rw, rh, 0, 0, rw, rh);

    try {
      const hits = await detector.detect(roiCanvas.current);
      if (hits.length > 0) {
        noDetectCtr.current = 0;
        expandROI.current   = false;
        const hit = hits[0];

        // P7 — update tracked ROI (bbox is relative to the cropped ROI canvas, map back to frame)
        trackROI.current = {
          x: rx + hit.boundingBox.x,
          y: ry + hit.boundingBox.y,
          w: hit.boundingBox.width,
          h: hit.boundingBox.height,
        };

        nudgeZoom(hit.boundingBox.width, vw);
        steerFocusToQR(hit, vw, vh); // P2 — steer AF region

        // P9 — record decode time
        if (process.env.NODE_ENV !== 'production') {
          const dt = performance.now() - frameStart;
          metrics.current.decodeCount++;
          metrics.current.decodeTimeSum += dt;
          const buf = metrics.current.decodeTimeP95Buf;
          buf.push(dt);
          if (buf.length > 100) buf.shift();
        }

        // Stop camera, hit the API, optionally restart
        await processDecode(
          hit.rawValue,
          async () => {
            if (scannerState.current === 'running') {
              scannerState.current = 'stopping';
              await _bdStopRaw();
            }
          },
          async () => {
            if (startBDRef.current) await startBDRef.current(activeCameraIdRef.current);
          },
        );
      } else {
        // P7 — lose track after N consecutive misses
        if (++noDetectCtr.current > 5) trackROI.current = null;
        if (noDetectCtr.current > ROI_EXPAND_FRAMES) expandROI.current = true;
        metrics.current.droppedFrames++;
      }
    } catch (_) { /* detector can throw on 0×0 canvas — safe to ignore */ }
  }, [_bdStopRaw, nudgeZoom, processDecode, sampleLuminance, shouldSkipFrame, steerFocusToQR]);

  // Keep latest processFrame reachable from the frame loop without stale closure
  const processFrameRef = useRef(processFrame);
  useEffect(() => { processFrameRef.current = processFrame; }, [processFrame]);

  // ── Dev metrics overlay ────────────────────────────────────────────────────
  const [devOverlay, setDevOverlay] = useState(false);
  const [devSnap,    setDevSnap]    = useState<typeof metrics.current | null>(null);
  // Snapshot metrics every second for the overlay
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const id = setInterval(() => {
      if (devOverlay) setDevSnap({ ...metrics.current });
    }, 1000);
    return () => clearInterval(id);
  }, [devOverlay]);

  const startBarcodeDetector = useCallback(async (deviceId?: string | null) => {
    return mutex.current.run(async () => {
      if (isDestroyed.current)                    { log('BD START skip — destroyed'); return; }
      if (scannerState.current !== 'idle')         { log(`BD START skip — ${scannerState.current}`); return; }

      log(`BD START deviceId=${deviceId ?? 'env'}`);
      scannerState.current = 'starting';
      setLoading(true);
      setPreviewReady(false);
      expandROI.current   = false;
      noDetectCtr.current = 0;
      luxFrameCtr.current = 0;
      darkFramesCtr.current = 0;   // P3 reset
      trackROI.current    = null;  // P7 reset
      lastDecoded.current = { text: '', at: 0 };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: videoConstraints(deviceId),
        });

        if (isDestroyed.current) { stream.getTracks().forEach(t => t.stop()); scannerState.current = 'idle'; return; }

        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        trackRef.current  = track;

        // P1 — Detect and cache camera capabilities
        try {
          const detected = detectCapabilities(track);
          caps.current = detected;
          log(`Caps: AF=${detected.hasContinuousAF} zoom=${detected.hasZoom}(${detected.zoomMin}–${detected.zoomMax}) torch=${detected.hasTorch} expComp=${detected.hasExposureComp} poi=${detected.hasPointsOfInterest}`);

          const adv: any = {};
          if (detected.hasContinuousAF)       adv.focusMode = 'continuous';
          // Leave exposure & white-balance on auto — only nudge via exposureCompensation later
          if (detected.hasZoom) {
            zoomNow.current = detected.zoomMin;
            zoomMax.current = detected.zoomMax;
          }
          if (detected.hasTorch) setTorchSupported(true);
          if (Object.keys(adv).length) await track.applyConstraints({ advanced: [adv] });
        } catch (_) {}

        // Attach to video element
        const video = videoRef.current;
        if (!video) { stream.getTracks().forEach(t => t.stop()); scannerState.current = 'idle'; return; }
        video.srcObject = stream;
        await video.play();

        if (isDestroyed.current) {
          video.pause(); stream.getTracks().forEach(t => t.stop()); video.srcObject = null;
          scannerState.current = 'idle'; return;
        }

        // Lazy-create detector (QR only)
        if (!detectorRef.current) {
          detectorRef.current = new window.BarcodeDetector!({ formats: ['qr_code'] });
        }

        scannerState.current = 'running';
        setPreviewReady(true);
        setLoading(false);
        log('BD START done');

        // Frame loop — use requestVideoFrameCallback for best timing, rAF as fallback
        const loop = () => {
          if (isDestroyed.current || scannerState.current !== 'running') return;
          if (!isDecoding.current) {
            isDecoding.current = true;
            processFrameRef.current().finally(() => { isDecoding.current = false; });
          }
          if ('requestVideoFrameCallback' in video) {
            rvfcHandle.current = (video as any).requestVideoFrameCallback(loop);
          } else {
            rvfcHandle.current = requestAnimationFrame(loop);
          }
        };
        if ('requestVideoFrameCallback' in video) {
          rvfcHandle.current = (video as any).requestVideoFrameCallback(loop);
        } else {
          rvfcHandle.current = requestAnimationFrame(loop);
        }

      } catch (err: any) {
        scannerState.current = 'idle';
        setLoading(false);
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setPermissionError(true); return;
        }
        // Specific device failed → retry with env facing mode
        if (deviceId && !isDestroyed.current) {
          log('BD fallback to env');
          await startBarcodeDetector(null);
          return;
        }
        if (!isDestroyed.current) setErrorMsg('Failed to start camera: ' + (err?.message ?? ''));
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Wire up the forward reference
  useEffect(() => { startBDRef.current = startBarcodeDetector; }, [startBarcodeDetector]);

  const stopBarcodeDetector = useCallback(() => {
    return mutex.current.run(async () => {
      if (scannerState.current !== 'running') { log(`BD STOP skip — ${scannerState.current}`); return; }
      log('BD STOP');
      scannerState.current = 'stopping';
      await _bdStopRaw();
    });
  }, [_bdStopRaw]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HTML5-QRCODE FALLBACK PATH
  // ═══════════════════════════════════════════════════════════════════════════

  /** Raw stop (must be called from inside a mutex task) */
  const _fbStopRaw = useCallback(async () => {
    if (scannerState.current !== 'running') return;
    log('FB STOP');
    scannerState.current = 'stopping';
    try { await scannerRef.current?.stop(); } catch (e) { console.error('[QR] fb stop:', e); }
    scannerState.current = 'idle';
    setPreviewReady(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const startFallback = useCallback((config?: any) => {
    return mutex.current.run(async () => {
      if (isDestroyed.current)            { log('FB START skip — destroyed'); return; }
      if (scannerState.current !== 'idle') { log(`FB START skip — ${scannerState.current}`); return; }
      if (!scannerRef.current)             { log('FB START skip — no instance'); return; }

      const cfg = config ?? activeCameraIdRef.current ?? { facingMode: 'environment' };
      log(`FB START config=${JSON.stringify(cfg)}`);
      scannerState.current = 'starting';
      setLoading(true);
      lastDecoded.current = { text: '', at: 0 };

      try {
        await scannerRef.current.start(
          cfg,
          {
            fps: 30,
            qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * ROI_RATIO); return { width: s, height: s }; },
            aspectRatio: 1.0,
          },
          async (text: string) => {
            await processDecode(
              text,
              async () => { await mutex.current.run(_fbStopRaw); },
              async () => { await startFallback(cfg); },
            );
          },
          () => {},
        );

        if (isDestroyed.current) {
          try { await scannerRef.current?.stop(); } catch (_) {}
          scannerState.current = 'idle'; setLoading(false); return;
        }

        scannerState.current = 'running';
        setPreviewReady(true);
        setLoading(false);
        log('FB START done');

        // P1 — Detect capabilities and apply CAF after fallback stream settles
        setTimeout(async () => {
          try {
            if (!scannerRef.current || scannerState.current !== 'running') return;
            const getTrack = (scannerRef.current as any).getRunningTrack as Function | undefined;
            if (typeof getTrack !== 'function') return;
            const track = getTrack.call(scannerRef.current) as MediaStreamTrack;
            if (!track) return;
            const detected = detectCapabilities(track);
            caps.current = detected;
            if (detected.hasTorch) setTorchSupported(true);
            const adv: any = {};
            if (detected.hasContinuousAF) adv.focusMode = 'continuous';
            if (Object.keys(adv).length) await track.applyConstraints({ advanced: [adv] });
          } catch (_) {}
        }, 500);

      } catch (err: any) {
        scannerState.current = 'idle';
        setLoading(false);
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || err === 'NotAllowedError') {
          setPermissionError(true); return;
        }
        const msg = typeof err === 'string' ? err : (err?.message ?? JSON.stringify(err));
        // Specific device failed → fall back to environment camera
        if (typeof cfg === 'string' || (cfg && !cfg.facingMode)) {
          log('FB fallback to env'); await startFallback({ facingMode: 'environment' }); return;
        }
        if (!isDestroyed.current) setErrorMsg('Failed to start camera: ' + msg);
      }
    });
  }, [_fbStopRaw, processDecode]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopFallback = useCallback(() => mutex.current.run(_fbStopRaw), [_fbStopRaw]);

  const destroyFallback = useCallback(async () => {
    if (!scannerRef.current) return;
    await _fbStopRaw();
    log('FB CLEAR');
    scannerState.current = 'destroyed';
    try { await scannerRef.current.clear(); } catch (e) { console.error('[QR] fb clear:', e); }
    scannerRef.current = null;
  }, [_fbStopRaw]);

  // ═══════════════════════════════════════════════════════════════════════════
  // UNIFIED PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════
  const startScanner = useCallback((deviceId?: string | null | { facingMode: string }) => {
    if (useBD.current) return startBarcodeDetector(typeof deviceId === 'string' ? deviceId : null);
    return startFallback(deviceId);
  }, [startBarcodeDetector, startFallback]);

  const stopScanner = useCallback(() => {
    if (useBD.current) return stopBarcodeDetector();
    return stopFallback();
  }, [stopBarcodeDetector, stopFallback]);

  // ═══════════════════════════════════════════════════════════════════════════
  // INIT — mount once, deferred by rAF so the DOM is fully painted
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (hasInitialized.current) { log('INIT skip — Strict Mode'); return; }
    hasInitialized.current = true;
    isDestroyed.current    = false;

    const bd = hasBarcodeDetector();
    useBD.current = bd;
    log(`BarcodeDetector=${bd}`);

    let rafId: number;

    const init = async () => {
      if (isDestroyed.current) return;

      if (!bd) {
        // html5-qrcode needs a visible, non-zero element
        const el = document.getElementById('qr-reader');
        if (!el || el.clientWidth === 0) {
          rafId = requestAnimationFrame(init); return;
        }
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode('qr-reader', {
            verbose: false,
            experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          });
          log('Html5Qrcode instance created');
        }
      }

      try {
        setLoading(true);
        setPermissionError(false);

        const devices = await Html5Qrcode.getCameras();

        if (devices && devices.length > 0) {
          setCameras(devices);

          let target = devices[0].id;
          const saved = localStorage.getItem(PREFERRED_CAMERA_KEY);
          if (saved && devices.find(d => d.id === saved)) {
            target = saved;
          } else {
            // Prefer rear primary — skip ultra-wide / macro / telephoto
            const backs = devices.filter(d => {
              const l = d.label.toLowerCase();
              return l.includes('back') || l.includes('environment') || l.includes('rear') || l.includes('0');
            });
            if (backs.length) {
              const primary = backs.find(d => {
                const l = d.label.toLowerCase();
                return !l.includes('ultra') && !l.includes('macro') && !l.includes('wide') && !l.includes('tele');
              });
              target = primary ? primary.id : backs[0].id;
            }
          }

          setActiveCameraId(target);
          await startScanner(target);
        } else {
          await startScanner(null);
        }
      } catch (err: any) {
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || err === 'NotAllowedError') {
          setPermissionError(true);
        } else {
          setErrorMsg('Camera unavailable: ' + (typeof err === 'string' ? err : (err?.message ?? '')));
        }
      } finally {
        setLoading(false);
      }
    };

    rafId = requestAnimationFrame(init);

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      log('CLEANUP');
      cancelAnimationFrame(rafId);
      isDestroyed.current    = true;
      hasInitialized.current = false;
      cancelRetry();

      if (bd) {
        // BD path: cancel frame loop and release stream synchronously
        const video = videoRef.current;
        if (video && 'requestVideoFrameCallback' in video && rvfcHandle.current) {
          try { (video as any).cancelVideoFrameCallback(rvfcHandle.current); } catch (_) {}
        } else if (rvfcHandle.current) {
          cancelAnimationFrame(rvfcHandle.current);
        }
        if (video) { try { video.pause(); } catch (_) {} video.srcObject = null; }
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null; trackRef.current = null;
      } else {
        // FB path: must be async; serialise through mutex
        mutex.current.run(() => destroyFallback());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pause / resume on tab hide (BD path only) ────────────────────────────
  useEffect(() => {
    const handle = () => {
      if (!useBD.current) return;
      const track = trackRef.current;
      if (!track) return;
      track.enabled = !document.hidden;
      log(document.hidden ? 'Camera paused (hidden)' : 'Camera resumed (visible)');
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // USER ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1 || !activeCameraId) return;
    if (scannerState.current !== 'running' && scannerState.current !== 'idle') return;
    const idx  = cameras.findIndex(c => c.id === activeCameraId);
    const next = cameras[(idx + 1) % cameras.length].id;
    setActiveCameraId(next);
    localStorage.setItem(PREFERRED_CAMERA_KEY, next);
    await stopScanner();
    await startScanner(next);
  };

  const toggleTorch = async () => {
    if (!torchSupported) return;
    const next = !torchOn;
    try {
      if (useBD.current) {
        await trackRef.current?.applyConstraints({ advanced: [{ torch: next } as any] });
      } else {
        await scannerRef.current?.applyVideoConstraints({ advanced: [{ torch: next } as any] });
      }
      setTorchOn(next);
      setIsLowLight(false); // user acted on suggestion — dismiss banner
    } catch (e) { console.error('[QR] Torch failed:', e); }
  };

  const handleConfirmCheckIn = async () => {
    if (!scannedBooking || checkInQuantity <= 0) return;
    try {
      setCheckInLoading(true);
      const res = await fetch('/api/admin/bookings/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: scannedBooking.bookingId, checkInQuantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message);
      setScannedBooking(null);
      setErrorMsg('');
      lastDecoded.current = { text: '', at: 0 };
      await startScanner(activeCameraIdRef.current);
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCancel = async () => {
    setScannedBooking(null);
    setErrorMsg('');
    lastDecoded.current = { text: '', at: 0 };
    await startScanner(activeCameraIdRef.current);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-[60] p-4 flex justify-between items-center
                      bg-gradient-to-b from-black/80 to-transparent pt-safe">
        <h2 className="text-xl font-headline-md font-bold text-white uppercase tracking-wide">
          Scanner
        </h2>
        {onClose && (
          <button onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center
                       justify-center text-white active:scale-95 transition-transform">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {permissionError ? (
        /* ── Permission error ──────────────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-black">
          <span className="material-symbols-outlined text-5xl mb-4 text-red-500">videocam_off</span>
          <h3 className="font-headline-md text-xl font-bold uppercase tracking-wide text-white mb-2">
            Camera Blocked
          </h3>
          <p className="text-on-surface/70 text-sm mb-4">
            Your browser has blocked camera access for this site.
          </p>
          <div className="bg-[#1c1b1b] border border-white/10 p-3 rounded text-left text-sm
                          text-on-surface/80 w-full max-w-xs mb-6">
            <strong className="block text-white mb-1">How to fix it:</strong>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Tap the <b>padlock icon</b> in the address bar.</li>
              <li>Go to <b>Site Settings</b>.</li>
              <li>Set <b>Camera</b> to <b>Allow</b>.</li>
              <li>Reload this page.</li>
            </ol>
          </div>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded font-bold
                       uppercase tracking-wider transition-colors">
            I fixed it — Reload
          </button>
        </div>
      ) : (
        /* ── Camera area ───────────────────────────────────────────────── */
        <div className="relative flex-1 bg-black overflow-hidden">

          {/* BarcodeDetector path: native <video> element */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: useBD.current ? 'block' : 'none' }}
          />

          {/* html5-qrcode fallback: library owns this div */}
          <div
            id="qr-reader"
            className="absolute inset-0 w-full h-full"
            style={{ display: useBD.current ? 'none' : 'block' }}
          />

          {/* ── Scan frame + corners + GPU scan-line ─────────────────── */}
          {!loading && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              <div
                ref={frameBoxRef}
                className="scan-frame relative rounded-2xl"
                style={{ width: '72%', aspectRatio: '1' }}
              >
                {/* Dark mask via box-shadow */}
                <div className="absolute inset-0 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.60)]" />
                {/* Corner brackets */}
                <div className="absolute -top-px -left-px  w-9 h-9 border-t-[3px] border-l-[3px] border-primary-container rounded-tl-2xl" />
                <div className="absolute -top-px -right-px w-9 h-9 border-t-[3px] border-r-[3px] border-primary-container rounded-tr-2xl" />
                <div className="absolute -bottom-px -left-px  w-9 h-9 border-b-[3px] border-l-[3px] border-primary-container rounded-bl-2xl" />
                <div className="absolute -bottom-px -right-px w-9 h-9 border-b-[3px] border-r-[3px] border-primary-container rounded-br-2xl" />
                {/* GPU-accelerated scan line (transform-based, never layout) */}
                {previewReady && (
                  <div className="scan-line absolute left-0 right-0 h-[2px] bg-primary-container
                                  shadow-[0_0_12px_4px_rgba(255,107,26,0.65)]" />
                )}
              </div>
            </div>
          )}

          {/* ── Low-light torch suggestion banner ────────────────────── */}
          {isLowLight && !torchOn && torchSupported && !scannedBooking && !loading && (
            <div className="absolute top-16 left-0 right-0 z-20 flex justify-center px-6 pointer-events-auto">
              <button
                onClick={toggleTorch}
                className="flex items-center gap-2 bg-black/75 backdrop-blur-md border border-white/20
                           rounded-full px-4 py-2 text-white text-sm font-medium
                           active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-yellow-400 text-base leading-none">
                  flashlight_on
                </span>
                Turn on flashlight?
              </button>
            </div>
          )}

          {/* ── Floating action buttons ───────────────────────────────── */}
          <div className="absolute bottom-12 left-0 right-0 z-[60]
                          flex justify-center items-center gap-6 pointer-events-auto">
            {cameras.length > 1 && (
              <button onClick={handleSwitchCamera}
                className="w-14 h-14 bg-black/60 backdrop-blur-md rounded-full border border-white/20
                           flex items-center justify-center text-white
                           active:scale-95 transition-transform shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                aria-label="Switch Camera">
                <span className="material-symbols-outlined text-2xl">flip_camera_ios</span>
              </button>
            )}
            {torchSupported && (
              <button onClick={toggleTorch}
                className={`w-14 h-14 backdrop-blur-md rounded-full border border-white/20
                            flex items-center justify-center transition-all
                            active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.5)]
                            ${torchOn ? 'bg-yellow-400 text-black' : 'bg-black/60 text-white'}`}
                aria-label="Toggle Flashlight">
                <span className="material-symbols-outlined text-2xl">
                  {torchOn ? 'flashlight_off' : 'flashlight_on'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Camera startup spinner (shown only before first frame) ─────── */}
      {loading && !scannedBooking && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
          <div className="w-10 h-10 border-[3px] border-primary-container border-t-transparent
                          rounded-full animate-spin mb-4" />
          <p className="text-white/50 text-sm tracking-wide">Opening camera…</p>
        </div>
      )}



      {/* ── Dev metrics overlay (development only) ────────────────────── */}
      {process.env.NODE_ENV !== 'production' && (
        <>
          <button
            className="absolute top-14 right-2 z-[200] text-[9px] bg-black/60 text-green-400
                       font-mono px-1.5 py-0.5 rounded border border-green-900/60
                       active:scale-95 transition-transform"
            onClick={() => setDevOverlay(v => !v)}
          >
            {devOverlay ? 'HIDE DEV' : 'METRICS'}
          </button>
          {devOverlay && devSnap && (
            <div className="absolute top-20 right-2 z-[200] bg-black/80 text-green-400 font-mono
                            text-[10px] p-2 rounded border border-green-900/40 w-52 leading-5"
                 style={{ pointerEvents: 'none' }}>
              <div>Path: {useBD.current ? 'BarcodeDetector' : 'html5-qrcode'}</div>
              <div>Decodes: {devSnap.decodeCount}</div>
              <div>Avg decode: {devSnap.decodeCount > 0
                ? (devSnap.decodeTimeSum / devSnap.decodeCount).toFixed(1) + ' ms' : '—'}</div>
              <div>p95 decode: {(() => {
                const b = [...devSnap.decodeTimeP95Buf].sort((a, b2) => a - b2);
                return b.length ? b[Math.floor(b.length * 0.95)].toFixed(1) + ' ms' : '—';
              })()}</div>
              <div>Dropped frm: {devSnap.droppedFrames}</div>
              <div>Skipped frm: {devSnap.skippedFrames}</div>
              <div>ROI: {(devSnap.lastROIRatio * 100).toFixed(0)}%</div>
              <div>Luminance: {devSnap.lastLum.toFixed(1)}</div>
              <div>AF:{caps.current.hasContinuousAF?'✓':'✗'} Torch:{caps.current.hasTorch?'✓':'✗'} ExpC:{caps.current.hasExposureComp?'✓':'✗'} POI:{caps.current.hasPointsOfInterest?'✓':'✗'}</div>
            </div>
          )}
        </>
      )}

      {/* ── Error overlay (auto-dismisses after retry) ────────────────── */}
      {errorMsg && !scannedBooking && !loading && (

        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center
                        bg-red-950/95 text-white p-6 text-center">
          <span className="material-symbols-outlined text-6xl mb-4 text-red-400">error</span>
          <h3 className="font-headline-md text-2xl font-bold uppercase tracking-wide mb-2">
            Scan Failed
          </h3>
          <p className="font-body-md text-lg text-red-300">{errorMsg}</p>
          <p className="text-white/40 text-sm mt-4">Retrying in 3 s…</p>
        </div>
      )}

      {/* ── Check-in bottom sheet ──────────────────────────────────────── */}
      {scannedBooking && (
        <div className="absolute inset-x-0 bottom-0 z-[70] bg-[#131313] rounded-t-3xl
                        shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col
                        pb-safe max-h-[85vh] animate-slide-up">
          {/* Drag handle */}
          <div className="w-full flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </div>

          <div className="px-6 py-4 flex-1 overflow-y-auto">
            {/* Guest info */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-label-caps text-on-surface/50 text-[10px] uppercase
                                 tracking-widest block mb-1">Scanned Ticket</span>
                <h3 className="font-headline-md text-2xl font-bold uppercase
                               text-primary-container leading-tight">
                  {scannedBooking.fullName}
                </h3>
                <p className="text-on-surface/70 text-sm mt-1">{scannedBooking.email}</p>
              </div>
              <button onClick={handleCancel}
                className="w-10 h-10 shrink-0 rounded-full bg-white/5 hover:bg-white/10
                           flex items-center justify-center active:scale-95 transition-transform
                           text-white/70">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Ticket stats */}
            <div className="grid grid-cols-3 gap-2 bg-[#1c1b1b] brutalist-border rounded-xl p-3 mb-4">
              <div className="flex flex-col items-center text-center">
                <span className="text-on-surface/50 text-[10px] font-label-caps uppercase mb-1">Total</span>
                <span className="font-bold text-lg leading-none">{scannedBooking.numberOfTickets}</span>
              </div>
              <div className="flex flex-col items-center text-center border-l border-white/10">
                <span className="text-on-surface/50 text-[10px] font-label-caps uppercase mb-1">Checked In</span>
                <span className="font-bold text-lg leading-none text-green-400">{scannedBooking.checkedInCount}</span>
              </div>
              <div className="flex flex-col items-center text-center border-l border-white/10">
                <span className="text-on-surface/50 text-[10px] font-label-caps uppercase mb-1">Remaining</span>
                <span className="font-bold text-lg leading-none text-primary-container">
                  {scannedBooking.numberOfTickets - scannedBooking.checkedInCount}
                </span>
              </div>
            </div>

            {/* Quantity picker or fully-used notice */}
            {scannedBooking.numberOfTickets - scannedBooking.checkedInCount > 0 ? (
              <div className="flex flex-col items-center gap-3 mt-4 mb-2">
                <span className="text-on-surface/70 text-xs uppercase tracking-widest font-bold">
                  Select Quantity
                </span>
                <div className="flex items-center gap-6 bg-[#1c1b1b] p-2 rounded-full brutalist-border">
                  <button
                    className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10
                               flex items-center justify-center active:scale-95 transition-transform"
                    onClick={() => setCheckInQuantity(q => Math.max(1, q - 1))}>
                    <span className="material-symbols-outlined text-2xl">remove</span>
                  </button>
                  <span className="font-headline-md text-4xl font-bold w-12 text-center">
                    {checkInQuantity}
                  </span>
                  <button
                    className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10
                               flex items-center justify-center active:scale-95 transition-transform"
                    onClick={() =>
                      setCheckInQuantity(q =>
                        Math.min(scannedBooking.numberOfTickets - scannedBooking.checkedInCount, q + 1))
                    }>
                    <span className="material-symbols-outlined text-2xl">add</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-4 rounded-xl
                              text-center uppercase tracking-wider font-bold my-6">
                Ticket Fully Used
              </div>
            )}
          </div>

          {/* Confirm button */}
          <div className="p-4 border-t border-white/5 bg-[#0e0e0e]">
            <button
              onClick={handleConfirmCheckIn}
              disabled={checkInQuantity <= 0 || checkInLoading}
              className={`w-full h-16 rounded-xl flex items-center justify-center gap-3
                          uppercase tracking-wider font-bold transition-all text-lg
                          ${checkInQuantity > 0 && !checkInLoading
                            ? 'bg-primary-container text-black hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-white/10 text-on-surface/40 cursor-not-allowed'}`}
            >
              {checkInLoading
                ? <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <>
                    <span className="material-symbols-outlined">how_to_reg</span>
                    {checkInQuantity > 0
                      ? `Confirm Check-In (${checkInQuantity})`
                      : 'No Seats Remaining'}
                  </>}
            </button>
          </div>
        </div>
      )}

      {/* ── Styles ─────────────────────────────────────────────────────── */}
      <style>{`
        /* Strip all chrome that html5-qrcode injects */
        #qr-reader { border: none !important; }
        #qr-reader > img,
        #qr-reader__dashboard,
        #qr-reader__scan_region img { display: none !important; }
        #qr-reader video {
          object-fit: cover   !important;
          width:      100%    !important;
          height:     100%    !important;
          position:   absolute !important;
          inset:      0 !important;
        }
        #qr-reader__scan_region { display: none !important; }

        /* GPU-accelerated scan-line  (transform: translateY, no layout cost) */
        .scan-frame { --sh: 200px; }
        .scan-line  { animation: scan-move 2.5s ease-in-out infinite; }
        @keyframes scan-move {
          0%   { transform: translateY(0);           opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateY(var(--sh));   opacity: 0; }
        }

        /* Bottom-sheet entry */
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}
