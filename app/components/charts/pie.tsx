import * as d3 from "d3"
import { useEffect, useMemo, useState } from "react"

type Arc<T> = {
  angles: d3.PieArcDatum<T>
  id: string
  value: number
  color: string
  name: string
}

type BaseT = { id: string }

type GraphProps<T extends BaseT> = {
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
// `color` or `colorStops` must be present, not both nor neither

export function PieChart<T extends BaseT>({
  data,
  value,
  name,
  color,
  colorStops,
  h = 100,
  w = 100,
  m = 0,
}: GraphProps<T>) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const totalValue = useMemo(
    () => data.reduce((acc, d) => acc + value(d), 0),
    [data, value],
  )

  const treatedData = data.filter((d) => value(d) > 0)
  const r = Math.min(w, h) / 2 - m

  const pie = d3.pie<T>().sort(null).value(value).padAngle(0.03)

  const angles = pie(treatedData)

  const arcs: Arc<T>[] = angles.map((d, i) => {
    let c: string

    if (color) {
      c = color(d.data)
    } else if (colorStops) {
      c = `color-mix(in srgb, ${colorStops[0]} ${d3.scaleLinear([0, angles.length], [0, 100])(i)}%, ${colorStops[1]})`
    } else throw new Error("unreachable")

    return {
      angles: d,
      id: d.data.id,
      value: value(d.data),
      color: c,
      name: name(d.data),
    }
  })

  const hoveredArc = arcs.find((a) => a.id === hoveredId)

  const arcGenerator = d3
    .arc<d3.PieArcDatum<T>>()
    .innerRadius(r / 2)
    .outerRadius(r)

  return (
    <>
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
      <svg viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        <InnerText {...{ hoveredArc, totalValue, r }} />

        <g transform={`translate(${w / 2}, ${h / 2})`}>
          {arcs.map((d) => (
            <GraphSection
              arcGenerator={arcGenerator}
              key={d.id}
              arc={d}
              setHoveredId={setHoveredId}
            />
          ))}
        </g>
      </svg>
    </>
  )
}

type GraphSectionProps<T> = {
  arcGenerator: d3.Arc<unknown, d3.PieArcDatum<T>>
  arc: Arc<T>
  setHoveredId: (id: string | null) => void
}

function GraphSection<T extends BaseT>({
  arc,
  setHoveredId,
  arcGenerator,
}: GraphSectionProps<T>) {
  const path = arcGenerator({
    ...arc.angles,
  })

  if (!path) {
    console.log("shit")
    return null
  }

  return (
    <path
      onMouseEnter={() => setHoveredId(arc.id)}
      onMouseLeave={() => setHoveredId(null)}
      key={arc.id}
      d={path}
      className="transition-transform hover:scale-105"
      fill={arc.color}
    />
  )
}

type InnerTextProps = {
  hoveredArc?: Arc<unknown>
  totalValue: number
  r: number
}
function InnerText({ hoveredArc, totalValue, r }: InnerTextProps) {
  const [prevLabel, setPrevLabel] = useState(hoveredArc?.name)

  useEffect(() => {
    if (hoveredArc) {
      setPrevLabel(hoveredArc.name)
    }
  }, [hoveredArc])

  return (
    <g
      textAnchor="middle"
      dominantBaseline="middle"
      className="font-display font-semibold transition-[fill]"
      style={{
        fontSize: `${r * 0.7}%`,
        fill: hoveredArc ? hoveredArc.color : "rgb(var(--primary-300))",
      }}
    >
      <text x="50%" y="50%">
        {hoveredArc && (
          <tspan dy="-0.6em" x="50%">
            {prevLabel}
          </tspan>
        )}
        <tspan dy={hoveredArc && "1.2em"} x="50%">
          {hoveredArc ? hoveredArc.value : totalValue}
        </tspan>
      </text>
    </g>
  )
}
