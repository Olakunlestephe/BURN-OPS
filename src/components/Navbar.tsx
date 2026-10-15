import React from 'react';
import { useBurnOps } from '../context/BurnOpsContext';
import {
  Home,
  Boxes,
  ClipboardCheck,
  Building2,
  Truck,
  Globe2,
  Newspaper,
  ShieldCheck,
  MapPin,
  UserCheck,
  Flame,
} from 'lucide-react';
import { BurnState } from '../types';

export const Navbar: React.FC = () => {
  const {
    state,
    currentUser,
    setTab,
    setCurrentUserIndex,
    visibleWarehouses,
    currentWarehouseId,
    setWarehouse,
  } = useBurnOps();

  const navItems: { key: BurnState['tab']; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { key: 'stock', label: 'Stock', icon: <Boxes className="w-4 h-4" /> },
    { key: 'audit', label: 'Audit', icon: <ClipboardCheck className="w-4 h-4" /> },
    { key: 'sites', label: 'Sites', icon: <Building2 className="w-4 h-4" /> },
    { key: 'dispatch', label: 'Dispatch', icon: <Truck className="w-4 h-4" /> },
    { key: 'trade', label: 'Trade', icon: <Globe2 className="w-4 h-4" /> },
    { key: 'news', label: 'Updates', icon: <Newspaper className="w-4 h-4" /> },
    { key: 'admin', label: 'Admin', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#E8590C] text-white shadow-md print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div
            onClick={() => setTab('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-inner text-[#E8590C] group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 fill-[#E8590C] text-[#E8590C]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-xl font-heading tracking-tight text-white">
                  BURN
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 text-orange-100 px-1.5 py-0.5 rounded">
                  Ops
                </span>
              </div>
              <span className="text-[11px] font-medium text-orange-100/90 block leading-tight">
                Cookstoves &amp; Supply Chain
              </span>
            </div>
          </div>

          {/* Quick Context Controls */}
          <div className="flex items-center gap-2.5">
            {/* Warehouse Selector (if multiple available) */}
            {visibleWarehouses.length > 1 && (
              <div className="hidden sm:flex items-center gap-1 bg-black/15 px-2.5 py-1 rounded-lg border border-white/20">
                <MapPin className="w-3.5 h-3.5 text-orange-200" />
                <select
                  value={currentWarehouseId}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                  aria-label="Active warehouse selection"
                >
                  {visibleWarehouses.map((w) => (
                    <option key={w.id} value={w.id} className="text-stone-900 bg-white">
                      {w.n} ({w.reg})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Persona / User Switcher */}
            <div className="flex items-center gap-1.5 bg-white text-stone-900 rounded-xl px-2.5 py-1.5 shadow-sm border border-orange-300">
              <UserCheck className="w-4 h-4 text-[#E8590C] shrink-0" />
              <div className="flex flex-col">
                <select
                  value={state.me}
                  onChange={(e) => setCurrentUserIndex(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-stone-900 focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[190px] truncate"
                  aria-label="Signed in as user"
                >
                  {state.users.map((u, idx) => (
                    <option key={idx} value={idx}>
                      {u.n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop / Tablet Sub-navigation Tabs */}
        <div className="hidden md:block border-t border-orange-600/60 bg-[#D44E08]">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-1">
            {navItems.map((item) => {
              const active = state.tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all cursor-pointer ${
                    active
                      ? 'bg-stone-50 dark:bg-stone-900 text-[#E8590C] shadow-sm'
                      : 'text-orange-100 hover:text-white hover:bg-black/10'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Role & Access Info Strip */}
      <div className="bg-orange-50 dark:bg-stone-900/60 border-b border-orange-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs py-1.5 px-4 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              Signed in: {currentUser.n}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
              Role: {currentUser.r}
            </span>
            {currentUser.reg && (
              <span className="hidden sm:inline-block text-[11px] text-stone-500 dark:text-stone-400">
                Region: <strong className="text-stone-700 dark:text-stone-200">{currentUser.reg}</strong>
              </span>
            )}
            {currentUser.wh && (
              <span className="hidden sm:inline-block text-[11px] text-stone-500 dark:text-stone-400">
                Assigned Warehouse:{' '}
                <strong className="text-stone-700 dark:text-stone-200">
                  {visibleWarehouses.find((w) => w.id === currentUser.wh)?.n || currentUser.wh}
                </strong>
              </span>
            )}
          </div>

          {currentUser.r === 'officer' && currentUser.p && (
            <div className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
              <span>Permissions:</span>
              <span className="font-medium text-stone-800 dark:text-stone-200">
                {currentUser.p.join(', ') || 'View Only'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 flex items-center justify-around py-1 shadow-lg print:hidden safe-area-pb">
        {navItems.map((item) => {
          const active = state.tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 text-[10px] font-semibold transition-colors ${
                active
                  ? 'text-[#E8590C] font-bold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-transform ${
                  active ? 'bg-orange-100 dark:bg-orange-950/80 scale-110' : ''
                }`}
              >
                {item.icon}
              </div>
              <span className="truncate max-w-[48px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
