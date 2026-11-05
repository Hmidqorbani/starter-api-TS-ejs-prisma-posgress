import express from "express";
import bcrypt from "bcrypt";
import Joi from "joi";
import { Prisma } from "@prisma/client";
import config from "../config";
import prisma from "../lib/prisma";
import { signToken } from "../api/utils/jwt";
import logger from "../api/utils/logger";
import { redirectIfAuth, requirePageAuth, requirePageAdmin } from "./middleware";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  firstName?: string;
  lastName?: string;
}

const isLoginInput = (value: unknown): value is LoginInput =>
  typeof value === "object" &&
  value !== null &&
  "email" in value &&
  typeof value.email === "string" &&
  "password" in value &&
  typeof value.password === "string";

const isRegisterInput = (value: unknown): value is RegisterInput =>
  isLoginInput(value) &&
  (!("firstName" in value) || typeof value.firstName === "string") &&
  (!("lastName" in value) || typeof value.lastName === "string");

const router = express.Router();

// Skip API routes entirely - pass to next app-level router
router.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/")) {
    return next();
  }
  next();
});

// ─── Landing ───
router.get("/", redirectIfAuth, (req, res) => {
  res.render("pages/landing", { title: "استارتر کیت API", layout: "layouts/main" });
});

// ─── Login (صفحه) ───
router.get("/login", redirectIfAuth, (req, res) => {
  res.render("pages/auth/login", {
    title: "ورود",
    error: req.query.error,
    layout: "layouts/main",
  });
});

// ─── Login (POST) ───
router.post("/login", async (req, res) => {
  try {
    if (!isLoginInput(req.body)) return res.redirect("/login?error=invalid_credentials");
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.redirect("/login?error=invalid_credentials");
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.redirect("/login?error=invalid_credentials");

    const token = signToken({ id: user.id, role: user.role });
    res.cookie(config.jwt.cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.env === "production",
      maxAge: config.jwt.cookieMaxAge,
    });
    logger.success(`ورود موفق: ${email}`);
    return res.redirect(user.role === "admin" ? "/admin" : "/dashboard");
  } catch (error) {
    logger.error("خطا در /login:", error);
    return res.redirect("/login?error=server_error");
  }
});

// ─── Register (صفحه) ───
router.get("/register", redirectIfAuth, (req, res) => {
  res.render("pages/auth/register", {
    title: "ثبت‌نام",
    error: req.query.error,
    layout: "layouts/main",
  });
});

// ─── Register (POST) ───
router.post("/register", async (req, res) => {
  try {
    if (!isRegisterInput(req.body)) return res.redirect("/register?error=invalid_input");
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || password.length < 6) {
      return res.redirect("/register?error=invalid_input");
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.redirect("/register?error=email_exists");

    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, password: hash, firstName, lastName, role: "user", isActive: true },
      select: { id: true },
    });
    logger.success(`ثبت‌نام جدید: ${email}`);
    return res.redirect("/login?success=registered");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.redirect("/register?error=email_exists");
    }
    logger.error("خطا در /register:", error);
    return res.redirect("/register?error=server_error");
  }
});

// ─── Logout ───
router.post("/logout", (req, res) => {
  res.clearCookie(config.jwt.cookieName);
  return res.redirect("/login");
});

// ─── Dashboard ───
router.get("/dashboard", requirePageAuth, async (req, res) => {
  try {
    const settings = await prisma.setting.findMany({ orderBy: { id: "desc" }, take: 20 });
    res.render("pages/dashboard", {
      title: "پنل کاربر",
      settings,
      layout: "layouts/main",
    });
  } catch (error) {
    logger.error("خطا در /dashboard:", error);
    res.status(500).render("errors/500", { title: "خطا", layout: "layouts/main" });
  }
});

// ─── Admin ───
router.get("/admin", requirePageAuth, requirePageAdmin, async (req, res) => {
  try {
    const [users, settings] = await Promise.all([
      prisma.user.findMany({
        orderBy: { id: "desc" },
        take: 50,
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
      }),
      prisma.setting.findMany({ orderBy: { id: "desc" }, take: 50 }),
    ]);
    res.render("pages/admin", {
      title: "پنل ادمین",
      users,
      settings,
      layout: "layouts/main",
    });
  } catch (error) {
    logger.error("خطا در /admin:", error);
    res.status(500).render("errors/500", { title: "خطا", layout: "layouts/main" });
  }
});

export default router;