import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  BurnState,
  Warehouse,
  User,
  WarehouseData,
  NonSerialItem,
  Shipment,
  TradeShipment,
  NewsItem,
  LogEntry,
  OfficerPermission,
  SerialRecord,
  Role,
} from '../types';
import { sound } from '../utils/audio';

const STORAGE_KEY = 'burn_ops_v2';
const FULL_ROLES: Role[] = ['admin', 'manager', 'director'];

export const getDaysFromToday = (days: number): string => {
  return new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
};

export const createEmptyWarehouseData = (): WarehouseData => ({
  opening: [],
  received: [],
  out: [],
  counted: [],
  locked: false,
});

const generateInitialSeed = (): BurnState => {
  const TODAY = Date.now();
  const dt = getDaysFromToday;

  // Realistic Burn cookstove serial numbers for Nairobi Main (w1)
  const initialW1Opening: SerialRecord[] = [];
  for (let i = 1001; i <= 1024; i++) {
    initialW1Opening.push([`ECO-254-${i}`, 'BS-ECO-STOVE', TODAY - 864e5 * 10, 'Wanjiru (Admin)']);
  }
  for (let i = 2001; i <= 2012; i++) {
    initialW1Opening.push([`PRO-254-${i}`, 'BS-PRO-STOVE', TODAY - 864e5 * 10, 'Wanjiru (Admin)']);
  }

  // Initial received & out for Nairobi
  const initialW1Received: SerialRecord[] = [
    [`ECO-254-1025`, 'BS-ECO-STOVE', TODAY - 864e5 * 4, 'Njeri (Warehouse Officer)'],
    [`ECO-254-1026`, 'BS-ECO-STOVE', TODAY - 864e5 * 4, 'Njeri (Warehouse Officer)'],
    [`PRO-254-2013`, 'BS-PRO-STOVE', TODAY - 864e5 * 3, 'Njeri (Warehouse Officer)'],
  ];

  const initialW1Out: SerialRecord[] = [
    [`ECO-254-1002`, 'BS-ECO-STOVE', TODAY - 864e5 * 2, 'Njeri (Warehouse Officer)'],
    [`ECO-254-1003`, 'BS-ECO-STOVE', TODAY - 864e5 * 1, 'Njeri (Warehouse Officer)'],
  ];

  // Some serials already counted in audit
  const initialW1Counted: SerialRecord[] = initialW1Opening
    .slice(0, 18)
    .map(([s, sku]) => [s, sku, TODAY - 864e5, 'Njeri (Warehouse Officer)']);
  // Add an unknown serial to demonstrate unexpected items finding
  initialW1Counted.push([`UNKNOWN-BS-999`, 'BS-ECO-STOVE', TODAY - 864e5, 'Njeri (Warehouse Officer)']);

  // Initial serials for Kisumu (w2)
  const initialW2Opening: SerialRecord[] = [];
  for (let i = 3001; i <= 3015; i++) {
    initialW2Opening.push([`ECO-KIS-${i}`, 'BS-ECO-STOVE', TODAY - 864e5 * 7, 'Odhiambo (Regional, Western)']);
  }

  return {
    me: 0,
    tab: 'home',
    sel: 'w1',
    kind: null,
    act: null,
    sw: null,
    cat: null,
    dtab: 'transit',
    rc: null,
    td: null,
    users: [
      { id: 'u1', n: 'Wanjiru (Admin)', r: 'admin' },
      { id: 'u2', n: 'Kamau (Director)', r: 'director' },
      { id: 'u3', n: 'Otieno (Manager)', r: 'manager' },
      { id: 'u4', n: 'Achieng (Regional, Central)', r: 'regional', reg: 'Central' },
      { id: 'u5', n: 'Odhiambo (Regional, Western)', r: 'regional', reg: 'Western' },
      {
        id: 'u6',
        n: 'Njeri (Warehouse Officer)',
        r: 'officer',
        wh: 'w1',
        p: ['opening', 'receive', 'scanout', 'count'],
      },
      { id: 'u7', n: 'Executive SMT (Read-Only)', r: 'smt' },
    ],
    wh: [
      {
        id: 'w1',
        n: 'Nairobi Main',
        reg: 'Central',
        rent: 150000,
        due: dt(20),
        a: {
          Furniture: [{ n: 'Office desk & ergonomic chairs', q: 4 }, { n: 'Steel shelving unit 4-tier', q: 12 }],
          'Working tools': [
            { n: 'Dell Rugged Laptop', q: 3 },
            { n: 'Heavy-duty Power bank 30,000mAh', q: 6 },
            { n: 'Hand pallet truck 2.5T', q: 2 },
          ],
          Equipment: [{ n: 'Zebra Wireless Barcode scanner', q: 4 }, { n: 'Industrial floor scale 500kg', q: 1 }],
        },
      },
      {
        id: 'w2',
        n: 'Kisumu Depot',
        reg: 'Western',
        rent: 60000,
        due: dt(120),
        a: {
          Furniture: [{ n: 'Office desk', q: 2 }, { n: 'Storage rack', q: 6 }],
          'Working tools': [{ n: 'Depot Laptop', q: 1 }, { n: 'Power bank', q: 2 }],
          Equipment: [{ n: 'Datalogic Barcode scanner', q: 2 }],
        },
      },
      {
        id: 'w3',
        n: 'Mombasa Coastal Hub',
        reg: 'Coast',
        rent: 95000,
        due: dt(12), // Alert: due soon!
        a: {
          Furniture: [{ n: 'Office table', q: 2 }],
          'Working tools': [{ n: 'Field tablet', q: 2 }],
          Equipment: [{ n: 'Barcode scanner', q: 1 }, { n: 'Forklift 3T', q: 1 }],
        },
      },
    ],
    skus: ['BS-ECO-STOVE', 'BS-PRO-STOVE', 'BS-SUPER-CHARCOAL', 'BS-BIOMASS-DUAL'],
    ns: [
      { c: 'PELLET-10', n: 'Pellet bag 10kg', q: { w1: 120, w2: 40, w3: 15 }, min: 20 },
      { c: 'GASKET', n: 'Stove gasket seal', q: { w1: 300, w2: 90, w3: 8 }, min: 20 },
      { c: 'REGULATOR', n: 'LPG Gas Regulator 20mm', q: { w1: 85, w2: 25, w3: 5 }, min: 10 },
      { c: 'FLUE-PIPE', n: 'Chimney flue pipe 1.2m', q: { w1: 210, w2: 60, w3: 35 }, min: 25 },
    ],
    d: {
      w1: {
        opening: initialW1Opening,
        received: initialW1Received,
        out: initialW1Out,
        counted: initialW1Counted,
        locked: true,
      },
      w2: {
        opening: initialW2Opening,
        received: [],
        out: [],
        counted: [],
        locked: false,
      },
      w3: {
        opening: [
          [`ECO-MOM-4001`, 'BS-ECO-STOVE', TODAY - 864e5 * 5, 'Wanjiru (Admin)'],
          [`ECO-MOM-4002`, 'BS-ECO-STOVE', TODAY - 864e5 * 5, 'Wanjiru (Admin)'],
        ],
        received: [],
        out: [],
        counted: [],
        locked: false,
      },
    },
    flags: {
      'ECO-254-1019': 'investigating',
    },
    news: [
      {
        id: 'news-1',
        t: 'Kisumu depot stock count under way',
        k: 'Progress',
        b: 'Opening serials uploaded; 100% physically barcode scanned; preliminary reconciliation scheduled for Friday.',
        by: 'Odhiambo (Regional, Western)',
        at: TODAY - 864e5 * 1,
      },
      {
        id: 'news-2',
        t: 'Customs port clearance backlog at Mombasa',
        k: 'Challenge',
        b: 'Port congestion has delayed container BL-77421 inspection. Clearance agent appointed to expedite.',
        by: 'Achieng (Regional, Central)',
        at: TODAY - 864e5 * 2,
      },
      {
        id: 'news-3',
        t: 'New batch of BS-PRO-STOVE distributed to regional depots',
        k: 'Progress',
        b: 'Factory dispatch completed successfully with zero transit variance.',
        by: 'Otieno (Manager)',
        at: TODAY - 864e5 * 4,
      },
    ],
    ships: [
      {
        id: 'TR-1001',
        from: 'F',
        to: 'w1',
        kind: 'ser',
        item: 'BS-ECO-STOVE',
        qty: 50,
        eta: dt(3),
        st: 'transit',
        by: 'Achieng (Regional, Central)',
      },
      {
        id: 'TR-1002',
        from: 'w1',
        to: 'w2',
        kind: 'ns',
        item: 'Stove gasket seal',
        qty: 100,
        eta: dt(5),
        st: 'transit',
        by: 'Achieng (Regional, Central)',
      },
      {
        id: 'TR-1003',
        from: 'w1',
        to: 'w3',
        kind: 'ser',
        item: 'BS-PRO-STOVE',
        qty: 20,
        eta: dt(-1), // overdue
        st: 'transit',
        by: 'Wanjiru (Admin)',
      },
    ],
    trade: [
      {
        id: 'T-1',
        type: 'import',
        ref: 'BL-77421',
        desc: 'Stove cast-iron components, 2x40ft containers',
        party: 'Shenzhen Precision Clean Energy Ltd',
        reg: 'Central',
        stage: 'At port / customs',
        dest: 'w1',
        eta: dt(3),
        docs: { 0: true, 1: true, 2: true, 3: true, 4: false, 5: false, 6: false },
        by: 'Achieng (Regional, Central)',
        leadTimeDays: 32,
        stageDays: {
          documentation: 4,
          transit: 18,
          portCustoms: 8, // Bottleneck: 8 days vs 3 target
          clearance: 0,
          delivery: 2,
        },
        bottleneck: 'Port customs clearance backlog at Mombasa Terminal 2',
        originPort: 'Port of Shenzhen (Yantian)',
        destPort: 'Kilindini Port (Mombasa)',
      },
      {
        id: 'T-2',
        type: 'export',
        ref: 'EXP-KE-2026-08',
        desc: '500x BS-ECO Cookstoves export batch to Tanzania',
        party: 'East Africa Clean Fuels Ltd (Arusha)',
        reg: 'Western',
        stage: 'Documentation',
        dest: 'w2',
        eta: dt(18),
        docs: { 0: true, 1: true, 2: false, 3: false, 4: false, 5: false },
        by: 'Odhiambo (Regional, Western)',
        leadTimeDays: 14,
        stageDays: {
          documentation: 6, // Bottleneck: Certificate of Origin verification
          transit: 5,
          portCustoms: 2,
          clearance: 1,
          delivery: 0,
        },
        bottleneck: 'Pending Certificate of Origin & EAC Trade Entry stamps',
        originPort: 'Kisumu Inland Depot',
        destPort: 'Namanga Border Customs Bay',
      },
      {
        id: 'T-3',
        type: 'import',
        ref: 'BL-99304',
        desc: '1200x LPG Burner Brass Valves & 20mm Gas Regulators',
        party: 'Gujarat Energy Components Corp (Mundra)',
        reg: 'Coast',
        stage: 'In transit',
        dest: 'w3',
        eta: dt(9),
        docs: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: false, 6: false },
        by: 'Wanjiru (Admin)',
        leadTimeDays: 22,
        stageDays: {
          documentation: 3,
          transit: 14,
          portCustoms: 3,
          clearance: 1,
          delivery: 1,
        },
        originPort: 'Mundra Port (India)',
        destPort: 'Kilindini Port (Mombasa)',
      },
      {
        id: 'T-4',
        type: 'import',
        ref: 'AWB-44102',
        desc: 'Precision Thermal Efficiency Sensors & Flame Calibrators',
        party: 'Testo SE & Co. KGaA (Frankfurt)',
        reg: 'Central',
        stage: 'Cleared',
        dest: 'w1',
        eta: dt(1),
        docs: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true },
        by: 'Otieno (Manager)',
        leadTimeDays: 5,
        stageDays: {
          documentation: 1,
          transit: 2,
          portCustoms: 1,
          clearance: 1,
          delivery: 0,
        },
        originPort: 'Frankfurt Cargo Hub (FRA)',
        destPort: 'JKIA Air Cargo Terminal (NBO)',
      },
      {
        id: 'T-5',
        type: 'export',
        ref: 'EXP-RW-2026-02',
        desc: '1500x BS-PRO Clean Cookstoves to Kigali Regional Distribution',
        party: 'Rwanda Climate Energy Initiative',
        reg: 'Western',
        stage: 'Delivered',
        dest: 'w2',
        eta: dt(-3),
        docs: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true },
        by: 'Odhiambo (Regional, Western)',
        leadTimeDays: 16,
        stageDays: {
          documentation: 3,
          transit: 7,
          portCustoms: 2,
          clearance: 2,
          delivery: 2,
        },
        originPort: 'Kisumu Depot',
        destPort: 'Kigali Free Zone Hub',
      },
    ],
    log: [
      { m: 'System initialized with Burn Ops production schema', by: 'Wanjiru (Admin)', at: TODAY - 864e5 * 10 },
      { m: 'Nairobi Main opening balance locked', by: 'Wanjiru (Admin)', at: TODAY - 864e5 * 9 },
      { m: 'Transfer TR-1001 created: Factory → Nairobi Main', by: 'Achieng (Regional, Central)', at: TODAY - 864e5 * 2 },
    ],
  };
};

interface BurnOpsContextType {
  state: BurnState;
  currentUser: User;
  isFull: boolean;
  isAp: boolean;
  can: (perm: OfficerPermission) => boolean;
  visibleWarehouses: Warehouse[];
  currentWarehouseId: string;
  currentWarehouse: Warehouse | undefined;
  toastMessage: string | null;
  showToast: (msg: string, isError?: boolean) => void;
  // Navigation
  setTab: (tab: BurnState['tab']) => void;
  setWarehouse: (id: string) => void;
  setCurrentUserIndex: (idx: number) => void;
  setKind: (kind: 'ser' | 'ns' | null) => void;
  setAct: (act: 'in' | 'out' | 'opening' | 'ret' | null) => void;
  setSiteWarehouse: (id: string | null) => void;
  setSiteCategory: (cat: string | null) => void;
  setDispatchTab: (tab: 'transit' | 'done') => void;
  setReceiptTarget: (id: string | null) => void;
  setTradeDetail: (id: string | null) => void;
  // Calculations
  getExpectedStock: (warehouseId: string) => Map<string, string>;
  getAuditData: (warehouseId: string) => {
    d: WarehouseData;
    ex: Map<string, string>;
    miss: [string, string][];
    unk: SerialRecord[];
  };
  getDaysUntilDue: (dueStr: string) => number;
  getWarehouseName: (id: string) => string;
  // Stock actions
  saveSerials: (
    warehouseId: string,
    action: 'in' | 'out' | 'opening' | 'ret',
    rawText: string,
    defaultSku: string
  ) => boolean;
  saveNonSerial: (
    warehouseId: string,
    action: 'in' | 'out' | 'opening' | 'ret',
    itemKey: string,
    qty: number,
    newCode?: string,
    newName?: string
  ) => boolean;
  unlockOpening: (warehouseId: string) => void;
  removeOpeningSerial: (warehouseId: string, serial: string) => void;
  // Audit actions
  addCountedSerials: (warehouseId: string, rawText: string) => number;
  clearAuditCount: (warehouseId: string) => void;
  setFlagStatus: (serial: string, status: 'investigating' | 'resolved') => void;
  closeMonth: (warehouseId: string) => boolean;
  // Sites & Assets
  adjustAssetQuantity: (warehouseId: string, category: string, index: number, delta: number) => void;
  addAssetItem: (warehouseId: string, category: string, name: string, qty: number) => void;
  updateRentInfo: (warehouseId: string, rent: number, due: string) => void;
  addWarehouse: (name: string, region: string) => void;
  // Dispatch transfers
  createShipment: (shipment: {
    from: string;
    to: string;
    kind: 'ser' | 'ns';
    item: string;
    qty: number;
    eta: string;
  }) => boolean;
  confirmReceipt: (
    shipmentId: string,
    receivedQtyOrSerials: { rawSerials?: string; qty?: number }
  ) => boolean;
  // Trade
  createTrade: (trade: {
    type: 'import' | 'export';
    ref: string;
    desc: string;
    party: string;
    reg: string;
  }) => boolean;
  toggleTradeDocument: (tradeId: string, docIndex: number, checked: boolean) => void;
  saveTradeStatus: (tradeId: string, stage: string, dest: string, eta: string) => void;
  // Updates & News
  postUpdate: (title: string, kind: 'Progress' | 'Challenge', body: string) => boolean;
  // Admin & Users
  createUser: (user: {
    name: string;
    role: Role;
    warehouseId?: string;
    region?: string;
    permissions?: OfficerPermission[];
  }) => boolean;
  exportCSV: (filename: string, rows: (string | number)[][]) => void;
  updateItemMinThreshold: (code: string, minThreshold: number) => void;
  exportAuditReportExcel: (warehouseId?: string) => void;
  exportAuditReportCSV: (warehouseId?: string) => void;
  resetAllData: () => void;
  findSerialInfo: (serial: string) => {
    warehouseName: string;
    sku: string;
    status: string;
    date?: string;
    user?: string;
  }[];
}

const BurnOpsContext = createContext<BurnOpsContextType | null>(null);

export const sanitizeState = (raw: any): BurnState => {
  const seed = generateInitialSeed();
  if (!raw || typeof raw !== 'object') return seed;

  const users = Array.isArray(raw.users) && raw.users.length > 0 ? raw.users : seed.users;
  const me = typeof raw.me === 'number' && raw.me >= 0 && raw.me < users.length ? raw.me : 0;

  const validTabs: BurnState['tab'][] = [
    'home',
    'stock',
    'audit',
    'sites',
    'dispatch',
    'trade',
    'news',
    'admin',
  ];
  const tab = validTabs.includes(raw.tab) ? raw.tab : 'home';

  const wh = Array.isArray(raw.wh) && raw.wh.length > 0 ? raw.wh : seed.wh;
  const sel = wh.some((w: any) => w.id === raw.sel) ? raw.sel : wh[0]?.id || 'w1';

  // Sanitize Trade Shipments so every item has leadTimeDays, stageDays, docs, dest, reg, type
  const rawTrade = Array.isArray(raw.trade) && raw.trade.length > 0 ? raw.trade : seed.trade;
  const trade = rawTrade.map((t: any, idx: number) => {
    const isExport = t.type === 'export';
    const defaultDocs: { [key: number]: boolean } = isExport
      ? { 0: true, 1: true, 2: false, 3: false, 4: false, 5: false }
      : { 0: true, 1: true, 2: true, 3: false, 4: false, 5: false, 6: false };

    return {
      id: t.id || `T-${idx + 1}`,
      type: isExport ? 'export' : 'import',
      ref: t.ref || `TR-${idx + 100}`,
      desc: t.desc || 'Clean Cookstove and components shipment',
      party: t.party || 'Burn Global Logistics',
      reg: t.reg || 'Central',
      stage: t.stage || 'In transit',
      dest: t.dest || 'w1',
      eta: t.eta || getDaysFromToday(7),
      docs: t.docs && typeof t.docs === 'object' ? t.docs : defaultDocs,
      by: t.by || 'System Admin',
      leadTimeDays: typeof t.leadTimeDays === 'number' ? t.leadTimeDays : 18,
      stageDays: {
        documentation: t.stageDays?.documentation ?? 3,
        transit: t.stageDays?.transit ?? 12,
        portCustoms: t.stageDays?.portCustoms ?? 4,
        clearance: t.stageDays?.clearance ?? 1,
        delivery: t.stageDays?.delivery ?? 1,
      },
      bottleneck: t.bottleneck || undefined,
      originPort: t.originPort || 'Port of Origin',
      destPort: t.destPort || 'Destination Bay',
    };
  });

  const flags = raw.flags && typeof raw.flags === 'object' ? raw.flags : seed.flags;
  const ns = Array.isArray(raw.ns) && raw.ns.length > 0 ? raw.ns : seed.ns;
  const d = raw.d && typeof raw.d === 'object' ? { ...seed.d, ...raw.d } : seed.d;
  const ships = Array.isArray(raw.ships) ? raw.ships : seed.ships;
  const news = Array.isArray(raw.news) ? raw.news : seed.news;
  const skus = Array.isArray(raw.skus) && raw.skus.length > 0 ? raw.skus : seed.skus;
  const log = Array.isArray(raw.log) ? raw.log : seed.log;

  return {
    me,
    tab,
    sel,
    kind: raw.kind ?? null,
    act: raw.act ?? null,
    sw: raw.sw ?? null,
    cat: raw.cat ?? null,
    dtab: raw.dtab === 'done' ? 'done' : 'transit',
    rc: raw.rc ?? null,
    td: raw.td ?? null,
    users,
    wh,
    skus,
    ns,
    d,
    flags,
    news,
    ships,
    trade,
    log,
  };
};

export const BurnOpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BurnState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            return sanitizeState(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to parse localStorage:', e);
      }
    }
    return generateInitialSeed();
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [state]);

  const showToast = useCallback((msg: string, isError = false) => {
    setToastMessage(msg);
    if (isError) {
      sound.playWarning();
    } else {
      sound.playSuccess();
    }
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const currentUser = useMemo(() => {
    return state.users[state.me] || state.users[0];
  }, [state.users, state.me]);

  const isFull = useMemo(() => {
    return FULL_ROLES.includes(currentUser.r);
  }, [currentUser.r]);

  const isAp = useMemo(() => {
    return isFull || currentUser.r === 'regional';
  }, [isFull, currentUser.r]);

  const can = useCallback(
    (perm: OfficerPermission) => {
      if (isAp) return true;
      if (currentUser.r === 'officer' && (currentUser.p || []).includes(perm)) return true;
      return false;
    },
    [isAp, currentUser]
  );

  const visibleWarehouses = useMemo(() => {
    if (isFull || currentUser.r === 'smt') {
      return state.wh;
    }
    if (currentUser.r === 'regional') {
      return state.wh.filter((w) => w.reg === currentUser.reg);
    }
    return state.wh.filter((w) => w.id === currentUser.wh);
  }, [isFull, currentUser, state.wh]);

  // Ensure selected warehouse is valid
  const currentWarehouseId = useMemo(() => {
    if (visibleWarehouses.length === 0) return '';
    const exists = visibleWarehouses.find((w) => w.id === state.sel);
    return exists ? exists.id : visibleWarehouses[0].id;
  }, [visibleWarehouses, state.sel]);

  const currentWarehouse = useMemo(() => {
    return state.wh.find((w) => w.id === currentWarehouseId);
  }, [state.wh, currentWarehouseId]);

  const getWarehouseName = useCallback(
    (id: string) => {
      if (id === 'F') return 'Main Burn Factory (Nairobi)';
      const match = state.wh.find((w) => w.id === id);
      return match ? match.n : id || 'Unknown Warehouse';
    },
    [state.wh]
  );

  const getDaysUntilDue = useCallback((dueStr: string) => {
    if (!dueStr) return 999;
    const diff = new Date(dueStr).getTime() - Date.now();
    return Math.ceil(diff / 864e5);
  }, []);

  const addLog = useCallback(
    (m: string) => {
      setState((prev) => {
        const newLog: LogEntry = {
          m,
          by: (prev.users[prev.me] || prev.users[0]).n,
          at: Date.now(),
        };
        return {
          ...prev,
          log: [newLog, ...prev.log].slice(0, 200),
        };
      });
    },
    []
  );

  // Navigation handlers
  const setTab = useCallback((tab: BurnState['tab']) => {
    setState((prev) => ({
      ...prev,
      tab,
      kind: null,
      act: null,
      sw: null,
      cat: null,
      rc: null,
      td: null,
    }));
  }, []);

  const setWarehouse = useCallback((id: string) => {
    setState((prev) => ({ ...prev, sel: id }));
  }, []);

  const setCurrentUserIndex = useCallback(
    (idx: number) => {
      setState((prev) => {
        const user = prev.users[idx];
        let nextSel = prev.sel;
        if (user && user.r === 'officer' && user.wh) {
          nextSel = user.wh;
        } else if (user && user.r === 'regional' && user.reg) {
          const matchReg = prev.wh.find((w) => w.reg === user.reg);
          if (matchReg) nextSel = matchReg.id;
        }
        return {
          ...prev,
          me: idx,
          sel: nextSel,
          kind: null,
          act: null,
          sw: null,
          cat: null,
          rc: null,
          td: null,
        };
      });
      showToast(`Switched user view to ${state.users[idx]?.n || 'User'}`);
    },
    [state.users, showToast]
  );

  const setKind = useCallback((kind: 'ser' | 'ns' | null) => {
    setState((prev) => ({ ...prev, kind, act: null }));
  }, []);

  const setAct = useCallback((act: 'in' | 'out' | 'opening' | 'ret' | null) => {
    setState((prev) => ({ ...prev, act }));
  }, []);

  const setSiteWarehouse = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, sw: id, cat: null }));
  }, []);

  const setSiteCategory = useCallback((cat: string | null) => {
    setState((prev) => ({ ...prev, cat }));
  }, []);

  const setDispatchTab = useCallback((tab: 'transit' | 'done') => {
    setState((prev) => ({ ...prev, dtab: tab, rc: null }));
  }, []);

  const setReceiptTarget = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, rc: id }));
  }, []);

  const setTradeDetail = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, td: id }));
  }, []);

  // Stock calculation functions
  const getExpectedStock = useCallback(
    (warehouseId: string): Map<string, string> => {
      const d = state.d[warehouseId] || createEmptyWarehouseData();
      const outSet = new Set(d.out.map((x) => x[0]));
      const expectedMap = new Map<string, string>();
      [...d.opening, ...d.received].forEach(([serial, sku]) => {
        if (!outSet.has(serial)) {
          expectedMap.set(serial, sku);
        }
      });
      return expectedMap;
    },
    [state.d]
  );

  const getAuditData = useCallback(
    (warehouseId: string) => {
      const d = state.d[warehouseId] || createEmptyWarehouseData();
      const ex = getExpectedStock(warehouseId);
      const countedSet = new Set(d.counted.map((x) => x[0]));

      const miss: [string, string][] = [];
      ex.forEach((sku, serial) => {
        if (!countedSet.has(serial)) {
          miss.push([serial, sku]);
        }
      });

      const unk = d.counted.filter(([s]) => !ex.has(s));

      return { d, ex, miss, unk };
    },
    [state.d, getExpectedStock]
  );

  // Serial stock actions
  const saveSerials = useCallback(
    (warehouseId: string, action: 'in' | 'out' | 'opening' | 'ret', rawText: string, defaultSku: string) => {
      const permMap: Record<string, OfficerPermission> = {
        opening: 'opening',
        in: 'receive',
        out: 'scanout',
        ret: 'receive',
      };
      if (!can(permMap[action])) {
        showToast('You do not have permission for this stock action', true);
        return false;
      }

      const d = state.d[warehouseId] || createEmptyWarehouseData();
      if (action === 'opening' && d.locked && !isAp) {
        showToast('Opening stock is locked. Ask a manager to unlock it.', true);
        return false;
      }

      const lines = Array.from(new Set(rawText.split('\n').map((l) => l.trim()).filter(Boolean)));
      if (!lines.length) {
        showToast('Please enter, scan, or upload serial numbers first', true);
        return false;
      }

      const defSku = defaultSku.trim() || 'UNSORTED';
      const expected = getExpectedStock(warehouseId);
      const allKnown = new Map<string, string>();
      [...d.opening, ...d.received, ...d.out].forEach(([s, k]) => allKnown.set(s, k));

      const parsed: SerialRecord[] = lines.map((line) => {
        const parts = line.split(/[\s,;]+/);
        const serial = parts[0];
        let sku = parts[1] || defSku;
        if (sku === defSku && defSku === 'UNSORTED' && allKnown.has(serial)) {
          sku = allKnown.get(serial)!;
        }
        return [serial, sku, Date.now(), currentUser.n];
      });

      setState((prev) => {
        const prevD = prev.d[warehouseId] || createEmptyWarehouseData();
        const nextD: WarehouseData = {
          ...prevD,
          opening: [...prevD.opening],
          received: [...prevD.received],
          out: [...prevD.out],
          counted: [...prevD.counted],
        };
        const nextSkus = [...prev.skus];

        let countSaved = 0;

        if (action === 'out') {
          const existingOutSet = new Set(nextD.out.map((x) => x[0]));
          const newOut = parsed.filter((x) => !existingOutSet.has(x[0]));
          newOut.forEach(([s, k, t, u]) => {
            const resolvedSku = expected.get(s) || allKnown.get(s) || k;
            nextD.out.push([s, resolvedSku, t, u]);
          });
          countSaved = newOut.length;
        } else if (action === 'ret') {
          const retSerials = new Set(parsed.map((x) => x[0]));
          nextD.out = nextD.out.filter((x) => !retSerials.has(x[0]));
          const existingIn = new Set([...nextD.opening, ...nextD.received].map((x) => x[0]));
          const newIn = parsed.filter((x) => !existingIn.has(x[0]));
          nextD.received.push(...newIn);
          countSaved = parsed.length;
        } else {
          const targetKey = action === 'in' ? 'received' : 'opening';
          const existingSet = new Set(nextD[targetKey].map((x) => x[0]));
          const toAdd = parsed.filter((x) => !existingSet.has(x[0]));
          nextD[targetKey].push(...toAdd);
          if (action === 'opening') {
            nextD.locked = true;
          }
          countSaved = toAdd.length;
        }

        parsed.forEach(([, k]) => {
          if (k && k !== 'UNSORTED' && !nextSkus.includes(k)) {
            nextSkus.push(k);
          }
        });

        const nextLog: LogEntry = {
          m: `${action.toUpperCase()}: ${countSaved} serials saved at ${getWarehouseName(warehouseId)}`,
          by: currentUser.n,
          at: Date.now(),
        };

        return {
          ...prev,
          skus: nextSkus,
          d: {
            ...prev.d,
            [warehouseId]: nextD,
          },
          act: null,
          log: [nextLog, ...prev.log].slice(0, 200),
        };
      });

      showToast(`Successfully processed ${parsed.length} serials for ${getWarehouseName(warehouseId)}`);
      return true;
    },
    [can, state.d, isAp, getExpectedStock, currentUser, getWarehouseName, showToast]
  );

  // Non-serial stock action
  const saveNonSerial = useCallback(
    (
      warehouseId: string,
      action: 'in' | 'out' | 'opening' | 'ret',
      itemKey: string,
      qty: number,
      newCode?: string,
      newName?: string
    ) => {
      const permMap: Record<string, OfficerPermission> = {
        opening: 'opening',
        in: 'receive',
        out: 'scanout',
        ret: 'receive',
      };
      if (!can(permMap[action])) {
        showToast('You do not have permission for this non-serial action', true);
        return false;
      }
      if (action === 'opening' && !isAp) {
        showToast('Only a manager or supervisor can set opening inventory quantity', true);
        return false;
      }
      if (isNaN(qty) || qty < 0) {
        showToast('Please enter a valid non-negative quantity', true);
        return false;
      }

      setState((prev) => {
        const nextNs = prev.ns.map((item) => ({ ...item, q: { ...item.q } }));
        let targetItem: NonSerialItem | undefined;

        if (itemKey === '+') {
          if (!newCode?.trim() || !newName?.trim()) {
            return prev;
          }
          const existing = nextNs.find((x) => x.c.toLowerCase() === newCode.trim().toLowerCase());
          if (existing) {
            targetItem = existing;
          } else {
            targetItem = {
              c: newCode.trim().toUpperCase(),
              n: newName.trim(),
              q: {},
              min: 20,
            };
            nextNs.push(targetItem);
          }
        } else {
          targetItem = nextNs.find((x) => x.c === itemKey);
        }

        if (!targetItem) return prev;

        const currentQty = targetItem.q[warehouseId] || 0;
        let finalQty = currentQty;

        if (action === 'opening') {
          finalQty = qty;
        } else if (action === 'out') {
          finalQty = Math.max(0, currentQty - qty);
        } else {
          finalQty = currentQty + qty;
        }

        targetItem.q[warehouseId] = finalQty;

        const nextLog: LogEntry = {
          m: `Non-serial ${targetItem.n} (${action.toUpperCase()} ${qty}): Balance now ${finalQty} at ${getWarehouseName(
            warehouseId
          )}`,
          by: currentUser.n,
          at: Date.now(),
        };

        return {
          ...prev,
          ns: nextNs,
          act: null,
          log: [nextLog, ...prev.log].slice(0, 200),
        };
      });

      showToast(`Updated non-serial quantity successfully`);
      return true;
    },
    [can, isAp, currentUser.n, getWarehouseName, showToast]
  );

  const unlockOpening = useCallback(
    (warehouseId: string) => {
      if (!isAp) {
        showToast('Only managers and supervisors can unlock opening stock', true);
        return;
      }
      setState((prev) => {
        const target = prev.d[warehouseId] || createEmptyWarehouseData();
        return {
          ...prev,
          d: {
            ...prev.d,
            [warehouseId]: {
              ...target,
              locked: false,
            },
          },
        };
      });
      addLog(`Unlocked opening stock for ${getWarehouseName(warehouseId)}`);
      showToast('Opening stock unlocked for editing');
    },
    [isAp, addLog, getWarehouseName, showToast]
  );

  const removeOpeningSerial = useCallback(
    (warehouseId: string, serial: string) => {
      if (!isAp) {
        showToast('Only managers can remove opening serial records', true);
        return;
      }
      const s = serial.trim();
      if (!s) return;
      setState((prev) => {
        const d = prev.d[warehouseId] || createEmptyWarehouseData();
        return {
          ...prev,
          d: {
            ...prev.d,
            [warehouseId]: {
              ...d,
              opening: d.opening.filter((x) => x[0] !== s),
            },
          },
        };
      });
      showToast(`Removed opening serial ${s}`);
    },
    [isAp, showToast]
  );

  // Audit actions
  const addCountedSerials = useCallback(
    (warehouseId: string, rawText: string) => {
      if (!can('count')) {
        showToast('You do not have permission to submit audit counts', true);
        return 0;
      }
      const lines = Array.from(new Set(rawText.split('\n').map((l) => l.trim()).filter(Boolean)));
      if (!lines.length) {
        showToast('No serials to add to count', true);
        return 0;
      }

      const ex = getExpectedStock(warehouseId);
      const d = state.d[warehouseId] || createEmptyWarehouseData();
      const existingCountedSet = new Set(d.counted.map((x) => x[0]));

      const newCounted: SerialRecord[] = [];
      lines.forEach((line) => {
        const parts = line.split(/[\s,;]+/);
        const serial = parts[0];
        if (!existingCountedSet.has(serial)) {
          const sku = ex.get(serial) || parts[1] || 'UNKNOWN';
          newCounted.push([serial, sku, Date.now(), currentUser.n]);
          existingCountedSet.add(serial);
        }
      });

      setState((prev) => {
        const prevD = prev.d[warehouseId] || createEmptyWarehouseData();
        const nextLog: LogEntry = {
          m: `Count recorded: +${newCounted.length} serials at ${getWarehouseName(warehouseId)}`,
          by: currentUser.n,
          at: Date.now(),
        };
        return {
          ...prev,
          d: {
            ...prev.d,
            [warehouseId]: {
              ...prevD,
              counted: [...prevD.counted, ...newCounted],
            },
          },
          log: [nextLog, ...prev.log].slice(0, 200),
        };
      });

      showToast(`Added ${newCounted.length} verified counted serials to audit`);
      return newCounted.length;
    },
    [can, getExpectedStock, state.d, currentUser, getWarehouseName, showToast]
  );

  const clearAuditCount = useCallback(
    (warehouseId: string) => {
      setState((prev) => {
        const d = prev.d[warehouseId] || createEmptyWarehouseData();
        return {
          ...prev,
          d: {
            ...prev.d,
            [warehouseId]: {
              ...d,
              counted: [],
            },
          },
        };
      });
      addLog(`Cleared audit count at ${getWarehouseName(warehouseId)}`);
      showToast('Counted serials reset for this audit cycle');
    },
    [addLog, getWarehouseName, showToast]
  );

  const setFlagStatus = useCallback((serial: string, status: 'investigating' | 'resolved') => {
    setState((prev) => ({
      ...prev,
      flags: {
        ...prev.flags,
        [serial]: status,
      },
    }));
  }, []);

  const closeMonth = useCallback(
    (warehouseId: string) => {
      if (!isAp) {
        showToast('Only managers and supervisors can execute month close', true);
        return false;
      }
      const audit = getAuditData(warehouseId);
      const confirmed = window.confirm(
        `Are you sure you want to close the month for ${getWarehouseName(
          warehouseId
        )}?\n\nCurrent expected balance (${audit.ex.size} serials) will roll forward as the new locked Opening Stock.\nTransient records will be archived.`
      );
      if (!confirmed) return false;

      setState((prev) => {
        const nextOpening: SerialRecord[] = Array.from(audit.ex.entries()).map(([s, k]) => [
          s,
          k,
          Date.now(),
          'Month Close Roll-Forward',
        ]);

        const nextLog: LogEntry = {
          m: `Closed month for ${getWarehouseName(warehouseId)} with ${nextOpening.length} serials rolled into opening`,
          by: currentUser.n,
          at: Date.now(),
        };

        return {
          ...prev,
          d: {
            ...prev.d,
            [warehouseId]: {
              opening: nextOpening,
              received: [],
              out: [],
              counted: [],
              locked: true,
            },
          },
          log: [nextLog, ...prev.log].slice(0, 200),
        };
      });

      showToast(`Month closed successfully for ${getWarehouseName(warehouseId)}`);
      return true;
    },
    [isAp, getAuditData, getWarehouseName, currentUser.n, showToast]
  );

  // Asset actions
  const adjustAssetQuantity = useCallback(
    (warehouseId: string, category: string, index: number, delta: number) => {
      setState((prev) => {
        const whIndex = prev.wh.findIndex((w) => w.id === warehouseId);
        if (whIndex === -1) return prev;
        const targetWh = { ...prev.wh[whIndex], a: { ...prev.wh[whIndex].a } };
        const catKey = category as keyof Warehouse['a'];
        const list = [...(targetWh.a[catKey] || [])];
        if (!list[index]) return prev;
        list[index] = {
          ...list[index],
          q: Math.max(0, list[index].q + delta),
        };
        targetWh.a[catKey] = list;
        const nextWh = [...prev.wh];
        nextWh[whIndex] = targetWh;
        return { ...prev, wh: nextWh };
      });
    },
    []
  );

  const addAssetItem = useCallback(
    (warehouseId: string, category: string, name: string, qty: number) => {
      if (!name.trim()) return;
      setState((prev) => {
        const whIndex = prev.wh.findIndex((w) => w.id === warehouseId);
        if (whIndex === -1) return prev;
        const targetWh = { ...prev.wh[whIndex], a: { ...prev.wh[whIndex].a } };
        const catKey = category as keyof Warehouse['a'];
        const list = [...(targetWh.a[catKey] || [])];
        list.push({ n: name.trim(), q: Math.max(1, qty || 1) });
        targetWh.a[catKey] = list;
        const nextWh = [...prev.wh];
        nextWh[whIndex] = targetWh;
        return { ...prev, wh: nextWh };
      });
      showToast(`Added ${name} to ${category}`);
    },
    [showToast]
  );

  const updateRentInfo = useCallback(
    (warehouseId: string, rent: number, due: string) => {
      setState((prev) => {
        const whIndex = prev.wh.findIndex((w) => w.id === warehouseId);
        if (whIndex === -1) return prev;
        const nextWh = [...prev.wh];
        nextWh[whIndex] = {
          ...nextWh[whIndex],
          rent: Number(rent) || 0,
          due: due || nextWh[whIndex].due,
        };
        return { ...prev, wh: nextWh };
      });
      showToast('Rent and lease parameters updated');
    },
    [showToast]
  );

  const addWarehouse = useCallback(
    (name: string, region: string) => {
      if (!name.trim()) return;
      const newId = 'w_' + Date.now();
      const newWh: Warehouse = {
        id: newId,
        n: name.trim(),
        reg: region.trim() || 'Unassigned',
        rent: 0,
        due: getDaysFromToday(365),
        a: {
          Furniture: [],
          'Working tools': [],
          Equipment: [],
        },
      };

      setState((prev) => ({
        ...prev,
        wh: [...prev.wh, newWh],
        d: {
          ...prev.d,
          [newId]: createEmptyWarehouseData(),
        },
      }));

      addLog(`Added new warehouse facility: ${name} (${region})`);
      showToast(`Warehouse "${name}" created successfully`);
    },
    [addLog, showToast]
  );

  // Dispatch / Transfers
  const createShipment = useCallback(
    ({
      from,
      to,
      kind,
      item,
      qty,
      eta,
    }: {
      from: string;
      to: string;
      kind: 'ser' | 'ns';
      item: string;
      qty: number;
      eta: string;
    }) => {
      if (from === to) {
        showToast('Origin and destination warehouses cannot be the same', true);
        return false;
      }
      if (!item.trim() || !qty || qty <= 0 || !eta) {
        showToast('Please specify item, positive quantity, and expected delivery date', true);
        return false;
      }

      setState((prev) => {
        const newShipment: Shipment = {
          id: `TR-${1000 + prev.ships.length + 1}`,
          from,
          to,
          kind,
          item: item.trim(),
          qty,
          eta,
          st: 'transit',
          by: currentUser.n,
        };

        const nextNs = prev.ns.map((x) => ({ ...x, q: { ...x.q } }));
        // If non-serial and coming from a warehouse (not Factory), deduct origin stock
        if (from !== 'F' && kind === 'ns') {
          const match = nextNs.find((x) => x.n === item || x.c === item);
          if (match) {
            match.q[from] = Math.max(0, (match.q[from] || 0) - qty);
          }
        }

        const nextLog: LogEntry = {
          m: `Dispatch transfer created: ${newShipment.id} (${qty}x ${item}) from ${getWarehouseName(
            from
          )} to ${getWarehouseName(to)}`,
          by: currentUser.n,
          at: Date.now(),
        };

        return {
          ...prev,
          ships: [newShipment, ...prev.ships],
          ns: nextNs,
          dtab: 'transit',
          log: [nextLog, ...prev.log].slice(0, 200),
        };
      });

      showToast(`Transfer shipment created! Destination warehouse notified.`);
      return true;
    },
    [currentUser.n, getWarehouseName, showToast]
  );

  const confirmReceipt = useCallback(
    (shipmentId: string, { rawSerials, qty }: { rawSerials?: string; qty?: number }) => {
      const ship = state.ships.find((s) => s.id === shipmentId);
      if (!ship) return false;

      setState((prev) => {
        const targetShip = prev.ships.find((s) => s.id === shipmentId);
        if (!targetShip) return prev;

        const destWarehouseId = targetShip.to;
        const prevD = prev.d[destWarehouseId] || createEmptyWarehouseData();
        const nextD: WarehouseData = {
          ...prevD,
          opening: [...prevD.opening],
          received: [...prevD.received],
          out: [...prevD.out],
          counted: [...prevD.counted],
        };
        const nextSkus = [...prev.skus];
        const nextNs = prev.ns.map((x) => ({ ...x, q: { ...x.q } }));

        let receivedCount = 0;

        if (targetShip.kind === 'ser') {
          const lines = Array.from(new Set((rawSerials || '').split('\n').map((l) => l.trim()).filter(Boolean)));
          const existingSerials = new Set([...nextD.opening, ...nextD.received].map((x) => x[0]));
          const toAdd: SerialRecord[] = lines
            .filter((l) => !existingSerials.has(l.split(/[\s,;]+/)[0]))
            .map((l) => {
              const p = l.split(/[\s,;]+/);
              return [p[0], p[1] || targetShip.item, Date.now(), currentUser.n];
            });

          nextD.received.push(...toAdd);
          receivedCount = toAdd.length;

          if (!nextSkus.includes(targetShip.item)) {
            nextSkus.push(targetShip.item);
          }
        } else {
          receivedCount = Number(qty) || 0;
          let match = nextNs.find((x) => x.n === targetShip.item || x.c === targetShip.item);
          if (!match) {
            match = {
              c: targetShip.item.toUpperCase().replace(/\s+/g, '-'),
              n: targetShip.item,
              q: {},
              min: 20,
            };
            nextNs.push(match);
          }
          match.q[destWarehouseId] = (match.q[destWarehouseId] || 0) + receivedCount;
        }

        const updatedShips = prev.ships.map((s) =>
          s.id === shipmentId
            ? {
                ...s,
                st: 'received' as const,
                rq: receivedCount,
                rat: Date.now(),
              }
            : s
        );

        const variance = receivedCount - targetShip.qty;
        const nextLog: LogEntry = {
          m: `Receipt confirmed for ${targetShip.id} at ${getWarehouseName(
            destWarehouseId
          )}: ${receivedCount} of ${targetShip.qty} units (Variance: ${variance})`,
          by: currentUser.n,
          at: Date.now(),
        };

        return {
          ...prev,
          ships: updatedShips,
          d: {
            ...prev.d,
            [destWarehouseId]: nextD,
          },
          skus: nextSkus,
          ns: nextNs,
          rc: null,
          log: [nextLog, ...prev.log].slice(0, 200),
        };
      });

      const variance = (qty !== undefined ? qty : 0) - ship.qty;
      if (variance === 0) {
        showToast(`Shipment ${ship.id} received in full (${ship.qty} units)`);
      } else {
        showToast(`Shipment ${ship.id} received with variance of ${variance > 0 ? `+${variance}` : variance}`);
      }
      return true;
    },
    [state.ships, currentUser.n, getWarehouseName, showToast]
  );

  // Trade actions
  const createTrade = useCallback(
    ({
      type,
      ref,
      desc,
      party,
      reg,
    }: {
      type: 'import' | 'export';
      ref: string;
      desc: string;
      party: string;
      reg: string;
    }) => {
      if (!ref.trim()) {
        showToast('Please specify a valid trade reference (BL, AWB, or Container #)', true);
        return false;
      }

      setState((prev) => {
        const newTrade: TradeShipment = {
          id: `T-${prev.trade.length + 1}`,
          type,
          ref: ref.trim(),
          desc: desc.trim(),
          party: party.trim(),
          reg: reg.trim() || 'Central',
          stage: 'Documentation',
          dest: '',
          eta: '',
          docs: {},
          by: currentUser.n,
        };

        return {
          ...prev,
          trade: [newTrade, ...prev.trade],
          log: [
            {
              m: `New ${type.toUpperCase()} shipment logged: ${newTrade.ref} (${newTrade.desc})`,
              by: currentUser.n,
              at: Date.now(),
            },
            ...prev.log,
          ].slice(0, 200),
        };
      });

      showToast(`Trade shipment ${ref} tracking started`);
      return true;
    },
    [currentUser.n, showToast]
  );

  const toggleTradeDocument = useCallback((tradeId: string, docIndex: number, checked: boolean) => {
    setState((prev) => {
      const nextTrade = prev.trade.map((t) => {
        if (t.id !== tradeId) return t;
        return {
          ...t,
          docs: {
            ...t.docs,
            [docIndex]: checked,
          },
        };
      });
      return { ...prev, trade: nextTrade };
    });
  }, []);

  const saveTradeStatus = useCallback(
    (tradeId: string, stage: string, dest: string, eta: string) => {
      setState((prev) => {
        const nextTrade = prev.trade.map((t) => {
          if (t.id !== tradeId) return t;
          return {
            ...t,
            stage,
            dest,
            eta,
          };
        });
        return {
          ...prev,
          trade: nextTrade,
          td: null,
          log: [
            {
              m: `Updated trade shipment ${tradeId} stage: ${stage}${dest ? ` targeting ${getWarehouseName(dest)}` : ''}`,
              by: currentUser.n,
              at: Date.now(),
            },
            ...prev.log,
          ].slice(0, 200),
        };
      });

      showToast(dest && stage !== 'Documentation' ? `Status saved. ${getWarehouseName(dest)} alerted to prepare.` : 'Trade status updated');
    },
    [currentUser.n, getWarehouseName, showToast]
  );

  // Updates / News
  const postUpdate = useCallback(
    (title: string, kind: 'Progress' | 'Challenge', body: string) => {
      if (!title.trim()) {
        showToast('Please enter an update title', true);
        return false;
      }
      setState((prev) => {
        const item: NewsItem = {
          id: `news-${Date.now()}`,
          t: title.trim(),
          k: kind,
          b: body.trim(),
          by: currentUser.n,
          at: Date.now(),
        };
        return {
          ...prev,
          news: [item, ...prev.news],
        };
      });
      showToast('Field operation update broadcasted');
      return true;
    },
    [currentUser.n, showToast]
  );

  // Admin User Creation
  const createUser = useCallback(
    ({
      name,
      role,
      warehouseId,
      region,
      permissions,
    }: {
      name: string;
      role: Role;
      warehouseId?: string;
      region?: string;
      permissions?: OfficerPermission[];
    }) => {
      if (!name.trim()) {
        showToast('Please specify a user name', true);
        return false;
      }
      const newUser: User = {
        id: `u-${Date.now()}`,
        n: `${name.trim()} (${role.charAt(0).toUpperCase() + role.slice(1)})`,
        r: role,
        wh: role === 'officer' ? warehouseId : undefined,
        reg: role === 'regional' ? region?.trim() || 'Central' : undefined,
        p: role === 'officer' ? permissions || [] : undefined,
      };

      setState((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        log: [
          {
            m: `Created user account: ${newUser.n} with role [${role}]`,
            by: currentUser.n,
            at: Date.now(),
          },
          ...prev.log,
        ].slice(0, 200),
      }));

      showToast(`User ${newUser.n} created`);
      return true;
    },
    [currentUser.n, showToast]
  );

  // Export CSV
  const exportCSV = useCallback(
    (filename: string, rows: (string | number)[][]) => {
      const csvContent = rows
        .map((r) => r.map((c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename}`);
    },
    [showToast]
  );

  // Update minimum safety stock threshold for non-serial consumable item
  const updateItemMinThreshold = useCallback(
    (code: string, minThreshold: number) => {
      const sanitized = Math.max(0, Number(minThreshold) || 0);
      setState((prev) => {
        const nextNs = prev.ns.map((item) => {
          if (item.c.toUpperCase() === code.toUpperCase()) {
            return { ...item, min: sanitized };
          }
          return item;
        });
        return {
          ...prev,
          ns: nextNs,
        };
      });
      addLog(`Updated inventory minimum threshold for ${code} to ${sanitized} units`);
      showToast(`Minimum threshold for ${code} set to ${sanitized} units`);
    },
    [addLog, showToast]
  );

  // Generate Excel (.xlsx) Multi-Sheet Audit Report
  const exportAuditReportExcel = useCallback(
    (targetWhId?: string) => {
      try {
        const wb = XLSX.utils.book_new();
        const dateStr = new Date().toISOString().slice(0, 10);
        const reportWarehouses = targetWhId
          ? visibleWarehouses.filter((w) => w.id === targetWhId)
          : visibleWarehouses;

        // 1. Sheet: Audit Summary & Executive KPIs
        const summaryData: (string | number)[][] = [
          ['BURN OPERATIONS - MONTH-END AUDIT & INVENTORY REPORT'],
          ['Generated Date', dateStr],
          ['Generated By', currentUser.n],
          ['User Role', currentUser.r.toUpperCase()],
          ['Depot Scope', targetWhId ? getWarehouseName(targetWhId) : 'All Accessible Depots'],
          [],
          [
            'Warehouse Depot',
            'Region',
            'Expected Cookstoves',
            'Physically Counted',
            'Missing Discrepancies',
            'Unknown on Floor',
            'Audit Flag Cases',
            'Monthly Rent (KES)',
            'Lease Renewal Date',
            'Lease Status',
          ],
        ];

        let totalExpected = 0;
        let totalCounted = 0;
        let totalMissing = 0;
        let totalUnknown = 0;

        reportWarehouses.forEach((w) => {
          const audit = getAuditData(w.id);
          const days = getDaysUntilDue(w.due);
          const leaseStatus = days < 0 ? 'OVERDUE' : days <= 30 ? `DUE IN ${days}d` : 'ACTIVE';
          totalExpected += audit.ex.size;
          totalCounted += audit.d.counted.length;
          totalMissing += audit.miss.length;
          totalUnknown += audit.unk.length;

          summaryData.push([
            w.n,
            w.reg,
            audit.ex.size,
            audit.d.counted.length,
            audit.miss.length,
            audit.unk.length,
            Object.keys(state.flags).length,
            w.rent,
            w.due,
            leaseStatus,
          ]);
        });

        summaryData.push([]);
        summaryData.push([
          'TOTALS & EXECUTIVE BALANCE',
          `${reportWarehouses.length} Depots`,
          totalExpected,
          totalCounted,
          totalMissing,
          totalUnknown,
        ]);

        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = [
          { wch: 24 },
          { wch: 14 },
          { wch: 20 },
          { wch: 20 },
          { wch: 22 },
          { wch: 18 },
          { wch: 16 },
          { wch: 18 },
          { wch: 18 },
          { wch: 14 },
        ];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Audit Summary');

        // 2. Sheet: Serial Cookstove Reconciliation
        const serialData: (string | number)[][] = [
          [
            'Serial Number',
            'SKU Model',
            'Depot Location',
            'Region',
            'Book Status',
            'Floor Count Verified',
            'Reconciliation Status',
            'Investigation Flag',
            'Date Handled',
            'Officer / User',
          ],
        ];

        reportWarehouses.forEach((w) => {
          const audit = getAuditData(w.id);
          const whData = audit.d;
          const countedSet = new Set(whData.counted.map((x) => x[0]));
          const outSet = new Set(whData.out.map((x) => x[0]));

          // All opening & received serials
          [...whData.opening, ...whData.received].forEach(([serial, sku, timestamp, user]) => {
            const isOut = outSet.has(serial);
            const isCounted = countedSet.has(serial);
            let reconStatus = 'Verified In Stock';
            if (isOut) {
              reconStatus = 'Scanned Out / Sold';
            } else if (!isCounted) {
              reconStatus = 'MISSING DISCREPANCY';
            }

            serialData.push([
              serial,
              sku,
              w.n,
              w.reg,
              isOut ? 'Scanned Out' : 'Active Balance',
              isCounted ? 'YES' : 'NO',
              reconStatus,
              state.flags[serial] || (reconStatus === 'MISSING DISCREPANCY' ? 'Missing' : 'None'),
              timestamp ? new Date(timestamp).toISOString().slice(0, 10) : '',
              user || '',
            ]);
          });

          // Unaccounted floor counted serials
          audit.unk.forEach(([serial, sku, timestamp, user]) => {
            serialData.push([
              serial,
              sku,
              w.n,
              w.reg,
              'Not In Book Records',
              'YES (Unplanned)',
              'UNKNOWN FLOOR SERIAL',
              'Investigating',
              timestamp ? new Date(timestamp).toISOString().slice(0, 10) : '',
              user || '',
            ]);
          });
        });

        const wsSerial = XLSX.utils.aoa_to_sheet(serialData);
        wsSerial['!cols'] = [
          { wch: 18 },
          { wch: 20 },
          { wch: 22 },
          { wch: 14 },
          { wch: 18 },
          { wch: 22 },
          { wch: 24 },
          { wch: 20 },
          { wch: 14 },
          { wch: 24 },
        ];
        XLSX.utils.book_append_sheet(wb, wsSerial, 'Serial Reconciliation');

        // 3. Sheet: Consumables & Non-Serial Stock Thresholds
        const consumableData: (string | number)[][] = [
          [
            'Item Code',
            'Item Description',
            'Depot Location',
            'Region',
            'Current Stock Balance',
            'Minimum Safety Threshold',
            'Buffer Deficit',
            'Stock Alert Status',
          ],
        ];

        reportWarehouses.forEach((w) => {
          state.ns.forEach((item) => {
            const qty = item.q[w.id] || 0;
            const min = item.min ?? 20;
            const deficit = Math.max(0, min - qty);
            let status = 'OPTIMAL BUFFER';
            if (qty === 0) {
              status = 'CRITICAL STOCKOUT (0 Units)';
            } else if (qty <= Math.floor(min / 2)) {
              status = 'CRITICAL SHORTAGE';
            } else if (qty <= min) {
              status = 'LOW STOCK WARNING';
            }

            consumableData.push([
              item.c,
              item.n,
              w.n,
              w.reg,
              qty,
              min,
              deficit,
              status,
            ]);
          });
        });

        const wsConsumables = XLSX.utils.aoa_to_sheet(consumableData);
        wsConsumables['!cols'] = [
          { wch: 16 },
          { wch: 28 },
          { wch: 22 },
          { wch: 14 },
          { wch: 22 },
          { wch: 24 },
          { wch: 16 },
          { wch: 26 },
        ];
        XLSX.utils.book_append_sheet(wb, wsConsumables, 'Non-Serial Consumables');

        // 4. Sheet: Activity Audit Log
        const logData: (string | number)[][] = [
          ['Timestamp', 'Logged Date', 'Handler / Personnel', 'Operational Action Event'],
        ];
        state.log.forEach((entry) => {
          logData.push([
            entry.at,
            new Date(entry.at).toLocaleString(),
            entry.by,
            entry.m,
          ]);
        });
        const wsLog = XLSX.utils.aoa_to_sheet(logData);
        wsLog['!cols'] = [{ wch: 16 }, { wch: 22 }, { wch: 24 }, { wch: 60 }];
        XLSX.utils.book_append_sheet(wb, wsLog, 'Audit Activity Log');

        // Export file
        const fileName = `Burn_Operations_Audit_Report_${dateStr}.xlsx`;
        XLSX.writeFile(wb, fileName);
        addLog(`Generated comprehensive Excel audit workbook: ${fileName}`);
        showToast(`Generated Excel Audit Report (${fileName})`);
      } catch (err) {
        console.error('Failed to export Excel report:', err);
        showToast('Failed to export Excel report. Please use CSV export as alternative.', true);
      }
    },
    [visibleWarehouses, currentUser, getAuditData, getWarehouseName, getDaysUntilDue, state.flags, state.ns, state.log, addLog, showToast]
  );

  // Generate CSV Complete Audit Report
  const exportAuditReportCSV = useCallback(
    (targetWhId?: string) => {
      const dateStr = new Date().toISOString().slice(0, 10);
      const reportWarehouses = targetWhId
        ? visibleWarehouses.filter((w) => w.id === targetWhId)
        : visibleWarehouses;

      const rows: (string | number)[][] = [
        ['# BURN OPERATIONS - FULL AUDIT & INVENTORY REPORT'],
        ['# Generated', dateStr],
        ['# Exported By', currentUser.n],
        [],
        ['=== SECTION 1: DEPOT AUDIT SUMMARY ==='],
        [
          'Depot Name',
          'Region',
          'Expected Balance',
          'Physical Count',
          'Missing Serials',
          'Unknown Floor Serials',
          'Rent (KES)',
          'Lease Due',
        ],
      ];

      reportWarehouses.forEach((w) => {
        const audit = getAuditData(w.id);
        rows.push([
          w.n,
          w.reg,
          audit.ex.size,
          audit.d.counted.length,
          audit.miss.length,
          audit.unk.length,
          w.rent,
          w.due,
        ]);
      });

      rows.push([]);
      rows.push(['=== SECTION 2: SERIALIZED COOKSTOVES RECONCILIATION ===']);
      rows.push([
        'Serial',
        'SKU Model',
        'Depot',
        'Region',
        'Book Status',
        'Counted',
        'Audit Status',
        'Flag',
        'Date Recorded',
        'Officer',
      ]);

      reportWarehouses.forEach((w) => {
        const audit = getAuditData(w.id);
        const whData = audit.d;
        const countedSet = new Set(whData.counted.map((x) => x[0]));
        const outSet = new Set(whData.out.map((x) => x[0]));

        [...whData.opening, ...whData.received].forEach(([serial, sku, timestamp, user]) => {
          const isOut = outSet.has(serial);
          const isCounted = countedSet.has(serial);
          let reconStatus = 'Verified In Stock';
          if (isOut) {
            reconStatus = 'Scanned Out / Sold';
          } else if (!isCounted) {
            reconStatus = 'MISSING';
          }

          rows.push([
            serial,
            sku,
            w.n,
            w.reg,
            isOut ? 'Scanned Out' : 'Active Balance',
            isCounted ? 'YES' : 'NO',
            reconStatus,
            state.flags[serial] || (reconStatus === 'MISSING' ? 'Missing' : 'None'),
            timestamp ? new Date(timestamp).toISOString().slice(0, 10) : '',
            user || '',
          ]);
        });

        audit.unk.forEach(([serial, sku, timestamp, user]) => {
          rows.push([
            serial,
            sku,
            w.n,
            w.reg,
            'Not In Book',
            'YES',
            'UNKNOWN FLOOR SERIAL',
            'Investigating',
            timestamp ? new Date(timestamp).toISOString().slice(0, 10) : '',
            user || '',
          ]);
        });
      });

      rows.push([]);
      rows.push(['=== SECTION 3: CONSUMABLES & NON-SERIAL SAFETY THRESHOLDS ===']);
      rows.push([
        'Item Code',
        'Item Name',
        'Depot',
        'Current Quantity',
        'Minimum Threshold',
        'Deficit Below Minimum',
        'Health Status',
      ]);

      reportWarehouses.forEach((w) => {
        state.ns.forEach((item) => {
          const qty = item.q[w.id] || 0;
          const min = item.min ?? 20;
          const deficit = Math.max(0, min - qty);
          const status = qty <= Math.floor(min / 2) ? 'CRITICAL SHORTAGE' : qty <= min ? 'LOW STOCK' : 'OPTIMAL';

          rows.push([
            item.c,
            item.n,
            w.n,
            qty,
            min,
            deficit,
            status,
          ]);
        });
      });

      const fileName = `Burn_Operations_Audit_Report_${dateStr}.csv`;
      exportCSV(fileName, rows);
      addLog(`Generated comprehensive CSV audit report: ${fileName}`);
    },
    [visibleWarehouses, currentUser, getAuditData, state.flags, state.ns, exportCSV, addLog]
  );

  const resetAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = generateInitialSeed();
    setState(fresh);
    showToast('Burn Ops database reset to initial demo seeds');
  }, [showToast]);

  // Serial finder lookup across all warehouses
  const findSerialInfo = useCallback(
    (serialQuery: string) => {
      const q = serialQuery.trim();
      if (!q) return [];
      const results: {
        warehouseName: string;
        sku: string;
        status: string;
        date?: string;
        user?: string;
      }[] = [];

      visibleWarehouses.forEach((w) => {
        const d = state.d[w.id] || createEmptyWarehouseData();
        const ex = getExpectedStock(w.id);

        const openMatch = d.opening.find((x) => x[0] === q);
        const recvMatch = d.received.find((x) => x[0] === q);
        const outMatch = d.out.find((x) => x[0] === q);
        const countMatch = d.counted.find((x) => x[0] === q);

        const found = openMatch || recvMatch || outMatch || countMatch;
        if (found) {
          let statusText = 'In stock';
          if (outMatch) {
            statusText = 'Scanned out (Dispatched / Sold)';
          } else if (ex.has(q)) {
            statusText = countMatch ? 'In stock (Physically Counted & Verified)' : 'In stock (Pending Audit Count)';
          } else if (countMatch) {
            statusText = 'Physically counted (Discrepancy: Not in book balance)';
          }

          results.push({
            warehouseName: w.n,
            sku: found[1],
            status: statusText,
            date: found[2] ? new Date(found[2]).toLocaleDateString() : undefined,
            user: found[3],
          });
        }
      });

      return results;
    },
    [visibleWarehouses, state.d, getExpectedStock]
  );

  return (
    <BurnOpsContext.Provider
      value={{
        state,
        currentUser,
        isFull,
        isAp,
        can,
        visibleWarehouses,
        currentWarehouseId,
        currentWarehouse,
        toastMessage,
        showToast,
        setTab,
        setWarehouse,
        setCurrentUserIndex,
        setKind,
        setAct,
        setSiteWarehouse,
        setSiteCategory,
        setDispatchTab,
        setReceiptTarget,
        setTradeDetail,
        getExpectedStock,
        getAuditData,
        getDaysUntilDue,
        getWarehouseName,
        saveSerials,
        saveNonSerial,
        unlockOpening,
        removeOpeningSerial,
        addCountedSerials,
        clearAuditCount,
        setFlagStatus,
        closeMonth,
        adjustAssetQuantity,
        addAssetItem,
        updateRentInfo,
        addWarehouse,
        createShipment,
        confirmReceipt,
        createTrade,
        toggleTradeDocument,
        saveTradeStatus,
        postUpdate,
        createUser,
        exportCSV,
        updateItemMinThreshold,
        exportAuditReportExcel,
        exportAuditReportCSV,
        resetAllData,
        findSerialInfo,
      }}
    >
      {children}
    </BurnOpsContext.Provider>
  );
};

export const useBurnOps = () => {
  const context = useContext(BurnOpsContext);
  if (!context) {
    throw new Error('useBurnOps must be used within a BurnOpsProvider');
  }
  return context;
};
