import { PrismaClient, ProductCategory, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

type ModifierFixture = {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  options: Array<{
    id: string;
    name: string;
    priceDeltaCents: number;
    sortOrder: number;
  }>;
};

type ProductFixture = {
  slug: string;
  name: string;
  description: string;
  category: ProductCategory;
  priceCents: number;
  imageUrl: string;
  modifiers?: ModifierFixture[];
};

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const products: ProductFixture[] = [
  {
    slug: "house-latte",
    name: "House Latte",
    description: "Silky espresso with textured milk and a soft caramel finish.",
    category: ProductCategory.COFFEE,
    priceCents: 480,
    imageUrl: image("photo-1541167760496-1628856ab772"),
    modifiers: [{
      id: "00000000-0000-4000-8000-000000000001",
      name: "Milk",
      minSelections: 1,
      maxSelections: 1,
      options: [
        { id: "00000000-0000-4000-8000-000000000011", name: "Whole milk", priceDeltaCents: 0, sortOrder: 0 },
        { id: "00000000-0000-4000-8000-000000000012", name: "Oat milk", priceDeltaCents: 70, sortOrder: 1 },
        { id: "00000000-0000-4000-8000-000000000013", name: "Almond milk", priceDeltaCents: 70, sortOrder: 2 },
      ],
    }],
  },
  {
    slug: "honey-cinnamon-cappuccino",
    name: "Honey Cinnamon Cappuccino",
    description: "Velvety foam, local honey, and a warm dusting of cinnamon.",
    category: ProductCategory.COFFEE,
    priceCents: 525,
    imageUrl: image("photo-1572442388796-11668a67e53d"),
  },
  {
    slug: "maple-mocha",
    name: "Maple Mocha",
    description: "Dark cocoa and espresso rounded out with a hint of maple.",
    category: ProductCategory.COFFEE,
    priceCents: 560,
    imageUrl: image("photo-1578314675249-a6910f80cc4e"),
  },
  {
    slug: "long-black",
    name: "Long Black",
    description: "Two bright espresso shots over hot water for a clean, bold cup.",
    category: ProductCategory.COFFEE,
    priceCents: 350,
    imageUrl: image("photo-1514432324607-a09d9b4aefdd"),
  },
  {
    slug: "cold-brew",
    name: "Slow Steep Cold Brew",
    description: "Smooth, chocolatey, and steeped overnight for a clean finish.",
    category: ProductCategory.ICED_DRINK,
    priceCents: 520,
    imageUrl: image("photo-1517701604599-bb29b565090c"),
    modifiers: [{
      id: "00000000-0000-4000-8000-000000000002",
      name: "Finish",
      minSelections: 0,
      maxSelections: 1,
      options: [{ id: "00000000-0000-4000-8000-000000000021", name: "Oat milk", priceDeltaCents: 70, sortOrder: 0 }],
    }],
  },
  {
    slug: "iced-vanilla-latte",
    name: "Iced Vanilla Latte",
    description: "Chilled espresso, real vanilla, and your choice of creamy milk.",
    category: ProductCategory.ICED_DRINK,
    priceCents: 535,
    imageUrl: image("photo-1461029383595-7b7c4b6a1a6e"),
    modifiers: [{
      id: "00000000-0000-4000-8000-000000000003",
      name: "Milk",
      minSelections: 1,
      maxSelections: 1,
      options: [
        { id: "00000000-0000-4000-8000-000000000031", name: "Whole milk", priceDeltaCents: 0, sortOrder: 0 },
        { id: "00000000-0000-4000-8000-000000000032", name: "Oat milk", priceDeltaCents: 70, sortOrder: 1 },
      ],
    }],
  },
  {
    slug: "citrus-sparkler",
    name: "Citrus Sparkler",
    description: "Bright citrus, sparkling water, and a little afternoon lift.",
    category: ProductCategory.ICED_DRINK,
    priceCents: 450,
    imageUrl: image("photo-1513558161293-cdaf765ed2fd"),
  },
  {
    slug: "berry-hibiscus-cooler",
    name: "Berry Hibiscus Cooler",
    description: "Tart hibiscus tea, crushed berries, and a squeeze of lime over ice.",
    category: ProductCategory.ICED_DRINK,
    priceCents: 495,
    imageUrl: image("photo-1544145945-f90425340c7e"),
  },
  {
    slug: "morning-bun",
    name: "Morning Bun",
    description: "Citrus sugar, laminated dough, and a crisp, buttery edge.",
    category: ProductCategory.PASTRY,
    priceCents: 390,
    imageUrl: image("photo-1509440159596-0249088772ff"),
  },
  {
    slug: "brown-butter-cookie",
    name: "Brown Butter Chocolate Chip Cookie",
    description: "A crisp edge, a soft center, and pools of bittersweet chocolate.",
    category: ProductCategory.PASTRY,
    priceCents: 325,
    imageUrl: image("photo-1499636136210-6f4ee915583e"),
  },
  {
    slug: "almond-croissant",
    name: "Almond Croissant",
    description: "Flaky layers filled with almond cream and finished with toasted almonds.",
    category: ProductCategory.PASTRY,
    priceCents: 475,
    imageUrl: image("photo-1555507036-ab1f4038808a"),
  },
  {
    slug: "blueberry-lemon-loaf",
    name: "Blueberry Lemon Loaf",
    description: "Tender lemon loaf studded with blueberries and a bright glaze.",
    category: ProductCategory.PASTRY,
    priceCents: 425,
    imageUrl: image("photo-1606101273945-e9ebaefee9c2"),
  },
];

async function seedUsers() {
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
}

async function seedProduct(product: ProductFixture) {
  const savedProduct = await db.product.upsert({
    where: { slug: product.slug },
    update: {
      name: product.name,
      description: product.description,
      category: product.category,
      priceCents: product.priceCents,
      imageUrl: product.imageUrl,
      isActive: true,
    },
    create: {
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: product.category,
      priceCents: product.priceCents,
      imageUrl: product.imageUrl,
      isActive: true,
    },
  });

  for (const modifier of product.modifiers ?? []) {
    const group = await db.modifierGroup.upsert({
      where: { id: modifier.id },
      update: {
        productId: savedProduct.id,
        name: modifier.name,
        minSelections: modifier.minSelections,
        maxSelections: modifier.maxSelections,
        sortOrder: 0,
      },
      create: {
        id: modifier.id,
        productId: savedProduct.id,
        name: modifier.name,
        minSelections: modifier.minSelections,
        maxSelections: modifier.maxSelections,
        sortOrder: 0,
      },
    });

    for (const option of modifier.options) {
      await db.modifierOption.upsert({
        where: { id: option.id },
        update: {
          name: option.name,
          priceDeltaCents: option.priceDeltaCents,
          sortOrder: option.sortOrder,
          modifierGroupId: group.id,
          isActive: true,
        },
        create: {
          id: option.id,
          name: option.name,
          priceDeltaCents: option.priceDeltaCents,
          sortOrder: option.sortOrder,
          modifierGroupId: group.id,
          isActive: true,
        },
      });
    }
  }
}

async function main() {
  await seedUsers();
  for (const product of products) await seedProduct(product);
  console.log(`Seeded ${products.length} products across ${new Set(products.map((product) => product.category)).size} categories.`);
}

main()
  .catch((error) => {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
