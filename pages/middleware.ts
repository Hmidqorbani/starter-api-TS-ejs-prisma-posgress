import type { RequestHandler } from "express";
import config from "../config";
import { verifyToken } from "../api/utils/jwt";
import prisma from "../lib/prisma";

const publicUserFields = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
} as const;

// اگر لاگین است، redirect به پنل خودش
const redirectIfAuth: RequestHandler = async (req, res, next) => {
  const token = req.cookies[config.jwt.cookieName];
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      select: publicUserFields,
    });
    if (user && user.isActive) {
      return res.redirect(user.role === "admin" ? "/admin" : "/dashboard");
    }
  } catch {}
  next();
};

// کاربر لاگین لازم است
const requirePageAuth: RequestHandler = async (req, res, next) => {
  const token = req.cookies[config.jwt.cookieName];
  if (!token) return res.redirect("/login?error=auth_required");
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      select: publicUserFields,
    });
    if (!user || !user.isActive) {
      res.clearCookie(config.jwt.cookieName);
      return res.redirect("/login?error=user_invalid");
    }
    req.user = user;
    res.locals.user = user; // در دسترس همه‌ی view ها
    next();
  } catch {
    res.clearCookie(config.jwt.cookieName);
    return res.redirect("/login?error=token_invalid");
  }
};

// ادمین لازم است
const requirePageAdmin: RequestHandler = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.redirect("/dashboard?error=forbidden");
  }
  next();
};

export { redirectIfAuth, requirePageAuth, requirePageAdmin };