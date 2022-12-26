import express, { Router, Request, Response } from "express";
import redis from "../database/redis";
import verify_hCaptcha from "../util/hCaptchaVerify";

const sessionRouter: Router = express.Router();

sessionRouter.get("/", async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN);

  let { token } = req.query;

  if (!token)
    return res.status(403).json({
      error: "Token is required",
    });

  if (typeof token !== "string")
    return res.status(403).json({
      error: "Token is invalid",
    });

  let tokenOkay = await verify_hCaptcha(token);

  if (!tokenOkay)
    return res.send({
      error: "hCaptcha token is invalid",
    });

  const ip = `IP_${
    req.headers["x-forwarded-for"] || req.connection.remoteAddress
  }...${req.headers["user-agent"]}`;

  let g = await redis.token.signup(ip);

  return res.send(g.token);
});

export default sessionRouter;
