import Joi from "joi";
import type { ApiContext, FeatureModule } from "../api/types";

interface UpdateRoleInput {
  role: "user" | "admin";
}

interface UpdateActiveInput {
  isActive: boolean;
}

const feature: FeatureModule = {
  name: "example-admin",
  version: "1.0.0",
  description: "مدیریت کاربران (فقط ادمین)",

  registerApi: async ({
    router, prisma, auth, validate, response,
    ApiError, asyncHandler, pagination, logger,
  }: ApiContext) => {
    logger.info("[Admin] در حال راه‌اندازی...");

    router.get(
      "/users",
      auth.requireAuth,
      auth.requireAdmin,
      asyncHandler(async (req, res) => {
        const { page, limit, offset } = pagination.getPagination(req.query);
        const result = await prisma.$transaction(async (tx) => {
          const [count, rows] = await Promise.all([
            tx.user.count(),
            tx.user.findMany({
              skip: offset,
              take: limit,
              orderBy: { id: "desc" },
              select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
            }),
          ]);
          return { count, rows };
        }, { isolationLevel: "RepeatableRead" });
        return response.ok(res, pagination.getPagingData(result.count, result.rows, page, limit));
      })
    );

    router.get(
      "/users/:id",
      auth.requireAuth,
      auth.requireAdmin,
      validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }),
      asyncHandler(async (req, res) => {
        const user = await prisma.user.findUnique({
          where: { id: Number(req.params.id) },
          select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
        });
        if (!user) throw new ApiError("NOT_FOUND", "کاربر پیدا نشد.", 404);
        return response.ok(res, user);
      })
    );

    router.patch(
      "/users/:id/role",
      auth.requireAuth,
      auth.requireAdmin,
      validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }),
      validate({ body: Joi.object({ role: Joi.string().valid("user", "admin").required() }) }),
      asyncHandler(async (req, res) => {
        const { role } = req.body as UpdateRoleInput;
        const user = await prisma.user.update({
          where: { id: Number(req.params.id) },
          data: { role },
          select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
        });
        logger.success(`نقش کاربر ${user.id} به ${role} تغییر کرد.`);
        return response.ok(res, user);
      })
    );

    router.patch(
      "/users/:id/active",
      auth.requireAuth,
      auth.requireAdmin,
      validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }),
      validate({ body: Joi.object({ isActive: Joi.boolean().required() }) }),
      asyncHandler(async (req, res) => {
        const { isActive } = req.body as UpdateActiveInput;
        const user = await prisma.user.update({
          where: { id: Number(req.params.id) },
          data: { isActive },
          select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
        });
        return response.ok(res, user);
      })
    );

    logger.success("[Admin] آماده است.");
  },
};

export = feature;