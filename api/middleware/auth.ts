import type { Request, RequestHandler } from "express";
import config from "../../config";
import { verifyToken } from "../utils/jwt";
import ApiError from "../utils/ApiError";
import prisma from "../../lib/prisma";

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies && req.cookies[config.jwt.cookieName]) {
    return req.cookies[config.jwt.cookieName];
  }
  return null;
};

const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      // برای API → JSON، برای صفحه → redirect
      if (req.accepts("html")) return res.redirect("/login?error=auth_required");
      throw new ApiError("UNAUTHORIZED", "توکن ارائه نشده است.", 401);
    }
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      if (req.accepts("html")) return res.redirect("/login?error=user_invalid");
      throw new ApiError("UNAUTHORIZED", "کاربر معتبر نیست.", 401);
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.user) {
    if (req.accepts("html")) return res.redirect("/login");
    return next(new ApiError("UNAUTHORIZED", "ابتدا وارد شوید.", 401));
  }
  if (req.user.role !== "admin") {
    if (req.accepts("html")) return res.redirect("/dashboard?error=forbidden");
    return next(new ApiError("FORBIDDEN", "دسترسی ادمین لازم است.", 403));
  }
  next();
};

const optionalAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return next();
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
};

export { requireAuth, requireAdmin, optionalAuth };