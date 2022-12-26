import { PrismaClient, School } from "@prisma/client";

var prisma = new PrismaClient();

var top100 = "[]";
var schoolCount = 0;

export default {
  prisma: prisma,
  top100_update: async () => {
    var a =
      (await prisma.school.findMany({
        take: 100,
        orderBy: [
          {
            pops: "desc",
          },
        ],
      })) || [];

    var str = "";
    a.forEach((v, i) => {
      str += v.schoolName + "." + v.pops;
      if (i < a.length - 1) str += "/";
    });
    top100 = str;
    schoolCount = await prisma.school.count();
  },
  top100: () => {
    return top100;
  },
  schoolCount: () => {
    return schoolCount;
  },
};
