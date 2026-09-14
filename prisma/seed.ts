import { PrismaClient, ProductCategory, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await hash("digitalcafe-demo", 10);
  await db.user.upsert({
    where: { email: "admin@digitalcafe.local" },
    update: { name: "Cafe Admin", role: UserRole.ADMIN, passwordHash },
    create: { email: "admin@digitalcafe.local", name: "Cafe Admin", role: UserRole.ADMIN, passwordHash },
  });
  await db.user.upsert({
    where: { email: "customer@digitalcafe.local" },
    update: { name: "Demo Customer", role: UserRole.CUSTOMER, passwordHash },
    create: { email: "customer@digitalcafe.local", name: "Demo Customer", role: UserRole.CUSTOMER, passwordHash },
  });

  const latte = await db.product.upsert({
    where: { slug: "house-latte" },
    update: { name: "House Latte", priceCents: 480, isActive: true },
    create: {
      name: "House Latte",
      slug: "house-latte",
      description: "Silky espresso with textured milk.",
      category: ProductCategory.COFFEE,
      priceCents: 480,
    },
  });
  const milkGroup = await db.modifierGroup.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: { productId: latte.id, name: "Milk", minSelections: 1, maxSelections: 1 },
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      productId: latte.id,
      name: "Milk",
      minSelections: 1,
      maxSelections: 1,
    },
  });
  for (const option of [
    { id: "00000000-0000-4000-8000-000000000011", name: "Whole milk", priceDeltaCents: 0 },
    { id: "00000000-0000-4000-8000-000000000012", name: "Oat milk", priceDeltaCents: 70 },
  ]) {
    await db.modifierOption.upsert({
      where: { id: option.id },
      update: { ...option, modifierGroupId: milkGroup.id, isActive: true },
      create: { ...option, modifierGroupId: milkGroup.id },
    });
  }

  await db.product.upsert({
    where: { slug: "morning-bun" },
    update: { name: "Morning Bun", priceCents: 390, isActive: true },
    create: {
      name: "Morning Bun",
      slug: "morning-bun",
      description: "Citrus sugar, laminated dough, and a crisp edge.",
      category: ProductCategory.PASTRY,
      priceCents: 390,
    },
  });
}

main().finally(() => db.$disconnect());
