import { seedDefaultAdmin } from "../server";
import prisma from "../lib/prisma";
import logger from "../api/utils/logger";

async function seed() {
  await prisma.$connect();
  await seedDefaultAdmin();
}

seed()
  .catch((error: unknown) => {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : "UNKNOWN";
    logger.error(`خطا در seed ادمین (کد: ${code}).`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });