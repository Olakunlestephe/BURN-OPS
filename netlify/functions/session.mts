import type { Config } from '@netlify/functions';
import { json, requireStaff, toClientUser } from '../lib/auth.js';

export default async (req: Request) => {
  const auth = await requireStaff(req);
  if (!auth.ok) return auth.response;
  return json({ user: toClientUser(auth.member) });
};

export const config: Config = { path: '/api/session' };
