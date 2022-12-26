import express, { Router, Request, Response } from "express";
import redis from "../database/redis";

var popRouter: Router = express.Router();

popRouter.post("/", async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN);

  var pop = req.count || 0;
  var schoolCode = req.schoolCode || "";

  // 추가는 thread로
  redis.pop.update(schoolCode, pop);

  return res
    .status(200)
    .send(
      `${await redis.total.get()}/${await redis.pop.getRank(
        schoolCode
      )}/${await redis.pop.getScore(schoolCode)}/${req.newToken}`
    );
});

export default popRouter;
