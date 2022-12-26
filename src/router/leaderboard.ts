import express, { Router, Request, Response } from "express";
import prisma from "../database/prisma";

var leaderBoardRouter: Router = express.Router();

leaderBoardRouter.get("/", async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN);

  res.send(`${prisma.top100()}*${prisma.schoolCount().toString()}`);
});

export default leaderBoardRouter;
