import express, { Router, Request, Response } from "express";
import redis from "../database/redis";
import validateSchool from "../validator/validateSchool";

const firstRouter: Router = express.Router();

firstRouter.post("/", async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN);
  let schoolCode = req.query.schoolCode || "";

  if (typeof schoolCode !== "string")
    return res.status(400).send({
      error: "School Code is not a string",
    });

  const S = await validateSchool(schoolCode);
  if (!S) return res.status(400).json({ error: "schoolCode is not exists" });

  const ret = `${await redis.total.get()}/${await redis.pop.getRank(
    schoolCode
  )}/${await redis.pop.getScore(schoolCode)}`;

  return res.send(ret);
});

export default firstRouter;
