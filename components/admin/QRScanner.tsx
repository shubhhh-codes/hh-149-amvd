/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */
import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
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
  const [scannerReady, setScannerReady] = useState(false);

  // Use refs for the callback to avoid re-initializing the scanner
  const loadingRef = React.useRef(loading);
  const scannedBookingRef = React.useRef(scannedBooking);

  useEffect(() => {
    loadingRef.current = loading;
    scannedBookingRef.current = scannedBooking;
  }, [loading, scannedBooking]);

  useEffect(() => {
    // Initialize Scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      async (decodedText) => {
        // Pauses scanning implicitly while we process
        if (loadingRef.current || scannedBookingRef.current) return;
        
        try {
          setLoading(true);
          setErrorMsg('');
          
          const res = await fetch('/api/admin/bookings/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrData: decodedText })
          });
          
          const data = await res.json();
          
          if (!res.ok) {
            setErrorMsg(data.message || 'Invalid Ticket');
            // Auto clear error after 3s so they can scan next
            setTimeout(() => { setErrorMsg(''); }, 3000);
            return;
          }
          
          const remaining = data.numberOfTickets - (data.checkedInCount || 0);
          
          setScannedBooking(data);
          setCheckInQuantity(remaining > 0 ? remaining : 0);
          
          if (remaining <= 0) {
            setErrorMsg('Ticket Fully Used (0 Seats Remaining)');
          }

        } catch (err: any) {
          setErrorMsg('Failed to process QR code');
          setTimeout(() => { setErrorMsg(''); }, 3000);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        // Ignore regular scan failures (no QR code found)
      }
    );

    setScannerReady(true);

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []); // Run once on mount

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
      
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setScannedBooking(null);
    setErrorMsg('');
  };

  return (
    <div className="relative w-full max-w-lg mx-auto bg-[#131313] rounded-xl brutalist-border overflow-hidden">
      
      {/* Scanner Viewport */}
      <div id="qr-reader" className="w-full bg-black min-h-[300px]"></div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error Overlay */}
      {errorMsg && !scannedBooking && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-900/90 text-white p-6 text-center animate-enter">
          <span className="material-symbols-outlined text-6xl mb-4 text-red-300">error</span>
          <h3 className="font-headline-md text-2xl font-bold uppercase tracking-wide mb-2">Scan Failed</h3>
          <p className="font-body-md text-lg text-red-200">{errorMsg}</p>
        </div>
      )}

      {/* Detail Overlay */}
      {scannedBooking && (
        <div className="absolute inset-0 z-10 bg-[#0e0e0e] flex flex-col">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="font-label-caps text-on-surface/50 text-[10px] uppercase tracking-widest block mb-1">Scanned Ticket</span>
                <h3 className="font-headline-md text-2xl font-bold uppercase text-primary-container">{scannedBooking.fullName}</h3>
                <p className="text-on-surface/70 text-sm mt-1">{scannedBooking.email}</p>
              </div>
              <button onClick={handleCancel} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-[#1c1b1b] brutalist-border rounded p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-on-surface/60 text-sm font-label-caps uppercase">Total Seats Booked</span>
                <span className="font-bold">{scannedBooking.numberOfTickets}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-on-surface/60 text-sm font-label-caps uppercase">Already Checked In</span>
                <span className="font-bold text-green-400">{scannedBooking.checkedInCount}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                <span className="text-on-surface/60 text-sm font-label-caps uppercase">Seats Remaining</span>
                <span className="font-bold text-primary-container">{scannedBooking.numberOfTickets - scannedBooking.checkedInCount}</span>
              </div>
            </div>

            {scannedBooking.numberOfTickets - scannedBooking.checkedInCount > 0 ? (
              <div className="flex flex-col items-center gap-4">
                <span className="text-on-surface/70 text-sm uppercase tracking-widest font-bold">Select Check-In Quantity</span>
                <div className="flex items-center gap-6 bg-[#1c1b1b] p-2 rounded-full brutalist-border">
                  <button 
                    className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
                    onClick={() => setCheckInQuantity(Math.max(1, checkInQuantity - 1))}
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <span className="font-headline-md text-3xl font-bold w-8 text-center">{checkInQuantity}</span>
                  <button 
                    className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
                    onClick={() => setCheckInQuantity(Math.min(scannedBooking.numberOfTickets - scannedBooking.checkedInCount, checkInQuantity + 1))}
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-4 rounded text-center uppercase tracking-wider font-bold">
                Ticket Fully Used
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/5 bg-[#131313]">
            <button 
              onClick={handleConfirmCheckIn}
              disabled={checkInQuantity <= 0}
              className={`w-full h-14 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider font-bold transition-all ${
                checkInQuantity > 0 ? 'bg-primary-container text-black hover:scale-[1.02] active:scale-[0.98]' : 'bg-white/10 text-on-surface/40 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined">how_to_reg</span>
              {checkInQuantity > 0 ? `Confirm Check-In (${checkInQuantity})` : 'No Seats Remaining'}
            </button>
          </div>
        </div>
      )}

      {/* Global CSS overrides for the html5-qrcode library UI */}
      <style>{`
        #qr-reader {
          border: none !important;
        }
        #qr-reader__dashboard_section_csr span {
          color: white !important;
        }
        #qr-reader__dashboard_section_swaplink {
          color: #FF6B1A !important;
          text-decoration: none !important;
          font-weight: bold;
        }
        #qr-reader button {
          background-color: #353534 !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          padding: 8px 16px !important;
          border-radius: 8px !important;
          font-weight: bold !important;
          cursor: pointer;
        }
        #qr-reader button:hover {
          background-color: #FF6B1A !important;
          color: black !important;
        }
      `}</style>
    </div>
  );
}
