import bcrypt from "bcrypt";
import Joi from "joi";
import { Prisma } from "@prisma/client";
import type { ApiContext, FeatureModule } from "../api/types";

interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const feature: FeatureModule = {
  name: "example-auth",
  version: "1.0.0",
  description: "ثبت‌نام، ورود و پروفایل کاربر با JWT",

  registerApi: async ({
    router, prisma, auth, validate, authRateLimit,
    response, ApiError, asyncHandler, jwt, logger,
  }: ApiContext) => {
    logger.info("[Auth] در حال راه‌اندازی...");

    const registerSchema = {
      body: Joi.object({
        email: Joi.string().email().required().messages({ "string.email": "ایمیل نامعتبر است." }),
        password: Joi.string().min(6).max(64).required(),
        firstName: Joi.string().max(128).allow(""),
        lastName: Joi.string().max(128).allow(""),
      }),
    };

    const loginSchema = {
      body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      }),
    };

    // ─── ثبت‌نام ───
    router.post(
      "/register",
      authRateLimit,
      validate(registerSchema),
      asyncHandler(async (req, res) => {
        const { email, password, firstName, lastName } = req.body as RegisterInput;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) throw new ApiError("EMAIL_EXISTS", "این ایمیل قبلاً ثبت شده است.", 409);

        const hash = await bcrypt.hash(password, 10);
        let user;
        try {
          user = await prisma.user.create({
            data: { email, password: hash, firstName, lastName, role: "user", isActive: true },
            select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
          });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new ApiError("EMAIL_EXISTS", "این ایمیل قبلاً ثبت شده است.", 409);
          }
          throw error;
        }

        const token = jwt.signToken({ id: user.id, role: user.role });
        logger.success(`ثبت‌نام جدید: ${email}`);
        return response.ok(res, { user, token }, 201);
      })
    );

    // ─── ورود ───
    router.post(
      "/login",
      authRateLimit,
      validate(loginSchema),
      asyncHandler(async (req, res) => {
        const { email, password } = req.body as LoginInput;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) throw new ApiError("INVALID_CREDENTIALS", "ایمیل یا رمز نادرست است.", 401);

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new ApiError("INVALID_CREDENTIALS", "ایمیل یا رمز نادرست است.", 401);

        const token = jwt.signToken({ id: user.id, role: user.role });
        const clean = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
        };
        logger.success(`ورود: ${email}`);
        return response.ok(res, { user: clean, token });
      })
    );

    // ─── پروفایل من ───
    router.get(
      "/me",
      auth.requireAuth,
      asyncHandler(async (req, res) => response.ok(res, req.user))
    );

    logger.success("[Auth] آماده است.");
  },
};

export = feature;