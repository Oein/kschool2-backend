import express, { Router, Request, Response } from "express";
import redis from "../database/redis";
import validateSchool from "../validator/validateSchool";

var firstRouter: Router = express.Router();

firstRouter.post("/", async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN);
  var schoolCode = req.query.schoolCode || "";

  if (typeof schoolCode !== "string") return res.status(400).send("-2");

  var S = await validateSchool(schoolCode);
  if (!S) return res.status(400).send("-2");

  var ret = `${await redis.total.get()}/${await redis.pop.getRank(
    schoolCode
  )}/${await redis.pop.getScore(schoolCode)}`;

  return res.send(ret);
});

export default firstRouter;
