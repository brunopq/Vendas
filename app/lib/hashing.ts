import bcrypt from "bcryptjs"
const { hash, compare } = bcrypt

export const encryptPassword = (password: string) => hash(password, 10)

export const verifyPassword = (password: string, hashed: string) =>
  compare(password, hashed)
