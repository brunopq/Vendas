import * as d3 from "d3"
import { format } from "date-fns"

type LineChartProps<T extends { id: string }> = {
  data: T[]
  value: (item: T) => number
  name: (item: T) => Date
  color: string
  w?: number
  h?: number
  m?: number
}

export function LineChart<T extends { id: string }>({
  data,
  value,
  name,
  color,
  w = 200,
  h = 100,
}: LineChartProps<T>) {
  const x = d3
    .scaleTime()
    .range([0, w])
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    .domain([d3.min(data.map(name))!, d3.max(data.map(name))!])

  const y = d3
    .scaleLinear()
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    .domain([0, d3.max(data.map(value))!])
    .range([h * 0.95, 0])

  const line = d3
    .line<T>()
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    .x((t) => x(name(t))!)
    .y((t) => y(value(t)))
  // .curve(d3.curveCatmullRom.alpha(0.2))

  const path = line(data)

  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={path || ""}
        stroke={color}
        fill="none"
      />

      {x.ticks(5).map((t) => (
        <g key={t.toDateString()} className="pointer-events-none">
          <line
            x1={x(t)}
            x2={x(t)}
            y1={0}
            y2={h * 0.95}
            stroke="#000000"
            strokeOpacity={0.2}
            strokeWidth=".5"
            strokeDasharray="1 1.5"
          />
          <text x={x(t)} y={h} textAnchor="middle" fontSize="25%">
            {format(t, "dd/MM/yyyy")}
          </text>
        </g>
      ))}
    </svg>
  )
}
