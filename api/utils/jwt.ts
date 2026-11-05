import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import config from "../../config";
import ApiError from "./ApiError";

interface TokenPayload {
  id: number;
  role: string;
}

const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as SignOptions["expiresIn"] });

const isTokenPayload = (payload: string | JwtPayload): payload is JwtPayload & TokenPayload =>
  typeof payload === "object" &&
  payload !== null &&
  typeof payload.id === "number" &&
  typeof payload.role === "string";

const verifyToken = (token: string): TokenPayload => {
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    if (isTokenPayload(payload)) return payload;
    throw new Error("Invalid token payload");
  } catch {
    throw new ApiError("INVALID_TOKEN", "توکن نامعتبر یا منقضی شده است.", 401);
  }
};

export { signToken, verifyToken };