import express, { Router, Request, Response } from "express";
import redis from "../database/redis";
import validateSchool from "../validator/validateSchool";

const firstRouter: Router = express.Router();

firstRouter.post("/", async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN);
  let schoolCode = req.query.schoolCode || "";

  if (typeof schoolCode !== "string")
    return res.send({
      error: "School Code is not a string",
    });

  const S = await validateSchool(schoolCode);
  if (!S)
    return res
      .status(400)
      .json({ error: true, msg: "schoolCode is not exists" });

  const ret = {
    total: await redis.total.get(),
    rank: await redis.pop.getRank(schoolCode),
    schoolPop: await redis.pop.getScore(schoolCode),
  };

  return res.status(200).json(ret);
});

export default firstRouter;
