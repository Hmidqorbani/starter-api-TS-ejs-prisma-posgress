# AGENTS.md — API Starter Kit

> **نسخه:** 2.0.0
> **نوع پروژه:** Boilerplate / Starter Kit برای API / Backend
> **زبان:** Node.js + Express + Prisma ORM + PostgreSQL

---

## 🎯 هدف پروژه

این یک **استارتر کیت** است، نه یک پروژه‌ی کاربردی. هدفش این است که هر Developer یا AI Agent بتواند با حفظ معماری موجود، قابلیت‌های جدید را به‌صورت ماژولار اضافه کند.

**این پروژه را به یک پروژه‌ی بیزینس‌اسپسیفیک تبدیل نکن.**
منطق دامنه (Domain Logic) مثل «دوره آموزشی»، «فروشگاه»، «نوبت‌دهی» و… نباید در استارتر هاردکد شود. فقط الگو و قالب باید باقی بماند.

**استارتر یک قالب خالی است، نه یک container که پروژه‌های قدیمی را داخلش بریزند.**
هر پروژه‌ی جدید = کپی تازه از استارتر + مدل‌های مخصوص خودش + فیچرهای مخصوص خودش.

---

## 🏗️ معماری هسته (تغییرناپذیر — CRITICAL)

معماری این پروژه **Feature-Based** است. هر قابلیت، یک فایل TypeScript مستقل در `features/` است که توسط `FeatureLoader` در `launcher.ts` بارگذاری می‌شود.

### ساختار پوشه‌ها (این ساختار را حفظ کن)

```
starter-api/
├── api/                              # لایه‌ی API (middleware + utils)
│   ├── index.ts                      # setupApi + initializeApis
│   ├── middleware/
│   │   ├── auth.ts                   # requireAuth, requireAdmin, optionalAuth
│   │   ├── errorHandler.ts           # هندلر مرکزی خطا
│   │   ├── notFound.ts               # 404
│   │   ├── rateLimit.ts              # rate limiter سراسری + per-route
│   │   ├── requestLogger.ts          # morgan wrapper با فرمت فارسی
│   │   └── validate.ts               # Joi validator middleware
│   └── utils/
│       ├── ApiError.ts               # کلاس خطای سفارشی
│       ├── asyncHandler.ts           # wrapper برای catch خودکار
│       ├── jwt.ts                    # signToken, verifyToken
│       ├── logger.ts                 # logger با ایموجی + فارسی
│       ├── pagination.ts             # helper برای صفحه‌بندی
│       └── response.ts               # ok() و fail()
├── config/
│   └── index.ts                      # متمرکز env + اعتبارسنجی
├── features/
│   ├── example-auth.ts               # register / login / me
│   ├── example-crud.ts               # CRUD روی Setting
│   └── example-admin.ts              # لیست/مدیریت کاربر (admin only)
├── lib/
│   └── prisma.ts                     # Prisma Client singleton
├── prisma/
│   ├── schema.prisma                 # User + Setting
│   └── migrations/                   # Prisma migrations
├── docs/
│   ├── ARCHITECTURE.md               # توضیح معماری
│   ├── ADDING_FEATURES.md            # راهنمای افزودن فیچر
│   └── API_GUIDE.md                  # راهنمای API
├── .dockerignore
├── .env.example                      # نمونه env (بدون مقادیر واقعی)
├── .gitignore
├── AGENTS.md                         # همین فایل
├── README.md                         # راهنمای کلی پروژه
├── launcher.ts                       # FeatureLoader + bootstrap
├── Dockerfile
├── docker-compose.yml
├── package.json
└── server.ts                         # هسته‌ی سرور (Express + DB + seed)
```

### فایل‌های هسته که **نباید حذف یا بازنویسی شوند**

| فایل | نقش | قانون |
|---|---|---|
| `launcher.ts` | Bootstrap + FeatureLoader | فقط `registerFeature` های جدید اضافه کن، ساختار `FeatureLoader` را تغییر نده |
| `server.ts` | هسته‌ی سرور + DB + seed | فقط توابع کمکی جدید اضافه کن، ساختار فعلی را حفظ کن |
| `prisma/schema.prisma` | مدل‌ها و relationها | مدل‌ها و relationها را در schema نگه دار |
| `api/index.ts` | API setup + mount فیچرها | ترتیب middlewareها را حفظ کن (health → features → notFound → errorHandler) |

---

## 🚀 شروع یک پروژه‌ی جدید از این استارتر

وقتی می‌خواهی یک پروژه‌ی جدید بسازی، این مراحل را به‌ترتیب انجام بده:

### مرحله ۱: کپی استارتر
کل پوشه‌ی استارتر را کپی کن به نام پروژه‌ی جدید (مثلاً `my-shop-api/`).

### مرحله ۲: مدل‌های مخصوص پروژه را اضافه کن
- مدل‌ها را در `prisma/schema.prisma` تعریف کن.
- relationها را با relation field و foreign keyهای Prisma تعریف کن.
- migration توسعه را با `npm run prisma:migrate:dev -- --name add-model` بساز.

### مرحله ۳: دسترسی از طریق Prisma Client
- فیچرها `prisma` مشترک را از طریق `registerApi` دریافت می‌کنند:
  ```js
  const apiContext = {
    prisma,
    // ...
  };
  ```

### مرحله ۴: فیچرها را بساز
- هر فیچر در `features/` با قالب استاندارد (بخش بعدی).
- در `launcher.ts` با `registerFeature` ثبت کن.
- طبق چک‌لیست انتهای این فایل پیش برو.

### ⚠️ نکات مهم هنگام شروع پروژه‌ی جدید
- ❌ **هرگز** پروژه‌ی قدیمی را داخل استارتر نریز.
- ❌ **هرگز** مدل‌های بیزینس‌اسپسیفیک را به استارتر پایه اضافه نکن (فقط در کپی پروژه‌ی جدید).
- ✅ **همیشه** با کپی تازه شروع کن.
- ✅ `AGENTS.md` و `ARCHITECTURE.md` و `ADDING_FEATURES.md` در **همه‌ی پروژه‌ها یکسان** می‌مانند.
- ✅ ساختار در همه‌ی پروژه‌ها یکدست است — کسی که یکی را بلد باشد، همه را بلد است.

---

## 📐 قوانین توسعه‌ی فیچر (Feature Contract)

کد بک‌اند با TypeScript نوشته می‌شود و با CommonJS به `dist/` کامپایل می‌شود. در توسعه از `npm run dev`، برای بررسی از `npm run typecheck` و برای production از `npm run build && npm start` استفاده کن. فایل‌های `public/js/` همچنان JavaScript مرورگر هستند.

هر فیچر **باید** دقیقاً این ساختار را export کند:

```js
// features/my-feature.ts
import type { ApiContext, FeatureModule } from "../api/types";

const feature: FeatureModule = {
  name: "my-feature",
  version: "1.0.0",
  description: "توضیح کوتاه فارسی",

  registerApi: async ({
    router, prisma, auth, validate, authRateLimit,
    response, ApiError, asyncHandler, jwt, pagination, logger,
  }: ApiContext) => {
    console.log("🚀 [My-Feature] راه‌اندازی شد...");
    // ... منطق فیچر با router.get/post/put/delete
  },
};

export = feature;
```

### نکات کلیدی

1. **همه‌ی dependency ها از طریق `registerApi` پاس داده می‌شوند.**
  - ❌ هرگز `require("../server")` یا `require("../../server.ts")` داخل فیچر نکن.
   - ✅ از پارامترهای `registerApi` استفاده کن.

2. **ثبت فیچر در `launcher.ts` اجباری است.**
   ```js
  loader.registerFeature("my-feature", "./features/my-feature", {
     enabled: true,
     priority: 20,
   });
   ```

3. **اولویت‌ها را رعایت کن:**
   - `5` → سیستمی/پایه (مثل notifications)
   - `10` → ادمین / Auth
   - `20` → کاربر عادی
   - `50` → پیش‌فرض

---

## 🌐 قرارداد API

### فرمت پاسخ (Response Format)
**همیشه** این فرمت را رعایت کن:
```js
// موفقیت
{ ok: true, data: { ... } }

// خطا
{ ok: false, error: { code: "ERROR_CODE", message: "پیام فارسی" } }
```
- ❌ هرگز `res.json({ result })` ننویس.
- ✅ همیشه `response.ok(res, data)` یا `throw new ApiError(...)`.

### کدهای خطای استاندارد
| کد | وضعیت HTTP | توضیح |
|---|---|---|
| `UNAUTHORIZED` | 401 | توکن ارائه نشده / نامعتبر |
| `FORBIDDEN` | 403 | دسترسی ادمین لازم است |
| `VALIDATION_ERROR` | 422 | ورودی نامعتبر (Joi) |
| `NOT_FOUND` | 404 | منبع پیدا نشد |
| `RATE_LIMITED` | 429 | درخواست زیاد |
| `INTERNAL_ERROR` | 500 | خطای داخلی سرور |
| `EMAIL_EXISTS` | 409 | ایمیل تکراری |
| `INVALID_CREDENTIALS` | 401 | ایمیل/رمز نادرست |

### Auth با JWT
- Header: `Authorization: Bearer <token>`
- Middleware: `auth.requireAuth` (کاربر لاگین)، `auth.requireAdmin` (فقط ادمین)
- در کنترلر: `req.user` در دسترس است.

### Validation با Joi
- روی `body`، `params`، `query` اجباری است.
- Middleware: `validate({ body: Joi.object(...), params: ..., query: ... })`

### Rate Limit
- سراسری: روی همه routeها (configurable via env).
- حساس: `authRateLimit` روی `/register`، `/login`.

### Pagination
- Query: `?page=1&limit=20`
- Helper: `pagination.getPagination(req.query)` → `{ page, limit, offset }`
- Response: `pagination.getPagingData(count, rows, page, limit)`

---

## 🗄️ مدل‌ها (Prisma)

### مدل‌های موجود در استارتر (فقط این دو)

- `User` → id, email, password, firstName, lastName, role (user/admin), isActive
- `Setting` → id, key, value, description (key-value config)

### افزودن مدل جدید (وقتی پروژه‌ی جدید شروع کردی)

1. مدل را در `prisma/schema.prisma` تعریف کن.
2. برای رابطه‌ها relation field و relation scalar مناسب تعریف کن.
3. با `npm run prisma:migrate:dev -- --name add-model` migration بساز.
4. در فیچر از `prisma` تزریق‌شده در `registerApi` استفاده کن.

### 🚫 هرگز

- ❌ مدل بیزینس‌اسپسیفیک (Course, Product, Order, …) را در **استارتر پایه** نگه ندار.
- ❌ از `prisma db push` به‌عنوان روش معمول schema management استفاده نکن.
- ❌ migration مخرب، `migrate reset`، `DROP` یا `TRUNCATE` اجرا نکن.
- ❌ منطق دامنه را داخل schema ننویس (فقط ساختار داده و relationها).

---

## 🌐 Frontend (EJS + SSR)

استارتر کیت شامل یک لایه‌ی Frontend با **EJS** برای SSR (Server-Side Rendering) است.

### ساختار پوشه‌ها

```
starter-api/
├── pages/                              # لایه‌ی SSR
│   ├── index.ts                        # setupPages(app)
│   ├── middleware.ts                   # requirePageAuth, requirePageAdmin, redirectIfAuth
│   └── routes.ts                       # تمام route های صفحه
├── views/                              # EJS templates
│   ├── layouts/
│   │   └── main.ejs                    # layout اصلی
│   ├── partials/
│   │   ├── head.ejs                    # <head> مشترک
│   │   ├── header.ejs                  # نوار بالا (logo + کاربر)
│   │   ├── footer.ejs
│   │   ├── flash.ejs                   # نمایش error/success از query
│   │   └── sidebar-admin.ejs           # منوی کنار پنل ادمین
│   ├── pages/
│   │   ├── landing.ejs
│   │   ├── not-found.ejs
│   │   ├── auth/
│   │   │   ├── login.ejs
│   │   │   └── register.ejs
│   │   ├── dashboard.ejs
│   │   └── admin.ejs
│   └── errors/
│       └── 500.ejs
├── public/                             # فقط asset استاتیک
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── dashboard.js                # AJAX برای خواندن Settings
│   │   └── admin.js                    # AJAX برای کاربران و CRUD
│   └── assets/
│       └── logo.svg
```

### صفحات موجود

| مسیر | توضیح | Auth |
|------|-------|------|
| `/` | لندینگ (صفحه اصلی) | عمومی (redirect اگر لاگین باشد) |
| `/login` | فرم ورود | عمومی (redirect اگر لاگین باشد) |
| `/register` | فرم ثبت‌نام | عمومی (redirect اگر لاگین باشد) |
| `/dashboard` | پنل کاربر (مشاهده Settings) | `requirePageAuth` |
| `/admin` | پنل ادمین (مدیریت کاربران/تنظیمات) | `requirePageAuth` + `requirePageAdmin` |
| `/logout` | خروج (POST) | - |
| `*` | 404 | - |

### Auth صفحات (Cookie-based)

- **صفحات** از **httpOnly cookie** (`auth_token`) برای احراز هویت استفاده می‌کنند.
- **API** همچنان از **Bearer Token** در Header استفاده می‌کند.
- Middleware `requireAuth` در `api/middleware/auth.ts` هم Bearer و هم cookie را پشتیبانی می‌کند.
- Middleware صفحات در `pages/middleware.ts`:
  - `redirectIfAuth` — اگر لاگین باشد به پنل خودش redirect می‌کند
  - `requirePageAuth` — نیاز به cookie معتبر، `req.user` و `res.locals.user` ست می‌کند
  - `requirePageAdmin` — نیاز به نقش admin

### Static Assets

- فایل‌های استاتیک در `public/` قرار می‌گیرند.
- در Express با مسیر `/static` سرو می‌شوند: `app.use("/static", express.static(...))`
- در EJS با `/static/css/style.css` و `/static/js/admin.js` ارجاع داده می‌شود.

### قرارداد صفحات (Page Contract)

هر صفحه در `views/pages/` قرار دارد و از layout `layouts/main` استفاده می‌کند.

**متغیرهای مشترک در تمام viewها (از طریق `res.locals`):**
- `user` — شیء کاربر لاگین‌شده (فقط در صفحات محافظت‌شده)
- `title` — عنوان صفحه
- `layout` — همیشه `"layouts/main"`

**خطاها از query string:**
- `?error=auth_required`، `?error=invalid_credentials`، ...
- `?success=registered`
- نمایش در `partials/flash.ejs`

### چک‌لیست صفحه‌ی جدید

قبل از commit کردن، این‌ها را چک کن:

- [ ] فایل EJS در `views/pages/` ساخته شد.
- [ ] از `layout: "layouts/main"` استفاده می‌کند.
- [ ] در `pages/routes.ts` route اضافه شده.
- [ ] Middleware مناسب (`redirectIfAuth`، `requirePageAuth`، `requirePageAdmin`).
- [ ] اگر نیاز به داده از دیتابیس دارد، در route handler query می‌شود و به `res.render` پاس داده می‌شود.
- [ ] خطاها با `res.redirect("/path?error=code")` هندل می‌شوند.
- [ ] مخصوصاً برای عملیات ادمین (تغییر نقش، CRUD تنظیمات)، از AJAX در `public/js/admin.js` استفاده می‌شود (cookie خودکار فرستاده می‌شود).
- [ ] RTL کامل، فونت فارسی (Vazirmatn).
- [ ] بدون inline JS/CSS — همه در فایل‌های جدا در `public/`.

---

## 🔐 امنیت و Secrets

### قوانین مطلق

- ❌ **هرگز** توکن، پسورد، یا API key را در کد هاردکد نکن.
- ✅ همه‌چیز از `process.env.*` خوانده شود.
- ✅ فقط `.env.example` در گیت نگه‌داری شود (بدون مقادیر واقعی).
- ✅ `.env` باید در `.gitignore` باشد.

---

## 🌐 زبان و لحن

| بخش | زبان |
|---|---|
| کامنت‌های کد | فارسی |
| لاگ‌های `console.log` | فارسی + ایموجی (از طریق `logger`) |
| پیام‌های API (error messages) | فارسی |
| نام متغیرها و توابع | انگلیسی |
| نام فایل‌ها | kebab-case انگلیسی |

---

## ✅ چک‌لیست افزودن فیچر جدید

قبل از commit کردن، این‌ها را چک کن:

- [ ] فایل جدید در `features/` ساخته شد (kebab-case).
- [ ] ساختار TypeScript `FeatureModule` با `registerApi` و `export = feature` رعایت شد.
- [ ] در `launcher.ts` با `registerFeature` ثبت شد.
- [ ] تمام endpointها `validate` دارند (body/params/query).
- [ ] Auth مناسب (`requireAuth` / `requireAdmin`) روی endpointهای محافظت‌شده.
- [ ] Rate limit روی endpointهای حساس (login/register).
- [ ] پاسخ یکدست `response.ok()` یا `throw new ApiError()`.
- [ ] همه‌ی catchها با `logger.error` لاگ می‌شوند.
- [ ] هیچ secret هاردکد نشده.
- [ ] مدل جدید (اگر وجود دارد) در `prisma/schema.prisma` تعریف و migration آن ثبت شده.
- [ ] نام فیچر با مسیر URL مطابقت دارد (`/api/v1/<feature-name>/...`).

---

## 🚫 Anti-Patterns (این‌ها را انجام نده)

| ❌ کار اشتباه | ✅ راه درست |
|---|---|
| `res.json({ result })` | `response.ok(res, result)` |
| `res.status(500).json(...)` | `throw new ApiError("CODE", "...", 500)` |
| `app.get("/users")` در فیچر | `router.get("/users")` |
| `req.body` بدون validation | `validate({ body: Joi.object(...) })` |
| auth دستی در هر route | `auth.requireAuth` middleware |
| `console.log` | `logger.info/error/warn/success` |
| hardcode `JWT_SECRET` | `process.env.JWT_SECRET` |
| تعریف مدل runtime در JS | تعریف در `prisma/schema.prisma` و دسترسی با Prisma Client |
| تغییر `FeatureLoader` برای یک فیچر | افزودن option جدید در `registerFeature` |
| تغییر خودکار schema در startup | `prisma migrate dev` در توسعه و `prisma migrate deploy` در production |
| فایل `.env` واقعی در گیت | فقط `.env.example` |
| ریختن پروژه‌ی قدیمی داخل استارتر | کپی تازه + مدل‌های مخصوص پروژه |

---

## 🧩 الگوی فیچر ساده (Mini Template)

```js
// features/my-feature.ts
import Joi from "joi";
import type { ApiContext, FeatureModule } from "../api/types";

const feature: FeatureModule = {
  name: "my-feature",
  version: "1.0.0",
  description: "توضیح کوتاه",

  registerApi: async ({
    router, prisma, auth, validate, response,
    ApiError, asyncHandler, logger,
  }: ApiContext) => {
    logger.info("[My-Feature] در حال راه‌اندازی...");

    const mySchema = {
      body: Joi.object({
        name: Joi.string().max(100).required(),
        value: Joi.string().allow(""),
      }),
    };

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

    router.post(
      "/",
      auth.requireAuth,
      auth.requireAdmin,
      validate(mySchema),
      asyncHandler(async (req, res) => {
        const item = await prisma.myModel.create({ data: req.body });
        return response.ok(res, item, 201);
      })
    );

    logger.success("[My-Feature] آماده است.");
  },
};

export = feature;
```

---

## 🔧 دستورات مفید

تنظیم اتصال دیتابیس فقط از طریق `DATABASE_URL` انجام می‌شود:
- Local: `postgresql://postgres:postgres@localhost:5432/app?schema=public`
- Docker: `postgresql://postgres:postgres@postgres:5432/app?schema=public` (host سرویس `postgres`)

```bash
# توسعه
npm run dev              # tsx watch + hot reload
npm run typecheck        # strict TypeScript check
npm run build            # emit CommonJS in dist/

# اجرا
npm start                # اجرای production

# Database
npm run prisma:generate
npm run prisma:migrate:dev -- --name change-name
npm run prisma:migrate:deploy
npm run db:seed
npm run db:seed:prod

# Docker
docker compose up -d     # PostgreSQL + migration + server
docker compose logs -f server
docker compose down
```

---

## 📌 یادآوری نهایی برای AI Agent

> وقتی این فایل را می‌خوانی، یعنی در حال کار روی یک **استارتر کیت API** هستی.
>
> **هدف:** حفظ معماری، افزودن قابلیت ماژولار، **بدون** تبدیل کردن پروژه به یک اپ بیزینس‌اسپسیفیک.
>
> **اگر شک داری، این سؤال را بپرس:** «آیا این تغییر، معماری Feature-Based را می‌شکند؟»
> اگر جواب «بله» است → انجام نده و از کاربر بپرس.
>
> **اگر مدل بیزینس‌اسپسیفیک درخواست شد** → به کاربر یادآوری کن که این یک استارتر است و مدل باید فقط در کپی پروژه‌ی نهایی اضافه شود، نه در استارتر پایه.
>
> **اگر فیچر جدید درخواست شد** → از قالب‌های بالا استفاده کن و چک‌لیست را رعایت کن.
>
> **اگر کاربر خواست پروژه‌ی قدیمی را داخل استارتر بریزد** → به او یادآوری کن که استارتر یک «قالب خالی» است، نه container. راه درست: کپی تازه + انتقال مدل‌ها و فیچرها به ترتیب مراحل بخش «شروع پروژه‌ی جدید».

---

**آخرین بروزرسانی:** 2026-10-07
**نگه‌دارنده:** (نام تو اینجا)