import { webcrypto as crypto } from "crypto";
import "dotenv/config";

/**
 * Encrypts plaintext using AES-GCM with supplied password, for decryption with aesGcmDecrypt().
 *                                                                      (c) Chris Veness MIT Licence
 *
 * @param   {String} plaintext - Plaintext to be encrypted.
 * @param   {String} password - Password to use to encrypt plaintext.
 * @returns {String} Encrypted ciphertext.
 *
 * @example
 *   const ciphertext = await aesGcmEncrypt('my secret text', 'pw');
 *   aesGcmEncrypt('my secret text', 'pw').then(function(ciphertext) { console.log(ciphertext); });
 */
export async function aesGcmEncrypt(plaintext: string, password: string) {
  const pwUtf8 = new TextEncoder().encode(password); // encode password as UTF-8
  const pwHash = await crypto.subtle.digest("SHA-256", pwUtf8); // hash the password

  const iv = crypto.getRandomValues(new Uint8Array(12)); // get 96-bit random iv
  const ivStr = Array.from(iv)
    .map((b) => String.fromCharCode(b))
    .join(""); // iv as utf-8 string

  const alg = { name: "AES-GCM", iv: iv }; // specify algorithm to use

  const key = await crypto.subtle.importKey("raw", pwHash, alg, false, [
    "encrypt",
  ]); // generate key from pw

  const ptUint8 = new TextEncoder().encode(plaintext); // encode plaintext as UTF-8
  const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8); // encrypt plaintext using key

  const ctArray = Array.from(new Uint8Array(ctBuffer)); // ciphertext as byte array
  const ctStr = ctArray.map((byte) => String.fromCharCode(byte)).join(""); // ciphertext as string

  return btoa(ivStr + ctStr); // iv+ciphertext base64-encoded
}

/**
 * Decrypts ciphertext encrypted with aesGcmEncrypt() using supplied password.
 *                                                                      (c) Chris Veness MIT Licence
 *
 * @param   {String} ciphertext - Ciphertext to be decrypted.
 * @param   {String} password - Password to use to decrypt ciphertext.
 * @returns {String} Decrypted plaintext.
 *
 * @example
 *   const plaintext = await aesGcmDecrypt(ciphertext, 'pw');
 *   aesGcmDecrypt(ciphertext, 'pw').then(function(plaintext) { console.log(plaintext); });
 */
export async function aesGcmDecrypt(ciphertext: string, password: string) {
  const pwUtf8 = new TextEncoder().encode(password); // encode password as UTF-8
  crypto.subtle.digest;
  const pwHash = await crypto.subtle.digest("SHA-256", pwUtf8); // hash the password

  const ivStr = atob(ciphertext).slice(0, 12); // decode base64 iv
  const iv = new Uint8Array(Array.from(ivStr).map((ch) => ch.charCodeAt(0))); // iv as Uint8Array

  const alg = { name: "AES-GCM", iv: iv }; // specify algorithm to use

  const key = await crypto.subtle.importKey("raw", pwHash, alg, false, [
    "decrypt",
  ]); // generate key from pw

  const ctStr = atob(ciphertext).slice(12); // decode base64 ciphertext
  const ctUint8 = new Uint8Array(
    Array.from(ctStr).map((ch) => ch.charCodeAt(0))
  ); // ciphertext as Uint8Array
  // note: why doesn't ctUint8 = new TextEncoder().encode(ctStr) work?

  try {
    const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8); // decrypt ciphertext using key
    const plaintext = new TextDecoder().decode(plainBuffer); // plaintext from ArrayBuffer
    return plaintext; // return the plaintext
  } catch (e) {
    return "Decrypt failed";
  }
}

export const enc = process.env.ENC || "1234";

function isJsonString(str: string) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

interface JS {
  a: string; // agent
  k: string; // key
  t: number; // timestamp
}

export default async function validate(old: string, newk: string, uag: string) {
  try {
    let oldDecrypted = await aesGcmDecrypt(old, enc);
    let newDecrypted = await aesGcmDecrypt(newk, enc);

    if (!oldDecrypted.startsWith("KSCHOOL")) {
      console.log("OLD Not starts with kschool");
      return false;
    }
    if (!newDecrypted.startsWith("KSCHOOL")) {
      console.log("New Not starts with kschool");
      return false;
    }

    oldDecrypted = oldDecrypted.replace("KSCHOOL", "");
    newDecrypted = newDecrypted.replace("KSCHOOL", "");

    if (!isJsonString(oldDecrypted)) return false;
    if (!isJsonString(newDecrypted)) return false;

    let oldJ: JS = JSON.parse(oldDecrypted);
    let newJ: JS = JSON.parse(newDecrypted);

    if (oldJ.k != newJ.k) {
      console.log("Key is not the same");
      return false;
    }
    let nt = new Date(newJ.t).getTime();
    let ot = new Date(oldJ.t).getTime();

    if (nt - ot < 10000) {
      console.log("Created before 10 seconds");
      return false; // 10초 미만
    }
    if (nt - ot > 1000 * 60 * 10) {
      console.log("Created after 60 seconds");
      return false; // 1분 이상
    }
    if (newJ.a != oldJ.a) {
      console.log("Agent is not the same");
      return false;
    }
    if (newJ.a != uag) {
      console.log("Agent is not the same as newA");
      return false;
    }
    if (uag != oldJ.a) {
      console.log("Agent is not the same as oldA");
      return false;
    }

    return true;
  } catch (e) {
    throw e;
  }
}
