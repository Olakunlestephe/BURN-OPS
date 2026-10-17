import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// People allowed into Burn Ops. Login itself is handled by Netlify Identity;
// this table decides who may sign up and what role they get once signed in.
export const staff = pgTable('staff', {
  id: serial().primaryKey(),
  email: text().notNull().unique(),
  name: text().notNull(),
  role: text().notNull(),
  region: text(),
  warehouseId: text('warehouse_id'),
  permissions: jsonb().$type<string[]>().notNull().default([]),
  active: boolean().notNull().default(true),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Shared operational data (warehouses, stock, shipments, trade, ...), stored as one JSON
// document per collection. Serial stock is split per warehouse ("d:<warehouseId>") so
// teams working in different warehouses never overwrite each other.
export const workspaceData = pgTable('workspace_data', {
  key: text().primaryKey(),
  data: jsonb().notNull(),
  version: integer().notNull().default(1),
  updatedBy: text('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Append-only audit trail.
export const activityLog = pgTable('activity_log', {
  id: serial().primaryKey(),
  message: text().notNull(),
  actor: text().notNull(),
  at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
