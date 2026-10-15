import React, { useState } from 'react';
import { useBurnOps } from '../../context/BurnOpsContext';
import {
  ShieldCheck,
  Printer,
  Copy,
  Users,
  UserPlus,
  History,
  RotateCcw,
  Download,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { OfficerPermission, Role } from '../../types';

export const AdminTab: React.FC = () => {
  const {
    state,
    currentUser,
    visibleWarehouses,
    getAuditData,
    createUser,
    resetAllData,
    exportCSV,
    isFull,
    isAp,
    showToast,
  } = useBurnOps();

  // Create user form state
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<Role>('officer');
  const [userWarehouse, setUserWarehouse] = useState<string>(visibleWarehouses[0]?.id || 'w1');
  const [userRegion, setUserRegion] = useState<string>(currentUser.reg || 'Central');
  const [userPerms, setUserPerms] = useState<OfficerPermission[]>([
    'opening',
    'receive',
    'scanout',
    'count',
  ]);

  // Generate Management Report CSV rows and table data
  const reportHeaders = [
    'Warehouse',
    'Region',
    'Opening',
    'Received',
    'Out',
    'Expected',
    'Counted',
    'Missing',
    'Rent Due',
  ];

  const reportRows = visibleWarehouses.map((w) => {
    const auditRes = getAuditData(w.id);
    const d = auditRes.d;
    return [
      w.n,
      w.reg,
      d.opening.length,
      d.received.length,
      d.out.length,
      auditRes.ex.size,
      d.counted.length,
      auditRes.miss.length,
      w.due,
    ];
  });

  const rawCSV = [reportHeaders.join(','), ...reportRows.map((r) => r.join(','))].join('\n');

  const handleCopyCSV = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(rawCSV);
      showToast('Copied management report CSV to clipboard for Excel');
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const success = createUser({
      name: userName,
      role: userRole,
      warehouseId: userRole === 'officer' ? userWarehouse : undefined,
      region: userRole === 'regional' ? userRegion : undefined,
      permissions: userRole === 'officer' ? userPerms : undefined,
    });
    if (success) {
      setUserName('');
    }
  };

  const togglePermission = (p: OfficerPermission) => {
    setUserPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
        <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100 tracking-tight">
          Executive Administration &amp; Governance
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Executive reporting, personnel access control matrix, full audit trails, and system reset
        </p>
      </div>

      {/* Management Report Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#E8590C]" />
            <h3 className="font-bold font-heading text-base text-stone-900 dark:text-stone-100">
              Operations &amp; Stock Audit Summary Report
            </h3>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#E8590C]" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCSV}
              className="px-3 py-1.5 rounded-xl border border-[#E8590C] text-[#E8590C] hover:bg-orange-50 dark:hover:bg-orange-950/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy CSV for Excel</span>
            </button>
          </div>
        </div>

        {/* Formatted Table View */}
        <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 font-bold border-b border-stone-200 dark:border-stone-800">
              <tr>
                {reportHeaders.map((h) => (
                  <th key={h} className="p-2.5 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono">
              {reportRows.map((row, i) => (
                <tr key={i} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                  <td className="p-2.5 font-sans font-bold text-stone-900 dark:text-stone-100">
                    {row[0]}
                  </td>
                  <td className="p-2.5 font-sans text-stone-600 dark:text-stone-400">{row[1]}</td>
                  <td className="p-2.5 text-stone-700 dark:text-stone-300">{row[2]}</td>
                  <td className="p-2.5 text-emerald-600 dark:text-emerald-400">+{row[3]}</td>
                  <td className="p-2.5 text-red-600 dark:text-red-400">&minus;{row[4]}</td>
                  <td className="p-2.5 font-bold text-[#E8590C]">{row[5]}</td>
                  <td className="p-2.5 text-stone-800 dark:text-stone-200">{row[6]}</td>
                  <td className="p-2.5">
                    {Number(row[7]) > 0 ? (
                      <span className="text-red-600 font-bold bg-red-100 dark:bg-red-950 px-1.5 py-0.5 rounded">
                        {row[7]}
                      </span>
                    ) : (
                      <span className="text-emerald-600">0</span>
                    )}
                  </td>
                  <td className="p-2.5 text-stone-500 font-sans text-[11px]">{row[8]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Raw CSV Text Box */}
        <div className="space-y-1 print:hidden">
          <label className="text-xs font-semibold text-stone-500">Raw CSV Representation</label>
          <textarea
            readOnly
            rows={4}
            value={rawCSV}
            className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs font-mono text-stone-600 dark:text-stone-400"
          />
        </div>
      </div>

      {/* User Management & Access Control (Managers & Supervisors) */}
      {isAp && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#E8590C]" />
            <h3 className="font-bold font-heading text-base text-stone-900 dark:text-stone-100">
              Users &amp; Permission Access Control
            </h3>
          </div>

          {/* User List */}
          <div className="divide-y divide-stone-100 dark:divide-stone-800 border rounded-xl border-stone-200 dark:border-stone-800 max-h-60 overflow-y-auto">
            {state.users.map((u, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-stone-900 dark:text-stone-100">{u.n}</span>
                  <div className="text-stone-500 text-[11px]">
                    Role: <strong className="uppercase">{u.r}</strong>
                    {u.reg && ` \u2022 Region: ${u.reg}`}
                    {u.wh &&
                      ` \u2022 Warehouse: ${
                        visibleWarehouses.find((w) => w.id === u.wh)?.n || u.wh
                      }`}
                  </div>
                </div>

                <div>
                  {u.r === 'officer' && u.p && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#E8590C] dark:bg-orange-950">
                      {u.p.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Create User Form */}
          <form onSubmit={handleCreateUser} className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
              Provision New Personnel Account
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kiprono Korir"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Role
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as Role)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="officer">Warehouse Officer (Assigned Facility)</option>
                  {isFull && (
                    <>
                      <option value="regional">Regional Supervisor (Regional Purview)</option>
                      <option value="manager">Operations Manager (Full Access)</option>
                      <option value="director">Director / Executive (Full Access)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Warehouse or Region assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userRole === 'officer' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                    Assigned Depot / Hub
                  </label>
                  <select
                    value={userWarehouse}
                    onChange={(e) => setUserWarehouse(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    {state.wh.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.n} ({w.reg})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {userRole === 'regional' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                    Supervised Region
                  </label>
                  <input
                    type="text"
                    value={userRegion}
                    readOnly={currentUser.r === 'regional'}
                    onChange={(e) => setUserRegion(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Permissions for Officer */}
            {userRole === 'officer' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300 block">
                  Officer Operational Permissions
                </label>
                <div className="flex flex-wrap gap-3 pt-1">
                  {(
                    [
                      ['opening', 'Upload Opening Stock'],
                      ['receive', 'Receive Shipments & Returns'],
                      ['scanout', 'Scan Out Outbound Goods'],
                      ['count', 'Perform Physical Audit Count'],
                    ] as const
                  ).map(([permKey, label]) => (
                    <label
                      key={permKey}
                      className="flex items-center gap-1.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={userPerms.includes(permKey)}
                        onChange={() => togglePermission(permKey)}
                        className="rounded text-[#E8590C] focus:ring-[#E8590C]"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!userName.trim()}
              className="py-2.5 px-5 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] disabled:opacity-50 text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              Provision Account
            </button>
          </form>
        </div>
      )}

      {/* Activity Audit Trail (Executive / Full Roles) */}
      {isFull && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#E8590C]" />
            <h3 className="font-bold font-heading text-base text-stone-900 dark:text-stone-100">
              System Activity Audit Trail ({state.log.length} events)
            </h3>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800 border rounded-xl border-stone-200 dark:border-stone-800 max-h-60 overflow-y-auto">
            {state.log.map((log, idx) => (
              <div key={idx} className="p-3 text-xs space-y-0.5">
                <p className="text-stone-800 dark:text-stone-200 font-medium">{log.m}</p>
                <p className="text-stone-400 text-[10px]">
                  By {log.by} &bull; {new Date(log.at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Demo Data Button */}
      <div className="pt-2 print:hidden">
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                'Are you sure you want to erase all current state and reload default Burn Ops demo datasets?'
              )
            ) {
              resetAllData();
            }
          }}
          className="py-3 px-4 rounded-xl border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset All Demo Data to Defaults</span>
        </button>
      </div>
    </div>
  );
};
