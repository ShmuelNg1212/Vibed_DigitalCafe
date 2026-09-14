ALTER TABLE "Order" ADD COLUMN "customerName" TEXT NOT NULL DEFAULT 'Unknown customer';
ALTER TABLE "Order" ADD COLUMN "customerEmail" TEXT NOT NULL DEFAULT 'unknown@example.invalid';
ALTER TABLE "Order" ADD COLUMN "specialInstructions" TEXT;

ALTER TABLE "Order" ALTER COLUMN "customerName" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "customerEmail" DROP DEFAULT;
