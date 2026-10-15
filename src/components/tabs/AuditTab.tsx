import React, { useState } from 'react';
import { useBurnOps } from '../../context/BurnOpsContext';
import {
  ClipboardCheck,
  Scan,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Download,
  RotateCcw,
  CalendarCheck,
  HelpCircle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { CameraScannerModal } from '../CameraScannerModal';

export const AuditTab: React.FC = () => {
  const {
    visibleWarehouses,
    currentWarehouseId,
    currentWarehouse,
    setWarehouse,
    getAuditData,
    addCountedSerials,
    clearAuditCount,
    setFlagStatus,
    closeMonth,
    exportCSV,
    isAp,
    can,
    state,
    showToast,
    exportAuditReportExcel,
    exportAuditReportCSV,
  } = useBurnOps();

  const [countInput, setCountInput] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  if (!currentWarehouse) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center text-stone-500">
        No warehouse selected.
      </div>
    );
  }

  const { d, ex, miss, unk } = getAuditData(currentWarehouseId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setCountInput((prev) => (prev ? prev + '\n' + content : content));
      showToast(`Loaded count data from ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddCount = () => {
    if (!countInput.trim()) return;
    const added = addCountedSerials(currentWarehouseId, countInput);
    if (added > 0) {
      setCountInput('');
    }
  };

  // CSV Downloads
  const downloadCounted = () => {
    const rows: (string | number)[][] = [
      ['Serial', 'SKU', 'Warehouse', 'Region', 'Date Counted', 'Counted By'],
    ];
    visibleWarehouses.forEach((w) => {
      const whData = state.d[w.id];
      if (whData) {
        whData.counted.forEach(([serial, sku, timestamp, user]) => {
          rows.push([
            serial,
            sku,
            w.n,
            w.reg,
            timestamp ? new Date(timestamp).toISOString().slice(0, 10) : '',
            user || '',
          ]);
        });
      }
    });
    exportCSV(`burn-counted-serials-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const downloadFlagged = () => {
    const rows: (string | number)[][] = [
      ['Serial', 'SKU', 'Warehouse', 'Region', 'Source', 'Date Uploaded', 'Uploaded By', 'Audit Status'],
    ];
    visibleWarehouses.forEach((w) => {
      const auditRes = getAuditData(w.id);
      const whData = state.d[w.id];
      if (whData) {
        auditRes.miss.forEach(([s, k]) => {
          const o = whData.opening.find((x) => x[0] === s);
          const r = whData.received.find((x) => x[0] === s);
          const originRecord = o || r || [];
          rows.push([
            s,
            k,
            w.n,
            w.reg,
            o ? 'Opening Stock' : 'Received Inbound',
            originRecord[2] ? new Date(originRecord[2]).toISOString().slice(0, 10) : '',
            originRecord[3] || '',
            state.flags[s] || 'Missing',
          ]);
        });
      }
    });
    exportCSV(`burn-flagged-serials-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const downloadStockBalance = () => {
    const rows: (string | number)[][] = [['Warehouse', 'Region', 'Type', 'SKU / Item', 'Quantity']];
    visibleWarehouses.forEach((w) => {
      const auditRes = getAuditData(w.id);
      const skuCounts: Record<string, number> = {};
      auditRes.ex.forEach((sku) => {
        skuCounts[sku] = (skuCounts[sku] || 0) + 1;
      });
      Object.entries(skuCounts).forEach(([sku, qty]) => {
        rows.push([w.n, w.reg, 'Serialised Cookstove', sku, qty]);
      });
      state.ns.forEach((item) => {
        rows.push([w.n, w.reg, 'Non-Serial Consumable', item.n, item.q[w.id] || 0]);
      });
    });
    exportCSV(`burn-stock-balance-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title & Warehouse Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100 tracking-tight">
            Month-End Stock Audit &amp; Reconciliation
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Compare book balance with physical warehouse barcode scan counts and flag discrepancies
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

      {/* Audit Reconciliation KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Expected in stock */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block mb-1">
            Expected In Stock
          </span>
          <div className="text-3xl font-extrabold font-heading text-stone-900 dark:text-stone-100">
            {ex.size}
          </div>
          <span className="text-[11px] text-stone-400">Book balance</span>
        </div>

        {/* Counted physically */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
          <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 block mb-1">
            Counted Physically
          </span>
          <div className="text-3xl font-extrabold font-heading text-emerald-600 dark:text-emerald-400">
            {d.counted.length}
          </div>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-300/70">
            Verified on floor
          </span>
        </div>

        {/* Missing serials */}
        <div
          className={`p-4 rounded-2xl border shadow-xs transition ${
            miss.length > 0
              ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/60'
              : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          }`}
        >
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block mb-1">
            Missing Serials
          </span>
          <div
            className={`text-3xl font-extrabold font-heading ${
              miss.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-stone-800 dark:text-stone-200'
            }`}
          >
            {miss.length}
          </div>
          <span className="text-[11px] text-stone-400">Not scanned in audit</span>
        </div>

        {/* Unknown serials */}
        <div
          className={`p-4 rounded-2xl border shadow-xs transition ${
            unk.length > 0
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
              : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          }`}
        >
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block mb-1">
            Counted Not In Book
          </span>
          <div
            className={`text-3xl font-extrabold font-heading ${
              unk.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-800 dark:text-stone-200'
            }`}
          >
            {unk.length}
          </div>
          <span className="text-[11px] text-stone-400">Unexpected serials</span>
        </div>
      </div>

      {/* Stock Counting Input Section */}
      {can('count') && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#E8590C]" />
              <h3 className="font-bold font-heading text-base text-stone-900 dark:text-stone-100">
                Record Physical Audit Count
              </h3>
            </div>
            <span className="text-xs text-stone-400">
              {d.counted.length} serials currently verified
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Scan or paste counted serial numbers (one per line)
            </label>
            <textarea
              rows={4}
              placeholder="Scan barcodes with camera, or paste serial list:&#10;ECO-254-1001&#10;ECO-254-1004"
              value={countInput}
              onChange={(e) => setCountInput(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl p-3 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#E8590C]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Scan className="w-4 h-4 text-[#E8590C]" />
                <span>Scan with Camera</span>
              </button>

              <label className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer">
                <Upload className="w-4 h-4 text-[#E8590C]" />
                <span>Upload TXT / CSV</span>
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              {d.counted.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all counted serials for this audit cycle?')) {
                      clearAuditCount(currentWarehouseId);
                    }
                  }}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Count</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleAddCount}
                disabled={!countInput.trim()}
                className="px-5 py-2 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] disabled:opacity-50 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Add to Count
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Data Exports (Manager & Regional) */}
      {isAp && (
        <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3.5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-2.5">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <span>Executive Audit Reports &amp; Exports</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  Excel &amp; CSV Ready
                </span>
              </h4>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Generate formatted multi-tab Microsoft Excel (.xlsx) workbooks and comma-separated reports for auditors
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportAuditReportExcel(currentWarehouseId)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Full Excel Report (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => exportAuditReportCSV(currentWarehouseId)}
                className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 dark:bg-stone-700 dark:hover:bg-stone-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileText className="w-4 h-4 text-orange-400" />
                <span>Full CSV Report (.csv)</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-stone-400 font-semibold mr-1">Granular tables:</span>
            <button
              onClick={downloadCounted}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:border-[#E8590C] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Counted Serials CSV</span>
            </button>
            <button
              onClick={downloadFlagged}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:border-[#E8590C] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-red-600" />
              <span>Flagged Serials CSV</span>
            </button>
            <button
              onClick={downloadStockBalance}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:border-[#E8590C] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#E8590C]" />
              <span>Stock Balance CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* Missing Serials Reconciliation Table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-bold font-heading text-stone-900 dark:text-stone-100 text-base">
              Missing Cookstove Serials ({miss.length})
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            In system balance, but missing from floor count
          </span>
        </div>

        {miss.length === 0 ? (
          <div className="text-center py-6 text-emerald-600 dark:text-emerald-400 text-xs flex flex-col items-center gap-1">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-bold">Zero Missing Serials</span>
            <span className="text-stone-400">All book balance serials have been physically verified.</span>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-80 overflow-y-auto pr-1">
            {miss.map(([serial, sku]) => {
              const flag = state.flags[serial];
              return (
                <div
                  key={serial}
                  className="py-2.5 flex items-center justify-between text-xs gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                      {serial}
                    </span>
                    <span className="text-stone-500 text-[11px] block">{sku}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {flag === 'resolved' ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Resolved
                      </span>
                    ) : flag === 'investigating' ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Investigating
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                        Missing
                      </span>
                    )}

                    {flag === 'investigating' ? (
                      <button
                        type="button"
                        onClick={() => setFlagStatus(serial, 'resolved')}
                        className="px-2.5 py-1 rounded-lg border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-bold transition cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setFlagStatus(serial, 'investigating')}
                        className="px-2.5 py-1 rounded-lg border border-amber-600 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] font-bold transition cursor-pointer"
                      >
                        Investigate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Counted But Not in Records (Unexpected Floor Serials) */}
      {unk.length > 0 && (
        <div className="bg-amber-50/50 dark:bg-stone-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold font-heading text-stone-900 dark:text-stone-100 text-base">
              Physically Counted but NOT in Stock Records ({unk.length})
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            These serial numbers were physically scanned on the warehouse floor, but have no inbound or opening record. Check factory shipment notes or untracked returns.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {unk.map(([serial, sku], idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-800 text-xs font-mono font-bold text-amber-900 dark:text-amber-300"
              >
                {serial} <span className="text-[10px] text-stone-400 font-sans font-normal">({sku})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Close Month Button (Manager / Director only) */}
      {isAp && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => closeMonth(currentWarehouseId)}
            className="w-full py-3.5 px-4 rounded-2xl border-2 border-[#E8590C] text-[#E8590C] hover:bg-orange-50 dark:hover:bg-orange-950/30 font-bold text-xs tracking-wide transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Close Month and Roll Balances Forward ({currentWarehouse.n})</span>
          </button>
        </div>
      )}

      {/* Camera Scanner Modal Component */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScannedSerials={(scanned) => {
          const joined = scanned.join('\n');
          setCountInput((prev) => (prev ? prev + '\n' + joined : joined));
        }}
        title="Audit Floor Barcode Scanner"
      />
    </div>
  );
};
