# ➕ راهنمای افزودن فیچر جدید (API Starter Kit)

این راهنمای گام‌به‌گام برای اضافه کردن یک قابلیت ماژولار به استارتر کیت API است.
قوانین کامل در [AGENTS.md](../AGENTS.md) آمده؛ اینجا خلاصه‌ی عملیاتی را می‌بینی.

## گام ۱: فایل فیچر را بساز

فایل جدید TypeScript در `features/` با نام **kebab-case انگلیسی** بساز، مثلاً `features/my-feature.ts`:

```js
import Joi from "joi";
import type { ApiContext, FeatureModule } from "../api/types";

const feature: FeatureModule = {
  name: "my-feature",
  version: "1.0.0",
  description: "توضیح کوتاه فارسی",

  registerApi: async ({
    router, prisma, auth, validate, authRateLimit,
    response, ApiError, asyncHandler, jwt, pagination, logger,
  }: ApiContext) => {
    logger.info("[My-Feature] در حال راه‌اندازی...");

    // Schema برای validation
    const createSchema = {
      body: Joi.object({
        name: Joi.string().max(100).required(),
        value: Joi.string().allow(""),
      }),
    };

    // GET لیست (با pagination)
    router.get(
      "/",
      auth.requireAuth,
      asyncHandler(async (req, res) => {
        const { page, limit, offset } = pagination.getPagination(req.query);
        const result = await prisma.$transaction(async (tx) => {
          const count = await tx.myModel.count();
          const rows = await tx.myModel.findMany({
            skip: offset,
            take: limit,
            orderBy: { id: "desc" },
          });
          return { count, rows };
        }, { isolationLevel: "RepeatableRead" });
        return response.ok(res, pagination.getPagingData(result.count, result.rows, page, limit));
      })
    );

    // GET تکی
    router.get(
      "/:id",
      auth.requireAuth,
      asyncHandler(async (req, res) => {
        const item = await prisma.myModel.findUnique({ where: { id: Number(req.params.id) } });
        if (!item) throw new ApiError("NOT_FOUND", "مورد پیدا نشد.", 404);
        return response.ok(res, item);
      })
    );

    // POST ایجاد (فقط ادمین)
    router.post(
      "/",
      auth.requireAuth,
      auth.requireAdmin,
      validate(createSchema),
      asyncHandler(async (req, res) => {
        const item = await prisma.myModel.create({ data: req.body });
        logger.success(`MyModel جدید: ${item.id}`);
        return response.ok(res, item, 201);
      })
    );

    // PUT آپدیت (فقط ادمین)
    router.put(
      "/:id",
      auth.requireAuth,
      auth.requireAdmin,
      validate(createSchema),
      asyncHandler(async (req, res) => {
        const item = await prisma.myModel.update({
          where: { id: Number(req.params.id) },
          data: req.body,
        });
        return response.ok(res, item);
      })
    );

    // DELETE (فقط ادمین)
    router.delete(
      "/:id",
      auth.requireAuth,
      auth.requireAdmin,
      asyncHandler(async (req, res) => {
        await prisma.myModel.delete({ where: { id: Number(req.params.id) } });
        return response.ok(res, { deleted: true });
      })
    );

    logger.success("[My-Feature] آماده است.");
  },
};

export = feature;
```

## گام ۲: در `launcher.ts` ثبت کن

```js
loader.registerFeature("my-feature", "./features/my-feature", {
  enabled: true,
  priority: 20, // 5=سیستمی، 10=ادمین/Auth، 20=کاربر عادی، 50=پیش‌فرض
});
```

**نکته:** نام فیچر (`name` در فایل و پارامتر اول `registerFeature`) باید یکسان باشد، چون مسیر URL به صورت `/api/v1/<name>/...` ساخته می‌شود.

## گام ۳: اگر مدل دیتابیس لازم داری

1. مدل را در `prisma/schema.prisma` تعریف کن.
2. برای رابطه‌ها relation field و foreign keyهای Prisma تعریف کن.
3. با `npm run prisma:migrate:dev -- --name add-model` migration بساز.
4. فیچرها از `prisma` تزریق‌شده در `registerApi` استفاده می‌کنند.

> ⚠️ مدل بیزینس‌اسپسیفیک (Course, Product, Order, …) به استارتر اضافه نکن — مدل جدید فقط همراه فیچر واقعی پروژه‌ی نهایی ساخته می‌شود.
>
> ❌ مدل runtime را در فایل جدا تعریف نکن — مدل‌ها باید در `prisma/schema.prisma` بمانند.

## گام ۴: Dependency Injection در `registerApi`

پارامترهای موجود در `registerApi` (از طریق `apiContext` در `launcher.ts`):

| پارامتر | نوع | کاربرد |
|----------|-----|--------|
| `router` | `express.Router()` | برای تعریف routeها |
| `prisma` | PrismaClient | دسترسی مشترک به مدل‌های Prisma |
| `auth` | Object | `{ requireAuth, requireAdmin, optionalAuth }` |
| `validate` | Function | Joi validator middleware |
| `authRateLimit` | Middleware | Rate limit سخت‌گیرانه برای auth |
| `response` | Object | `{ ok, fail }` |
| `ApiError` | Class | کلاس خطای سفارشی |
| `asyncHandler` | Function | Wrapper برای catch خودکار |
| `jwt` | Object | `{ signToken, verifyToken }` |
| `pagination` | Object | `{ getPagination, getPagingData }` |
| `logger` | Object | `{ info, warn, error, success }` |

## گام ۵: Auth و Authorization

- **عمومی (بدون auth):** health check، register، login
- **کاربر لاگین:** `auth.requireAuth` → `req.user` در دسترس
- **فقط ادمین:** `auth.requireAuth` + `auth.requireAdmin`

```js
router.get("/profile", auth.requireAuth, asyncHandler(...));
router.post("/", auth.requireAuth, auth.requireAdmin, asyncHandler(...));
```

## گام ۶: Validation (Joi)

هر endpoint باید validation داشته باشد:

```js
const schema = {
  body: Joi.object({ email: Joi.string().email().required() }),
  params: Joi.object({ id: Joi.number().integer().required() }),
  query: Joi.object({ page: Joi.number().integer().min(1) }),
};

router.post("/", validate(schema), asyncHandler(...));
```

## گام ۷: Response Format

```js
// موفقیت
return response.ok(res, data, 201); // status optional، پیش‌فرض 200

// خطا — فقط throw کن، errorHandler هندل می‌کند
throw new ApiError("CODE", "پیام فارسی", 400);
```

## گام ۸: Logging

از `logger` استفاده کن (نه `console.log` مستقیم):

```js
logger.info("[My-Feature] در حال راه‌اندازی...");
logger.success("مورد با موفقیت ساخته شد.");
logger.warn("هشدار: ...");
logger.error("خطا در ...:", error);
```

## گام ۹: چک‌لیست نهایی

- [ ] فایل در `features/` (kebab-case)
- [ ] ساختار TypeScript `FeatureModule` با `registerApi` و `export = feature` رعایت شد
- [ ] در `launcher.ts` با `registerFeature` ثبت شد
- [ ] مسیر فیچر با `name` مطابقت دارد (URL prefix)
- [ ] Validation روی body/params/query با Joi
- [ ] Auth مناسب (`requireAuth` / `requireAdmin`) روی endpointهای محافظت‌شده
- [ ] Rate limit روی endpointهای حساس (login/register)
- [ ] پاسخ یکدست `response.ok()` یا `throw new ApiError()`
- [ ] همه‌ی catchها با `logger.error` لاگ می‌شوند
- [ ] هیچ secret hardcode نشده
- [ ] مدل جدید (اگر هست) در `prisma/schema.prisma` تعریف و migration آن ثبت شده

---

## 📄 افزودن صفحه‌ی جدید (EJS)

استارتر شامل لایه‌ی Frontend با EJS است. برای اضافه کردن یک صفحه‌ی جدید:

### ۱. فایل View بساز

در `views/pages/` فایل `.ejs` بساز (مثلاً `views/pages/my-page.ejs`):

```ejs
<div class="my-page">
  <h1>صفحه من</h1>
  <p>محتوای صفحه...</p>
</div>

<!-- اگر JS نیاز داری، در همین فایل یا در public/js/ اضافه کن -->
<script src="/static/js/my-page.js"></script>
```

### ۲. Route در `pages/routes.ts` اضافه کن

```js
// در pages/routes.ts
router.get("/my-page", requirePageAuth, async (req, res) => {
  try {
    // اگر داده از DB لازم داری:
    const data = await prisma.myModel.findMany();
    res.render("pages/my-page", {
      title: "صفحه من",
      data,
      layout: "layouts/main",
    });
  } catch (error) {
    logger.error("خطا در /my-page:", error);
    res.status(500).render("errors/500", { title: "خطا", layout: "layouts/main" });
  }
});
```

**Middlewareهای موجود:**
- `redirectIfAuth` — برای `/login`، `/register` (اگر لاگین هست redirect می‌کند)
- `requirePageAuth` — برای صفحات نیاز به لاگین (`/dashboard`)
- `requirePageAdmin` — فقط برای ادمین (`/admin`)

### ۳. Static Assets (اختیاری)

- CSS: `public/css/my-page.css` → در view: `<link rel="stylesheet" href="/static/css/my-page.css">`
- JS: `public/js/my-page.js` → در view: `<script src="/static/js/my-page.js"></script>`

### ۴. چک‌لیست صفحه‌ی جدید

- [ ] فایل EJS در `views/pages/` ساخته شد.
- [ ] از `layout: "layouts/main"` استفاده می‌کند.
- [ ] در `pages/routes.ts` route اضافه شده با middleware مناسب.
- [ ] اگر نیاز به داده از دیتابیس دارد، در route handler query می‌شود.
- [ ] خطاها با `res.redirect("/path?error=code")` هندل می‌شوند.
- [ ] برای عملیات ادمین/مستخدم (AJAX)، از `public/js/` استفاده می‌شود (cookie خودکار فرستاده می‌شود).
- [ ] RTL کامل، فونت فارسی (Vazirmatn).
- [ ] بدون inline JS/CSS — همه در فایل‌های جدا در `public/`.