/*
  Seed predefined catalog tables from local SQLite (prisma/dev.db) into the database
  pointed to by your current environment (DATABASE_URL).

  Usage:
    1) Ensure env vars for your target DB are set (DATABASE_URL, DIRECT_URL optional)
    2) Run: npx tsx scripts/seed_predefined_from_sqlite.ts
*/

import sqlite3 from 'sqlite3';
import { PrismaClient } from '@prisma/client';
import path from 'path';

async function main() {
  const prisma = new PrismaClient();
  const sqlitePath = path.resolve(process.cwd(), 'prisma/dev.db');
  const raw = new sqlite3.Database(sqlitePath);
  const all = <T = any>(sql: string): Promise<T[]> =>
    new Promise((resolve, reject) => {
      raw.all(sql, (err, rows) => (err ? reject(err) : resolve(rows as T[])));
    });

  // Read PredefinedActivity
  const activities = await all<any>(
    'SELECT id, name, icon, category, dssComponent, color, isActive, createdAt, updatedAt FROM PredefinedActivity'
  );

  // Read PredefinedGoal
  const goals = await all<any>(
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

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});


