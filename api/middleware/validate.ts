import type { RequestHandler } from "express";
import Joi from "joi";
import ApiError from "../utils/ApiError";

type ValidationSchemas = Partial<Record<"body" | "params" | "query", Joi.Schema>>;

const validate = (schemas: ValidationSchemas): RequestHandler => (req, res, next) => {
  const targets = ["body", "params", "query"] as const;
  for (const t of targets) {
    if (!schemas[t]) continue;
    const { error, value } = schemas[t].validate(req[t], { abortEarly: false, stripUnknown: true });
    if (error) {
      const message = error.details.map((d) => d.message).join(" | ");
      return next(new ApiError("VALIDATION_ERROR", message, 422));
    }
    req[t] = value;
  }
  next();
};

export default validate;