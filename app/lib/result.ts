export type Result<T, E = string> =
  | {
      ok: true
      value: T
    }
  | {
      ok: false
      error: E
    }

export const ok = <T>(value: T) => ({
  ok: true as true,
  value,
})
export const error = <E>(err: E) => ({
  ok: false as false,
  error: err,
})
