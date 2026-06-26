/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { toast } from 'react-toastify';

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

export default function QRScanner() {
  const [scannedBooking, setScannedBooking] = useState<ScannedBooking | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkInQuantity, setCheckInQuantity] = useState(1);
  const [permissionError, setPermissionError] = useState(false);
  
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  // Refs for the callback to avoid stale closures
  const stateRefs = useRef({ loading, scannedBooking });
  useEffect(() => {
    stateRefs.current = { loading, scannedBooking };
  }, [loading, scannedBooking]);

  const triggerHaptic = useCallback((type: 'detect' | 'success' | 'warning' | 'error') => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      try {
        switch(type) {
          case 'detect': navigator.vibrate([10]); break;
          case 'success': navigator.vibrate([20]); break;
          case 'warning': navigator.vibrate([20, 50, 20]); break;
          case 'error': navigator.vibrate([30]); break;
        }
      } catch(e) {
        // Silently ignore unsupported devices
      }
    }
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        isScanningRef.current = false;
        setTorchSupported(false);
        setTorchOn(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const startScanner = async (cameraIdOrConfig: any) => {
    if (!scannerRef.current) return;
    try {
      await stopScanner(); // Ensure any existing stream is stopped
      
      await scannerRef.current.start(
        cameraIdOrConfig,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Dynamic qrbox size based on screen
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * 0.7); // 70% of screen
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Ignore if already processing a scan
          if (stateRefs.current.loading || stateRefs.current.scannedBooking) return;
          
          triggerHaptic('detect');

          try {
            setLoading(true);
            setErrorMsg('');
            
            // Pause camera to prevent duplicate scans
            if (scannerRef.current?.isScanning) {
              scannerRef.current.pause();
            }

            const res = await fetch('/api/admin/bookings/scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ qrData: decodedText })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
              triggerHaptic('warning');
              setErrorMsg(data.message || 'Invalid Ticket');
              setTimeout(() => { 
                setErrorMsg(''); 
                if (scannerRef.current?.isScanning) scannerRef.current.resume();
              }, 3000);
              return;
            }
            
            triggerHaptic('success');
            const remaining = data.numberOfTickets - (data.checkedInCount || 0);
            setScannedBooking(data);
            setCheckInQuantity(remaining > 0 ? remaining : 0);
            
            if (remaining <= 0) {
              triggerHaptic('warning');
              setErrorMsg('Ticket Fully Used (0 Seats Remaining)');
            }

          } catch (err: any) {
            triggerHaptic('error');
            setErrorMsg('Failed to process QR code');
            setTimeout(() => { 
              setErrorMsg(''); 
              if (scannerRef.current?.isScanning) scannerRef.current.resume();
            }, 3000);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          // Ignore normal scan failures (no QR code in frame)
        }
      );
      
      isScanningRef.current = true;
      
      // Check if Torch (Flashlight) is supported on the active track
      if (typeof (scannerRef.current as any).getRunningTrack === 'function') {
        const track = (scannerRef.current as any).getRunningTrack();
        if (track && typeof track.getCapabilities === 'function') {
          const capabilities = track.getCapabilities();
          if (capabilities && capabilities.torch) {
            setTorchSupported(true);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError(true);
      } else {
        setErrorMsg('Failed to start camera: ' + err.message);
      }
    }
  };

  useEffect(() => {
    scannerRef.current = new Html5Qrcode("qr-reader", /* verbose= */ false);

    const init = async () => {
      try {
        setLoading(true);
        // 1. Manually request camera permission FIRST
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissionError(false);

        // 2. Enumerate cameras and auto-select the best one
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          
          let targetCamera = devices[0].id;
          const savedCamera = localStorage.getItem('preferred_camera');
          
          if (savedCamera && devices.find(d => d.id === savedCamera)) {
            targetCamera = savedCamera;
          } else {
            // Find environment/back camera automatically
            const envCam = devices.find(d => 
              d.label.toLowerCase().includes('back') || 
              d.label.toLowerCase().includes('environment') ||
              d.label.toLowerCase().includes('rear')
            );
            if (envCam) targetCamera = envCam.id;
          }
          
          setActiveCameraId(targetCamera);
          await startScanner(targetCamera);
        } else {
          // Fallback if specific enumeration fails
          await startScanner({ facingMode: "environment" });
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionError(true);
        } else {
          setErrorMsg('Camera unavailable');
        }
      } finally {
        setLoading(false);
      }
    };

    init();

    // Cleanup strictly on unmount
    return () => {
      if (scannerRef.current) {
        if (isScanningRef.current) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          }).catch(() => {});
        } else {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1 || !activeCameraId) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex].id;
    
    setActiveCameraId(nextCamera);
    localStorage.setItem('preferred_camera', nextCamera);
    await startScanner(nextCamera);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const newState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newState } as any]
      });
      setTorchOn(newState);
    } catch (err) {
      console.error("Torch toggle failed", err);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!scannedBooking || checkInQuantity <= 0) return;
    
    try {
      setLoading(true);
      const res = await fetch('/api/admin/bookings/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId: scannedBooking.bookingId, 
          checkInQuantity 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success(data.message);
      setScannedBooking(null);
      setErrorMsg('');
      
      // Resume scanning after check-in
      if (scannerRef.current?.isScanning) scannerRef.current.resume();
      
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setScannedBooking(null);
    setErrorMsg('');
    if (scannerRef.current?.isScanning) scannerRef.current.resume();
  };

  return (
    <div className="relative w-full h-[75vh] min-h-[500px] bg-[#0e0e0e] rounded-xl brutalist-border overflow-hidden flex flex-col">
      
      {permissionError ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-red-400 bg-black">
          <span className="material-symbols-outlined text-5xl mb-4 text-red-500">videocam_off</span>
          <h3 className="font-headline-md text-xl font-bold uppercase tracking-wide text-white mb-2">Camera Blocked</h3>
          <p className="text-on-surface/70 text-sm mb-4">
            Your browser has blocked camera access for this site.
          </p>
          <div className="bg-[#1c1b1b] border border-white/10 p-3 rounded text-left text-sm text-on-surface/80 w-full max-w-xs">
            <strong className="block text-white mb-1">How to fix it:</strong>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Click the <b>Padlock icon</b> in your browser address bar.</li>
              <li>Go to <b>Site Settings</b>.</li>
              <li>Change <b>Camera</b> to <b>Allow</b>.</li>
              <li>Refresh this page.</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded font-bold uppercase tracking-wider transition-colors"
          >
            I fixed it, Refresh
          </button>
        </div>
      ) : (
        <div className="relative flex-1 bg-black overflow-hidden">
          {/* Video Container */}
          <div id="qr-reader" className="w-full h-full object-cover"></div>

          {/* Modern Scanning Mask Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
             {/* Dark outer mask achieved using enormous box-shadow on the cutout window */}
            <div className="scan-window relative w-[70%] aspect-square rounded-2xl border border-white/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]">
              {/* Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-primary-container rounded-tl-2xl"></div>
              <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-primary-container rounded-tr-2xl"></div>
              <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-primary-container rounded-bl-2xl"></div>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-primary-container rounded-br-2xl"></div>
              
              {/* Animated Scan Line */}
              <div className="absolute w-full h-[2px] bg-primary-container shadow-[0_0_15px_3px_rgba(255,107,26,0.6)] animate-scan-line"></div>
            </div>
          </div>

          {/* Floating Action Buttons */}
          <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center items-center gap-6 pointer-events-auto">
            {cameras.length > 1 && (
              <button 
                onClick={handleSwitchCamera} 
                className="w-14 h-14 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"
                aria-label="Switch Camera"
              >
                <span className="material-symbols-outlined text-2xl">flip_camera_ios</span>
              </button>
            )}
            
            {torchSupported && (
              <button 
                onClick={toggleTorch} 
                className={`w-14 h-14 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center transition-all active:scale-95 ${torchOn ? 'bg-primary-container text-black' : 'bg-black/60 text-white'}`}
                aria-label="Toggle Flashlight"
              >
                <span className="material-symbols-outlined text-2xl">{torchOn ? 'flashlight_off' : 'flashlight_on'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && !scannedBooking && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error Overlay (Auto-dismisses) */}
      {errorMsg && !scannedBooking && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-900/95 text-white p-6 text-center animate-enter">
          <span className="material-symbols-outlined text-6xl mb-4 text-red-300">error</span>
          <h3 className="font-headline-md text-2xl font-bold uppercase tracking-wide mb-2">Scan Failed</h3>
          <p className="font-body-md text-lg text-red-200">{errorMsg}</p>
        </div>
      )}

      {/* Detail Overlay (Manual Check-In) */}
      {scannedBooking && (
        <div className="absolute inset-0 z-40 bg-[#0e0e0e] flex flex-col animate-enter">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="font-label-caps text-on-surface/50 text-[10px] uppercase tracking-widest block mb-1">Scanned Ticket</span>
                <h3 className="font-headline-md text-2xl font-bold uppercase text-primary-container">{scannedBooking.fullName}</h3>
                <p className="text-on-surface/70 text-sm mt-1">{scannedBooking.email}</p>
              </div>
              <button onClick={handleCancel} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center active:scale-95 transition-transform">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-[#1c1b1b] brutalist-border rounded-xl p-4 mb-6">
              <div className="flex justify-between mb-3">
                <span className="text-on-surface/60 text-sm font-label-caps uppercase">Total Seats Booked</span>
                <span className="font-bold text-lg">{scannedBooking.numberOfTickets}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-on-surface/60 text-sm font-label-caps uppercase">Already Checked In</span>
                <span className="font-bold text-lg text-green-400">{scannedBooking.checkedInCount}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 mt-1">
                <span className="text-on-surface/60 text-sm font-label-caps uppercase">Seats Remaining</span>
                <span className="font-bold text-lg text-primary-container">{scannedBooking.numberOfTickets - scannedBooking.checkedInCount}</span>
              </div>
            </div>

            {scannedBooking.numberOfTickets - scannedBooking.checkedInCount > 0 ? (
              <div className="flex flex-col items-center gap-4 mt-8">
                <span className="text-on-surface/70 text-sm uppercase tracking-widest font-bold">Select Check-In Quantity</span>
                <div className="flex items-center gap-6 bg-[#1c1b1b] p-2 rounded-full brutalist-border">
                  <button 
                    className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
                    onClick={() => setCheckInQuantity(Math.max(1, checkInQuantity - 1))}
                  >
                    <span className="material-symbols-outlined text-2xl">remove</span>
                  </button>
                  <span className="font-headline-md text-4xl font-bold w-12 text-center">{checkInQuantity}</span>
                  <button 
                    className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
                    onClick={() => setCheckInQuantity(Math.min(scannedBooking.numberOfTickets - scannedBooking.checkedInCount, checkInQuantity + 1))}
                  >
                    <span className="material-symbols-outlined text-2xl">add</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-4 rounded-xl text-center uppercase tracking-wider font-bold mt-8">
                Ticket Fully Used
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/5 bg-[#131313]">
            <button 
              onClick={handleConfirmCheckIn}
              disabled={checkInQuantity <= 0}
              className={`w-full h-16 rounded-xl flex items-center justify-center gap-3 uppercase tracking-wider font-bold transition-all text-lg ${
                checkInQuantity > 0 ? 'bg-primary-container text-black hover:scale-[1.02] active:scale-[0.98]' : 'bg-white/10 text-on-surface/40 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined">how_to_reg</span>
              {checkInQuantity > 0 ? `Confirm Check-In (${checkInQuantity})` : 'No Seats Remaining'}
            </button>
          </div>
        </div>
      )}

      {/* Global CSS Overrides */}
      <style>{`
        #qr-reader {
          border: none !important;
        }
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        @keyframes scan-line-anim {
          0% { top: 5%; opacity: 0; }
          10% { opacity: 1; }
          50% { top: 95%; }
          90% { opacity: 1; }
          100% { top: 5%; opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line-anim 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
