import { Request, Response, NextFunction } from "express";
import redis from "../database/redis";

var POP_SECONDS_WINDOW = parseInt(process.env.POP_SECONDS_WINDOW || "9");
var POP_ALLOWED_HITS = parseInt(process.env.POP_ALLOWED_HITS || "1");

export default async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  var ip = `IP_${
    req.headers["x-forwarded-for"] || req.connection.remoteAddress
  }`;
  var requests = await redis.ip.incr(ip);
  if (!requests) {
    return res.status(400).send("-4");
  }

  if (requests === 1) redis.ip.expire(ip, POP_SECONDS_WINDOW);
  if (requests <= POP_ALLOWED_HITS) {
    return next();
  }

  return res.status(400).send("-5");
}
