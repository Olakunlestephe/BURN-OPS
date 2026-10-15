import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, X, Check, Flashlight, RefreshCw, Volume2, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScannedSerials: (serials: string[]) => void;
  initialSerials?: string[];
  title?: string;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScannedSerials,
  initialSerials = [],
  title = 'Barcode & Serial Scanner',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [scannedList, setScannedList] = useState<string[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualInput, setManualInput] = useState('');

  // Sync initial serials
  useEffect(() => {
    if (isOpen) {
      setScannedList(initialSerials);
      setCameraError(null);
      setLastScanned(null);
    }
  }, [isOpen, initialSerials]);

  const handleBarcodeDetected = useCallback((text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;

    setScannedList((prev) => {
      if (prev.includes(cleaned)) {
        // Already seen, just give quick subtle feedback without duplicating
        sound.playBeep(900, 0.05);
        return prev;
      }
      sound.playScan();
      setLastScanned(cleaned);
      return [cleaned, ...prev];
    });
  }, []);

  // Initialize ZXing Camera Scanner
  useEffect(() => {
    if (!isOpen) {
      if (readerRef.current) {
        try {
          readerRef.current.reset();
        } catch {}
        readerRef.current = null;
      }
      return;
    }

    let isMounted = true;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const startScanner = async () => {
      try {
        setCameraError(null);
        const videoInputDevices = await reader.listVideoInputDevices();

        if (videoInputDevices.length === 0) {
          if (isMounted) setCameraError('No video camera devices detected.');
          return;
        }

        // Choose camera matching facingMode preference
        const selectedDevice =
          videoInputDevices.find((d) =>
            facingMode === 'environment'
              ? /back|rear|environment/i.test(d.label)
              : /front|user/i.test(d.label)
          ) || videoInputDevices[0];

        if (!videoRef.current || !isMounted) return;

        reader.decodeFromVideoDevice(
          selectedDevice.deviceId,
          videoRef.current,
          (result, error) => {
            if (!isMounted) return;
            if (result) {
              handleBarcodeDetected(result.getText());
            }
          }
        );

        // Check torch capabilities
        setTimeout(() => {
          try {
            if (videoRef.current && videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              const track = stream.getVideoTracks()[0];
              const capabilities = (track.getCapabilities?.() || {}) as { torch?: boolean };
              if (capabilities && capabilities.torch) {
                setHasTorch(true);
              }
            }
          } catch {}
        }, 500);
      } catch (err) {
        console.warn('Camera access issue:', err);
        if (isMounted) {
          setCameraError(
            'Camera access was blocked or is unavailable. You can use manual entry or upload a file.'
          );
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      try {
        reader.reset();
      } catch {}
      readerRef.current = null;
    };
  }, [isOpen, facingMode, handleBarcodeDetected]);

  // Toggle torch
  const toggleTorch = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as MediaTrackConstraintSet],
        });
        setTorchOn(nextState);
      }
    } catch (e) {
      console.warn('Torch failed:', e);
    }
  };

  const addManualSerial = () => {
    const val = manualInput.trim();
    if (!val) return;
    if (!scannedList.includes(val)) {
      setScannedList((prev) => [val, ...prev]);
      sound.playScan();
      setLastScanned(val);
    }
    setManualInput('');
  };

  const removeSerial = (s: string) => {
    setScannedList((prev) => prev.filter((item) => item !== s));
  };

  const handleFinish = () => {
    onScannedSerials(scannedList);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950/95 text-stone-100 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-900/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-600/20 text-orange-500">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white tracking-tight">{title}</h3>
            <p className="text-xs text-stone-400">Aim camera at Burn serial barcode or QR</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          title="Close scanner"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Viewfinder Area */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        {cameraError ? (
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/60 text-red-400 flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-lg text-stone-200">Camera Unavailable</h4>
            <p className="text-xs text-stone-400">{cameraError}</p>
            <div className="pt-2">
              <p className="text-xs text-orange-400 font-medium mb-3">
                Quick entry fallback: Enter or paste serial numbers below:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. ECO-254-1050"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addManualSerial()}
                  className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-orange-500 font-mono"
                />
                <button
                  onClick={addManualSerial}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-md aspect-3/4 sm:aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border border-stone-800">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="relative w-64 h-48 sm:w-72 sm:h-56 rounded-2xl border-2 border-orange-500/80 bg-orange-500/5 shadow-[0_0_50px_rgba(232,89,12,0.2)]">
                {/* Corner Accents */}
                <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-orange-500 rounded-tl-lg" />
                <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-orange-500 rounded-tr-lg" />
                <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-orange-500 rounded-bl-lg" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-orange-500 rounded-br-lg" />

                {/* Laser scan animation line */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_12px_#ff7a2e]" />
              </div>
            </div>

            {/* In-viewfinder Flash/Switch controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2.5 rounded-full backdrop-blur-md transition ${
                    torchOn ? 'bg-orange-500 text-stone-950 font-bold' : 'bg-black/60 text-white hover:bg-black/80'
                  }`}
                  title="Toggle Flashlight"
                >
                  <Flashlight className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
                className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition"
                title="Flip Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Last Scanned Instant Notification Overlay */}
            {lastScanned && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center">
                <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/90 text-white text-xs font-mono font-medium shadow-lg flex items-center gap-2 animate-in zoom-in-95 duration-150">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Captured: {lastScanned}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Manual Entry Bar below camera */}
        <div className="w-full max-w-md mt-3 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type serial or test barcode..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addManualSerial()}
            className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-orange-500 font-mono"
          />
          <button
            type="button"
            onClick={addManualSerial}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold tracking-wide transition"
          >
            Add
          </button>
        </div>
      </div>

      {/* Bottom Tray with Scanned Badges & Finish Button */}
      <div className="border-t border-stone-800 bg-stone-900/95 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
              Scanned Serials
            </span>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs">
              {scannedList.length} items
            </span>
          </div>
          {scannedList.length > 0 && (
            <button
              type="button"
              onClick={() => setScannedList([])}
              className="text-xs text-stone-400 hover:text-red-400 transition"
            >
              Clear list
            </button>
          )}
        </div>

        {/* Horizontal Chips of Scanned Items */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-h-24 scrollbar-thin">
          {scannedList.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-2">
              No serials scanned yet. Point scanner at barcode or type above.
            </p>
          ) : (
            scannedList.map((serial) => (
              <span
                key={serial}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-800 border border-stone-700/80 text-xs font-mono text-stone-200 whitespace-nowrap group"
              >
                <span>{serial}</span>
                <button
                  type="button"
                  onClick={() => removeSerial(serial)}
                  className="text-stone-400 hover:text-red-400 transition ml-0.5"
                  title="Remove serial"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleFinish}
          className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-orange-950/40 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Apply {scannedList.length} Serials</span>
        </button>
      </div>
    </div>
  );
};
