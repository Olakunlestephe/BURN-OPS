import { getUser, verifyRequestOrigin, AuthError } from '@netlify/identity';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { staff } from '../../db/schema.js';

export type StaffRow = typeof staff.$inferSelect;

export const ROLES = ['admin', 'director', 'manager', 'regional', 'officer', 'smt'] as const;
export const FULL_ROLES = ['admin', 'manager', 'director'];
export const PERMISSIONS = ['opening', 'receive', 'scanout', 'count'];

// The first administrator. Their account is created automatically the first time they sign in;
// everybody else has to be added by an administrator from the Admin tab.
export const bootstrapAdminEmail = () =>
  (Netlify.env.get('BURN_OPS_ADMIN_EMAIL') || 'olakunlestephen90@gmail.com').trim().toLowerCase();

export const normalizeEmail = (email: string | undefined | null) => (email || '').trim().toLowerCase();

export const json = (body: unknown, status = 200) => Response.json(body, { status });

export const findStaffByEmail = async (email: string) => {
  const [row] = await db.select().from(staff).where(eq(staff.email, normalizeEmail(email)));
  return row;
};

export const ensureBootstrapAdmin = async (email: string, name?: string) => {
  if (normalizeEmail(email) !== bootstrapAdminEmail()) return undefined;
  const [row] = await db
    .insert(staff)
    .values({
      email: bootstrapAdminEmail(),
      name: name || 'Administrator',
      role: 'admin',
      createdBy: 'system',
    })
    .onConflictDoNothing()
    .returning();
  return row ?? (await findStaffByEmail(email));
};

type AuthResult =
  | { ok: true; email: string; member: StaffRow }
  | { ok: false; response: Response };

// Resolves the signed-in Identity user to an active staff record.
export const requireStaff = async (req: Request): Promise<AuthResult> => {
  if (req.method !== 'GET') {
    try {
      verifyRequestOrigin(req);
    } catch (e) {
      if (e instanceof AuthError) return { ok: false, response: json({ error: 'Invalid request origin' }, 403) };
      throw e;
    }
  }

  const user = await getUser();
  if (!user?.email) return { ok: false, response: json({ error: 'Not signed in' }, 401) };

  let member = await findStaffByEmail(user.email);
  if (!member) member = await ensureBootstrapAdmin(user.email, user.name);
  if (!member || !member.active) {
    return { ok: false, response: json({ error: 'Your account has not been given access yet' }, 403) };
  }
  return { ok: true, email: normalizeEmail(user.email), member };
};

export const isFull = (m: StaffRow) => FULL_ROLES.includes(m.role);
export const isAp = (m: StaffRow) => isFull(m) || m.role === 'regional';

export const toClientUser = (m: StaffRow) => ({
  id: String(m.id),
  email: m.email,
  n: m.name,
  r: m.role,
  reg: m.region || undefined,
  wh: m.warehouseId || undefined,
  p: m.role === 'officer' ? m.permissions : undefined,
  active: m.active,
});
