const KEY = process.env.NEIS_API_KEY || "";

import redis from "../database/redis";
import axios from "axios";
import { getSchoolName } from "../util/getSchoolName";

const checkSchoolCode = (c: string) => {
  const n = parseInt(c);
  return Number.isInteger(n) && n > 0 && c === n.toString();
};

export default async function validateSchool(schoolCode: string) {
  if (!checkSchoolCode(schoolCode)) return false;

  const data = await redis.pop.getScore(schoolCode);
  if (data != -1) {
    return true;
  }

  try {
    let schoolName = await getSchoolName(schoolCode);

    if (schoolName == null) {
      return false;
    }

    redis.pop.set(schoolCode, 0);

    return true;
  } catch (err) {
    console.log("[Neis API] Falied Request schoolCode : ", schoolCode);
    console.log(err);

    return false;
  }
}
