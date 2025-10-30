/*
  Prisma seed: populate predefined catalogs from the bundled SQLite snapshot (prisma/dev.db)

  This makes any fresh database (Neon/Prisma Postgres/Supabase/etc.) self-initializing
  just by running:

    npx prisma db push
    npx prisma db seed

  The seed is idempotent (uses upsert) and safe to run multiple times.
*/

import sqlite3 from 'sqlite3';
import { PrismaClient } from '@prisma/client';
import path from 'path';

async function readAll<T = any>(db: sqlite3.Database, sql: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => (err ? reject(err) : resolve(rows as T[])));
  });
}

async function main() {
  const prisma = new PrismaClient();
  const sqlitePath = path.resolve(process.cwd(), 'prisma/dev.db');
  const raw = new sqlite3.Database(sqlitePath);

  // Read predefined catalogs from the snapshot
  const activities = await readAll<any>(
    raw,
    'SELECT id, name, icon, category, dssComponent, color, isActive, createdAt, updatedAt FROM PredefinedActivity'
  );
  const goals = await readAll<any>(
    raw,
    'SELECT id, title, description, category, subcategory, dssComponent, targetValue, unit, difficulty, isActive, createdAt, updatedAt FROM PredefinedGoal'
  );

  let actUpserts = 0;
  for (const a of activities) {
    await prisma.predefinedActivity.upsert({
      where: { id: a.id },
      update: {
        name: a.name,
        icon: a.icon,
        category: a.category,
        dssComponent: a.dssComponent,
        color: a.color,
        isActive: !!a.isActive ?? true,
      },
      create: {
        id: a.id,
        name: a.name,
        icon: a.icon,
        category: a.category,
        dssComponent: a.dssComponent,
        color: a.color,
        isActive: !!a.isActive ?? true,
        createdAt: a.createdAt ? new Date(a.createdAt) : undefined,
        updatedAt: a.updatedAt ? new Date(a.updatedAt) : undefined,
      },
    });
    actUpserts++;
  }

  let goalUpserts = 0;
  for (const g of goals) {
    await prisma.predefinedGoal.upsert({
      where: { id: g.id },
      update: {
        title: g.title,
        description: g.description,
        category: g.category,
        subcategory: g.subcategory,
        dssComponent: g.dssComponent,
        targetValue: g.targetValue,
        unit: g.unit,
        difficulty: g.difficulty,
        isActive: !!g.isActive ?? true,
      },
      create: {
        id: g.id,
        title: g.title,
        description: g.description,
        category: g.category,
        subcategory: g.subcategory,
        dssComponent: g.dssComponent,
        targetValue: g.targetValue,
        unit: g.unit,
        difficulty: g.difficulty,
        isActive: !!g.isActive ?? true,
        createdAt: g.createdAt ? new Date(g.createdAt) : undefined,
        updatedAt: g.updatedAt ? new Date(g.updatedAt) : undefined,
      },
    });
    goalUpserts++;
  }

  console.log(`Seed complete: activities=${actUpserts}, goals=${goalUpserts}`);
  raw.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


