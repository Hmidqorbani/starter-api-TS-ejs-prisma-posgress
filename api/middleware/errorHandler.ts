import type { ErrorRequestHandler } from "express";
import ApiError from "../utils/ApiError";
import { fail } from "../utils/response";
import logger from "../utils/logger";
import config from "../../config";

// eslint-disable-next-line no-unused-vars
const errorHandler: ErrorRequestHandler = (unknownError, req, res, _next) => {
  const err = unknownError instanceof Error ? unknownError : new Error(String(unknownError));
  const errorWithCode = err as Error & { code?: string };
  const isPrismaError = Boolean(err.name.startsWith("PrismaClient"));
  const logMessage = isPrismaError ? `${err.name} (${errorWithCode.code || "UNKNOWN"})` : err.message;
  logger.error(`خطا در ${req.method} ${req.originalUrl}: ${logMessage}`);
  if (err instanceof ApiError) {
    return fail(res, err.code, err.message, err.status);
  }
  if (errorWithCode.code === "P2002") {
    return fail(res, "DUPLICATE_VALUE", "مقدار تکراری است.", 409);
  }
  if (errorWithCode.code === "P2025") {
    return fail(res, "NOT_FOUND", "مورد پیدا نشد.", 404);
  }
  if (isPrismaError) {
    return fail(res, "INTERNAL_ERROR", "خطای داخلی سرور", 500);
  }
  const message = config.env === "production" ? "خطای داخلی سرور" : err.message;
  return fail(res, "INTERNAL_ERROR", message, 500);
};

export default errorHandler;