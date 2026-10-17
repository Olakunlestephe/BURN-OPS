import type { Config } from '@netlify/functions';
import { desc, gt, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { activityLog, workspaceData } from '../../db/schema.js';
import { isAp, json, requireStaff, type StaffRow } from '../lib/auth.js';

const SHARED_KEYS = ['wh', 'skus', 'ns', 'flags', 'news', 'ships', 'trade'];
const LOG_LIMIT = 300;

const isValidKey = (key: string) => SHARED_KEYS.includes(key) || /^d:[A-Za-z0-9_-]{1,64}$/.test(key);

// Officers may only change serial stock for their own warehouse; read-only executives change nothing.
const canWrite = (member: StaffRow, key: string) => {
  if (member.role === 'smt') return false;
  if (key.startsWith('d:') && member.role === 'officer') return key === `d:${member.warehouseId}`;
  if ((key === 'wh' || key === 'skus') && member.role === 'officer') return false;
  return true;
};

const serializeLog = (rows: (typeof activityLog.$inferSelect)[]) =>
  rows.map((r) => ({ id: r.id, m: r.message, by: r.actor, at: r.at.getTime() }));

export default async (req: Request) => {
  const auth = await requireStaff(req);
  if (!auth.ok) return auth.response;
  const { member } = auth;

  if (req.method === 'GET') {
    // `since` lets the browser poll for changes made by colleagues without re-downloading everything.
    const url = new URL(req.url);
    const since = url.searchParams.get('since');
    const sinceLogId = Number(url.searchParams.get('sinceLog') || 0);
    const sinceDate = since ? new Date(since) : null;

    const entries = await db
      .select()
      .from(workspaceData)
      .where(sinceDate && !isNaN(sinceDate.getTime()) ? gt(workspaceData.updatedAt, sinceDate) : undefined);

    const logRows = await db
      .select()
      .from(activityLog)
      .where(sinceLogId > 0 ? gt(activityLog.id, sinceLogId) : undefined)
      .orderBy(desc(activityLog.id))
      .limit(LOG_LIMIT);

    const [{ now }] = await db.select({ now: sql<string>`now()` }).from(sql`(select 1) as t`);

    return json({
      cursor: new Date(now).toISOString(),
      data: Object.fromEntries(entries.map((e) => [e.key, e.data])),
      log: serializeLog(logRows),
    });
  }

  if (req.method === 'PUT') {
    let body: { changes?: Record<string, unknown>; log?: { m?: string }[] };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const changes = Object.entries(body.changes || {});
    for (const [key, value] of changes) {
      if (!isValidKey(key)) return json({ error: `Unknown data collection: ${key}` }, 400);
      if (value === undefined || value === null) return json({ error: `Missing data for ${key}` }, 400);
      if (!canWrite(member, key)) return json({ error: `Your role cannot change ${key}` }, 403);
    }
    const logEntries = (body.log || [])
      .map((l) => String(l?.m || '').trim().slice(0, 1000))
      .filter(Boolean)
      .slice(0, 100);
    if (member.role === 'smt' && logEntries.length) return json({ error: 'Read-only role' }, 403);

    await db.transaction(async (tx) => {
      for (const [key, value] of changes) {
        await tx
          .insert(workspaceData)
          .values({ key, data: value, updatedBy: member.email })
          .onConflictDoUpdate({
            target: workspaceData.key,
            set: {
              data: value,
              version: sql`${workspaceData.version} + 1`,
              updatedBy: member.email,
              updatedAt: sql`now()`,
            },
          });
      }
      if (logEntries.length) {
        // Stored oldest-first so ids follow the order the actions happened in.
        await tx
          .insert(activityLog)
          .values([...logEntries].reverse().map((message) => ({ message, actor: member.name })));
      }
    });

    return json({ ok: true, saved: changes.map(([k]) => k), canManageStaff: isAp(member) });
  }

  return json({ error: 'Method not allowed' }, 405);
};

export const config: Config = { path: '/api/workspace' };
