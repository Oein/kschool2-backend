var KEY = process.env.NEIS_API_KEY || "";

import redis from "../database/redis";
import axios from "axios";
import { getSchoolName } from "../util/getSchoolName";

var checkSchoolCode = (c: string) => {
  var n = parseInt(c);
  return Number.isInteger(n) && n > 0 && c === n.toString();
};

export default async function validateSchool(schoolCode: string) {
  if (!checkSchoolCode(schoolCode)) return false;

  var data = await redis.pop.getScore(schoolCode);
  if (data != -1) {
    return true;
  }

  try {
    var schoolName = await getSchoolName(schoolCode);

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
