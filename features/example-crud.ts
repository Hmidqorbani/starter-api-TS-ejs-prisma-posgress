import Joi from "joi";
import type { ApiContext, FeatureModule } from "../api/types";

interface CreateSettingInput {
  key: string;
  value?: string;
  description?: string;
}

interface UpdateSettingInput {
  value?: string;
  description?: string;
}

const feature: FeatureModule = {
  name: "example-crud",
  version: "1.0.0",
  description: "نمونه CRUD روی Setting (خواندن: کاربر، نوشتن: ادمین)",

  registerApi: async ({
    router, prisma, auth, validate, response,
    ApiError, asyncHandler, pagination, logger,
  }: ApiContext) => {
    logger.info("[CRUD] در حال راه‌اندازی...");

    const createSchema = {
      body: Joi.object({
        key: Joi.string().max(100).required(),
        value: Joi.string().allow(""),
        description: Joi.string().allow(""),
      }),
    };

    const updateSchema = {
      body: Joi.object({
        value: Joi.string().allow(""),
        description: Joi.string().allow(""),
      }),
    };

    router.get(
      "/",
      auth.requireAuth,
      asyncHandler(async (req, res) => {
        const { page, limit, offset } = pagination.getPagination(req.query);
        const result = await prisma.$transaction(async (tx) => {
          const [count, rows] = await Promise.all([
            tx.setting.count(),
            tx.setting.findMany({ skip: offset, take: limit, orderBy: { id: "desc" } }),
          ]);
          return { count, rows };
        }, { isolationLevel: "RepeatableRead" });
        return response.ok(res, pagination.getPagingData(result.count, result.rows, page, limit));
      })
    );

    router.get(
      "/:id",
      auth.requireAuth,
      validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }),
      asyncHandler(async (req, res) => {
        const item = await prisma.setting.findUnique({ where: { id: Number(req.params.id) } });
        if (!item) throw new ApiError("NOT_FOUND", "مورد پیدا نشد.", 404);
        return response.ok(res, item);
      })
    );

    router.post(
      "/",
      auth.requireAuth,
      auth.requireAdmin,
      validate(createSchema),
      asyncHandler(async (req, res) => {
        const item = await prisma.setting.create({ data: req.body as CreateSettingInput });
        logger.success(`Setting جدید: ${item.key}`);
        return response.ok(res, item, 201);
      })
    );

    router.put(
      "/:id",
      auth.requireAuth,
      auth.requireAdmin,
      validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }),
      validate(updateSchema),
      asyncHandler(async (req, res) => {
        const item = await prisma.setting.update({
          where: { id: Number(req.params.id) },
          data: req.body as UpdateSettingInput,
        });
        return response.ok(res, item);
      })
    );

    router.delete(
      "/:id",
      auth.requireAuth,
      auth.requireAdmin,
      validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }),
      asyncHandler(async (req, res) => {
        await prisma.setting.delete({ where: { id: Number(req.params.id) } });
        return response.ok(res, { deleted: true });
      })
    );

    logger.success("[CRUD] آماده است.");
  },
};

export = feature;