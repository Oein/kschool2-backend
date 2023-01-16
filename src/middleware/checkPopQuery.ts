import { Request, Response, NextFunction } from "express";

var MAX_POP = parseInt(process.env.MAX_POP || "200");

import validateSchool from "../validator/validateSchool";
import redis from "../database/redis";

export var checkPopQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  var { schoolCode, count, token } = req.query;
  var ip_ls = `IP_${
    req.headers["x-original-forwarded-for"] || req.connection.remoteAddress
  }`;
  var ip = `IP_${
    req.headers["x-original-forwarded-for"] || req.connection.remoteAddress
  }...${req.headers["user-agent"]}`;

  var banned = await redis.ban.ed(ip_ls);
  if (banned) return res.send("-1");

  var invalid_q = () => res.status(400).send("-2");

  if (typeof count !== "string") return invalid_q();
  if (typeof schoolCode !== "string") return invalid_q();
  if (typeof token !== "string") return invalid_q();

  // 토큰
  var rested = await redis.token.register(token, ip);
  // 에러 나면 끝내기
  if (rested.error) {
    return res.status(400).json({ error: rested.error });
  }
  // 토큰 넣기
  if (rested.token) req.newToken = rested.token;

  // 학교 코드 검증
  var S = await validateSchool(schoolCode);
  if (!S) return res.status(400).send("-2");

  // 점수 계산
  var c = parseInt(count || "0");
  req.count = 0 < c && c <= MAX_POP && req.newToken ? c : 0; // 허용값 사이면 c를 아니면 0을

  // 학교 코드
  req.schoolCode = schoolCode;

  return next();
};
