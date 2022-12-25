import redis, { addTotalScore } from "../database/redis";

// DB 에 있는 데이터들 Redis 에 올리기
export default async function prepareCahce() {
  await redis.redisClient.flushall();
  const data = await redis.prisma.school.findMany({});

  data.forEach((e) => {
    redis.pop.set(e.schoolCode, parseInt(e.pops.toString()));
    addTotalScore(Number(e.pops));
  });
}
