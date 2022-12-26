import { uid } from "uid";

export default function signNewToken() {
  let token = uid(24);
  return token;
}
