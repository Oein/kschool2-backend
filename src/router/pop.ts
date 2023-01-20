import axios from "axios";
import express, { Router, Request, Response } from "express";
import redis from "../database/redis";

import "dotenv/config";

var popRouter: Router = express.Router();

var KEY = process.env.NEIS_API_KEY;

popRouter.post("/", async (req: Request, res: Response) => {
  var pop = req.count || 0;
  var schoolCode = req.schoolCode || "";

  // 추가는 thread로
  redis.pop.update(schoolCode, pop);

  const gx = async () => {
    let data = await redis.redisClient.get(`SCHOOL::${schoolCode}`);
    const yx = (sn: string) => {
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
                value: sn,
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
    };
    if (data != null) {
      yx(data);
    } else
      axios
        .get(
          `https://open.neis.go.kr/hub/schoolInfo?Type=json&pIndex=1&pSize=1&KEY=${KEY}&SD_SCHUL_CODE=${schoolCode}`
        )
        .then((v) => {
          let sn = "알 수 없음 / " + schoolCode.toString();
          try {
            sn = v.data.schoolInfo[1].row[0]["SCHUL_NM"];
          } catch (e) {}
          redis.redisClient.set(`SCHOOL::${schoolCode}`, sn);
          yx(sn);
        });
  };

  // gx();

  return res
    .status(200)
    .send(
      `${await redis.total.get()}/${await redis.pop.getRank(
        schoolCode
      )}/${await redis.pop.getScore(schoolCode)}/${req.newToken}`
    );
});

export default popRouter;
