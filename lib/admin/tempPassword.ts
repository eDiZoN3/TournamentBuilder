import { randomInt } from "crypto";

const TEMPORARY_PASSWORD_LENGTH = 10;
const TEMPORARY_PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generateTemporaryPassword(): string {
  let password = "";

  for (let index = 0; index < TEMPORARY_PASSWORD_LENGTH; index += 1) {
    password +=
      TEMPORARY_PASSWORD_CHARS[randomInt(TEMPORARY_PASSWORD_CHARS.length)];
  }

  return password;
}
