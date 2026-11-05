import path from "node:path";
import express from "express";
import bcrypt from "bcrypt";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import expressLayouts from "express-ejs-layouts";
import { Prisma } from "@prisma/client";
import config from "./config";
import prisma from "./lib/prisma";
import logger from "./api/utils/logger";
import { globalRateLimit } from "./api/middleware/rateLimit";

const projectRoot = path.basename(__dirname) === "dist" ? path.resolve(__dirname, "..") : __dirname;

const app = express();

// ─── view engine (EJS) ───
app.set("view engine", "ejs");
app.set("views", path.join(projectRoot, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

// ─── cookie parser ───
app.use(cookieParser());

// ─── static assets (فقط css/js/assets) ───
app.use("/static", express.static(path.join(projectRoot, "public")));

// ─── global middleware ───
app.use(helmet());
app.use(cors({ origin: config.api.corsOrigins }));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(globalRateLimit);

// ─── اتصال دیتابیس ───
async function initializeDatabase() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.success("اتصال به دیتابیس برقرار شد.");
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : "UNKNOWN";
    logger.error(`خطا در اتصال به دیتابیس (کد: ${code}).`);
    throw error;
  }
}

// ─── seed ادمین پیش‌فرض ───
async function seedDefaultAdmin() {
  const count = await prisma.user.count({ where: { role: "admin" } });
  if (count > 0) return;
  if (!config.admin.password) {
    throw new Error("متغیر DEFAULT_ADMIN_PASSWORD تنظیم نشده است.");
  }

  const existing = await prisma.user.findUnique({ where: { email: config.admin.email } });
  if (existing) {
    logger.warn("ادمین پیش‌فرض ساخته نشد؛ ایمیل پیکربندی‌شده از قبل وجود دارد.");
    return;
  }

  const hash = await bcrypt.hash(config.admin.password, 10);
  try {
    await prisma.user.create({
      data: {
        email: config.admin.email,
        password: hash,
        firstName: "Admin",
        lastName: "Default",
        role: "admin",
        isActive: true,
      },
    });
    logger.warn(`ادمین پیش‌فرض ساخته شد: ${config.admin.email} — رمز را فوراً تغییر بده!`);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (adminCount > 0) return;
    }
    throw error;
  }
}

async function initializeServer() {
  await initializeDatabase();
  await seedDefaultAdmin();
  return app;
}

export { app, initializeServer, seedDefaultAdmin };