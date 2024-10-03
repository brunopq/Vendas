import * as d3 from "d3"

type HorizontalBarChartProps<T extends { id: string }> = {
  data: T[]
  value: (item: T) => number
  name: (item: T) => string
  markers?: number[]
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

export function HorizontalBarChart<T extends { id: string }>({
  data,
  name,
  value,
  markers = [],
  color,
  colorStops,
  w = 100,
  h = 100,
  m = 0,
}: HorizontalBarChartProps<T>) {
  const x = d3
    .scaleLinear()
    // biome-ignore lint/style/noNonNullAssertion:
    .domain([0, d3.max(data.map(value).concat(markers))!])
    .range([0, w])

  const y = d3
    .scaleBand()
    .range([0, h])
    .domain(data.map(name))
    .paddingInner(0.1)

  const bars = data.map((d, i) => {
    let c: string

    if (color) {
      c = color(d)
    } else if (colorStops) {
      c = `color-mix(in srgb, ${colorStops[0]} ${d3.scaleLinear([0, data.length], [0, 100])(i)}%, ${colorStops[1]})`
    } else throw new Error("unreachable")

    return {
      id: d.id,
      x: 0,
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      y: y(name(d))!,
      w: x(value(d)),
      h: y.bandwidth(),
      c: c,
      name: name(d),
      value: value(d),
    }
  })

  const marks = markers.map((m) => {
    return {
      x: x(m),
      label: m,
    }
  })

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <title>hello</title>

      {marks.map((m) => (
        <line
          key={m.label}
          x1={m.x}
          x2={m.x}
          y1={0}
          y2={h}
          stroke="#000000"
          strokeOpacity={0.4}
          strokeWidth=".5"
          strokeDasharray="1 1.5"
        />
      ))}

      {bars.map((b) => (
        <g fill={`color-mix(in srgb, ${b.c} 30%, black)`} key={b.id}>
          <rect
            className="rounded"
            rx="1px"
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill={b.c}
          />

          <text
            x={0}
            y={b.y + y.bandwidth() / 2}
            fontSize="30%"
            fontWeight={600}
            dominantBaseline="middle"
          >
            {b.name}
          </text>

          {/* <text
            x={b.w}
            y={b.y + y.bandwidth() / 2}
            dominantBaseline="middle"
            textAnchor="end"
            // x={(b.x || 0) + y.bandwidth() / 2}
            // y={h - b.h}
            // dy="-0.125em"
            fontSize="50%"
            fontWeight={600}
          >{b.value}</text> */}
        </g>
      ))}
    </svg>
  )
}
