import React, { useState } from 'react';
import { useBurnOps } from '../../context/BurnOpsContext';
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Scan,
  Upload,
  Calendar,
  Package,
  ArrowRight,
  Plus,
  ArrowLeftRight,
} from 'lucide-react';
import { CameraScannerModal } from '../CameraScannerModal';
import { getDaysFromToday } from '../../context/BurnOpsContext';

export const DispatchTab: React.FC = () => {
  const {
    state,
    currentUser,
    visibleWarehouses,
    setDispatchTab,
    setReceiptTarget,
    getWarehouseName,
    getDaysUntilDue,
    createShipment,
    confirmReceipt,
    isFull,
    isAp,
    can,
    showToast,
  } = useBurnOps();

  const activeTab = state.dtab || 'transit';
  const whIds = visibleWarehouses.map((w) => w.id);

  // Filter shipments visible to current role
  const visibleShipments = state.ships.filter(
    (s) => isFull || whIds.includes(s.to) || whIds.includes(s.from)
  );

  const filteredList = visibleShipments.filter(
    (s) => (s.st === 'transit') === (activeTab === 'transit')
  );

  // New Shipment form state
  const [fromWh, setFromWh] = useState<string>('F');
  const [toWh, setToWh] = useState<string>(visibleWarehouses[0]?.id || 'w1');
  const [stockKind, setStockKind] = useState<'ser' | 'ns'>('ser');
  const [itemInput, setItemInput] = useState('BS-ECO-STOVE');
  const [qtyInput, setQtyInput] = useState<number>(50);
  const [etaInput, setEtaInput] = useState<string>(getDaysFromToday(3));

  // Receipt confirmation form state
  const [receiptSerials, setReceiptSerials] = useState('');
  const [receiptQty, setReceiptQty] = useState<number>(0);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setReceiptSerials((prev) => (prev ? prev + '\n' + content : content));
      showToast(`Loaded serials from ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const success = createShipment({
      from: fromWh,
      to: toWh,
      kind: stockKind,
      item: itemInput,
      qty: qtyInput,
      eta: etaInput,
    });
    if (success) {
      setQtyInput(50);
    }
  };

  const handleExecuteReceipt = (shipmentId: string, kind: 'ser' | 'ns') => {
    if (kind === 'ser') {
      if (!receiptSerials.trim()) {
        showToast('Please scan or enter received serial numbers', true);
        return;
      }
      confirmReceipt(shipmentId, { rawSerials: receiptSerials });
      setReceiptSerials('');
    } else {
      if (receiptQty < 0 || isNaN(receiptQty)) {
        showToast('Please enter a valid received quantity', true);
        return;
      }
      confirmReceipt(shipmentId, { qty: receiptQty });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
        <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100 tracking-tight">
          Dispatch &amp; Inter-Warehouse Logistics
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Track transfers from factory &amp; regional hubs, verify received serials, and inspect shipping variances
        </p>
      </div>

      {/* Tabs: In transit vs Received */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDispatchTab('transit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'transit'
              ? 'bg-[#E8590C] text-white shadow-sm'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>In Transit ({visibleShipments.filter((s) => s.st === 'transit').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setDispatchTab('done')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'done'
              ? 'bg-[#E8590C] text-white shadow-sm'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Received ({visibleShipments.filter((s) => s.st === 'received').length})</span>
        </button>
      </div>

      {/* Shipments List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400">
            No transfer shipments currently in {activeTab === 'transit' ? 'transit' : 'the received archive'}.
          </div>
        ) : (
          filteredList.map((s) => {
            const days = getDaysUntilDue(s.eta);
            const isDestinationMine = whIds.includes(s.to) && can('receive');
            const isReceiving = state.rc === s.id;

            return (
              <div
                key={s.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-stone-900 dark:text-stone-100 text-base">
                      {s.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.st === 'transit'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {s.st === 'transit' ? 'In Transit' : 'Received'}
                    </span>
                    <span className="text-xs text-stone-400">
                      &bull; Dispatched by {s.by}
                    </span>
                  </div>

                  <div className="text-xs">
                    {s.st === 'transit' ? (
                      <span
                        className={`font-semibold ${
                          days < 0
                            ? 'text-red-600 dark:text-red-400 font-bold'
                            : days === 0
                            ? 'text-amber-600'
                            : 'text-stone-500'
                        }`}
                      >
                        Expected: {s.eta} ({days < 0 ? `${Math.abs(days)}d late` : days === 0 ? 'Today' : `in ${days}d`})
                      </span>
                    ) : (
                      <span className="text-stone-400">
                        Received on {s.rat ? new Date(s.rat).toLocaleDateString() : 'N/A'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Route & Cargo Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-stone-400 text-[11px] uppercase tracking-wider block">
                      Transfer Route
                    </span>
                    <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 mt-0.5">
                      <span>{getWarehouseName(s.from)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#E8590C]" />
                      <span>{getWarehouseName(s.to)}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] uppercase tracking-wider block">
                      Cargo Particulars
                    </span>
                    <div className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5">
                      {s.qty} units &bull; {s.item} (
                      {s.kind === 'ser' ? 'Serialised Cookstoves' : 'Consumables / Non-Serial'})
                    </div>
                  </div>
                </div>

                {/* Received Variance Information */}
                {s.st === 'received' && s.rq !== undefined && (
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 text-xs flex items-center justify-between">
                    <span className="text-stone-600 dark:text-stone-300">
                      Dispatched: <strong>{s.qty}</strong> &bull; Verified Received:{' '}
                      <strong>{s.rq}</strong>
                    </span>
                    {s.rq === s.qty ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Received In Full
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                        Variance: {s.rq - s.qty > 0 ? `+${s.rq - s.qty}` : s.rq - s.qty} units
                      </span>
                    )}
                  </div>
                )}

                {/* Receiving Confirmation Flow */}
                {s.st === 'transit' && isDestinationMine && (
                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                    {!isReceiving ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptTarget(s.id);
                          setReceiptQty(s.qty);
                          setReceiptSerials('');
                        }}
                        className="py-2 px-4 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Receipt at {getWarehouseName(s.to)}</span>
                      </button>
                    ) : (
                      <div className="p-4 rounded-xl bg-orange-50/60 dark:bg-stone-800/70 border border-orange-200 dark:border-stone-700 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-[#E8590C] uppercase tracking-wider">
                            Intake Receipt Verification for {s.id}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setReceiptTarget(null)}
                            className="text-xs text-stone-400 hover:text-stone-600"
                          >
                            Cancel
                          </button>
                        </div>

                        {s.kind === 'ser' ? (
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                              Scan or upload received serial barcodes ({s.item})
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Scan barcodes or paste serials:&#10;ECO-254-1001&#10;ECO-254-1002"
                              value={receiptSerials}
                              onChange={(e) => setReceiptSerials(e.target.value)}
                              className="w-full bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-xs font-mono"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setIsScannerOpen(true)}
                                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5"
                              >
                                <Scan className="w-3.5 h-3.5 text-[#E8590C]" />
                                <span>Scan Barcodes</span>
                              </button>
                              <label className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                                <Upload className="w-3.5 h-3.5 text-[#E8590C]" />
                                <span>Upload File</span>
                                <input
                                  type="file"
                                  accept=".txt,.csv"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                              Verified Quantity Received (Dispatched: {s.qty})
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={receiptQty}
                              onChange={(e) => setReceiptQty(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-40 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold font-mono"
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleExecuteReceipt(s.id, s.kind)}
                          className="py-2.5 px-4 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] text-white font-bold text-xs transition cursor-pointer"
                        >
                          Complete Receipt &amp; Credit Inventory
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Shipment Creation Form (Managers & Regional Supervisors) */}
      {isAp && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#E8590C]" />
            <h3 className="font-bold font-heading text-base text-stone-900 dark:text-stone-100">
              Create New Transfer Shipment
            </h3>
          </div>

          <form onSubmit={handleCreateShipment} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Origin
                </label>
                <select
                  value={fromWh}
                  onChange={(e) => setFromWh(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100"
                >
                  <option value="F">Main Burn Factory (Nairobi)</option>
                  {state.wh.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.n} ({w.reg})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Destination Warehouse
                </label>
                <select
                  value={toWh}
                  onChange={(e) => setToWh(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100"
                >
                  {state.wh.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.n} ({w.reg})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Stock Kind
                </label>
                <select
                  value={stockKind}
                  onChange={(e) => setStockKind(e.target.value as 'ser' | 'ns')}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100"
                >
                  <option value="ser">Serialised Cookstoves</option>
                  <option value="ns">Non-Serial Consumables</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Item / SKU
                </label>
                <input
                  list="dispatch-sku-list"
                  value={itemInput}
                  onChange={(e) => setItemInput(e.target.value)}
                  placeholder="e.g. BS-ECO-STOVE"
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold"
                />
                <datalist id="dispatch-sku-list">
                  {[...state.skus, ...state.ns.map((x) => x.n)].map((x) => (
                    <option key={x} value={x} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={etaInput}
                onChange={(e) => setEtaInput(e.target.value)}
                className="w-full sm:w-60 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              Create Transfer Shipment
            </button>
          </form>
        </div>
      )}

      {/* Camera scanner for dispatch intake */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScannedSerials={(scanned) => {
          const joined = scanned.join('\n');
          setReceiptSerials((prev) => (prev ? prev + '\n' + joined : joined));
        }}
        title="Scan Inbound Transfer Serials"
      />
    </div>
  );
};
