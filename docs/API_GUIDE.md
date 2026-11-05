# 📚 راهنمای API — API Starter Kit

## معرفی

این سند مستندات کامل API استارتر کیت را پوشش می‌دهد. تمام endpointها تحت prefix `/api/v1` در دسترس هستند (قابل تنظیم از طریق `API_PREFIX` در env).

## راه‌اندازی

### پیش‌نیازها
- Node.js 20.19+ (یا 22.12+ / 24+)
- PostgreSQL 17+
- فایل `.env` بر اساس `.env.example` پر شده باشد

### اجرا در توسعه
```bash
npm install
npm run prisma:migrate:dev -- --name init
npm run dev
```

### اجرا با Docker
```bash
docker compose up -d
# سرور روی http://localhost:3000
# PostgreSQL روی پورت 5432
```

برای تغییر schema در توسعه از `npm run prisma:migrate:dev -- --name change-name` استفاده کنید. در production دستور `npm run prisma:migrate:deploy` جدا از process سرور اجرا می‌شود.

## متغیرهای محیطی (Environment Variables)

| متغیر | پیش‌فرض | توضیح |
|--------|---------|-------|
| `NODE_ENV` | `development` | محیط اجرا |
| `PORT` | `3000` | پورت سرور |
| `API_ENABLED` | `true` | فعال/غیرفعال کردن API |
| `API_PREFIX` | `/api/v1` | پیشوند مسیر API |
| `CORS_ORIGINS` | `*` | origins مجاز CORS |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 دقیقه) | بازه زمانی rate limit سراسری |
| `RATE_LIMIT_MAX` | `100` | حداکثر درخواست در بازه |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/app?schema=public` | تنها منبع تنظیم اتصال PostgreSQL |
| `POSTGRES_DB` | `app` | نام دیتابیس Docker |
| `POSTGRES_USER` | `postgres` | کاربر Docker PostgreSQL |
| `POSTGRES_PASSWORD` | `postgres` | رمز Docker PostgreSQL؛ در production تغییر دهید |
| `JWT_SECRET` | - | **اجباری** کلید امضای توکن |
| `JWT_EXPIRES_IN` | `7d` | انقضای توکن |
| `DEFAULT_ADMIN_EMAIL` | `admin@example.com` | ایمیل ادمین پیش‌فرض (seed) |
| `DEFAULT_ADMIN_PASSWORD` | - | برای ساخت ادمین اولیه الزامی است؛ در `.env.example` مقدار نمونه دارد |

آدرس `DATABASE_URL` داخل Docker با host سرویس `postgres` تنظیم می‌شود؛ URL نمونه‌ی `localhost` فقط برای اجرای برنامه روی میزبان است.

## فرمت پاسخ (Response Format)

### موفقیت
```json
{
  "ok": true,
  "data": { ... }
}
```

### خطا
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "پیام فارسی توضیحی"
  }
}
```

## کدهای خطا (Error Codes)

| کد | HTTP Status | توضیح |
|-----|-------------|-------|
| `UNAUTHORIZED` | 401 | توکن ارائه نشده، نامعتبر یا منقضی شده |
| `FORBIDDEN` | 403 | نیاز به نقش ادمین |
| `VALIDATION_ERROR` | 422 | ورودی نامعتبر (Joi validation) |
| `NOT_FOUND` | 404 | مسیر یا منبع پیدا نشد |
| `RATE_LIMITED` | 429 | درخواست‌های زیاد، پس از مدتی تلاش کنید |
| `INTERNAL_ERROR` | 500 | خطای داخلی سرور |
| `EMAIL_EXISTS` | 409 | ایمیل قبلاً ثبت شده |
| `INVALID_CREDENTIALS` | 401 | ایمیل یا رمز عبور نادرست |

## احراز هویت (Authentication)

### Header
```
Authorization: Bearer <JWT_TOKEN>
```

### دریافت توکن
- `POST /api/v1/example-auth/register` → ثبت‌نام + دریافت توکن
- `POST /api/v1/example-auth/login` → ورود + دریافت توکن

### Middlewareها
- `auth.requireAuth` — نیاز به توکن معتبر، `req.user` ست می‌شود
- `auth.requireAdmin` — نیاز به توکن معتبر + نقش `admin`
- `auth.optionalAuth` — اگر توکن معتبر باشد `req.user` ست می‌شود، وگرنه ادامه می‌دهد

---

## Endpointها

### ۱. Health Check (عمومی)
```
GET /api/v1/health
```
**Response:**
```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "env": "development",
    "uptime": 123.45,
    "timestamp": "2026-10-07T12:00:00.000Z"
  }
}
```

---

### ۲. Auth — example-auth

#### ثبت‌نام
```
POST /api/v1/example-auth/register
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "علی",
  "lastName": "احمدی"
}
```
**Response (201):**
```json
{
  "ok": true,
  "data": {
    "user": { "id": 1, "email": "user@example.com", "firstName": "علی", "lastName": "احمدی", "role": "user", "isActive": true },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
**Error 409:** `EMAIL_EXISTS` — ایمیل تکراری

#### ورود
```
POST /api/v1/example-auth/login
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "ok": true,
  "data": {
    "user": { "id": 1, "email": "user@example.com", "firstName": "علی", "lastName": "احمدی", "role": "user", "isActive": true },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
**Error 401:** `INVALID_CREDENTIALS` — ایمیل/رمز نادرست
**Error 429:** `RATE_LIMITED` — بیش از 10 تلاش در 15 دقیقه

#### پروفایل من
```
GET /api/v1/example-auth/me
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "ok": true,
  "data": { "id": 1, "email": "user@example.com", "firstName": "علی", "lastName": "احمدی", "role": "user", "isActive": true }
}
```
**Error 401:** `UNAUTHORIZED` — توکن نامعتبر یا ارائه نشده

---

### ۳. CRUD — example-crud (Setting)

تمام endpointها نیاز به `auth.requireAuth` دارند.
نوشتن (POST/PUT/DELETE) نیاز به `auth.requireAdmin` دارد.

#### لیست (با Pagination)
```
GET /api/v1/example-crud/?page=1&limit=20
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "ok": true,
  "data": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "items": [
      { "id": 1, "key": "site_title", "value": "My Site", "description": "عنوان سایت" }
    ]
  }
}
```

#### تکی
```
GET /api/v1/example-crud/:id
```

#### ایجاد (فقط ادمین)
```
POST /api/v1/example-crud/
```
**Body:**
```json
{
  "key": "new_setting",
  "value": "some value",
  "description": "توضیح تنظیمات"
}
```
**Response (201):** ساخته شده

#### آپدیت (فقط ادمین)
```
PUT /api/v1/example-crud/:id
```
**Body:**
```json
{
  "value": "updated value",
  "description": "توضیح جدید"
}
```

#### حذف (فقط ادمین)
```
DELETE /api/v1/example-crud/:id
```
**Response:**
```json
{ "ok": true, "data": { "deleted": true } }
```

---

### ۴. Admin — example-admin (مدیریت کاربران)

همه endpointها نیاز به `auth.requireAuth` + `auth.requireAdmin` دارند.

#### لیست کاربران (با Pagination)
```
GET /api/v1/example-admin/users?page=1&limit=20
```
**Response:**
```json
{
  "ok": true,
  "data": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "items": [
      { "id": 1, "email": "admin@example.com", "firstName": "Admin", "lastName": "Default", "role": "admin", "isActive": true }
    ]
  }
}
```

#### تغییر نقش کاربر
```
PATCH /api/v1/example-admin/users/:id/role
```
**Body:**
```json
{ "role": "admin" }  // یا "user"
```

#### تغییر وضعیت فعال/غیرفعال
```
PATCH /api/v1/example-admin/users/:id/active
```
**Body:**
```json
{ "isActive": false }
```

---

## نمونه cURL

### ثبت‌نام
```bash
curl -X POST http://localhost:3000/api/v1/example-auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","firstName":"Test","lastName":"User"}'
```

### ورود
```bash
curl -X POST http://localhost:3000/api/v1/example-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### پروفایل (با توکن)
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X GET http://localhost:3000/api/v1/example-auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### لیست Settings
```bash
curl -X GET "http://localhost:3000/api/v1/example-crud/?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### ایجاد Setting (ادمین)
```bash
ADMIN_TOKEN="..."
curl -X POST http://localhost:3000/api/v1/example-crud/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"key":"test_key","value":"test_value","description":"تست"}'
```

### لیست کاربران (ادمین)
```bash
curl -X GET "http://localhost:3000/api/v1/example-admin/users?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Seed ادمین پیش‌فرض

در اولین اجرای سرور، اگر هیچ ادمینی در دیتابیس نباشد، یک کاربر ادمین با مشخصات زیر ساخته می‌شود:
- **Email:** `DEFAULT_ADMIN_EMAIL` (پیش‌فرض: `admin@example.com`)
- **Password:** `DEFAULT_ADMIN_PASSWORD` (پیش‌فرض: `admin123`)

⚠️ **مهم:** بلافاصله پس از اولین لاگین، رمز عبور را تغییر دهید یا در env مقادیر قوی ست کنید.

---

## نکات امنیتی

1. **JWT_SECRET** باید رشته طولانی و تصادفی باشد (حداقل ۳۲ کاراکتر).
2. در production: `NODE_ENV=production` ست کنید تا پیام‌های خطای جزئی مخفی شوند.
3. `CORS_ORIGINS` را محدود به دامنه‌های مجاز کنید (نه `*`).
4. `RATE_LIMIT_MAX` و `RATE_LIMIT_WINDOW_MS` را متناسب با ترافیک تنظیم کنید.
5. رمز ادمین پیش‌فرض را در env تغییر دهید (`DEFAULT_ADMIN_PASSWORD`).
6. از HTTPS در production استفاده کنید.

---

## توسعه فیچر جدید

برای افزودن endpointهای جدید، به [ADDING_FEATURES.md](ADDING_FEATURES.md) مراجعه کنید.
قرارداد: هر فیچر در `features/` یک فایل TypeScript است که `registerApi` پیاده‌سازی می‌کند و در `launcher.ts` ثبت می‌شود.
مسیر URL: `/api/v1/<feature-name>/...`