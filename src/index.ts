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

app.use("/pop", rateLimiter, checkPopQuery, popRouter);
app.use("/register", sessionRouter);
app.use("/first", firstRouter);
app.use("/lead", leaderBoardRouter);

app.get("/banme", (req, res) => {
  var ip = `IP_${
    req.headers["x-forwarded-for"] || req.connection.remoteAddress
  }`;

  redis.ban.add(ip);
  res.send("Banned! 1 Day");
});

app.listen(PORT, () => {
  console.log("[Express]", "Listening on port", PORT);
});
