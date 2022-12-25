import { uid } from "uid";

export default function signNewToken() {
  let token = uid(256);
  return token;
}
