import dotenv from "dotenv"
import { cleanEnv, host, port, str } from "envalid"

dotenv.config()

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production"],
  }),
  DB_HOST: host(),
  DB_USER: str(),
  DB_PASSWORD: str(),
  DB_NAME: str(),
  DB_PORT: port(),
  COOKIE_SECRET: str(),
})
