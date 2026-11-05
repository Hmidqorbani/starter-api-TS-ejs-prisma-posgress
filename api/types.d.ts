import type { Express, RequestHandler, Router } from "express";
import type prisma from "../lib/prisma";
import type ApiError from "./utils/ApiError";
import type logger from "./utils/logger";

export interface ApiContext {
  router: Router;
  app: Express;
  prisma: typeof prisma;
  auth: typeof import("./middleware/auth");
  validate: typeof import("./middleware/validate").default;
  authRateLimit: RequestHandler;
  response: typeof import("./utils/response");
  ApiError: typeof ApiError;
  asyncHandler: typeof import("./utils/asyncHandler").default;
  jwt: typeof import("./utils/jwt");
  pagination: typeof import("./utils/pagination");
  logger: typeof logger;
}

export interface FeatureModule {
  name: string;
  version?: string;
  description?: string;
  registerApi?: (context: ApiContext) => void | Promise<void>;
}

export interface LoadedFeature {
  name: string;
  module: FeatureModule;
  feature: FeatureRegistration;
}

export interface FeatureRegistration {
  name: string;
  path: string;
  module: FeatureModule | null;
  enabled: boolean;
  priority: number;
}

export interface FeatureOptions {
  enabled?: boolean;
  priority?: number;
}