import express, { type Express } from "express";
import config from "../config";
import logger from "./utils/logger";
import requestLogger from "./middleware/requestLogger";
import errorHandler from "./middleware/errorHandler";
import notFound from "./middleware/notFound";
import { ok } from "./utils/response";
import type { ApiContext, LoadedFeature } from "./types";

type ApiDependencies = Omit<ApiContext, "router" | "app">;

const setupApi = (app: Express): { prefix: string | null } => {
  if (!config.api.enabled) {
    logger.warn("API غیرفعال است.");
    return { prefix: null };
  }
  const prefix = config.api.prefix;
  app.use(requestLogger);

  // health (public)
  app.get(`${prefix}/health`, (req, res) =>
    ok(res, {
      status: "ok",
      env: config.env,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  );

  logger.success(`API در مسیر ${prefix} فعال شد.`);
  return { prefix };
};

const initializeApis = async (
  featuresList: LoadedFeature[],
  app: Express,
  apiContext: ApiDependencies,
  prefix: string | null,
): Promise<void> => {
  let mounted = 0;
  for (const { name, module } of featuresList) {
    if (typeof module.registerApi !== "function") continue;
    try {
      const router = express.Router();
      await module.registerApi({ router, app, ...apiContext });
      app.use(`${prefix}/${name}`, router);
      logger.success(`مسیرهای فیچر "${name}" در ${prefix}/${name} mount شدند.`);
      mounted++;
    } catch (error) {
      logger.error(`خطا در mount فیچر API "${name}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  logger.info(`${mounted} فیچر API mount شدند.`);

  // 404 + error handler باید آخر بیایند
  app.use(notFound);
  app.use(errorHandler);
};

export { setupApi, initializeApis };