export type Role = 'admin' | 'director' | 'manager' | 'regional' | 'officer' | 'smt';

export type OfficerPermission = 'opening' | 'receive' | 'scanout' | 'count';

export interface User {
  id?: string;
  n: string;
  r: Role;
  reg?: string;
  wh?: string;
  p?: OfficerPermission[];
}

export interface Asset {
  n: string;
  q: number;
}

export interface Warehouse {
  id: string;
  n: string;
  reg: string;
  rent: number;
  due: string;
  a: {
    Furniture: Asset[];
    'Working tools': Asset[];
    Equipment: Asset[];
  };
}

export type SerialRecord = [string, string, number, string]; // [serial, sku, timestamp, user]

export interface WarehouseData {
  opening: SerialRecord[];
  received: SerialRecord[];
  out: SerialRecord[];
  counted: SerialRecord[];
  locked: boolean;
}

export interface NonSerialItem {
  c: string; // code
  n: string; // name
  q: Record<string, number>; // warehouseId -> quantity
  min?: number;
}

export interface Shipment {
  id: string;
  from: string; // 'F' for factory, or warehouse id
  to: string; // warehouse id
  kind: 'ser' | 'ns';
  item: string;
  qty: number;
  eta: string;
  st: 'transit' | 'received';
  by: string;
  rq?: number; // quantity received
  rat?: number; // timestamp received
}

export interface TradeShipment {
  id: string;
  type: 'import' | 'export';
  ref: string;
  desc: string;
  party: string;
  reg: string;
  stage: string;
  dest: string; // warehouse id
  eta: string;
  docs: Record<number, boolean>;
  by: string;
  leadTimeDays?: number;
  stageDays?: {
    documentation: number;
    transit: number;
    portCustoms: number;
    clearance: number;
    delivery: number;
  };
  bottleneck?: string;
  originPort?: string;
  destPort?: string;
}

export interface NewsItem {
  id?: string;
  t: string; // title
  k: 'Progress' | 'Challenge';
  b: string; // body
  by: string;
  at: number;
}

export interface LogEntry {
  m: string;
  by: string;
  at: number;
}

export interface BurnState {
  me: number;
  tab: 'home' | 'stock' | 'audit' | 'sites' | 'dispatch' | 'trade' | 'news' | 'admin';
  sel: string | null;
  kind: 'ser' | 'ns' | null;
  act: 'in' | 'out' | 'opening' | 'ret' | null;
  sw: string | null;
  cat: string | null;
  dtab?: 'transit' | 'done';
  rc?: string | null;
  td?: string | null;
  users: User[];
  wh: Warehouse[];
  skus: string[];
  ns: NonSerialItem[];
  d: Record<string, WarehouseData>;
  flags: Record<string, 'investigating' | 'resolved'>;
  news: NewsItem[];
  ships: Shipment[];
  trade: TradeShipment[];
  log: LogEntry[];
}

export const CATS = ['Furniture', 'Working tools', 'Equipment'] as const;

export const DOCS = {
  import: [
    'Commercial invoice',
    'Packing list',
    'Bill of lading',
    'Import declaration (IDF)',
    'Certificate of origin',
    'Customs clearance',
    'Duty payment',
  ],
  export: [
    'Commercial invoice',
    'Packing list',
    'Export entry',
    'Bill of lading',
    'Certificate of origin',
    'Export clearance',
  ],
};

export const STAGES = [
  'Documentation',
  'In transit',
  'At port / customs',
  'Cleared',
  'Delivered',
];

export const ACT_META: Record<
  'in' | 'out' | 'opening' | 'ret',
  { title: string; subtitle: string; perm: OfficerPermission }
> = {
  in: {
    title: 'Scan in / received',
    subtitle: 'Add serials received into the warehouse',
    perm: 'receive',
  },
  out: {
    title: 'Scan out',
    subtitle: 'Serials leaving the warehouse; updates the live balance',
    perm: 'scanout',
  },
  opening: {
    title: 'Opening stock',
    subtitle: 'Start-of-month serials; locked after upload',
    perm: 'opening',
  },
  ret: {
    title: 'Return',
    subtitle: 'Serials coming back after being scanned out',
    perm: 'receive',
  },
};
