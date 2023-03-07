import { Request, Response, NextFunction } from "express";
import redis from "../database/redis";

var POP_SECONDS_WINDOW = parseInt(process.env.POP_SECONDS_WINDOW || "9");
var POP_ALLOWED_HITS = parseInt(process.env.POP_ALLOWED_HITS || "1");

export default async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    var ip = `IP_${
      req.headers["x-original-forwarded-for"] || req.connection.remoteAddress
    }`;

    var requestsCount = await redis.ip.incr(ip);
    if (!requestsCount) {
      console.log("[RateLimiter]", ip);
      return res.status(400).send("-4");
    }

    console.log("[RateLimiter]", ip, requestsCount);

    if (requestsCount === 1) redis.ip.expire(ip, POP_SECONDS_WINDOW);
    if (requestsCount <= POP_ALLOWED_HITS) {
      return next();
    }

    return res.status(400).send("-5");
  } catch (e) {
    if (res.writable) res.send({ e: e });
  }
}
