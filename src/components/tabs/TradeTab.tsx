import React, { useState } from 'react';
import { useBurnOps } from '../../context/BurnOpsContext';
import {
  Globe2,
  FileCheck2,
  Ship,
  ArrowLeft,
  Clock,
  Building2,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Truck,
  TrendingUp,
  BarChart2,
  Calculator,
  Scale,
} from 'lucide-react';
import { DOCS, STAGES } from '../../types';
import { LogisticsPipelineView } from '../LogisticsPipelineView';
import { FreightDutyCalculator } from '../FreightDutyCalculator';

export const TradeTab: React.FC = () => {
  const {
    state,
    currentUser,
    visibleWarehouses,
    setTradeDetail,
    getWarehouseName,
    createTrade,
    toggleTradeDocument,
    saveTradeStatus,
    isFull,
    isAp,
  } = useBurnOps();

  const whIds = visibleWarehouses.map((w) => w.id);

  // Visibility rule for international trade
  const isVisible = (t: (typeof state.trade)[0]) => {
    if (!t) return false;
    if (isFull || currentUser.r === 'smt') return true;
    if (currentUser.r === 'regional') return t.reg === currentUser.reg;
    if (currentUser.r === 'officer') return whIds.includes(t.dest);
    return false;
  };

  const tradeList = (state.trade || []).filter(isVisible);
  const selectedTrade = (state.trade || []).find((x) => x && x.id === state.td);

  // New Trade Shipment Form State
  const [tradeViewMode, setTradeViewMode] = useState<'pipeline' | 'directory' | 'calculator'>('pipeline');
  const [newType, setNewType] = useState<'import' | 'export'>('import');
  const [newRef, setNewRef] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newParty, setNewParty] = useState('');
  const [newReg, setNewReg] = useState(currentUser.reg || 'Central');

  // Selected trade stage editor
  const [stageInput, setStageInput] = useState(selectedTrade?.stage || 'Documentation');
  const [destInput, setDestInput] = useState(selectedTrade?.dest || '');
  const [etaInput, setEtaInput] = useState(selectedTrade?.eta || '');

  // Sub-view: Trade shipment detail
  if (selectedTrade && isVisible(selectedTrade)) {
    const tradeType = selectedTrade.type === 'export' ? 'export' : 'import';
    const docList = DOCS[tradeType] || DOCS.import;
    const docsObj = selectedTrade.docs || {};
    const checkedCount = docList.filter((_, i) => docsObj[i]).length;
    const progressPercent = Math.round((checkedCount / (docList.length || 1)) * 100);
    const isArrivingAtMyWarehouse =
      whIds.includes(selectedTrade.dest) &&
      currentUser.r === 'officer' &&
      selectedTrade.stage !== 'Documentation' &&
      selectedTrade.stage !== 'Delivered';

    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        <button
          onClick={() => setTradeDetail(null)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8590C] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to trade shipments</span>
        </button>

        {/* Title & Metadata */}
        <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100">
                {selectedTrade.ref}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedTrade.type === 'import'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {selectedTrade.type}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {selectedTrade.desc} &bull; Counterparty:{' '}
              <strong className="text-stone-700 dark:text-stone-300">{selectedTrade.party}</strong>{' '}
              &bull; {selectedTrade.reg} Region
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#E8590C] dark:bg-orange-950/80">
              Stage: {selectedTrade.stage}
            </span>
          </div>
        </div>

        {/* Destination Warehouse Advance Alert */}
        {isArrivingAtMyWarehouse && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                Prepare Receiving Bay: Container Arriving Soon
              </h4>
              <p className="text-amber-800 dark:text-amber-300">
                This shipment is cleared or in transit to your warehouse (
                <strong>{getWarehouseName(selectedTrade.dest)}</strong>) with estimated arrival on{' '}
                <strong>{selectedTrade.eta || 'TBC'}</strong>. Prepare pallet racking and offloading staff.
              </p>
            </div>
          </div>
        )}

        {/* Documentation Compliance Checklist */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#E8590C]" />
              <h3 className="font-bold font-heading text-base text-stone-900 dark:text-stone-100">
                Statutory Trade Documents ({checkedCount}/{docList.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-stone-500">{progressPercent}% verified</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E8590C] to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {docList.map((docName, idx) => {
              const isChecked = !!selectedTrade.docs[idx];
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                    isChecked
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-stone-900 dark:text-stone-100'
                      : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-500 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={!isAp}
                    onChange={(e) => toggleTradeDocument(selectedTrade.id, idx, e.target.checked)}
                    className="w-4 h-4 rounded text-[#E8590C] focus:ring-[#E8590C]"
                  />
                  <span className={isChecked ? 'font-semibold text-emerald-900 dark:text-emerald-300' : ''}>
                    {docName}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Logistics Stage & Destination Bay Settings */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-[#E8590C]" />
            <h3 className="font-bold font-heading text-base text-stone-900 dark:text-stone-100">
              Customs &amp; Destination Logistics
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                Logistics Stage
              </label>
              <select
                value={stageInput}
                disabled={!isAp}
                onChange={(e) => setStageInput(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                Destination Warehouse
              </label>
              <select
                value={destInput}
                disabled={!isAp}
                onChange={(e) => setDestInput(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <option value="">Not Assigned Yet</option>
                {state.wh.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.n} ({w.reg})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                Expected Arrival Date
              </label>
              <input
                type="date"
                value={etaInput}
                disabled={!isAp}
                onChange={(e) => setEtaInput(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          {isAp && (
            <button
              type="button"
              onClick={() => saveTradeStatus(selectedTrade.id, stageInput, destInput, etaInput)}
              className="py-2.5 px-4 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Status &amp; Notify Destination Bay</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Sub-view: Trade Shipments and Pipeline
  const activeBottlenecksCount = tradeList.filter((t) => !!t.bottleneck).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100 tracking-tight">
            International Trade &amp; Freight Tracking
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Cross-border stove exports, raw material imports, bill of lading documentation, and port customs status
          </p>
        </div>

        {/* View mode switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTradeViewMode('pipeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tradeViewMode === 'pipeline'
                ? 'bg-[#E8590C] text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Logistics Pipeline</span>
            {activeBottlenecksCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse">
                {activeBottlenecksCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTradeViewMode('directory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tradeViewMode === 'directory'
                ? 'bg-[#E8590C] text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Shipments Directory</span>
            <span className="ml-0.5 text-[10px] opacity-80">({tradeList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTradeViewMode('calculator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tradeViewMode === 'calculator'
                ? 'bg-[#E8590C] text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Freight &amp; Duty Calculator</span>
          </button>
        </div>
      </div>

      {tradeViewMode === 'pipeline' ? (
        <LogisticsPipelineView
          onOpenCalculator={() => setTradeViewMode('calculator')}
          onSelectShipment={(id) => {
            setTradeDetail(id);
            const s = state.trade.find((x) => x.id === id);
            if (s) {
              setStageInput(s.stage);
              setDestInput(s.dest);
              setEtaInput(s.eta);
            }
          }}
        />
      ) : tradeViewMode === 'calculator' ? (
        <FreightDutyCalculator
          onApplyToNewShipment={(data) => {
            createTrade(data);
            setTradeViewMode('directory');
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Quick Calculator Launch Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-stone-900 dark:via-stone-850 dark:to-stone-900 border border-orange-200/80 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[#E8590C] text-white shrink-0">
                <Calculator className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold font-heading text-stone-900 dark:text-stone-100">
                  Pre-Shipment Freight &amp; Duty Tariff Modeler
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Calculate chargeable weight, ocean/air shipping rates, and EAC/ECOWAS customs duties before dispatch.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTradeViewMode('calculator')}
              className="py-2 px-3.5 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] text-white font-bold text-xs transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer shadow-xs"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculate Rates &amp; Duties</span>
            </button>
          </div>

          <div className="space-y-3">
          {tradeList.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400">
              No international shipments currently assigned to your region.
            </div>
          ) : (
            tradeList.map((t) => {
              const docList = DOCS[t.type];
              const verified = docList.filter((_, i) => t.docs[i]).length;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTradeDetail(t.id);
                    setStageInput(t.stage);
                    setDestInput(t.dest);
                    setEtaInput(t.eta);
                  }}
                  className="w-full text-left bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 border-l-4 border-l-[#E8590C] rounded-2xl p-5 hover:shadow-md transition group flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-stone-900 dark:text-stone-100 group-hover:text-[#E8590C] transition-colors">
                        {t.ref}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.type === 'import'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {t.type}
                      </span>
                      <span className="text-xs text-stone-400">&bull; {t.party}</span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300">{t.desc}</p>
                    <p className="text-[11px] text-stone-400">
                      Stage: <strong className="text-stone-700 dark:text-stone-300">{t.stage}</strong>{' '}
                      &bull; Compliance: {verified}/{docList.length} documents verified
                      {t.dest && ` \u2022 Destined for: ${getWarehouseName(t.dest)}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#E8590C] font-semibold group-hover:translate-x-1 transition-transform">
                      Inspect &rarr;
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    )}

      {/* Start Tracking New Trade Shipment (Managers & Regional Supervisors) */}
      {isAp && tradeViewMode === 'directory' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#E8590C]" />
            <h3 className="font-bold font-heading text-base text-stone-900 dark:text-stone-100">
              Start Tracking New Import / Export Batch
            </h3>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const success = createTrade({
                type: newType,
                ref: newRef,
                desc: newDesc,
                party: newParty,
                reg: newReg,
              });
              if (success) {
                setNewRef('');
                setNewDesc('');
                setNewParty('');
              }
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Trade Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'import' | 'export')}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100"
                >
                  <option value="import">Import (Raw Materials / Containers)</option>
                  <option value="export">Export (Finished Clean Cookstoves)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Reference (Bill of Lading, AWB, or Container #)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BL-88219"
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Goods / Manifest Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1000x BS-ECO Burnstoves export to Uganda"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Supplier / Consignee
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kampala Clean Energy Ltd"
                  value={newParty}
                  onChange={(e) => setNewParty(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!newRef.trim()}
              className="py-2.5 px-5 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] disabled:opacity-50 text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              Start Tracking Trade Shipment
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
