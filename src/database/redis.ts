import Redis from "ioredis";

import { PrismaClient } from "@prisma/client";
import signNewToken from "../validator/signNewToken";
import { getSchoolName } from "../util/getSchoolName";

const PASS = process.env.REDIS_PASS || "redis";
const PORT = process.env.REDIS_PORT || "6379";
const URL = process.env.REDIS_URL || "localhost";

const CACHE_NAMESPACE_POP = process.env.CACHE_NAMESPACE_POP || "POP";
const DB_UPDATE_SEC = parseInt(process.env.DB_UPDATE_SEC || "60");

const prisma = new PrismaClient();

const redisClient = new Redis({
  port: parseInt(PORT),
  host: URL,
  password: PASS,
});

redisClient.on("connect", () => {
  console.log("[REDIS]  ", "Connected!");
});

let totalScore: number = 0;

let json_queue: {
  [key: string]: number;
} = {};

const update_sql = async (schoolCode: string) => {
  let increse_pop = json_queue[schoolCode]!;
  delete json_queue[schoolCode];

  // prisma로 업데이트
  await prisma.school
    .update({
      where: {
        schoolCode: schoolCode,
      },
      data: {
        pops: {
          increment: increse_pop,
        },
      },
    })
    .catch(async (err) => {
      if (
        err.message.includes(
          "An operation failed because it depends on one or more records that were required but not found. Record to update not found."
        )
      ) {
        let schoolName = await getSchoolName(schoolCode);
        if (!schoolName) {
          console.error("[SC NAME]", "NULL Returned");
        } else
          await prisma.school.create({
            data: {
              pops: increse_pop,
              schoolCode: schoolCode,
              schoolName: schoolName,
            },
          });
      }
    });
};

const queue_school = (schoolCode: string, pop: number) => {
  if (json_queue[schoolCode]) json_queue[schoolCode] += pop;
  else {
    json_queue[schoolCode] = pop;
    setTimeout(update_sql, DB_UPDATE_SEC * 1000, schoolCode);
  }
};

export default {
  redisClient: redisClient,
  prisma: prisma,
  totalScore: totalScore,
  empty: () => {},
  ip: {
    // ip에 1 더하기
    incr: async (ip: string) => {
      return await new Promise((resolve) => {
        redisClient.incr(ip, (err, data) => {
          if (err) console.error("[REDIS]  ", "Redis ip incr error", err);
          resolve(err ? null : data || 0);
        });
      });
    },
    //
    expire: async (ip: string, seconds: number) => {
      return await new Promise((resolve) => {
        redisClient.expire(ip, seconds, (err, data) => {
          if (err) console.error("[REDIS]  ", "Redis expire", err);
          resolve(err ? null : data);
        });
      });
    },
  },
  pop: {
    set: (schoolCode: string, score: number) => {
      return new Promise(async (resolve, reject) => {
        redisClient.zadd(CACHE_NAMESPACE_POP, score, schoolCode);
      });
    },
    // sorted set 에서 학교 점수 올리기
    update: (schoolCode: string, score: number) => {
      return new Promise(async (resolve, reject) => {
        queue_school(schoolCode, score);
        redisClient.zincrby(
          CACHE_NAMESPACE_POP,
          score,
          schoolCode,
          (err, data) => {
            if (err) console.error(`Redis update error\n>>> ${err}`);
            if (data) {
              totalScore += parseInt(data);
            }

            resolve(err ? -1 : data);
          }
        );
      });
    },
    // sorted set 에서 학교 점수 가져오기 -> 학교가 존재하나?
    getScore: async (schoolCode: string) => {
      return await new Promise((resolve) => {
        redisClient.zscore(CACHE_NAMESPACE_POP, schoolCode, (err, data) => {
          if (err) console.error(`Redis pop get error\n>>> ${err}`);
          if (data == null) {
            resolve(-1);
          } else resolve(data);
        });
      });
    },
    // sorted set 에서 학교 순위 가져오기
    getRank: async (schoolCode: string) => {
      return await new Promise((resolve) => {
        redisClient.zrevrank(CACHE_NAMESPACE_POP, schoolCode, (err, data) => {
          if (err) console.error(`Redis pop getIndex error\n>>> ${err}`);
          if (typeof data !== "number") {
            resolve(-1);
          } else resolve(data + 1);
        });
      });
    },
  },
  token: {
    register: (oldToken: string, ip: string) => {
      return new Promise<{
        error: string | null;
        token: string | null;
      }>(async (resolve, reject) => {
        redisClient.get(`tokens::${oldToken}`).then(async (v) => {
          if (!v) {
            // token이 없으면
            resolve({
              error: "Token does not exist.",
              token: null,
            });

            return;
          }
          if (v != ip) {
            // 같은 토큰인데 접속한 ip가 다름
            resolve({
              error: "Requested from different ip.",
              token: null,
            });
            return;
          }
          // 새로운 토큰 주면 됨
          await redisClient.del(`tokens::${oldToken}`);

          let newToken = signNewToken();

          await redisClient.set(`tokens::${newToken}`, ip);

          resolve({
            error: null,
            token: newToken,
          });
          return;
        });
      });
    },
  },
};
