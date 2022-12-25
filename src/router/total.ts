import express, { Router, Request, Response } from "express";
import redis from "../database/redis";
import verify_hCaptcha from "../util/hCaptchaVerify";

const totalRouter: Router = express.Router();

totalRouter.get("/", async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN);

  res.send({ total: await redis.total.get() });
});

export default totalRouter;
