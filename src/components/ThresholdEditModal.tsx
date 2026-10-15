import React, { useState } from 'react';
import { X, ShieldAlert, Sliders, Check } from 'lucide-react';
import { useBurnOps } from '../context/BurnOpsContext';

interface ThresholdEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    code: string;
    name: string;
    min: number;
    currentQty: number;
    warehouseName: string;
  } | null;
}

export const ThresholdEditModal: React.FC<ThresholdEditModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const { updateItemMinThreshold } = useBurnOps();
  const [thresholdValue, setThresholdValue] = useState<number>(item?.min ?? 20);

  // Sync initial threshold when item changes
  React.useEffect(() => {
    if (item) {
      setThresholdValue(item.min);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateItemMinThreshold(item.code, thresholdValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-[#E8590C]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-heading text-base text-stone-900 dark:text-stone-100">
                Configure Minimum Threshold
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Automated low-stock safety buffer trigger
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Particulars */}
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
              {item.name}
            </span>
            <span className="font-mono text-stone-500 font-bold">[{item.code}]</span>
          </div>
          <div className="text-stone-500 dark:text-stone-400 flex items-center justify-between pt-1">
            <span>Location: <strong>{item.warehouseName}</strong></span>
            <span>Current Stock: <strong className="text-stone-900 dark:text-stone-100 font-mono text-sm">{item.currentQty} units</strong></span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Minimum Quantity Safety Threshold
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#E8590C]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                units
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              When stock drops to or below this quantity, the automated notification banner will flag this item as requiring replenishment.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-400 font-semibold">Presets:</span>
            {[10, 20, 30, 50, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setThresholdValue(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  thresholdValue === preset
                    ? 'bg-[#E8590C] text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Threshold</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
