import type { Express, RequestHandler } from "express";
import routes from "./routes";
import logger from "../api/utils/logger";
import config from "../config";
import { verifyToken } from "../api/utils/jwt";
import prisma from "../lib/prisma";

const loadUserFromCookie: RequestHandler = async (req, res, next) => {
  const token = req.cookies[config.jwt.cookieName];
  if (!token) {
    res.locals.user = null;
    return next();
  }
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
    if (user && user.isActive) {
      req.user = user;
      res.locals.user = user;
    } else {
      res.locals.user = null;
    }
  } catch {
    res.locals.user = null;
  }
  next();
};

const setupPages = (app: Express): void => {
  app.use(loadUserFromCookie);
  app.use("/", routes);
  logger.success("صفحات EJS mount شدند.");
};

export { setupPages };