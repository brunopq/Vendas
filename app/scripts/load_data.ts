import { readFileSync } from "node:fs"
import { newSaleSchema } from "~/db/schema"

import SalesService, { type CaptationType } from "~/services/SalesService"

const filePath = "dados.csv"

const data = readFileSync(filePath).toString()
const lines = data.split("\r\n").map((l) => l.split(","))

const USERS: Record<string, string> = {
  NICOLE: "bUZZWCsjyt6a",
  LORRANA: "Xy3y0rltTLM3",
  FERNANDA: "4Lr527URLRwA",
  ANDREIA: "Ax08sMslrdTX",
  ÁGATHA: "ZywxExtJzE54",
  PAULA: "AfJ3nGl6dnXM",
  GABRIELA: "NKCEg24VyI3L",
  RAFAEL: "gxuBqrCilEIa",
}

const CAMPAIGNS: Record<string, string> = {
  TRABALHISTA: "pkfC1PoNJErL",
  CÍVEL: "UjBsAPgm0HXf",
  PREV: "uxFHECwHqLC5",
  APLICATIVO: "ZkgMFgizAMer",
}

const AREAS: Record<string, string> = {
  TRABALHISTA: "Trabalhista",
  "CÍVEL ESTADUAL": "Cível estadual",
  "CÍVEL FEDERAL": "Cível federal",
  PREVIDENCIÁRIO: "Previdenciário",
  APLICATIVO: "Aplicativo",
}

const TYPES: Record<string, CaptationType> = {
  PASSIVA: "PASSIVO",
  ATIVA: "ATIVO",
}

const REPURCHASES: Record<string, boolean> = {
  SIM: true,
  NÃO: false,
}

// DATA DE CONTRATAÇÃO, PROFISSIONAL, TIPO CAPTAÇÃO (ATIVA/PASSIVA), CLIENTE, ÁREA, PARTE ADVERSA, RECOMPRA, CAMPANHA

let total = 0
let good = 0
let bad = 0
for (const line of lines) {
  total++
  try {
    const [day, month, year] = line[0].split("/").map(Number)

    const date = new Date(year, month - 1, day)

    const sale = {
      date: date.toDateString(),
      seller: USERS[line[1] as string],
      captationType: TYPES[line[2]],
      client: line[3],
      saleArea: AREAS[line[4]],
      adverseParty: line[5],
      isRepurchase: REPURCHASES[line[6]],
      campaign: CAMPAIGNS[line[7]],
      indication: line[8] || null,
      description: line[9] || null,
    } // satisfies Sale

    const parsed = newSaleSchema.parse(sale)

    await SalesService.create(parsed)
    good++
  } catch (e) {
    console.log("Linha não inserida: ")
    console.log(line)
    bad++
  }
}

console.log(`Total: ${total} (${good} good, ${bad} bad)`)
