import axios from "axios";

var KEY = process.env.NEIS_API_KEY || "";

export var getSchoolName = async (schoolCode: string) => {
  var URL = encodeURI(
    `https://open.neis.go.kr/hub/schoolInfo?Type=json&SD_SCHUL_CODE=${schoolCode}&key=${KEY}`
  );
  var { data } = await axios.get(URL);
  if (data.schoolInfo) {
    var { SD_SCHUL_CODE: schoolCode_, SCHUL_NM: schoolName } =
      data.schoolInfo[1].row[0];

    return schoolName;
  } else {
    return null;
  }
};
