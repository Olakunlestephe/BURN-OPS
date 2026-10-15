import React from 'react';
import { useBurnOps } from '../../context/BurnOpsContext';
import {
  Building2,
  PackageCheck,
  AlertTriangle,
  Search,
  Calendar,
  Truck,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const HomeTab: React.FC = () => {
  const {
    state,
    visibleWarehouses,
    getExpectedStock,
    getAuditData,
    getDaysUntilDue,
    getWarehouseName,
    setTab,
  } = useBurnOps();

  // Metrics
  const whIds = visibleWarehouses.map((w) => w.id);
  let totalMissing = 0;
  let totalInStock = 0;
  const rentAlerts: { warehouseName: string; days: number; rent: number; due: string }[] = [];

  visibleWarehouses.forEach((w) => {
    const auditRes = getAuditData(w.id);
    totalMissing += auditRes.miss.length;
    totalInStock += getExpectedStock(w.id).size;

    const days = getDaysUntilDue(w.due);
    if (days <= 30) {
      rentAlerts.push({
        warehouseName: w.n,
        days,
        rent: w.rent,
        due: w.due,
      });
    }
  });

  const investigatingCount = Object.values(state.flags || {}).filter(
    (f) => f === 'investigating'
  ).length;

  // Incoming shipments
  const incomingTransfers = (state.ships || []).filter(
    (s) => s && s.st === 'transit' && whIds.includes(s.to)
  );
  const incomingTrade = (state.trade || []).filter(
    (t) => t && whIds.includes(t.dest) && t.stage !== 'Documentation' && t.stage !== 'Delivered'
  );

  // Low stock non-serial items
  const lowStockAlerts: { itemName: string; warehouseName: string; qty: number; min: number }[] = [];
  (visibleWarehouses || []).forEach((w) => {
    (state.ns || []).forEach((item) => {
      if (!item || !item.q) return;
      const q = item.q[w.id];
      const minThreshold = item.min ?? 20;
      if (q !== undefined && q <= minThreshold) {
        lowStockAlerts.push({
          itemName: item.n,
          warehouseName: w.n,
          qty: q,
          min: minThreshold,
        });
      }
    });
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100 tracking-tight">
            Burn Operations Dashboard
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Real-time multi-depot stock balances, audit discrepancies, and logistics pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('stock')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8590C] hover:bg-[#d44e08] text-white text-xs font-semibold shadow-sm transition"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Manage Stock</span>
          </button>
          <button
            onClick={() => setTab('audit')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold border border-stone-300 dark:border-stone-700 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Audit Count</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Warehouses */}
        <div className="bg-orange-50/70 dark:bg-stone-900 border border-orange-200/80 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Depots &amp; Hubs</span>
            <Building2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-3xl font-extrabold font-heading text-[#E8590C] dark:text-orange-400">
            {visibleWarehouses.length}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Active under your role
          </p>
        </div>

        {/* Serials in Stock */}
        <div className="bg-orange-50/70 dark:bg-stone-900 border border-orange-200/80 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Serials In Stock</span>
            <PackageCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-heading text-stone-900 dark:text-stone-100">
            {totalInStock}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Cookstoves live balance
          </p>
        </div>

        {/* Missing Serials */}
        <div
          className={`rounded-2xl p-4 shadow-xs border transition ${
            totalMissing > 0
              ? 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-800/60'
              : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Not Accounted For
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${totalMissing > 0 ? 'text-red-600 dark:text-red-400' : 'text-stone-400'}`}
            />
          </div>
          <div
            className={`text-3xl font-extrabold font-heading ${
              totalMissing > 0 ? 'text-red-600 dark:text-red-400' : 'text-stone-800 dark:text-stone-200'
            }`}
          >
            {totalMissing}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Missing from physical audit
          </p>
        </div>

        {/* Under Investigation */}
        <div className="bg-amber-50/70 dark:bg-stone-900 border border-amber-200/80 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Investigating</span>
            <Search className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-heading text-amber-600 dark:text-amber-400">
            {investigatingCount}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Flagged discrepancy cases
          </p>
        </div>
      </div>

      {/* Rent Renewals Banner (if any due soon) */}
      {rentAlerts.length > 0 && (
        <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-base font-bold text-red-950 dark:text-red-200 font-heading">
                Lease &amp; Rent Renewals Due Soon
              </h3>
            </div>
            <button
              onClick={() => setTab('sites')}
              className="text-xs text-red-700 dark:text-red-300 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Manage leases</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {rentAlerts.map((alert, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-red-100 dark:border-red-900/40 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {alert.warehouseName}
                  </span>
                  <span className="text-stone-500 dark:text-stone-400">
                    KES {alert.rent.toLocaleString()} / mo
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 dark:text-stone-400 hidden sm:inline">
                    Expires: {alert.due}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200">
                    {alert.days < 0 ? `${Math.abs(alert.days)}d Overdue!` : `Renews in ${alert.days} days`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two-column Operations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Incoming Shipments & Transfers */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#E8590C]" />
              <h3 className="font-bold font-heading text-stone-900 dark:text-stone-100 text-base">
                Incoming Shipments &amp; Transfers
              </h3>
            </div>
            <button
              onClick={() => setTab('dispatch')}
              className="text-xs text-[#E8590C] hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {incomingTransfers.length === 0 && incomingTrade.length === 0 ? (
            <div className="text-center py-6 text-stone-400 dark:text-stone-500 text-xs">
              No inbound freight or inter-depot shipments currently in transit.
            </div>
          ) : (
            <div className="space-y-2.5">
              {incomingTransfers.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-orange-50/50 dark:bg-stone-800/40 border border-orange-100 dark:border-stone-700/60 flex items-start justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                        {s.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                        In Transit
                      </span>
                    </div>
                    <p className="text-stone-700 dark:text-stone-300">
                      <strong>{s.qty}x</strong> {s.item}
                    </p>
                    <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                      From {getWarehouseName(s.from)} &rarr; To {getWarehouseName(s.to)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block">ETA</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {s.eta}
                    </span>
                  </div>
                </div>
              ))}

              {incomingTrade.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-blue-50/50 dark:bg-stone-800/40 border border-blue-100 dark:border-stone-700/60 flex items-start justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                        {t.ref}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 uppercase">
                        {t.type}
                      </span>
                      <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                        {t.stage}
                      </span>
                    </div>
                    <p className="text-stone-700 dark:text-stone-300">{t.desc}</p>
                    <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                      Destined for {getWarehouseName(t.dest)} &bull; {t.party}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block">Port ETA</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {t.eta || 'TBC'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold font-heading text-stone-900 dark:text-stone-100 text-base">
                Consumables &amp; Non-Serial Stock Alerts
              </h3>
            </div>
            <button
              onClick={() => setTab('stock')}
              className="text-xs text-[#E8590C] hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>Restock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {lowStockAlerts.length === 0 ? (
            <div className="text-center py-6 text-stone-400 dark:text-stone-500 text-xs">
              All non-serialized consumables (pellets, gaskets, valves) are above minimum inventory safety thresholds.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs"
                >
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      {alert.itemName}
                    </span>
                    <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                      At {alert.warehouseName} (Min buffer: {alert.min})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300">
                      {alert.qty} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Latest Operational Field Updates */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#E8590C]" />
            <h3 className="font-bold font-heading text-stone-900 dark:text-stone-100 text-base">
              Latest Operational Field Updates
            </h3>
          </div>
          <button
            onClick={() => setTab('news')}
            className="text-xs text-[#E8590C] hover:underline font-semibold flex items-center gap-0.5"
          >
            <span>Post update</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {state.news.length === 0 ? (
          <div className="text-center py-6 text-stone-400 dark:text-stone-500 text-xs">
            No updates posted yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {state.news.slice(0, 3).map((item) => (
              <div
                key={item.id || item.t}
                className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between text-xs space-y-2"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.k === 'Challenge'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {item.k}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(item.at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                    {item.t}
                  </h4>
                  <p className="text-stone-600 dark:text-stone-300 text-[11px] line-clamp-3">
                    {item.b}
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-[10px] text-stone-400">
                  By {item.by}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
