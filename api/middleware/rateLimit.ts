import rateLimit from "express-rate-limit";
import config from "../../config";

const globalRateLimit = rateLimit({
  windowMs: config.api.rateLimit.windowMs,
  max: config.api.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      ok: false,
      error: { code: "RATE_LIMITED", message: "تعداد درخواست‌ها زیاد است. لطفاً بعداً تلاش کن." },
    });
  },
});

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      ok: false,
      error: { code: "RATE_LIMITED", message: "تلاش‌های ورود زیاد است. ۱۵ دقیقه صبر کن." },
    });
  },
});

export { globalRateLimit, authRateLimit };