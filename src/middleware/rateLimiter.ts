import { Request, Response, NextFunction } from "express";
import redis from "../database/redis";

const POP_SECONDS_WINDOW = parseInt(process.env.POP_SECONDS_WINDOW || "9");
const POP_ALLOWED_HITS = parseInt(process.env.POP_ALLOWED_HITS || "1");

export default async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = `IP_${
    req.headers["x-forwarded-for"] || req.connection.remoteAddress
  }`;
  const requests = await redis.ip.incr(ip);
  if (!requests) {
    return res.status(500).json({ error: true, msg: "server error" });
  }

  if (requests === 1) redis.ip.expire(ip, POP_SECONDS_WINDOW);
  if (requests <= POP_ALLOWED_HITS) {
    return next();
  }

  return res.status(429).json({ error: true, msg: "429 Too many requests" });
}
