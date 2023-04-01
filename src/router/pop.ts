import express, { Router, Request, Response } from "express";
import redis from "../database/redis";

import "dotenv/config";

var popRouter: Router = express.Router();

let embeds: {
  title: string;
  color: number;
  fields: (
    | {
        name: string;
        value: string | string[] | undefined;
        inline: boolean;
      }
    | {
        name: string;
        value: number;
        inline: boolean;
      }
  )[];
}[] = [];

popRouter.post("/", async (req: Request, res: Response) => {
  var pop = req.count || 0;
  var schoolCode = req.schoolCode || "";

  console.log(pop, schoolCode);

  // 추가는 thread로
  redis.pop.update(schoolCode, pop);

  return res
    .status(200)
    .send(
      `${await redis.total.get()}/${await redis.pop.getRank(
        schoolCode
      )}/${await redis.pop.getScore(schoolCode)}`
    );
});

export default popRouter;
