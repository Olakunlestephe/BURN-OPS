import React, { useState } from 'react';
import { useBurnOps } from '../../context/BurnOpsContext';
import {
  Building2,
  ArrowLeft,
  Calendar,
  Layers,
  Plus,
  Minus,
  Save,
  Download,
  AlertCircle,
  Briefcase,
  Wrench,
  Sofa,
  Check,
} from 'lucide-react';
import { CATS, Warehouse } from '../../types';

export const SitesTab: React.FC = () => {
  const {
    state,
    visibleWarehouses,
    setSiteWarehouse,
    setSiteCategory,
    getExpectedStock,
    getDaysUntilDue,
    adjustAssetQuantity,
    addAssetItem,
    updateRentInfo,
    addWarehouse,
    exportCSV,
    isAp,
  } = useBurnOps();

  // Selected warehouse object
  const selectedWh = visibleWarehouses.find((w) => w.id === state.sw);

  // New warehouse state
  const [newWhName, setNewWhName] = useState('');
  const [newWhRegion, setNewWhRegion] = useState('');

  // Asset creation state
  const [assetName, setAssetName] = useState('');
  const [assetQty, setAssetQty] = useState(1);

  // Rent editor state
  const [rentAmount, setRentAmount] = useState<number>(selectedWh?.rent || 0);
  const [rentDueDate, setRentDueDate] = useState<string>(selectedWh?.due || '');

  // Sub-view: No warehouse chosen
  if (!selectedWh) {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
          <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100 tracking-tight">
            Burn Warehouses &amp; Facilities
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Site-level asset registers, lease expiration calendars, and physical premises control
          </p>
        </div>

        <div className="space-y-3">
          {visibleWarehouses.map((w) => {
            const days = getDaysUntilDue(w.due);
            const serialCount = getExpectedStock(w.id).size;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setSiteWarehouse(w.id);
                  setSiteCategory(null);
                  setRentAmount(w.rent);
                  setRentDueDate(w.due);
                }}
                className="w-full text-left bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 border-l-4 border-l-[#E8590C] rounded-2xl p-5 hover:shadow-md transition group flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold font-heading text-lg text-stone-900 dark:text-stone-100 group-hover:text-[#E8590C] transition-colors">
                      {w.n}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {w.reg} Region
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Live Stock: <strong className="text-stone-800 dark:text-stone-200">{serialCount} cookstoves</strong> &bull; Rent: KES {w.rent.toLocaleString()} / mo
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      days < 0
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : days <= 30
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {days < 0
                      ? 'Lease Overdue'
                      : days <= 30
                      ? `Lease due in ${days}d`
                      : `Renews ${w.due}`}
                  </span>
                  <span className="text-xs text-[#E8590C] font-semibold group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Add Warehouse Facility (Managers & Regional Supervisors) */}
        {isAp && (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#E8590C]" />
              <h3 className="font-bold font-heading text-base text-stone-900 dark:text-stone-100">
                Register New Warehouse Site
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Warehouse Name e.g. Eldoret Logistics Hub"
                value={newWhName}
                onChange={(e) => setNewWhName(e.target.value)}
                className="bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#E8590C]"
              />
              <input
                type="text"
                placeholder="Region e.g. North Rift"
                value={newWhRegion}
                onChange={(e) => setNewWhRegion(e.target.value)}
                className="bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#E8590C]"
              />
            </div>

            <button
              type="button"
              disabled={!newWhName.trim()}
              onClick={() => {
                if (newWhName.trim()) {
                  addWarehouse(newWhName, newWhRegion);
                  setNewWhName('');
                  setNewWhRegion('');
                }
              }}
              className="py-2.5 px-4 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer"
            >
              Add Warehouse Facility
            </button>
          </div>
        )}
      </div>
    );
  }

  // Back button handler
  const handleBack = () => {
    if (state.cat) {
      setSiteCategory(null);
    } else {
      setSiteWarehouse(null);
    }
  };

  // Sub-view: Warehouse chosen, show Category Choices
  if (!state.cat) {
    const days = getDaysUntilDue(selectedWh.due);
    const categoryOptions = [
      {
        name: 'Inventory balance',
        desc: `${getExpectedStock(selectedWh.id).size} serialised cookstoves in stock`,
        icon: <Layers className="w-5 h-5 text-[#E8590C]" />,
      },
      {
        name: 'Furniture',
        desc: `${selectedWh.a.Furniture.length} items catalogued`,
        icon: <Sofa className="w-5 h-5 text-amber-600" />,
      },
      {
        name: 'Working tools',
        desc: `${selectedWh.a['Working tools'].length} items catalogued`,
        icon: <Wrench className="w-5 h-5 text-blue-600" />,
      },
      {
        name: 'Equipment',
        desc: `${selectedWh.a.Equipment.length} items catalogued`,
        icon: <Briefcase className="w-5 h-5 text-purple-600" />,
      },
      {
        name: 'Rent and lease',
        desc: `Renews on ${selectedWh.due} (${days < 0 ? 'Overdue' : `${days}d left`})`,
        icon: <Calendar className="w-5 h-5 text-red-500" />,
      },
    ];

    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8590C] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to warehouse directory</span>
        </button>

        <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100">
              {selectedWh.n}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-[#E8590C] dark:bg-orange-950/80">
              {selectedWh.reg} Region
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Select a facility registry section to view or update
          </p>
        </div>

        <div className="space-y-2.5">
          {categoryOptions.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => {
                setSiteCategory(cat.name);
                setRentAmount(selectedWh.rent);
                setRentDueDate(selectedWh.due);
              }}
              className="w-full text-left bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 border-l-4 border-l-[#E8590C] rounded-2xl p-4 sm:p-5 hover:border-[#E8590C] transition group shadow-xs flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 group-hover:bg-orange-50 dark:group-hover:bg-orange-950/50 transition">
                  {cat.icon}
                </div>
                <div>
                  <h4 className="font-bold font-heading text-base text-stone-900 dark:text-stone-100 group-hover:text-[#E8590C] transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{cat.desc}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#E8590C] group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Sub-view: Specific Category View
  const currentCat = state.cat;

  // View: Inventory Balance Breakdown
  if (currentCat === 'Inventory balance') {
    const whData = state.d[selectedWh.id] || {
      opening: [],
      received: [],
      out: [],
      counted: [],
      locked: false,
    };
    const expected = getExpectedStock(selectedWh.id);
    const skuMap: Record<string, number> = {};
    expected.forEach((sku) => {
      skuMap[sku] = (skuMap[sku] || 0) + 1;
    });

    const downloadThisWarehouseBalance = () => {
      const rows: (string | number)[][] = [
        ['Warehouse', 'Region', 'Category', 'SKU / Item', 'Stock Quantity'],
      ];
      Object.entries(skuMap).forEach(([sku, qty]) => {
        rows.push([selectedWh.n, selectedWh.reg, 'Serialised Cookstove', sku, qty]);
      });
      state.ns.forEach((item) => {
        rows.push([
          selectedWh.n,
          selectedWh.reg,
          'Non-Serial Consumable',
          item.n,
          item.q[selectedWh.id] || 0,
        ]);
      });
      exportCSV(`burn-stock-balance-${selectedWh.id}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    };

    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8590C] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {selectedWh.n}</span>
        </button>

        <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100">
              Live Inventory Balance
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Facility: <strong className="text-stone-800 dark:text-stone-200">{selectedWh.n}</strong>
            </p>
          </div>

          <button
            onClick={downloadThisWarehouseBalance}
            className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#E8590C]" />
            <span>Download Balance CSV</span>
          </button>
        </div>

        {/* Serial Stock Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3 shadow-xs">
          <h3 className="font-bold text-sm font-heading text-stone-900 dark:text-stone-100">
            Serialised Cookstove Stock
          </h3>

          {Object.keys(skuMap).length === 0 ? (
            <p className="text-xs text-stone-400 italic">No serialised stoves in stock.</p>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {Object.entries(skuMap).map(([sku, count]) => (
                <div key={sku} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-900 dark:text-stone-100">{sku}</span>
                  <span className="font-mono font-bold text-sm text-[#E8590C]">{count} units</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 text-[11px] text-stone-400 border-t border-stone-100 dark:border-stone-800">
            Opening ({whData.opening.length}) + Received ({whData.received.length}) &minus; Scanned Out ({whData.out.length}) = Total {expected.size} units
          </div>
        </div>

        {/* Non-Serial Stock Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3 shadow-xs">
          <h3 className="font-bold text-sm font-heading text-stone-900 dark:text-stone-100">
            Consumables &amp; Non-Serial Stock
          </h3>

          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {state.ns.map((item) => {
              const q = item.q[selectedWh.id] || 0;
              const isLow = q <= (item.min ?? 20);
              return (
                <div key={item.c} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{item.n}</span>
                    <span className="text-stone-400 font-mono ml-2">[{item.c}]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100">
                      {q} units
                    </span>
                    {isLow && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // View: Rent & Lease Management
  if (currentCat === 'Rent and lease') {
    const days = getDaysUntilDue(selectedWh.due);

    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8590C] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {selectedWh.n}</span>
        </button>

        <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
          <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100">
            Premises Lease &amp; Rent Schedule
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Facility: <strong className="text-stone-800 dark:text-stone-200">{selectedWh.n}</strong>
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-500">Current Monthly Rent</span>
              <div className="text-2xl font-extrabold font-heading text-stone-900 dark:text-stone-100">
                KES {Number(selectedWh.rent).toLocaleString()}
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                days < 0
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : days <= 30
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {days < 0 ? `${Math.abs(days)}d Overdue!` : `${days} days left on lease`}
            </span>
          </div>

          {/* Manager / Supervisor Rent Editor */}
          {isAp ? (
            <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Update Lease Terms
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-stone-500 font-semibold">
                    Rent Amount (KES / Month)
                  </label>
                  <input
                    type="number"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(Number(e.target.value) || 0)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-stone-500 font-semibold">
                    Lease Renewal Due Date
                  </label>
                  <input
                    type="date"
                    value={rentDueDate}
                    onChange={(e) => setRentDueDate(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => updateRentInfo(selectedWh.id, rentAmount, rentDueDate)}
                className="py-2.5 px-4 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Lease Parameters</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">
              Lease modification is restricted to regional managers and directors.
            </p>
          )}
        </div>
      </div>
    );
  }

  // View: Assets in Furniture, Working tools, or Equipment
  const catKey = currentCat as keyof Warehouse['a'];
  const assetList = selectedWh.a[catKey] || [];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8590C] hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to {selectedWh.n}</span>
      </button>

      <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
        <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100">
          {currentCat} Register
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Fixed assets and physical equipment at{' '}
          <strong className="text-stone-800 dark:text-stone-200">{selectedWh.n}</strong>
        </p>
      </div>

      {/* Asset Items List */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm font-heading text-stone-900 dark:text-stone-100">
          Catalogued Assets ({assetList.length})
        </h3>

        {assetList.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-3">
            No items listed in {currentCat} yet.
          </p>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {assetList.map((asset, index) => (
              <div
                key={index}
                className="py-2.5 flex items-center justify-between text-xs gap-2"
              >
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {asset.n}
                </span>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm px-2">
                    {asset.q}
                  </span>
                  {isAp && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustAssetQuantity(selectedWh.id, currentCat, index, 1)}
                        className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 transition"
                        title="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustAssetQuantity(selectedWh.id, currentCat, index, -1)}
                        className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 transition"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Asset Form (Managers & Supervisors) */}
      {isAp && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
            Add New Item to {currentCat}
          </h4>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Item name e.g. Laser Barcode Scanner"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="flex-1 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#E8590C]"
            />
            <input
              type="number"
              min="1"
              value={assetQty}
              onChange={(e) => setAssetQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-stone-900 dark:text-stone-100"
            />
            <button
              type="button"
              disabled={!assetName.trim()}
              onClick={() => {
                if (assetName.trim()) {
                  addAssetItem(selectedWh.id, currentCat, assetName, assetQty);
                  setAssetName('');
                  setAssetQty(1);
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer"
            >
              Add Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
