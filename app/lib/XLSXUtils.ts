import XLSX from "xlsx"

export function autofitColumns(
  worksheet: XLSX.WorkSheet,
  range = XLSX.utils.decode_range("A1:ZZ1000"),
) {
  const maxLengths: number[] = []

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })]
      if (!cell) continue
      const cellText = cell.v
      if (!cellText) continue
      const cellTextLength = cellText.toString().length
      if (!maxLengths[C] || maxLengths[C] < cellTextLength) {
        maxLengths[C] = cellTextLength
      }
    }
  }

  for (let C = range.s.c; C <= range.e.c; ++C) {
    worksheet["!cols"] = worksheet["!cols"] || []
    worksheet["!cols"][C] = { wch: maxLengths[C] }
  }
}

export function excelCurrency(value: number) {
  return { v: value, t: "n", z: "R$ #,##0.00" }
}
