import { uid } from "uid";

export default function signNewToken() {
  var token = uid(24);
  return token;
}
