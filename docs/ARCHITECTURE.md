# معماری — API Starter Kit

## نمای کلی

معماری این پروژه **Feature-Based** است:

```
launcher.ts (bootstrap)
   │
  ├── initializeServer()   → server.ts (Express + DB + seed)
  ├── setupApi()           → api/index.ts (helmet, cors, health, prefix)
   ├── FeatureLoader
   │     ├── registerFeature()
   │     └── loadAllFeatures()
   ├── initializeApis()     → module.registerApi() + mount route
   └── app.listen()
```

جریان درخواست:
```
Request → helmet → cors → compression → json parser → rate limit
       → morgan → route → validate → auth → handler → response
       → (در صورت خطا) errorHandler
```

مدل‌ها در `prisma/schema.prisma` تعریف می‌شوند. یک Prisma Client مشترک از `lib/prisma.ts` به featureها تزریق می‌شود.

## لایه‌ها

| لایه | فایل | مسئولیت |
|-----|------|----------|
| **Entry Point** | `launcher.ts` | Bootstrap، FeatureLoader، mount APIها، graceful shutdown |
| **HTTP Server** | `server.ts` | Express app، global middleware، اتصال DB و seed admin |
| **Config** | `config/index.ts` | اعتبارسنجی env، متمرکز کردن تنظیمات |
| **Prisma Client** | `lib/prisma.ts` | Singleton اتصال Prisma به PostgreSQL |
| **Schema/Migrations** | `prisma/schema.prisma`, `prisma/migrations/` | مدل‌ها، relationها و تغییرات versioned دیتابیس |
| **API Core** | `api/index.ts` | setupApi (health/prefix)، initializeApis (mount فیچرها) |
| **Middleware** | `api/middleware/*` | auth، validate، errorHandler، notFound، rateLimit، requestLogger |
| **Utils** | `api/utils/*` | logger، response، ApiError، asyncHandler، jwt، pagination |
| **Features** | `features/*.ts` | منطق بیزینس به صورت ماژولار (registerApi) |
| **Pages (SSR)** | `pages/*.ts` | EJS view engine، routes، middleware، views، static assets |

## FeatureLoader

- `registerFeature(name, path, options)`: ثبت فیچر با priority و enabled.
- `loadAllFeatures()`: بارگذاری همزمان فیچرها (مرتب بر اساس priority).
- در `launcher.ts`، `apiContext` شامل تمام dependencyهای مشترک است که به `registerApi` پاس داده می‌شوند.

## لایه Pages (SSR)

```
launcher.ts
  ├── initializeServer()
  │     ├── EJS view engine
  │     ├── cookieParser
  │     ├── express.static("/static")
  │     ├── initializeDatabase() → prisma.$connect()
  │     └── seedDefaultAdmin()
  ├── setupApi(app)         → /api/v1/*
  ├── setupPages(app)       → / , /login , /register , /dashboard , /admin
  └── initializeApis(...)   → mount feature routers + notFound + errorHandler
```

جریان درخواست صفحه:
```
GET /dashboard → cookie → requirePageAuth → query DB → render EJS → HTML
```

### ساختار Views

```
views/
├── layouts/
│   └── main.ejs           # Layout اصلی (html, head, header, footer)
├── partials/
│   ├── head.ejs           # <head> مشترک
│   ├── header.ejs         # نوار بالا
│   ├── footer.ejs
│   ├── flash.ejs          # پیام‌های error/success
│   └── sidebar-admin.ejs  # منوی پنل ادمین
├── pages/
│   ├── landing.ejs
│   ├── not-found.ejs
│   ├── auth/
│   │   ├── login.ejs
│   │   └── register.ejs
│   ├── dashboard.ejs
│   └── admin.ejs
└── errors/
    └── 500.ejs
```

### Static Assets

```
public/
├── css/
│   └── style.css
├── js/
│   ├── dashboard.js             # Browser-side JavaScript
│   └── admin.js                # Browser-side JavaScript
└── assets/
    └── logo.svg
```

در Express، مسیرهای production از ریشه‌ی پروژه برای assets و views استفاده می‌کنند؛ browser-side JavaScript در `public/js/` باقی می‌ماند.
در EJS: `/static/css/style.css`، `/static/js/admin.js`، `/static/assets/logo.svg`

## ترتیب Mount در Express ( حیاتی )

1. `static` assets (`/static`)
2. `cookieParser`
3. `view engine` (EJS + layouts)
4. `helmet` → `cors` → `compression` → `json parser` → `urlencoded` → `globalRateLimit`
5. `health` (public، در `setupApi`)
6. Feature routers (در `initializeApis`، به ترتیب priority)
7. `notFound` (404)
8. `errorHandler` (همیشه آخرین middleware)

نکته: `setupPages` باید **بعد** از `setupApi` و **قبل** از `initializeApis` صدا زده شود — چون `notFound` و `errorHandler` توی `initializeApis` mount می‌شوند و باید آخر باشند.

## Dependency Injection

فیچرها **هرگز** `require("../server")` نمی‌کنند. همه‌چیز از طریق پارامتر `registerApi` تزریق می‌شود:

```js
registerApi({
  router, prisma, auth, validate, authRateLimit,
  response, ApiError, asyncHandler, jwt, pagination, logger,
})
```

برای تغییر schema، در توسعه `npm run prisma:migrate:dev -- --name change-name` اجرا کن و migration تولیدشده را ثبت کن. در production فقط `npm run prisma:migrate:deploy` اجرا می‌شود؛ startup سرور migration یا sync انجام نمی‌دهد. برای Docker، service جداگانه‌ی `migrate` قبل از server اجرا می‌شود.