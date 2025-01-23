// TODO: use 0 based month number, but refactor the whole app to avoid bugs
export function validateDate(month: number, year: number): Date {
  if (month < 1 || month > 12 || year < 2000) {
    throw new Error("date out of range")
  }

  return new Date(year, month - 1)
}
