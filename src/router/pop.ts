import express, { Router, Request, Response } from "express";
import redis from "../database/redis";

const popRouter: Router = express.Router();

popRouter.post("/", async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN);

  let pop = req.count || 0;
  let schoolCode = req.schoolCode || "";

  // 추가는 thread로
  redis.pop.update(schoolCode, pop);

  const total = await redis.total.get();
  const rank = await redis.pop.getRank(schoolCode);
  const schoolPop = await redis.pop.getScore(schoolCode);
  const token = req.newToken;
  const ret = `${total}/${rank}/${schoolPop}/${token}`;
  return res.status(200).send(ret);
});

export default popRouter;
