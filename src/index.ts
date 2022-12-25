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
import totalRouter from "./router/total";
import firstRouter from "./router/first";

prepareCahce().then(() => {
  console.log("[Cache]", "Updated Redis data");
});

redis.empty();

let app = express();

const PORT = parseInt(process.env.PORT || "8080");

app.use("/pop", rateLimiter, checkPopQuery, popRouter);
app.use("/register", sessionRouter);
app.use("/total", totalRouter);
app.use("/first", firstRouter);

app.listen(PORT, () => {
  console.log("[Express]", "Listening on port", PORT);
});
