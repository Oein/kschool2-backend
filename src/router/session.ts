import express, { Router, Request, Response } from "express";
import redis from "../database/redis";
import verify_hCaptcha from "../util/hCaptchaVerify";

var sessionRouter: Router = express.Router();

sessionRouter.get("/", async (req: Request, res: Response) => {
  var { token } = req.query;

  if (!token) return res.status(400).send("-6");

  if (typeof token !== "string") return res.status(400).send("-6");

  var tokenOkay = await verify_hCaptcha(token);

  if (!tokenOkay) return res.send("-7");

  var ip = `IP_${
    req.headers["x-forwarded-for"] || req.connection.remoteAddress
  }...${req.headers["user-agent"]}`;

  var g = await redis.token.signup(ip);

  return res.send(g.token);
});

export default sessionRouter;
