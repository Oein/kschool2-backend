import express, { Router, Request, Response } from "express";
import redis from "../database/redis";

const popRouter: Router = express.Router();

popRouter.post("/", async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN);

  let pop = req.count || 0;
  let schoolCode = req.schoolCode || "";
  // 추가는 thread로
  redis.pop.update(schoolCode, pop);

  const ret = {
    total: redis.totalScore,
    rank: await redis.pop.getRank(schoolCode),
    schoolPop: await redis.pop.getScore(schoolCode),
    token: req.newToken,
  };

  return res.status(200).json(ret);
});

export default popRouter;
