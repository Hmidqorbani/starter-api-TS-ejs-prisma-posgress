import type { RequestHandler } from "express";
import { fail } from "../utils/response";

const notFound: RequestHandler = (req, res) => {
  // For API routes (JSON response)
  if (req.originalUrl.startsWith("/api/") || req.accepts("json") && !req.accepts("html")) {
    return fail(res, "NOT_FOUND", "مسیر مورد نظر پیدا نشد.", 404);
  }
  // For page routes (HTML response)
  res.status(404).render("pages/not-found", { title: "پیدا نشد", layout: "layouts/main" });
};

export default notFound;