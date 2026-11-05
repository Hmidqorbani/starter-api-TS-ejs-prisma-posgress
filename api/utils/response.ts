import type { Response } from "express";

const ok = (res: Response, data: unknown = null, status = 200) => res.status(status).json({ ok: true, data });
const fail = (res: Response, code: string, message: string, status = 400) =>
  res.status(status).json({ ok: false, error: { code, message } });

export { ok, fail };