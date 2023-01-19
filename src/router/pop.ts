import axios from "axios";
import express, { Router, Request, Response } from "express";
import redis from "../database/redis";

var popRouter: Router = express.Router();

popRouter.post("/", async (req: Request, res: Response) => {
  var pop = req.count || 0;
  var schoolCode = req.schoolCode || "";

  // 추가는 thread로
  redis.pop.update(schoolCode, pop);
  axios.post(process.env.WEBHOOK || "", {
    content: null,
    embeds: [
      {
        title: "POP Request",
        color: 12488334,
        fields: [
          {
            name: "IP",
            value:
              req.headers["x-original-forwarded-for"] ||
              req.connection.remoteAddress,
            inline: true,
          },
          {
            name: "Count",
            value: pop,
            inline: true,
          },
          {
            name: "School",
            value: schoolCode.toString(),
            inline: true,
          },
          {
            name: "UserAgent",
            value: req.headers["user-agent"],
            inline: true,
          },
        ],
      },
    ],
    attachments: [],
  });

  return res
    .status(200)
    .send(
      `${await redis.total.get()}/${await redis.pop.getRank(
        schoolCode
      )}/${await redis.pop.getScore(schoolCode)}/${req.newToken}`
    );
});

export default popRouter;
