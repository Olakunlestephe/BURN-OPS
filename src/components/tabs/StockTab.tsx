import React, { useState } from 'react';
import { useBurnOps } from '../../context/BurnOpsContext';
import {
  Search,
  Scan,
  Upload,
  ArrowLeft,
  Lock,
  Unlock,
  CheckCircle2,
  Package,
  Layers,
  Flame,
  Plus,
  Trash2,
  Camera,
  Sparkles,
  Bell,
  AlertTriangle,
  AlertOctagon,
  Sliders,
  FileSpreadsheet,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  RotateCw,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';
import { ACT_META } from '../../types';
import { CameraScannerModal } from '../CameraScannerModal';
import { BarcodeIdentifierModal } from '../BarcodeIdentifierModal';
import { ThresholdEditModal } from '../ThresholdEditModal';

export const StockTab: React.FC = () => {
  const {
    state,
    visibleWarehouses,
    currentWarehouseId,
    currentWarehouse,
    setWarehouse,
    setKind,
    setAct,
    setTab,
    getExpectedStock,
    saveSerials,
    saveNonSerial,
    unlockOpening,
    removeOpeningSerial,
    isAp,
    can,
    findSerialInfo,
    showToast,
    updateItemMinThreshold,
    exportAuditReportExcel,
    exportAuditReportCSV,
  } = useBurnOps();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    ReturnType<typeof findSerialInfo> | null
  >(null);

  // Form states
  const [skuInput, setSkuInput] = useState('');
  const [serialsText, setSerialsText] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isIdentifyModalOpen, setIsIdentifyModalOpen] = useState(false);
  const [removeSerialInput, setRemoveSerialInput] = useState('');

  // Threshold modal & automated notifications state
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [thresholdTargetItem, setThresholdTargetItem] = useState<{
    code: string;
    name: string;
    min: number;
    currentQty: number;
    warehouseName: string;
  } | null>(null);
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState(false);
  const [reportScope, setReportScope] = useState<'current' | 'all'>('current');

  // Non-serial form states
  const [nsItemKey, setNsItemKey] = useState<string>(state.ns[0]?.c || '');
  const [nsQuantity, setNsQuantity] = useState<number>(10);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  const currentData = currentWarehouseId
    ? state.d[currentWarehouseId] || {
        opening: [],
        received: [],
        out: [],
        counted: [],
        locked: false,
      }
    : null;

  const currentExpected = currentWarehouseId ? getExpectedStock(currentWarehouseId) : new Map();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const res = findSerialInfo(searchQuery.trim());
    setSearchResults(res);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setSerialsText((prev) => (prev ? prev + '\n' + content : content));
      showToast(`Loaded serials from ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveSerials = () => {
    if (!currentWarehouseId || !state.act) return;
    const success = saveSerials(currentWarehouseId, state.act, serialsText, skuInput);
    if (success) {
      setSerialsText('');
      setSkuInput('');
    }
  };

  const handleSaveNonSerial = () => {
    if (!currentWarehouseId || !state.act) return;
    const success = saveNonSerial(
      currentWarehouseId,
      state.act,
      nsItemKey,
      nsQuantity,
      newCode,
      newName
    );
    if (success) {
      setNsQuantity(10);
      setNewCode('');
      setNewName('');
    }
  };

  if (!currentWarehouse) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center text-stone-500">
        No active warehouse assigned to your account. Contact an administrator.
      </div>
    );
  }

  // Sub-view: Kind not chosen yet (landing)
  if (!state.kind) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        {/* Header with Warehouse Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
          <div>
            <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100 tracking-tight">
              Warehouse Stock Management
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Manage Cookstove serial lifecycles, non-serial inventory, and rapid serial search
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-stone-500">Warehouse:</label>
            <select
              value={currentWarehouseId}
              onChange={(e) => setWarehouse(e.target.value)}
              className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 dark:text-stone-100"
            >
              {visibleWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.n} ({w.reg})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rapid Camera Barcode Identification Banner */}
        <div className="bg-gradient-to-r from-orange-600 via-[#E8590C] to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-xs">
                <Scan className="w-5 h-5 text-white" />
              </span>
              <h3 className="font-bold text-base font-heading tracking-tight text-white flex items-center gap-2">
                <span>Quick Barcode Scanner Utility</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-black/25 text-orange-200 px-2 py-0.5 rounded-full border border-white/20">
                  Device Camera API
                </span>
              </h3>
            </div>
            <p className="text-xs text-orange-100 max-w-xl">
              Use your device camera to instantly scan Cookstove serial barcodes (Code 128 / QR) or consumable SKUs. Real-time depot location, inventory status, and instant action options.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsIdentifyModalOpen(true)}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-white hover:bg-orange-50 text-[#E8590C] font-bold text-xs tracking-wide shadow-md transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Camera className="w-4 h-4 text-[#E8590C]" />
            <span>Scan with Device Camera</span>
          </button>
        </div>

        {/* Rapid Serial Search Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#E8590C]" />
              <h3 className="font-bold text-sm font-heading text-stone-900 dark:text-stone-100">
                Find Any Cookstove Serial
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsIdentifyModalOpen(true)}
              className="text-xs text-[#E8590C] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Scan</span>
            </button>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="e.g. ECO-254-1001 or PRO-254-2012"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl pl-3.5 pr-10 py-2 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#E8590C]"
              />
              <button
                type="button"
                onClick={() => setIsIdentifyModalOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-stone-400 hover:text-[#E8590C] transition cursor-pointer"
                title="Scan barcode with camera"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#E8590C] hover:bg-[#d44e08] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>

          {/* Search Result Display */}
          {searchResults !== null && (
            <div className="pt-2">
              {searchResults.length === 0 ? (
                <p className="text-xs text-stone-400 italic bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
                  No record found for serial &quot;{searchQuery}&quot; in your accessible warehouses.
                </p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((res, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-orange-50/70 dark:bg-stone-800/60 border border-orange-200 dark:border-stone-700 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-stone-900 dark:text-stone-100 text-sm font-mono">
                          {searchQuery}
                        </span>
                        <div className="text-stone-600 dark:text-stone-300">
                          SKU: <strong className="font-semibold">{res.sku}</strong> &bull; Location:{' '}
                          <strong className="text-[#E8590C]">{res.warehouseName}</strong>
                        </div>
                      </div>
                      <div className="text-right sm:text-right">
                        <span className="inline-block px-2.5 py-1 rounded-full font-bold text-[11px] bg-white dark:bg-stone-900 border border-orange-200 text-stone-800 dark:text-stone-200">
                          {res.status}
                        </span>
                        {res.date && (
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Recorded: {res.date} by {res.user}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Automated Low-Stock Minimum Threshold Notification Center */}
        {(() => {
          const lowStockThresholdItems = state.ns
            .map((item) => {
              const qty = item.q[currentWarehouseId] || 0;
              const min = item.min ?? 20;
              const isLow = qty <= min;
              const isCritical = qty === 0 || qty <= Math.floor(min / 2);
              const percent = Math.min(100, Math.round((qty / (min || 1)) * 100));
              const deficit = Math.max(0, min - qty);
              return {
                ...item,
                qty,
                min,
                isLow,
                isCritical,
                percent,
                deficit,
              };
            })
            .filter((x) => x.isLow);

          // Low Cookstove SKU balances (< 5 stoves)
          const skuCounts: Record<string, number> = {};
          currentExpected.forEach((sku) => {
            skuCounts[sku] = (skuCounts[sku] || 0) + 1;
          });
          const lowCookstoves = Object.entries(skuCounts)
            .filter(([, qty]) => qty < 5)
            .map(([sku, qty]) => ({ sku, qty }));

          const totalAlerts = lowStockThresholdItems.length + lowCookstoves.length;
          const criticalCount = lowStockThresholdItems.filter((x) => x.isCritical).length;

          if (totalAlerts === 0) {
            return (
              <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 dark:text-emerald-200">
                      Safety Buffers Optimal at {currentWarehouse.n}
                    </h4>
                    <p className="text-emerald-800/80 dark:text-emerald-300/80 text-[11px]">
                      All non-serial consumables and cookstove serial balances are operating above configured minimum quantity safety thresholds.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const first = state.ns[0];
                    if (first) {
                      setThresholdTargetItem({
                        code: first.c,
                        name: first.n,
                        min: first.min ?? 20,
                        currentQty: first.q[currentWarehouseId] || 0,
                        warehouseName: currentWarehouse.n,
                      });
                      setIsThresholdModalOpen(true);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold text-xs hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Configure Thresholds</span>
                </button>
              </div>
            );
          }

          return (
            <div className="bg-red-50/80 dark:bg-red-950/25 border-2 border-red-300 dark:border-red-900/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-600 text-white shadow-xs animate-pulse">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold font-heading text-red-950 dark:text-red-200 text-base">
                        Automated Inventory Threshold Alert
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-600 text-white shadow-xs">
                        {totalAlerts} Item{totalAlerts > 1 ? 's' : ''} Breached
                      </span>
                    </div>
                    <p className="text-xs text-red-800 dark:text-red-300 mt-0.5">
                      {criticalCount > 0 ? `${criticalCount} critical shortage(s) detected • ` : ''}
                      Stock has depleted below safety minimums at <strong>{currentWarehouse.n}</strong>. Immediate replenishment recommended.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAlertsCollapsed((prev) => !prev)}
                  className="p-1.5 rounded-lg text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition cursor-pointer"
                  title="Toggle alert list"
                >
                  {isAlertsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>

              {!isAlertsCollapsed && (
                <div className="space-y-2.5 pt-1">
                  {lowStockThresholdItems.map((item) => (
                    <div
                      key={item.c}
                      className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                            {item.n}
                          </span>
                          <span className="font-mono text-stone-400 font-semibold">[{item.c}]</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.isCritical
                                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {item.qty === 0 ? 'Out of Stock' : item.isCritical ? 'Critical Shortage' : 'Low Buffer'}
                          </span>
                        </div>

                        {/* Visual stock vs minimum threshold bar */}
                        <div className="space-y-1 max-w-md">
                          <div className="flex justify-between text-[11px] text-stone-500">
                            <span>
                              Current Balance: <strong className="font-mono text-stone-800 dark:text-stone-200">{item.qty} units</strong>
                            </span>
                            <span>
                              Safety Threshold: <strong className="font-mono text-stone-800 dark:text-stone-200">{item.min} units</strong> ({item.deficit} deficit)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                item.isCritical ? 'bg-red-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Fast Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setThresholdTargetItem({
                              code: item.c,
                              name: item.n,
                              min: item.min,
                              currentQty: item.qty,
                              warehouseName: currentWarehouse.n,
                            });
                            setIsThresholdModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:border-orange-500 transition flex items-center gap-1 cursor-pointer"
                          title="Configure minimum threshold"
                        >
                          <Sliders className="w-3.5 h-3.5 text-stone-500" />
                          <span>Threshold</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setKind('ns');
                            setAct('in');
                            setNsItemKey(item.c);
                            setNsQuantity(item.deficit || 20);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Quick Restock</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {lowCookstoves.map((stove) => (
                    <div
                      key={stove.sku}
                      className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-red-200 dark:border-red-900/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          {stove.sku} Cookstoves
                        </span>
                        <span className="text-stone-500 ml-2">
                          Only <strong className="text-red-600 font-mono">{stove.qty}</strong> units remaining in active stock
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTab('dispatch')}
                        className="px-3 py-1 rounded-xl bg-orange-100 hover:bg-orange-200 text-[#E8590C] text-xs font-bold transition"
                      >
                        Request Dispatch
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Generate Audit Report (CSV and Excel .xlsx) Toolbar */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold font-heading text-stone-900 dark:text-stone-100 text-sm">
                  Generate Audit &amp; Inventory Report
                </h3>
                <p className="text-[11px] text-stone-400">
                  Export multi-tab formatted Excel spreadsheets (.xlsx) and structured CSV tables
                </p>
              </div>
            </div>

            {/* Scope selection */}
            <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setReportScope('current')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  reportScope === 'current'
                    ? 'bg-white dark:bg-stone-900 text-[#E8590C] shadow-xs font-bold'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                {currentWarehouse.n}
              </button>
              <button
                type="button"
                onClick={() => setReportScope('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  reportScope === 'all'
                    ? 'bg-white dark:bg-stone-900 text-[#E8590C] shadow-xs font-bold'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                All Depots ({visibleWarehouses.length})
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                exportAuditReportExcel(reportScope === 'current' ? currentWarehouseId : undefined)
              }
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Generate Excel Report (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                exportAuditReportCSV(reportScope === 'current' ? currentWarehouseId : undefined)
              }
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 dark:bg-stone-700 dark:hover:bg-stone-600 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-orange-400" />
              <span>Generate CSV Report (.csv)</span>
            </button>
          </div>
        </div>

        {/* Two Main Cards: Serialized vs Non-Serialized */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Serial Inventory Button Card */}
          <button
            type="button"
            onClick={() => setKind('ser')}
            className="text-left bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 hover:border-[#E8590C] dark:hover:border-[#E8590C] rounded-2xl p-6 transition group shadow-sm flex flex-col justify-between cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-[#E8590C] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Flame className="w-6 h-6 fill-[#E8590C]" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-stone-900 dark:text-stone-100 group-hover:text-[#E8590C] transition-colors">
                  Serial Inventory
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  BS-ECO-STOVE, BS-PRO-STOVE, Super Charcoal and high-value serialized products
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400">Current balance:</span>
              <span className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {currentExpected.size} units in stock
              </span>
            </div>
          </button>

          {/* Non-Serial Inventory Button Card */}
          <button
            type="button"
            onClick={() => setKind('ns')}
            className="text-left bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 hover:border-[#E8590C] dark:hover:border-[#E8590C] rounded-2xl p-6 transition group shadow-sm flex flex-col justify-between cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-stone-900 dark:text-stone-100 group-hover:text-[#E8590C] transition-colors">
                  Non-Serial Inventory
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  10kg pellet bags, stove gaskets, gas regulators, chimney flue pipes and bulk consumables
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400">Tracked items:</span>
              <span className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {state.ns.length} SKUs configured
              </span>
            </div>
          </button>
        </div>

        {/* Device Camera Barcode Identifier Modal */}
        <BarcodeIdentifierModal
          isOpen={isIdentifyModalOpen}
          onClose={() => setIsIdentifyModalOpen(false)}
          onSelectItem={(code) => {
            setSearchQuery(code);
            const results = findSerialInfo(code);
            setSearchResults(results);
          }}
        />

        {/* Minimum Quantity Safety Threshold Modal */}
        <ThresholdEditModal
          isOpen={isThresholdModalOpen}
          onClose={() => setIsThresholdModalOpen(false)}
          item={thresholdTargetItem}
        />
      </div>
    );
  }

  // Sub-view: Back button header
  const isSerial = state.kind === 'ser';
  const handleBack = () => {
    if (state.act) {
      setAct(null);
    } else {
      setKind(null);
    }
  };

  // Sub-view: In/Out/Opening/Return Action selected
  if (state.act) {
    const actInfo = ACT_META[state.act];
    const canDo = can(actInfo.perm);

    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8590C] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to actions</span>
        </button>

        <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100">
              {actInfo.title}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-[#E8590C] dark:bg-orange-950/80">
              {isSerial ? 'Serialised Stoves' : 'Consumables & Parts'}
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {actInfo.subtitle} &bull; Warehouse:{' '}
            <strong className="text-stone-700 dark:text-stone-300">{currentWarehouse.n}</strong>
          </p>
        </div>

        {!canDo && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            You do not have permission to execute &quot;{actInfo.title}&quot;. Required permission:{' '}
            <strong>{actInfo.perm}</strong>. Contact your regional manager or switch to an authorized user.
          </div>
        )}

        {/* SERIAL FORM */}
        {isSerial ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4 shadow-sm">
            {(state.act === 'opening' || state.act === 'in') && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Product SKU (select existing or type to create new)
                </label>
                <input
                  list="sku-suggestions"
                  placeholder="e.g. BS-ECO-STOVE"
                  value={skuInput}
                  onChange={(e) => setSkuInput(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#E8590C]"
                />
                <datalist id="sku-suggestions">
                  {state.skus.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Serial numbers (one per line, or &quot;SERIAL,SKU&quot;)
                </label>
                <span className="text-[11px] text-stone-400">
                  {serialsText.split('\n').filter((l) => l.trim()).length} entered
                </span>
              </div>
              <textarea
                rows={6}
                placeholder="ECO-254-1001&#10;ECO-254-1002,BS-ECO-STOVE&#10;PRO-254-2015,BS-PRO-STOVE"
                value={serialsText}
                onChange={(e) => setSerialsText(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl p-3 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#E8590C]"
              />
            </div>

            {/* Scanning and Upload Tools */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Scan className="w-4 h-4 text-[#E8590C]" />
                <span>Scan with Camera</span>
              </button>

              <label className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer">
                <Upload className="w-4 h-4 text-[#E8590C]" />
                <span>Upload CSV / TXT</span>
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {serialsText && (
                <button
                  type="button"
                  onClick={() => setSerialsText('')}
                  className="text-xs text-stone-400 hover:text-red-500 ml-auto"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={!canDo || !serialsText.trim()}
              onClick={handleSaveSerials}
              className="w-full py-3 px-4 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs tracking-wide transition shadow-sm cursor-pointer"
            >
              Save {actInfo.title} Records
            </button>

            {/* Special Opening Stock controls for manager */}
            {state.act === 'opening' && isAp && (
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                  Manager Override: Remove Single Opening Serial
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter serial to purge from opening balance"
                    value={removeSerialInput}
                    onChange={(e) => setRemoveSerialInput(e.target.value)}
                    className="flex-1 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (removeSerialInput.trim()) {
                        removeOpeningSerial(currentWarehouseId, removeSerialInput.trim());
                        setRemoveSerialInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-semibold transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* NON-SERIAL FORM */
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Select Non-Serial Item
              </label>
              <select
                value={nsItemKey}
                onChange={(e) => setNsItemKey(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100"
              >
                {state.ns.map((item) => (
                  <option key={item.c} value={item.c}>
                    {item.n} ({item.c}) &bull; Current at {currentWarehouse.n}:{' '}
                    {item.q[currentWarehouseId] || 0} units
                  </option>
                ))}
                <option value="+">+ Create new SKU item...</option>
              </select>
            </div>

            {nsItemKey === '+' && (
              <div className="p-3 rounded-xl bg-orange-50/60 dark:bg-stone-800/60 border border-orange-200 dark:border-stone-700 space-y-2">
                <span className="text-xs font-bold text-[#E8590C]">New SKU Definition</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Item Code e.g. BR-VALVE-20"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Item Name e.g. Brass Gas Valve 20mm"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Quantity ({state.act === 'opening' ? 'Set Opening Quantity' : 'Units'})
              </label>
              <input
                type="number"
                min="0"
                value={nsQuantity}
                onChange={(e) => setNsQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 dark:text-stone-100"
              />
            </div>

            <button
              type="button"
              disabled={!canDo}
              onClick={handleSaveNonSerial}
              className="w-full py-3 px-4 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] disabled:opacity-50 text-white font-bold text-xs tracking-wide transition shadow-sm cursor-pointer"
            >
              Confirm Non-Serial {actInfo.title}
            </button>
          </div>
        )}

        {/* Camera Scanner Modal Component */}
        <CameraScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScannedSerials={(scanned) => {
            const joined = scanned.join('\n');
            setSerialsText((prev) => (prev ? prev + '\n' + joined : joined));
          }}
          title={`Scan serials for ${actInfo.title}`}
        />
      </div>
    );
  }

  // Sub-view: Kind selected, show Action Cards
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8590C] hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to stock overview</span>
      </button>

      {/* Header & Depot Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100">
              {isSerial ? 'Serial Inventory' : 'Non-Serial Inventory'}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-[#E8590C] dark:bg-orange-950/80">
              {currentWarehouse.n}
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {isSerial
              ? 'Cookstoves and unit-tracked items with unique barcode serials'
              : 'Bulk materials, spare parts, and packaged consumables tracked by count'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsIdentifyModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/80 text-[#E8590C] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Scan item barcode to identify"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Identify Barcode</span>
          </button>

          <select
            value={currentWarehouseId}
            onChange={(e) => setWarehouse(e.target.value)}
            className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 dark:text-stone-100"
          >
            {visibleWarehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.n} ({w.reg})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Serial Stock Metrics Strip */}
      {isSerial && currentData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>Opening Stock</span>
              {currentData.locked ? (
                <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                  <Unlock className="w-3 h-3" /> Editable
                </span>
              )}
            </div>
            <div className="text-2xl font-extrabold font-heading text-stone-900 dark:text-stone-100">
              {currentData.opening.length}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <span className="text-xs text-stone-500 block mb-1">Received (Month)</span>
            <div className="text-2xl font-extrabold font-heading text-emerald-600 dark:text-emerald-400">
              +{currentData.received.length}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <span className="text-xs text-stone-500 block mb-1">Scanned Out</span>
            <div className="text-2xl font-extrabold font-heading text-red-600 dark:text-red-400">
              -{currentData.out.length}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-stone-900 border border-orange-200/80 dark:border-stone-800">
            <span className="text-xs text-[#E8590C] font-semibold block mb-1">Live Balance</span>
            <div className="text-2xl font-extrabold font-heading text-[#E8590C]">
              {currentExpected.size}
            </div>
          </div>
        </div>
      )}

      {/* Non-Serial Stock Balance List */}
      {!isSerial && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500">
            Current Non-Serial Quantities at {currentWarehouse.n}
          </h3>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {state.ns.map((item) => {
              const q = item.q[currentWarehouseId] || 0;
              const min = item.min ?? 20;
              const isLow = q <= min;
              const isCritical = q === 0 || q <= Math.floor(min / 2);
              return (
                <div
                  key={item.c}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {item.n}
                      </span>
                      <span className="text-stone-400 font-mono text-[11px]">[{item.c}]</span>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                      <span>Safety Buffer: <strong className="font-mono text-stone-700 dark:text-stone-300">{min} units</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setThresholdTargetItem({
                            code: item.c,
                            name: item.n,
                            min,
                            currentQty: q,
                            warehouseName: currentWarehouse.n,
                          });
                          setIsThresholdModalOpen(true);
                        }}
                        className="text-[#E8590C] hover:underline flex items-center gap-0.5 text-[10px] font-semibold cursor-pointer"
                        title="Configure safety threshold"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Edit Threshold</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100">
                      {q} units
                    </span>
                    {isLow && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCritical
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {q === 0 ? 'Out of Stock' : isCritical ? 'Critical Shortage' : 'Low Buffer'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Selection Cards */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Select Inventory Transaction
        </h3>
        {(['in', 'out', 'opening', 'ret'] as const).map((key) => {
          const actMeta = ACT_META[key];
          const hasPerm = can(actMeta.perm);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setAct(key)}
              className="w-full text-left p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-[#E8590C] dark:hover:border-[#E8590C] transition group shadow-xs flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold font-heading text-base text-stone-900 dark:text-stone-100 group-hover:text-[#E8590C] transition-colors">
                    {actMeta.title}
                  </h4>
                  {!hasPerm && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-400">
                      Requires {actMeta.perm}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {actMeta.subtitle}
                </p>
              </div>

              <span className="text-xs font-semibold text-[#E8590C] group-hover:translate-x-1 transition-transform">
                Proceed &rarr;
              </span>
            </button>
          );
        })}
      </div>

      {/* Unlock opening stock helper button */}
      {isSerial && currentData?.locked && isAp && (
        <button
          type="button"
          onClick={() => unlockOpening(currentWarehouseId)}
          className="w-full py-2.5 px-4 rounded-xl border border-[#E8590C] text-[#E8590C] hover:bg-orange-50 dark:hover:bg-orange-950/20 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Unlock className="w-3.5 h-3.5" />
          <span>Unlock Opening Stock (Manager Permission)</span>
        </button>
      )}

      {/* Device Camera Barcode Identifier Modal */}
      <BarcodeIdentifierModal
        isOpen={isIdentifyModalOpen}
        onClose={() => setIsIdentifyModalOpen(false)}
        onSelectItem={(code) => {
          setKind(null);
          setSearchQuery(code);
          const results = findSerialInfo(code);
          setSearchResults(results);
        }}
      />

      {/* Minimum Quantity Safety Threshold Modal */}
      <ThresholdEditModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        item={thresholdTargetItem}
      />
    </div>
  );
};
