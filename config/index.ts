import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

const required = ["JWT_SECRET", "DATABASE_URL"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌ متغیرهای محیطی ناموجود: ${missing.join(", ")}`);
  process.exit(1);
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT ?? "", 10) || 3000,
  api: {
    prefix: process.env.API_PREFIX || "/api/v1",
    enabled: process.env.API_ENABLED !== "false",
    corsOrigins: (process.env.CORS_ORIGINS || "*").split(",").map((s) => s.trim()),
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "", 10) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX ?? "", 10) || 100,
    },
  },
  db: { url: process.env.DATABASE_URL },
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
    cookieName: "auth_token",
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 روز (میلی‌ثانیه)
  },
  admin: {
    email: process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com",
    password: process.env.DEFAULT_ADMIN_PASSWORD,
  },
};

export default config;
