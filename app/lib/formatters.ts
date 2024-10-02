const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

export const brl = (num: string | number) => brlFormatter.format(Number(num))

export const currencyToNumber = (currency: string): number => {
  return Number(currency.replace(/\D/g, "")) / 100
}

// Transforms a string formatted by `brl` into a
// numeric string value from postgres
// R$ 123.456,78  ==>  123456.78
export const currencyToNumeric = (currency: string): string => {
  const cleanedCurrency = currency.replace(/[R$\s]/g, "")

  const numericValue = cleanedCurrency.replace(/\./g, "").replace(",", ".")

  return numericValue
}
