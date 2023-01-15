import express from "express";
import "dotenv/config";

// db
import redis from "./database/redis";

// middleware
import rateLimiter from "./middleware/rateLimiter";

// router
import popRouter from "./router/pop";

import prepareCahce from "./cache/prepareCache";
import { checkPopQuery } from "./middleware/checkPopQuery";
import sessionRouter from "./router/session";
import firstRouter from "./router/first";
import prisma from "./database/prisma";
import leaderBoardRouter from "./router/leaderboard";

prepareCahce().then(() => {
  console.log("[Cache]", "Updated Redis data");
});

redis.empty();

BigInt.prototype["toJSON"] = function () {
  return this.toString();
};

var app = express();

var PORT = parseInt(process.env.PORT || "8080");
var UPDATE_SEC = parseInt(process.env.UPDATE_SEC || "30");

prisma.top100_update();
setInterval(prisma.top100_update, UPDATE_SEC * 1000);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN?.toString());
  res.header("Access-Control-Allow-Methods", "GET,POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use("/pop", rateLimiter, checkPopQuery, popRouter);
app.use("/register", sessionRouter);
app.use("/first", firstRouter);
app.use("/lead", leaderBoardRouter);
app.post("/tmpban", async (req, res) => {
  var ip = `IP_${
    req.headers["x-forwarded-for"] || req.connection.remoteAddress
  }`;

  // 이전에 밴당한 데이터
  let old = await prisma.prisma.bannedUser.findFirst({
    where: {
      ip: ip,
    },
  });

  if (!old) {
    // 밴 당한 적이 없으면 10분 tmp ban
    await prisma.prisma.bannedUser.create({
      data: {
        ip: ip,
        bannedCount: 1,
        banStart: new Date(),
      },
    });
    await redis.ban.add(ip, 60 * 10);
    return res.send(`1`);
  }

  // ms 기준으로 밴 시간
  let needBant: number = 1000 * 60 * 10;
  if (old.banStart == null) return;
  if (old.bannedCount != 0 && old.bannedCount % 5 == 0)
    needBant = 1000 * 60 * 60 * 24 * 10;

  let now = new Date();
  // 지금 - 전에 밴 당한시간 = 밴 당한 시간
  // 밴 당한 시간 > 밴 시간
  if (now.getTime() - old.banStart.getTime() > needBant) {
    // 마지막으로 밴 당한게 끝남

    // prisma에 밴 당했다고 등록
    let banCount = old.bannedCount + 1;
    await prisma.prisma.bannedUser.update({
      where: {
        ip: ip,
      },
      data: {
        bannedCount: banCount,
        banStart: new Date(),
      },
    });

    // redis에 등록
    let needBantx: number = 60 * 10;
    if (banCount != 0 && banCount % 5 == 0) needBantx = 60 * 60 * 24 * 10;
    await redis.ban.add(ip, needBantx);

    return res.send(banCount.toString());
  }
  // 밴 당했지만 아직 끝나지 않음
  return res.send("a");
});
app.post("/bansure", async (req, res) => {
  var ip = `IP_${
    req.headers["x-forwarded-for"] || req.connection.remoteAddress
  }`;

  // 이전에 밴당한 데이터
  let old = await prisma.prisma.bannedUser.findFirst({
    where: {
      ip: ip,
    },
  });

  if (!old) {
    await prisma.prisma.bannedUser.create({
      data: {
        ip: ip,
        bannedCount: 1,
        banStart: new Date(),
      },
    });
    await redis.ban.add(ip);
    return res.send("1");
  }

  await prisma.prisma.bannedUser.update({
    where: {
      ip: ip,
    },
    data: {
      bannedCount: old.bannedCount + 1,
      banStart: new Date(),
    },
  });
  await redis.ban.add(ip);
  return res.send((old.bannedCount + 1).toString());
});

app.listen(PORT, () => {
  console.log("[Express]", "Listening on port", PORT);
});
