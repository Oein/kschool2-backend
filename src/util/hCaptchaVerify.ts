import { verify } from "hcaptcha";

var hSecret = process.env.HCAPTCHA_SECRET || "";

export default function verify_hCaptcha(token: string) {
  return new Promise<boolean>((resolve, reject) => {
    verify(hSecret, token)
      .then((data) => {
        if (data.success) resolve(true);
        else resolve(false);
      })
      .catch((err) => {
        console.error("[HCAPTCHA]", err.message, "\n", err);
        resolve(false);
      });
  });
}
