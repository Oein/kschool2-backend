import axios from "axios";

const KEY = process.env.NEIS_API_KEY || "";

export const getSchoolName = async (schoolCode: string) => {
  const URL = encodeURI(
    `https://open.neis.go.kr/hub/schoolInfo?Type=json&SD_SCHUL_CODE=${schoolCode}&key=${KEY}`
  );
  const { data } = await axios.get(URL);
  if (data.schoolInfo) {
    const { SD_SCHUL_CODE: schoolCode, SCHUL_NM: schoolName } =
      data.schoolInfo[1].row[0];

    return schoolName;
  } else {
    return null;
  }
};
