import { useMemo } from 'react'
import * as d3 from 'd3'

const MARGIN = { top: 20, right: 60, bottom: 20, left: 180 }

const CATEGORY_COLORS = {
  'Toras': '#15803d',
  'Madeira Serrada': '#166534',
  'Energia': '#ea580c',
  'Cavacos': '#0284c7',
  'Mudas': '#059669',
  'PFNM': '#7c3aed',
  'Sementes': '#ca8a04',
  'Residuos': '#64748b',
  'Produtos Beneficiados': '#be185d'
}

export default function LollipopChart({
  data,
  title = "Ranking de Produtos por Preco",
  width = 550,
  height = 500,
  limit = 15,
  onProdutoClick
}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    // Sort by price and take top N
    const sorted = [...data]
      .filter(d => d.preco_medio > 0)
      .sort((a, b) => b.preco_medio - a.preco_medio)
      .slice(0, limit)

    if (sorted.length === 0) return null

    const maxValue = Math.max(...sorted.map(d => d.preco_medio))

    return { items: sorted, maxValue }
  }, [data, limit])

  if (!chartData) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-dark-700 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-dark-400">
          Sem dados disponiveis
        </div>
      </div>
    )
  }

  const { items, maxValue } = chartData
  const innerWidth = width - MARGIN.left - MARGIN.right
  const innerHeight = height - MARGIN.top - MARGIN.bottom

  const xScale = d3.scaleLinear()
    .domain([0, maxValue * 1.1])
    .range([0, innerWidth])

  const yScale = d3.scaleBand()
    .domain(items.map(d => d.produto))
    .range([0, innerHeight])
    .padding(0.35)

  const formatValue = (v) => {
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}K`
    return `R$ ${v.toFixed(2)}`
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-dark-700 mb-4">{title}</h3>

      <svg width={width} height={height}>
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {/* Grid lines */}
          {xScale.ticks(5).map((tick, i) => (
            <line
              key={i}
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={0}
              y2={innerHeight}
              stroke="#e2e8f0"
              strokeDasharray="4,4"
            />
          ))}

          {/* X axis labels */}
          {xScale.ticks(5).map((tick, i) => (
            <text
              key={i}
              x={xScale(tick)}
              y={innerHeight + 15}
              textAnchor="middle"
              fill="#64748b"
              fontSize={10}
            >
              {formatValue(tick)}
            </text>
          ))}

          {/* Lollipops */}
          {items.map((item, i) => {
            const y = yScale(item.produto) + yScale.bandwidth() / 2
            const xEnd = xScale(item.preco_medio)
            const color = CATEGORY_COLORS[item.categoria] || '#64748b'

            return (
              <g
                key={item.produto}
                className="group cursor-pointer"
                onClick={() => onProdutoClick?.(item)}
              >
                {/* Hover background */}
                <rect
                  x={-MARGIN.left}
                  y={yScale(item.produto) - 2}
                  width={innerWidth + MARGIN.left + MARGIN.right}
                  height={yScale.bandwidth() + 4}
                  fill="#f1f5f9"
                  fillOpacity={0}
                  className="group-hover:fill-opacity-100 transition-all"
                />

                {/* Line */}
                <line
                  x1={0}
                  x2={xEnd}
                  y1={y}
                  y2={y}
                  stroke={color}
                  strokeWidth={2}
                />

                {/* Circle */}
                <circle
                  cx={xEnd}
                  cy={y}
                  r={7}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                >
                  <title>
                    {`${item.produto}\nCategoria: ${item.categoria}\nPreco: ${formatValue(item.preco_medio)}`}
                  </title>
                </circle>

                {/* Value label on hover */}
                <text
                  x={xEnd + 12}
                  y={y}
                  alignmentBaseline="middle"
                  fill="#334155"
                  fontSize={11}
                  fontFamily="monospace"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {formatValue(item.preco_medio)}
                </text>

                {/* Y axis label */}
                <text
                  x={-8}
                  y={y}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  fill="#334155"
                  fontSize={10}
                >
                  {item.produto.length > 25 ? item.produto.slice(0, 22) + '...' : item.produto}
                </text>

                {/* Category dot */}
                <circle
                  cx={-MARGIN.left + 10}
                  cy={y}
                  r={4}
                  fill={color}
                />
              </g>
            )
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {Object.entries(CATEGORY_COLORS).slice(0, 5).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-dark-600">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
