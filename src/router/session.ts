import express, { Router, Request, Response } from "express";
import redis from "../database/redis";
import verify_hCaptcha from "../util/hCaptchaVerify";

const sessionRouter: Router = express.Router();

sessionRouter.get("/", async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN);

  let { token } = req.query;

  if (!token) return res.status(400).send("-6");

  if (typeof token !== "string") return res.status(400).send("-6");

  let tokenOkay = await verify_hCaptcha(token);

  if (!tokenOkay) return res.send("-7");

  const ip = `IP_${
    req.headers["x-forwarded-for"] || req.connection.remoteAddress
  }...${req.headers["user-agent"]}`;

  let g = await redis.token.signup(ip);

  return res.send(g.token);
});

export default sessionRouter;
