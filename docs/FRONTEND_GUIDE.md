# راهنمای Frontend (EJS + SSR) — API Starter Kit

این سند معماری و نحوه کار با لایه‌ی Frontend (Server-Side Rendering با EJS) را توضیح می‌دهد.

---

## 📁 ساختار پوشه‌ها

```
starter-api/
├── pages/                              # لایه‌ی SSR (Controller/View Logic)
│   ├── index.ts                        # setupPages(app) — mount router
│   ├── middleware.ts                   # Middlewareهای احراز هویت صفحات
│   └── routes.ts                       # تمام route های صفحه
├── views/                              # EJS Templates
│   ├── layouts/
│   │   └── main.ejs                    # Layout اصلی (HTML skeleton)
│   ├── partials/
│   │   ├── head.ejs                    # <head> مشترک (meta, css, font)
│   │   ├── header.ejs                  # نوار بالا (logo + user menu)
│   │   ├── footer.ejs
│   │   ├── flash.ejs                   # نمایش error/success از query string
│   │   └── sidebar-admin.ejs           # منوی کناری پنل ادمین
│   ├── pages/
│   │   ├── landing.ejs                 # صفحه اصلی (Hero + Features + CTA)
│   │   ├── not-found.ejs               # 404
│   │   ├── auth/
│   │   │   ├── login.ejs               # فرم ورود
│   │   │   └── register.ejs            # فرم ثبت‌نام
│   │   ├── dashboard.ejs               # پنل کاربر
│   │   └── admin.ejs                   # پنل ادمین
│   └── errors/
│       └── 500.ejs                     # خطای سرور
├── public/                             # Static Assets (فقط فایل‌های استاتیک)
│   ├── css/
│   │   └── style.css                   # تمام استایل‌ها
│   ├── js/
│   │   ├── dashboard.js                # AJAX برای پنل کاربر
│   │   └── admin.js                    # AJAX برای پنل ادمین
│   └── assets/
│       └── logo.svg                    # لوگو
```

---

## 🔐 احراز هویت صفحات (Cookie-based)

### تفاوت با API Auth

| ویژگی | API (`/api/v1/*`) | Pages (`/`, `/dashboard`, `/admin`) |
|--------|-------------------|-------------------------------------|
| روش Auth | `Authorization: Bearer <token>` | httpOnly Cookie (`auth_token`) |
| Middleware | `auth.requireAuth` | `pages/middleware.ts` → `requirePageAuth` |
| خطا | JSON `{ ok: false, error: {...} }` | Redirect به `/login?error=...` |
| Logout | Client-side (حذف توکن) | POST `/logout` → clear cookie + redirect |

### Middlewareهای صفحات (`pages/middleware.ts`)

```js
// 1. redirectIfAuth — برای صفحات عمومی (login/register)
// اگر کاربر لاگین باشد، به پنل خودش redirect می‌کند
router.get("/login", redirectIfAuth, (req, res) => ...);

// 2. requirePageAuth — برای صفحات محافظت‌شده (dashboard)
// نیاز به cookie معتبر، req.user و res.locals.user ست می‌کند
router.get("/dashboard", requirePageAuth, async (req, res) => ...);

// 3. requirePageAdmin — فقط برای ادمین (admin)
// باید requirePageAuth قبلش اجرا شده باشد
router.get("/admin", requirePageAuth, requirePageAdmin, async (req, res) => ...);
```

### نحوه کار Cookie

1. **Login (POST `/login`)**:
   - بررسی ایمیل/رمز با bcrypt
   - تولید JWT با `signToken({ id, role })`
   - ست کردن cookie:
     ```js
     res.cookie(config.jwt.cookieName, token, {
       httpOnly: true,           // از دسترس JS محافظت می‌شود
       sameSite: "lax",          // CSRF protection
       secure: config.env === "production", // HTTPS فقط در production
       maxAge: config.jwt.cookieMaxAge,     // 7 روز
     });
     ```

2. **Requestهای بعدی**:
   - مرورگر به‌صورت خودکار cookie را با هر request می‌فرستد
   - `requirePageAuth` cookie را می‌خواند، verify می‌کند، کاربر را در DB پیدا می‌کند
   - `req.user` و `res.locals.user` ست می‌شود (در همه viewها در دسترس)

3. **Logout (POST `/logout`)**:
   ```js
   res.clearCookie(config.jwt.cookieName);
   return res.redirect("/login");
   ```

---

## 🎨 View Engine (EJS + express-ejs-layouts)

### Layout اصلی (`views/layouts/main.ejs`)

```ejs
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <%- include("../partials/head", { title }) %>
</head>
<body>
  <%- include("../partials/header") %>
  <%- include("../partials/flash") %>
  <main class="container">
    <%- body %>
  </main>
  <%- include("../partials/footer") %>
</body>
</html>
```

### متغیرهای Shared (`res.locals`)

در تمام viewها در دسترس:

| متغیر | منبع | توضیح |
|--------|-------|-------|
| `user` | `requirePageAuth` | شیء کاربر لاگین‌شده (فقط در صفحات محافظت‌شده) |
| `title` | `res.render(..., { title })` | عنوان صفحه |
| `layout` | همیشه `"layouts/main"` | Layout پیش‌فرض |

### Partial: Flash Messages (`views/partials/flash.ejs`)

خطاها و موفقیت‌ها از **query string** می‌آیند:

```js
// در route handler
return res.redirect("/login?error=invalid_credentials");
return res.redirect("/login?success=registered");
```

در `flash.ejs` مپینگ کد → پیام فارسی وجود دارد.

---

## 📄 صفحات موجود

| مسیر | فایل View | Middleware | توضیح |
|------|-----------|------------|-------|
| `GET /` | `pages/landing.ejs` | `redirectIfAuth` | لندینگ با Hero، Features، CTA |
| `GET /login` | `pages/auth/login.ejs` | `redirectIfAuth` | فرم ورود |
| `POST /login` | — | — | پردازش ورود، ست cookie، redirect |
| `GET /register` | `pages/auth/register.ejs` | `redirectIfAuth` | فرم ثبت‌نام |
| `POST /register` | — | — | پردازش ثبت‌نام، redirect به login |
| `POST /logout` | — | — | پاک کردن cookie، redirect به login |
| `GET /dashboard` | `pages/dashboard.ejs` | `requirePageAuth` | پنل کاربر (نمایش Settings) |
| `GET /admin` | `pages/admin.ejs` | `requirePageAuth` + `requirePageAdmin` | پنل ادمین (کاربران + تنظیمات) |
| `*` | `pages/not-found.ejs` | — | 404 |

---

## ⚡ AJAX در صفحات (Client-side JS)

چون cookie httpOnly است و در same-origin ارسال می‌شود، fetch/AJAX به APIها **بدون نیاز به header دستی** کار می‌کند.

### مثال: تغییر نقش کاربر در پنل ادمین (`public/js/admin.js`)

```js
async function changeRole(userId, role) {
  try {
    const res = await fetch(`/api/v1/example-admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin", // پیش‌فرض در same-origin، cookie می‌رود
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error.message);
    location.reload();
  } catch (err) {
    console.error("❌ خطا:", err);
    alert(err.message);
  }
}
```

### نکات مهم AJAX

1. **`credentials: "same-origin"`** — پیش‌فرض در same-origin، اما صریح نوشتن بهتر است
2. **Cookie خودکار می‌رود** — نیازی به `Authorization` header نیست
3. **APIهای موجود کار می‌کنند** — `/api/v1/example-admin/*`، `/api/v1/example-crud/*` هم با Bearer و هم با cookie کار می‌کنند (به‌فضل `extractToken` در `auth.js`)

---

## 🛡️ نکات امنیتی

### 1. httpOnly Cookie
- JavaScript در مرورگر به cookie دسترسی ندارد → جلوگیری از XSS token theft
- فقط سرور می‌تواند cookie را ست/پاک کند

### 2. SameSite: Lax
- از CSRF در بیشتر سناریوها محافظت می‌کند
- در login/register forms که POST هستند، مرورگر cookie را می‌فرستد

### 3. Secure در Production
```js
secure: config.env === "production" // فقط HTTPS
```
در development (localhost) روی HTTP هم کار می‌کند.

### 4. JWT Secret
- هم برای API (Bearer) و هم برای Pages (Cookie) یک `JWT_SECRET` استفاده می‌شود
- در `.env` باید رشته طولانی و تصادفی باشد (حداقل ۳۲ کاراکتر)

### 5. Rate Limit
- `/login` و `/register` (صفحات) فعلاً rate limit ندارند (فقط APIها دارند)
- در صورت نیاز می‌توان `authRateLimit` را در `pages/routes.ts` هم استفاده کرد

---

## 🎯 نحوه اضافه کردن صفحه‌ی جدید

مراحل کامل در [`ADDING_FEATURES.md`](ADDING_FEATURES.md#-افزودن-صفحه‌ی-جدید-ejs) آمده، اما خلاصه:

1. **View بساز**: `views/pages/my-page.ejs`
2. **Route اضافه کن**: در `pages/routes.ts` با middleware مناسب
3. **Static assets** (اختیاری): در `public/css/` و `public/js/`
4. **چک‌لیست**:
   - [ ] RTL، فونت فارسی
   - [ ] از layout اصلی استفاده می‌کند
   - [ ] خطاها با redirect + query string
   - [ ] بدون inline CSS/JS
   - [ ] برای عملیات بنویسی (POST/PATCH/DELETE) از AJAX + API استفاده کن

---

## 🔧 تنظیمات Config (`config/index.ts`)

```js
jwt: {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieName: "auth_token",
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 روز (میلی‌ثانیه)
},
```

### متغیرهای محیطی مرتبط

| متغیر | پیش‌فرض | توضیح |
|--------|---------|-------|
| `JWT_SECRET` | **اجباری** | کلید امضای توکن (حداقل ۳۲ کاراکتر) |
| `JWT_EXPIRES_IN` | `7d` | انقضای توکن (مثال: `1d`, `30d`, `2h`) |
| `NODE_ENV` | `development` | در production `secure: true` فعال می‌شود |

---

## 🐳 Docker

Frontend هیچ تغییر خاصی در Docker ندارد. فایل‌های `public/` در ایمیج کپی می‌شوند و از طریق Express سرو می‌شوند.

```dockerfile
# در Dockerfile
COPY public/ ./public/
COPY views/ ./views/
COPY pages/ ./pages/
```

---

## 📋 خلاصه قوانین (Best Practices)

| قانون | توضیح |
|-------|-------|
| **بدون build step** | EJS فقط، بدون bundler (webpack/vite)، بدون framework JS |
| **بدون localStorage** | تمام auth در httpOnly cookie |
| **بدون flash library** | خطاها از query string (`?error=...`) |
| **API نباید بشکند** | Bearer token همچنان کار می‌کند (extractToken از هر دو می‌خواند) |
| **Static در `/static`** | از تداخل با routeهای صفحه جلوگیری می‌کند |
| **ترتیب Mount** | static → cookieParser → view engine → setupApi → setupPages → initializeApis |
| **RTL کامل** | `<html lang="fa" dir="rtl">` + فونت Vazirmatn |
| **لاگ با logger** | `logger.info/error/warn/success` به جای `console.log` |
| **کامنت فارسی، کد انگلیسی** | استاندارد پروژه |

---

## 🔗 لینک‌های مفید

- [`AGENTS.md`](../AGENTS.md#-frontend-ejs--ssr) — قوانین توسعه
- [`ARCHITECTURE.md`](ARCHITECTURE.md#%D9%84%D8%A7%DB%8C%D9%87-pages-ssr) — معماری لایه Pages
- [`ADDING_FEATURES.md`](ADDING_FEATURES.md#-%D8%A7%D9%81%D8%B2%D9%88%D8%AF%D9%86-%D8%B5%D9%81%D8%AD%D9%87%DB%8C-%D8%AC%D8%AF%DB%8C%D8%AF-ejs) — چک‌لیست صفحه جدید
- [`API_GUIDE.md`](API_GUIDE.md) — مستندات API endpoints