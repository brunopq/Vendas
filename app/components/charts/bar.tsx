import * as d3 from "d3"

type BarChartProps<T extends { id: string }> = {
  data: T[]
  value: (item: T) => number
  name: (item: T) => string
  w?: number
  h?: number
  m?: number
} & (
  | {
      color: (el: T) => string
      colorStops?: never
    }
  | {
      color?: never
      colorStops: [string, string]
    }
)

export function BarChart<T extends { id: string }>({
  data,
  name,
  value,
  color,
  colorStops,
  w = 100,
  h = 100,
  m = 0,
}: BarChartProps<T>) {
  const x = d3
    .scaleBand()
    .range([0, w])
    .domain(data.map(name))
    .paddingInner(0.1)

  const y = d3
    .scaleLinear()
    // biome-ignore lint/style/noNonNullAssertion:
    .domain([0, d3.max(data.map(value))!])
    .range([h, 0])

  const bars = data.map((d, i) => {
    let c: string

    if (color) {
      c = color(d)
    } else if (colorStops) {
      c = `color-mix(in srgb, ${colorStops[0]} ${d3.scaleLinear([0, data.length], [0, 100])(i)}%, ${colorStops[1]})`
    } else throw new Error("unreachable")

    return {
      id: d.id,
      x: x(name(d)),
      y: y(value(d)),
      w: x.bandwidth(),
      h: h - y(value(d)),
      c: c,
      name: name(d),
      value: value(d),
    }
  })

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <title>hello</title>

      {bars.map((b) => (
        <g fill={`color-mix(in srgb, ${b.c} 30%, black)`} key={b.id}>
          <rect
            className="rounded"
            rx="4px"
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill={b.c}
          />

          <text
            x={(b.x || 0) + x.bandwidth() / 2}
            y={h - 2}
            fontSize="30%"
            fontWeight={600}
            textAnchor="middle"
          >
            {b.name}
          </text>

          <text
            x={(b.x || 0) + x.bandwidth() / 2}
            y={h - b.h}
            dy="-0.125em"
            fontSize="50%"
            fontWeight={600}
            textAnchor="middle"
          >
            {b.value}
          </text>
        </g>
      ))}
    </svg>
  )
}
