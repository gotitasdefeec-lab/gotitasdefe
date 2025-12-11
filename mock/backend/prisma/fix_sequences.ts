
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing database sequences...');

    const tables = [
        'customers',
        'sales',
        'products',
        'categories',
        'admin',
        'inventory'
    ];

    for (const table of tables) {
        try {
            // Postgres specific: reset sequence to max(id) + 1
            await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), coalesce(max(id)+1, 1), false) FROM "${table}";`);
            console.log(`✅ Sequence fixed for table: ${table}`);
        } catch (error) {
            console.log(`⚠️ Could not fix sequence for ${table} (might not exist or different structure):`, error.message);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
