import redis from "../database/redis";

// DB 에 있는 데이터들 Redis 에 올리기
export default async function prepareCahce() {
  await redis.redisClient.flushall();
  const data = await redis.prisma.school.findMany({});
  redis.redisClient.set(`TOTAL`, 0);
  data.forEach((e) => {
    redis.pop.set(e.schoolCode, parseInt(e.pops.toString()));
    redis.total.add(parseInt(e.pops.toString()));
  });
}
