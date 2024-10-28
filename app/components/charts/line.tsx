import * as d3 from "d3"
import { format } from "date-fns"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ClientOnly } from "remix-utils/client-only"
import { cn } from "~/lib/utils"

type LineChartProps<T extends { id: string }> = {
  data: T[]
  value: (item: T) => number
  name: (item: T) => Date
  color: string
  w?: number
  h?: number
  m?: number
}

function dst(x1: number, x2: number, y1: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

export function LineChart<T extends { id: string }>({
  data,
  value,
  name,
  color,
  w = 200,
  h = 100,
}: LineChartProps<T>) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  const handleUpdate = useCallback((e: MouseEvent) => {
    const svg = svgRef.current
    if (!svg) return

    const rec = svg.getBoundingClientRect()

    if (
      rec.x >= e.clientX ||
      e.clientX >= rec.x + rec.width ||
      rec.y >= e.clientY ||
      e.clientY >= rec.y + rec.height
    ) {
      setVisible(false)
      return
    }
    setVisible(true)

    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const { x, y } = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    setPos({
      x,
      y,
    })
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    document.addEventListener("mousemove", handleUpdate, {
      signal: controller.signal,
    })

    return () => controller.abort()
  }, [handleUpdate])

  const x = d3
    .scaleUtc()
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

  let closest: T = data[0]

  for (const d of data) {
    if (
      dst(x(name(d)), pos.x, y(value(d)), pos.y) <
      dst(x(name(closest)), pos.x, y(value(closest)), pos.y)
    ) {
      closest = d
    }
  }
  console.log(closest)

  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={path || ""}
        stroke={color}
        fill="none"
      />

      {visible &&
        data.map((d) => {
          const cx = x(name(d))
          if (!cx) return
          const r = (w - Math.abs(pos.x - cx)) ** 4 / w ** 4
          return (
            <circle
              key={d.id}
              style={{}}
              r={1.5 * r}
              fill="white"
              stroke={color}
              strokeWidth={0.6}
              cx={cx}
              cy={y(value(d))}
            />
          )
        })}

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

      {
        <ClientOnly>
          {() => {
            if (!svgRef.current) return
            const point = svgRef.current.createSVGPoint()
            point.x = x(name(closest))
            point.y = y(value(closest))

            const matrix = svgRef.current.getScreenCTM()
            if (!matrix) return

            const transformedPoint = point.matrixTransform(matrix)

            return createPortal(
              <div
                data-open={visible}
                className={cn(
                  "-translate-x-1/2 pointer-events-none absolute z-20 rounded border border-zinc-300 bg-zinc-100/50 p-2 backdrop-blur-lg",
                  "-translate-y-[calc(100%-0.25rem)] data-[open=true]:-translate-y-[calc(100%+0.5rem)] scale-90 opacity-0 transition-[opacity,transform,left,top] data-[open=true]:scale-100 data-[open=true]:opacity-100",
                )}
                style={{
                  left: `${transformedPoint.x}px`,
                  top: `${transformedPoint.y}px`,
                }}
              >
                <p>{format(name(closest), "dd/MM/yyyy")}</p>
                <p>{value(closest)} vendas</p>
              </div>,
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              document.getElementById("portal")!,
            )
          }}
        </ClientOnly>
      }
    </svg>
  )
}
