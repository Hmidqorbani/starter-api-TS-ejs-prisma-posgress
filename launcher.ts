import fs from "node:fs";
import path from "node:path";
import { app, initializeServer } from "./server";
import { setupApi, initializeApis } from "./api";
import { setupPages } from "./pages";
import prisma from "./lib/prisma";
import config from "./config";
import logger from "./api/utils/logger";
import * as auth from "./api/middleware/auth";
import validate from "./api/middleware/validate";
import { authRateLimit } from "./api/middleware/rateLimit";
import * as response from "./api/utils/response";
import ApiError from "./api/utils/ApiError";
import asyncHandler from "./api/utils/asyncHandler";
import * as jwt from "./api/utils/jwt";
import * as pagination from "./api/utils/pagination";
import type { ApiContext, FeatureModule, FeatureOptions, FeatureRegistration, LoadedFeature } from "./api/types";

process.on("unhandledRejection", (reason) => logger.error("Unhandled Rejection:", reason));
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

const isFeatureModule = (value: unknown): value is FeatureModule => {
  if (typeof value !== "object" || value === null || !("name" in value)) return false;
  if (typeof value.name !== "string") return false;
  return !("registerApi" in value) || typeof value.registerApi === "function";
};

class FeatureLoader {
  private readonly features = new Map<string, FeatureRegistration>();
  registerFeature(name: string, modulePath: string, options: FeatureOptions = {}): boolean {
    try {
      const extension = path.extname(__filename) === ".ts" ? ".ts" : ".js";
      const fullPath = path.resolve(__dirname, `${modulePath}${extension}`);
      if (!fs.existsSync(fullPath)) {
        logger.warn(`فایل فیچر ${name} پیدا نشد: ${fullPath}`);
        return false;
      }
      this.features.set(name, {
        name,
        path: fullPath,
        module: null,
        enabled: options.enabled !== false,
        priority: options.priority || 50,
      });
      logger.success(`فیچر "${name}" ثبت شد.`);
      return true;
    } catch (error) {
      logger.error(`خطا در ثبت فیچر ${name}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  async loadFeature(name: string): Promise<FeatureModule | null> {
    const feature = this.features.get(name);
    if (!feature || !feature.enabled) return null;
    try {
      delete require.cache[require.resolve(feature.path)];
      const loaded: unknown = require(feature.path);
      if (!isFeatureModule(loaded)) throw new TypeError(`ماژول فیچر ${name} قرارداد معتبری ندارد.`);
      feature.module = loaded;
      logger.success(`فیچر ${name} بارگذاری شد.`);
      return feature.module;
    } catch (error) {
      logger.error(`خطا در بارگذاری فیچر "${name}": ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  async loadAllFeatures(): Promise<LoadedFeature[]> {
    const results: LoadedFeature[] = [];
    // ترتیب بارگذاری بر اساس priority (عدد کوچکتر = اول)
    const sorted = [...this.features.values()].sort((a, b) => a.priority - b.priority);
    for (const feature of sorted) {
      if (!feature.enabled) continue;
      const module = await this.loadFeature(feature.name);
      if (module) results.push({ name: feature.name, module, feature });
    }
    logger.info(`${results.length} فیچر بارگذاری شدند.`);
    return results;
  }
}

async function launch() {
  try {
    logger.info("در حال راه‌اندازی...");

    // ۱. دیتابیس + seed
    await initializeServer();

    // ۲. setup API (health + prefix)
    const { prefix } = setupApi(app);

    // ۳. setup Pages (EJS)
    setupPages(app);

    // ۴. بارگذاری فیچرها
    const loader = new FeatureLoader();
    loader.registerFeature("example-auth", "./features/example-auth", { priority: 10 });
    loader.registerFeature("example-crud", "./features/example-crud", { priority: 20 });
    loader.registerFeature("example-admin", "./features/example-admin", { priority: 10 });

    const loadedFeatures = await loader.loadAllFeatures();

    // ۵. mount route های فیچرها
    const apiContext: Omit<ApiContext, "router" | "app"> = {
      prisma,
      auth,
      validate,
      authRateLimit,
      response,
      ApiError,
      logger,
      asyncHandler,
      jwt,
      pagination,
    };
    await initializeApis(loadedFeatures, app, apiContext, prefix);

    // ۶. start listening
    const server = app.listen(config.port, () => {
      logger.success(`سرور روی پورت ${config.port} آماده است.`);
      logger.info(`محیط: ${config.env}`);
    });

    // ۶. graceful shutdown
    let shuttingDown = false;
    const shutdown = async (signal: NodeJS.Signals) => {
      if (shuttingDown) return;
      shuttingDown = true;
      logger.warn(`دریافت ${signal}. در حال خاموش‌سازی...`);
      server.close(async (error?: Error) => {
        if (error) logger.error(`خطا هنگام بستن سرور: ${error.message}`);
        await prisma.$disconnect();
        logger.success("خاموش شد.");
        process.exit(0);
      });
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    return loader;
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error";
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "UNKNOWN";
    logger.error(`خطا در راه‌اندازی (${name}: ${code}).`);
    process.exit(1);
  }
}

if (require.main === module) launch().catch((error: unknown) => logger.error("خطا در launch:", error));

export { launch, FeatureLoader };