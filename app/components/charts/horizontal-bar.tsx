import * as d3 from "d3"
import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ClientOnly } from "remix-utils/client-only"
import { cn } from "~/lib/utils"

type HorizontalBarChartProps<T extends { id: string }> = {
  data: T[]
  value: (item: T) => number
  name: (item: T) => string
  markerFormat: (m: number) => string
  markers?: number[]
  renderTooltip?: (item: T) => JSX.Element
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
  markerFormat,
  color,
  colorStops,
  renderTooltip,
  w = 100,
  h = 100,
  m = 0,
}: HorizontalBarChartProps<T>) {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  // biome-ignore lint/complexity/noUselessFragments: not useless
  const [tooltipContent, setTooltipContent] = useState(<></>)

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
      item: d,
    }
  })

  const marks = markers.map((m) => {
    return {
      x: x(m),
      label: m,
    }
  })

  const handlePointerOver = (item: T) => {
    if (!renderTooltip) {
      return
    }
    setTooltipVisible(true)
    setTooltipContent(renderTooltip(item))
  }

  const handlePointerOut = () => {
    setTooltipVisible(false)
  }

  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      {<Tooltip open={tooltipVisible}>{tooltipContent}</Tooltip>}

      {bars.map((b) => (
        <g fill={`color-mix(in srgb, ${b.c} 30%, black)`} key={b.id}>
          <rect
            onPointerOver={() => handlePointerOver(b.item)}
            onPointerOut={handlePointerOut}
            className="rounded"
            rx="1px"
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill={b.c}
          />

          <text
            onPointerOver={() => handlePointerOver(b.item)}
            onPointerOut={handlePointerOut}
            x={0}
            y={b.y + y.bandwidth() / 2}
            fontSize="30%"
            fontWeight={600}
            dominantBaseline="middle"
          >
            {b.name}
          </text>
        </g>
      ))}

      {marks.map((m) => (
        <g key={m.label} className="pointer-events-none">
          <line
            x1={m.x}
            x2={m.x}
            y1={0}
            y2={h}
            stroke="#000000"
            strokeOpacity={0.2}
            strokeWidth=".5"
            strokeDasharray="1 1.5"
          />
          <text x={m.x} y={h} textAnchor="middle" fontSize="20%">
            {markerFormat(m.label)}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Tooltip({ children, open }: { children: JSX.Element; open: boolean }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleUpdate = useCallback(
    (e: MouseEvent) => {
      if (open) {
        setPos({
          x: e.pageX,
          y: e.pageY,
        })
      }
    },
    [open],
  )

  useEffect(() => {
    window.addEventListener("mousemove", handleUpdate)

    return () => window.removeEventListener("mousemove", handleUpdate)
  }, [handleUpdate])

  return (
    <ClientOnly>
      {() =>
        createPortal(
          <div
            data-open={open}
            className={cn(
              "-translate-x-1/2 pointer-events-none absolute z-20 rounded border border-zinc-300 bg-zinc-100/50 p-2 backdrop-blur-lg",
              "-translate-y-[calc(100%-0.25rem)] data-[open=true]:-translate-y-[calc(100%+0.5rem)] scale-90 opacity-0 transition-[opacity,transform] data-[open=true]:scale-100 data-[open=true]:opacity-100",
            )}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
            }}
          >
            {children}
          </div>,
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          document.getElementById("portal")!,
        )
      }
    </ClientOnly>
  )
}
