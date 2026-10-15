import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import {
  Camera,
  X,
  Flashlight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight,
  Flame,
  Search,
  Scan,
  MapPin,
  ClipboardCheck,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { useBurnOps } from '../context/BurnOpsContext';

interface BarcodeIdentifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem?: (serialOrCode: string) => void;
}

export interface IdentificationResult {
  code: string;
  type: 'serial' | 'non-serial' | 'unknown';
  title: string;
  subtitle: string;
  status: 'in-stock' | 'out' | 'counted' | 'unknown' | 'non-serial';
  statusLabel: string;
  warehouseDetails: {
    warehouseName: string;
    warehouseId: string;
    detail: string;
  }[];
  rawRecord?: {
    sku: string;
    date?: string;
    user?: string;
  };
}

export const BarcodeIdentifierModal: React.FC<BarcodeIdentifierModalProps> = ({
  isOpen,
  onClose,
  onSelectItem,
}) => {
  const {
    state,
    visibleWarehouses,
    getExpectedStock,
    getAuditData,
    setWarehouse,
    setKind,
    setAct,
    addCountedSerials,
    showToast,
  } = useBurnOps();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [identifiedItem, setIdentifiedItem] = useState<IdentificationResult | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isContinuous, setIsContinuous] = useState(false);

  // Perform lookup across Burn Ops database for any scanned barcode/QR
  const identifyBarcode = useCallback(
    (codeStr: string): IdentificationResult => {
      const code = codeStr.trim();
      const codeUpper = code.toUpperCase();

      // 1. Check if matches non-serial item code or name
      const nsMatch = state.ns.find(
        (item) =>
          item.c.toUpperCase() === codeUpper ||
          item.n.toUpperCase() === codeUpper
      );

      if (nsMatch) {
        const warehouseDetails = state.wh.map((w) => {
          const qty = nsMatch.q[w.id] || 0;
          return {
            warehouseName: w.n,
            warehouseId: w.id,
            detail: `${qty} units in stock ${qty <= (nsMatch.min ?? 20) ? '(Low stock buffer)' : ''}`,
          };
        });

        return {
          code,
          type: 'non-serial',
          title: nsMatch.n,
          subtitle: `SKU: ${nsMatch.c} • Non-serial consumable item`,
          status: 'non-serial',
          statusLabel: 'Consumable Item',
          warehouseDetails,
        };
      }

      // 2. Check if matches serial cookstove across warehouses
      const matches: {
        warehouseName: string;
        warehouseId: string;
        detail: string;
        status: 'in-stock' | 'out' | 'counted' | 'unknown';
        statusLabel: string;
        sku: string;
        date?: string;
        user?: string;
      }[] = [];

      state.wh.forEach((w) => {
        const d = state.d[w.id];
        if (!d) return;
        const ex = getExpectedStock(w.id);

        const openMatch = d.opening.find((x) => x[0] === code);
        const recvMatch = d.received.find((x) => x[0] === code);
        const outMatch = d.out.find((x) => x[0] === code);
        const countMatch = d.counted.find((x) => x[0] === code);

        const hit = openMatch || recvMatch || outMatch || countMatch;
        if (hit) {
          let st: 'in-stock' | 'out' | 'counted' | 'unknown' = 'in-stock';
          let stLabel = 'In Stock';

          if (outMatch) {
            st = 'out';
            stLabel = 'Scanned Out (Dispatched / Sold)';
          } else if (ex.has(code)) {
            if (countMatch) {
              st = 'counted';
              stLabel = 'In Stock (Audit Count Verified)';
            } else {
              st = 'in-stock';
              stLabel = 'In Stock (Active Balance)';
            }
          } else if (countMatch) {
            st = 'unknown';
            stLabel = 'Counted on Floor (Book Discrepancy)';
          }

          matches.push({
            warehouseName: w.n,
            warehouseId: w.id,
            detail: stLabel,
            status: st,
            statusLabel: stLabel,
            sku: hit[1],
            date: hit[2] ? new Date(hit[2]).toLocaleDateString() : undefined,
            user: hit[3],
          });
        }
      });

      if (matches.length > 0) {
        const primary = matches[0];
        return {
          code,
          type: 'serial',
          title: `${primary.sku} Cookstove`,
          subtitle: `Unique Serial: ${code}`,
          status: primary.status,
          statusLabel: primary.statusLabel,
          warehouseDetails: matches.map((m) => ({
            warehouseName: m.warehouseName,
            warehouseId: m.warehouseId,
            detail: m.detail,
          })),
          rawRecord: {
            sku: primary.sku,
            date: primary.date,
            user: primary.user,
          },
        };
      }

      // 3. Unknown barcode (not currently registered in system)
      return {
        code,
        type: 'unknown',
        title: 'Unregistered Barcode / Serial',
        subtitle: `Scanned code: ${code}`,
        status: 'unknown',
        statusLabel: 'Not Found in System',
        warehouseDetails: [],
      };
    },
    [state.ns, state.wh, state.d, getExpectedStock]
  );

  const handleBarcodeCaptured = useCallback(
    (text: string) => {
      const cleaned = text.trim();
      if (!cleaned) return;

      // Don't re-trigger if already showing the exact same item
      if (identifiedItem && identifiedItem.code === cleaned) {
        return;
      }

      sound.playScan();
      const result = identifyBarcode(cleaned);
      setIdentifiedItem(result);
    },
    [identifiedItem, identifyBarcode]
  );

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

    const startCamera = async () => {
      try {
        setCameraError(null);
        const devices = await reader.listVideoInputDevices();

        if (devices.length === 0) {
          if (isMounted) setCameraError('No video camera devices found.');
          return;
        }

        const chosenDevice =
          devices.find((d) =>
            facingMode === 'environment'
              ? /back|rear|environment/i.test(d.label)
              : /front|user/i.test(d.label)
          ) || devices[0];

        if (!videoRef.current || !isMounted) return;

        reader.decodeFromVideoDevice(
          chosenDevice.deviceId,
          videoRef.current,
          (result) => {
            if (!isMounted) return;
            if (result) {
              handleBarcodeCaptured(result.getText());
            }
          }
        );

        // Check torch capabilities
        setTimeout(() => {
          try {
            if (videoRef.current && videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              const track = stream.getVideoTracks()[0];
              const caps = (track.getCapabilities?.() || {}) as { torch?: boolean };
              if (caps && caps.torch) {
                setHasTorch(true);
              }
            }
          } catch {}
        }, 500);
      } catch (err) {
        console.warn('Camera failed:', err);
        if (isMounted) {
          setCameraError(
            'Camera access was denied or is unavailable. You can use manual entry or click sample barcodes below.'
          );
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      try {
        reader.reset();
      } catch {}
      readerRef.current = null;
    };
  }, [isOpen, facingMode, handleBarcodeCaptured]);

  // Flashlight toggle
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

  const handleManualLookup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualInput.trim()) return;
    handleBarcodeCaptured(manualInput.trim());
    setManualInput('');
  };

  const handleQuickAction = (action: 'scanout' | 'count' | 'view') => {
    if (!identifiedItem) return;

    if (action === 'view') {
      if (onSelectItem) onSelectItem(identifiedItem.code);
      onClose();
      return;
    }

    if (action === 'count') {
      const targetWhId = identifiedItem.warehouseDetails[0]?.warehouseId || state.sel || 'w1';
      addCountedSerials(targetWhId, identifiedItem.code);
      showToast(`Added ${identifiedItem.code} to physical audit count at ${state.wh.find(w => w.id === targetWhId)?.n || targetWhId}`);
      if (onSelectItem) onSelectItem(identifiedItem.code);
      onClose();
      return;
    }

    if (action === 'scanout') {
      const targetWhId = identifiedItem.warehouseDetails[0]?.warehouseId || state.sel || 'w1';
      setWarehouse(targetWhId);
      setKind('ser');
      setAct('out');
      showToast(`Initiating Scan Out for ${identifiedItem.code}`);
      if (onSelectItem) onSelectItem(identifiedItem.code);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Sample quick barcodes for zero-friction browser testing
  const sampleBarcodes = [
    { code: 'ECO-254-1001', label: 'ECO-254-1001 (In Stock)' },
    { code: 'ECO-254-1002', label: 'ECO-254-1002 (Scanned Out)' },
    { code: 'PRO-254-2013', label: 'PRO-254-2013 (Received)' },
    { code: 'PELLET-10', label: 'PELLET-10 (Non-Serial)' },
    { code: 'UNKNOWN-BS-999', label: 'UNKNOWN-BS-999' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950/95 text-stone-100 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-900/90">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-600/20 text-[#E8590C]">
            <Scan className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
              <span>Inventory Barcode Scanner</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-600/30 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                Live Camera API
              </span>
            </h3>
            <p className="text-xs text-stone-400">
              Aim camera at any Cookstove serial barcode or consumable SKU to identify
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
          title="Close scanner"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Viewfinder Column */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-4 bg-stone-950 overflow-hidden">
          {cameraError ? (
            <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-950/60 text-red-400 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-base text-stone-200">Camera Device Stream Offline</h4>
              <p className="text-xs text-stone-400">{cameraError}</p>
            </div>
          ) : (
            <div className="relative w-full max-w-sm sm:max-w-md aspect-3/4 sm:aspect-4/3 bg-black rounded-3xl overflow-hidden shadow-2xl border border-stone-800">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {/* Viewfinder Reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="relative w-56 h-44 sm:w-64 sm:h-52 rounded-2xl border-2 border-orange-500/80 bg-orange-500/5 shadow-[0_0_60px_rgba(232,89,12,0.25)]">
                  {/* Glowing corners */}
                  <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-orange-500 rounded-tl-lg" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-orange-500 rounded-tr-lg" />
                  <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-orange-500 rounded-bl-lg" />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-orange-500 rounded-br-lg" />

                  {/* Red/Orange Laser scan beam */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-[pulse_1.2s_ease-in-out_infinite] shadow-[0_0_15px_#ff7a2e]" />
                </div>
              </div>

              {/* Viewfinder Overlay Buttons */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2.5 rounded-full backdrop-blur-md transition ${
                      torchOn
                        ? 'bg-orange-500 text-stone-950 font-bold'
                        : 'bg-black/60 text-white hover:bg-black/80'
                    }`}
                    title="Toggle Flashlight"
                  >
                    <Flashlight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))
                  }
                  className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition"
                  title="Switch Camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Scanning status pill */}
              <div className="absolute bottom-4 inset-x-0 flex justify-center">
                <span className="px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-medium text-orange-200 border border-orange-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                  <span>Position barcode within frame</span>
                </span>
              </div>
            </div>
          )}

          {/* Quick barcode simulation chips */}
          <div className="w-full max-w-md mt-3 pt-2">
            <span className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider block mb-1.5">
              Quick Test Sample Barcodes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleBarcodes.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => handleBarcodeCaptured(s.code)}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-[11px] font-mono text-stone-300 hover:text-white transition cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Identification Result Sidebar / Card */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-stone-800 bg-stone-900/95 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
          {identifiedItem ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Item Identified
                </span>
                <button
                  type="button"
                  onClick={() => setIdentifiedItem(null)}
                  className="text-xs text-stone-400 hover:text-stone-200 underline"
                >
                  Clear / Scan Another
                </button>
              </div>

              {/* Title & Type */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      identifiedItem.status === 'in-stock' || identifiedItem.status === 'counted'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : identifiedItem.status === 'out'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : identifiedItem.status === 'non-serial'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {identifiedItem.statusLabel}
                  </span>
                </div>

                <h4 className="text-xl font-bold font-heading text-white">
                  {identifiedItem.title}
                </h4>
                <p className="text-xs text-stone-400 font-mono">{identifiedItem.subtitle}</p>
              </div>

              {/* Warehouse Locations Breakdown */}
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                  Depot Inventory Status
                </span>

                {identifiedItem.warehouseDetails.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">
                    This barcode is not linked to any active warehouse record.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {identifiedItem.warehouseDetails.map((w, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 border-b border-stone-900 last:border-0"
                      >
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="font-semibold text-stone-200">{w.warehouseName}</span>
                        </div>
                        <span className="text-stone-300 font-medium">{w.detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Provenance Details */}
              {identifiedItem.rawRecord && (
                <div className="text-xs text-stone-400 space-y-1 bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                  <div>
                    SKU Category: <strong className="text-stone-200">{identifiedItem.rawRecord.sku}</strong>
                  </div>
                  {identifiedItem.rawRecord.date && (
                    <div>
                      Recorded Date: <strong className="text-stone-200">{identifiedItem.rawRecord.date}</strong>
                    </div>
                  )}
                  {identifiedItem.rawRecord.user && (
                    <div>
                      Handled By: <strong className="text-stone-200">{identifiedItem.rawRecord.user}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Fast Action Buttons */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                  Quick Actions for this Item
                </span>

                {identifiedItem.type === 'serial' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleQuickAction('count')}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Verify / Record in Physical Audit Count</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickAction('scanout')}
                      className="w-full py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Initiate Outbound Scan Out</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => handleQuickAction('view')}
                  className="w-full py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-orange-400" />
                  <span>Inspect in Stock Tab</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-3 text-stone-400">
              <div className="w-14 h-14 rounded-2xl bg-stone-800/80 border border-stone-700 flex items-center justify-center text-orange-500 shadow-inner">
                <Scan className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-base text-stone-200 font-heading">
                Ready to Identify
              </h4>
              <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
                Scan any Burn Cookstove serial barcode (Code 128, EAN-13, QR Code) or consumable SKU label. Item particulars, live depot balances, and instant action buttons will appear here.
              </p>
            </div>
          )}

          {/* Manual barcode input bar at bottom of sidebar */}
          <form onSubmit={handleManualLookup} className="mt-4 pt-3 border-t border-stone-800 flex gap-2">
            <input
              type="text"
              placeholder="Or type barcode number..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-stone-200 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition"
            >
              Check
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
