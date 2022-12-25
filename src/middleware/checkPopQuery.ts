import { Request, Response, NextFunction } from "express";

const MAX_POP = parseInt(process.env.MAX_POP || "200");

import validateSchool from "../validator/validateSchool";
import redis from "../database/redis";

export const checkPopQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { schoolCode, count, token } = req.query;
  const ip = `IP_${
    req.headers["x-forwarded-for"] || req.connection.remoteAddress
  }`;

  const invalid_q = () => {
    res.status(400).send({
      error: "query is invalid",
    });
    return;
  };

  if (typeof count !== "string") return invalid_q();
  if (typeof schoolCode !== "string") return invalid_q();
  if (typeof token !== "string") return invalid_q();

  // 토큰
  let rested = await redis.token.register(token, ip);
  // 에러 나면 끝내기
  if (rested.error) {
    return res.status(400).json({ error: true, msg: rested.error });
  }
  // 토큰 넣기
  if (rested.token) req.newToken = rested.token;

  // 학교 코드 검증
  const S = await validateSchool(schoolCode);
  if (!S)
    return res
      .status(400)
      .json({ error: true, msg: "schoolCode is not exists" });

  // 점수 계산
  const c = parseInt(count || "0");
  req.count = 0 < c && c <= MAX_POP && req.newToken ? c : 0; // 허용값 사이면 c를 아니면 0을

  // 학교 코드
  req.schoolCode = schoolCode;

  return next();
};
