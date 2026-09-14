import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function redactedDatabaseTarget(value: string | undefined) {
  if (!value) return "not configured";
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}:${url.port || "default"}/${url.pathname.slice(1)}`;
  } catch {
    return "invalid DATABASE_URL";
  }
}

async function main() {
  console.log(`Database target: ${redactedDatabaseTarget(process.env.DATABASE_URL)}`);
  await db.$connect();
  const [activeProducts, migrations] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name
      FROM _prisma_migrations
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
      ORDER BY finished_at DESC
      LIMIT 1
    `,
  ]);
  console.log("Connection: ok");
  console.log(`Latest migration: ${migrations[0]?.migration_name ?? "none"}`);
  console.log(`Active products: ${activeProducts}`);
}

main()
  .catch((error) => {
    console.error("Database check failed: connection or migration state is unavailable.");
    if (process.env.DEBUG_DB_CHECK === "1") console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
