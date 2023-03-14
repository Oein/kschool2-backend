import { Request, Response, NextFunction } from "express";

var MAX_POP = parseInt(process.env.MAX_POP || "200");

import validateSchool from "../validator/validateSchool";
import redis from "../database/redis";
import validate, {
  aesGcmDecrypt,
} from "../validator/validateOldTokenAndNewToken";

export var checkPopQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    var {
      schoolCode,
      count,
      token,
      newToken,
      validatox,
      validator,
      timestamp,
    } = req.query;
    var ip_ls = `IP_${
      req.headers["x-original-forwarded-for"] || req.connection.remoteAddress
    }`;
    var ip = `IP_${
      req.headers["x-original-forwarded-for"] || req.connection.remoteAddress
    }...${req.headers["user-agent"]}`;

    var banned = await redis.ban.ed(ip_ls);
    if (banned) return res.send("-1");

    var invalid_q = () => {
      res.status(406).send("-2");
    };

    if (typeof count !== "string") return invalid_q();
    if (typeof schoolCode !== "string") return invalid_q();
    if (typeof token !== "string") return invalid_q();
    if (typeof newToken !== "string") return invalid_q();
    if (typeof validatox !== "string") return invalid_q();
    if (typeof validator !== "string") return invalid_q();
    if (typeof timestamp !== "string") return invalid_q();

    const decryt = async (al: string) => {
      return await aesGcmDecrypt(atob(al), timestamp as string);
    };

    validatox = atob(validatox);
    validator = atob(validator);

    let decs = atob(await aesGcmDecrypt(validator, validatox));

    if (decs != req.headers["user-agent"]!)
      return res.status(400).json({ error: "Not valid ontoken1" });

    token = atob(token);
    newToken = atob(newToken);

    if (!(await validate(token, newToken, req.headers["user-agent"] || "")))
      return res.status(400).json({ error: "Not valid ontoken2" });
    // 토큰
    var rested = await redis.token.register(token, ip, newToken);
    // 에러 나면 끝내기
    if (rested.error) {
      return res.status(400).json({ error: rested.error });
    }

    // 학교 코드 검증
    schoolCode = await decryt(schoolCode);
    var S = await validateSchool(schoolCode);
    if (!S) return res.status(400).send("-2");

    // 점수 계산
    count = (await decryt(count)).toString();
    var c = parseInt(count || "0");
    req.count = 0 < c && c <= MAX_POP ? c : 0; // 허용값 사이면 c를 아니면 0을

    // 학교 코드
    req.schoolCode = schoolCode;
    return next();
  } catch (e) {
    if (res.writable) return res.send({ e: e });
  }
};
