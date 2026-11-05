# API Starter Kit

استارتر کیت ماژولار برای ساخت **REST API / Backend** با Node.js + Express + Prisma ORM + PostgreSQL.

معماری **Feature-Based** — هر قابلیت یک فایل مستقل در `features/` که به‌صورت پلاگین بارگذاری می‌شود.

---

## ✨ ویژگی‌ها

- 🏗️ **معماری ماژولار** — Feature-Based با `FeatureLoader`
- 🔐 **Auth با JWT** — register / login / me / admin-only
- ✅ **Validation با Joi** — روی body / params / query
- 📦 **Response یکدست** — `{ ok, data }` یا `{ ok, error: { code, message } }`
- 🛡️ **Middlewareهای استاندارد** — helmet, cors, compression, morgan, rate-limit
- 🗄️ **Prisma ORM + PostgreSQL** — schema و migrationهای versioned
- 📄 **مستندات کامل** — AGENTS.md, ARCHITECTURE.md, ADDING_FEATURES.md, API_GUIDE.md
- 🐳 **Docker Ready** — PostgreSQL + migration service + Server

---

## 🚀 Quick Start

### ۱. نصب وابستگی‌ها
```bash
npm install
```

### ۲. تنظیم محیط
فایل `.env` را بر اساس `.env.example` بسازید. برای اجرای local مقدار `DATABASE_URL` از `localhost` استفاده می‌کند:
```bash
cp .env.example .env
# مقدارهای JWT_SECRET و DEFAULT_ADMIN_PASSWORD را تغییر دهید.
```

### ۳. ساخت schema دیتابیس
```bash
npm run prisma:migrate:dev -- --name init
```

برای تغییرهای بعدی، migration را با `npm run prisma:migrate:dev -- --name change-name` بسازید و ثبت کنید.

### ۴. اجرا در توسعه
```bash
npm run dev
```
سرور روی `http://localhost:3000` بالا می‌آید.

برای بررسی typeها و ساخت خروجی production:
```bash
npm run typecheck
npm run build
npm start
```

### ۵. تست Health Check
```bash
curl http://localhost:3000/api/v1/health
```

---

## 🐳 اجرای با Docker

```bash
# ابتدا .env را پر کنید
docker compose up -d
```

| سرویس | پورت | توضیح |
|-------|------|-------|
| Server | 3000 | API Server |
| PostgreSQL | 5432 | دیتابیس |

در Docker، سرویس `migrate` دستور `prisma migrate deploy` را قبل از server اجرا می‌کند. داخل شبکه‌ی Docker، host دیتابیس `postgres` است؛ `localhost` فقط برای اجرای local روی میزبان است.

```bash
# لاگ‌ها
docker compose logs -f server

# خاموش کردن
docker compose down
```

---

## 🌐 صفحات

- لندینگ: http://localhost:3000/
- ورود: http://localhost:3000/login
- ثبت‌نام: http://localhost:3000/register
- پنل کاربر: http://localhost:3000/dashboard
- پنل ادمین: http://localhost:3000/admin

---

## 📁 ساختار پروژه

```
starter-api/
├── api/                              # لایه API (middleware + utils)
│   ├── index.ts
│   ├── middleware/
│   └── utils/
├── config/
│   └── index.ts
├── features/
│   ├── example-auth.ts     # register / login / me
│   ├── example-crud.ts     # CRUD روی Setting
│   └── example-admin.ts    # مدیریت کاربران (admin)
├── lib/
│   └── prisma.ts           # Prisma Client singleton
├── prisma/
│   ├── schema.prisma       # User + Setting
│   └── migrations/         # Database migrations
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ADDING_FEATURES.md
│   ├── API_GUIDE.md
│   └── FRONTEND_GUIDE.md
├── pages/                            # 🆕 لایه SSR (EJS)
│   ├── index.ts
│   ├── middleware.ts
│   └── routes.ts
├── views/                            # 🆕 EJS Templates
│   ├── layouts/
│   ├── partials/
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard.ejs
│   │   ├── admin.ejs
│   │   └── landing.ejs
│   └── errors/
├── public/                           # 🆕 Static Assets
│   ├── css/
│   ├── js/
│   └── assets/
├── launcher.ts              # Bootstrap + FeatureLoader
├── server.ts                # Express + DB + Seed
├── dist/                    # Compiled production JavaScript
├── package.json
└── ...
```

---

## 📚 مستندات

| فایل | توضیح |
|------|-------|
| [AGENTS.md](AGENTS.md) | دستورالعمل کامل برای AI Agent و توسعه‌دهنده |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | دیاگرام و توضیح معماری |
| [docs/ADDING_FEATURES.md](docs/ADDING_FEATURES.md) | راهنمای گام‌به‌گام افزودن فیچر |
| [docs/API_GUIDE.md](docs/API_GUIDE.md) | مستندات کامل endpointها با نمونه cURL |

---

## 🔧 نمونه cURL

### ثبت‌نام
```bash
curl -X POST http://localhost:3000/api/v1/example-auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456","firstName":"علی","lastName":"احمدی"}'
```

### ورود
```bash
curl -X POST http://localhost:3000/api/v1/example-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

### پروفایل (با توکن)
```bash
TOKEN="YOUR_JWT_TOKEN"
curl -X GET http://localhost:3000/api/v1/example-auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### لیست Settings (کاربر لاگین)
```bash
curl -X GET "http://localhost:3000/api/v1/example-crud/?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### مدیریت کاربران (ادمین)
```bash
ADMIN_TOKEN="ADMIN_JWT_TOKEN"
curl -X GET "http://localhost:3000/api/v1/example-admin/users?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🔑 ادمین پیش‌فرض

در اولین اجرا، اگر ادمینی وجود نداشته باشد، seed با متغیرهای `DEFAULT_ADMIN_EMAIL` و `DEFAULT_ADMIN_PASSWORD` ساخته می‌شود. رمز باید در `.env` تنظیم شده باشد و با bcrypt hash می‌شود. اگر از قبل ادمین وجود داشته باشد، رمز او تغییر نمی‌کند.

⚠️ **بلافاصله پس از اولین لاگین رمز را تغییر دهید.**

---

## 🛠️ افزودن فیچر جدید

1. فایل TypeScript در `features/my-feature.ts` بسازید (template: [ADDING_FEATURES.md](docs/ADDING_FEATURES.md))
2. در `launcher.ts` ثبت کنید:
   ```js
  loader.registerFeature("my-feature", "./features/my-feature", { priority: 20 });
   ```
3. مسیر API: `/api/v1/my-feature/...`

---

## 📋 دستورات

```bash
npm run dev      # اجرای TypeScript با watch و restart
npm run typecheck
npm run build    # خروجی CommonJS در dist/
npm start        # اجرای dist/launcher.js
npm run prisma:generate
npm run prisma:migrate:dev -- --name change-name
npm run prisma:migrate:deploy
npm run prisma:studio
npm run db:seed        # توسعه (tsx)
npm run db:seed:prod   # اجرای seed کامپایل‌شده
docker compose up -d
docker compose logs -f server
docker compose down
```

`DATABASE_URL` local:
```text
postgresql://postgres:postgres@localhost:5432/app?schema=public
```

Prisma migrations schema را مدیریت می‌کنند و داده‌های MySQL را منتقل نمی‌کنند. انتقال داده‌ی موجود باید جداگانه برنامه‌ریزی شود؛ هیچ دستور reset یا حذف داده در این پروژه اجرا نمی‌شود.

---

## 📝 لایسنس

MIT