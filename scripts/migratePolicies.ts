// Script para poblar la base de datos real con las políticas de mock/db.json usando Prisma
// Ejecuta: npx ts-node scripts/migratePolicies.ts

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Leer políticas del mock
  const dbPath = path.resolve(__dirname, '../mock/db.json');
  const dbRaw = fs.readFileSync(dbPath, 'utf-8');
  const db = JSON.parse(dbRaw);
  const policies = db.policies || [];

  if (!policies.length) {
    console.log('No se encontraron políticas en mock/db.json');
    return;
  }

  for (const policy of policies) {
    // Verificar si ya existe una política con el mismo título
    const exists = await prisma.policy.findFirst({ where: { title: policy.title } });
    if (!exists) {
      await prisma.policy.create({
        data: {
          title: policy.title,
          content: policy.content,
        },
      });
      console.log(`Política migrada: ${policy.title}`);
    } else {
      console.log(`Ya existe: ${policy.title}`);
    }
  }

  console.log('Migración completada.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
