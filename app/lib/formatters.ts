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

export const cpf = (value: string) => {
  return value
    .slice(0, 14)
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

export const phone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1")
}
