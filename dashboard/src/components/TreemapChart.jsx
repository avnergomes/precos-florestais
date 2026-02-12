import { useMemo, useState } from 'react'
import * as d3 from 'd3'

const CATEGORY_COLORS = {
  'Toras': '#15803d',
  'Madeira Serrada': '#166534',
  'Energia': '#ea580c',
  'Cavacos': '#0284c7',
  'Mudas': '#059669',
  'PFNM': '#7c3aed',
  'Sementes': '#ca8a04',
  'Residuos': '#64748b',
  'Produtos Beneficiados': '#be185d',
  'Custos Operacionais': '#475569'
}

export default function TreemapChart({
  data,
  title = "Hierarquia de Produtos Florestais",
  width = 800,
  height = 500,
  onCategoriaClick
}) {
  const [hoveredId, setHoveredId] = useState(null)

  const chartData = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return null

    // Build hierarchy: categoria > subcategoria > produto
    const root = { name: 'Produtos', children: [] }

    Object.entries(data).forEach(([categoria, subcats]) => {
      if (typeof subcats !== 'object') return

      const catNode = { name: categoria, children: [] }

      Object.entries(subcats).forEach(([subcat, produtos]) => {
        if (!Array.isArray(produtos)) return

        const subcatNode = {
          name: subcat,
          categoria,
          children: produtos.map(p => ({
            name: typeof p === 'string' ? p : p.produto || p.name,
            categoria,
            subcategoria: subcat,
            value: 1 // Equal weight for products
          }))
        }

        if (subcatNode.children.length > 0) {
          catNode.children.push(subcatNode)
        }
      })

      if (catNode.children.length > 0) {
        root.children.push(catNode)
      }
    })

    if (root.children.length === 0) return null

    // Create hierarchy
    const hierarchy = d3.hierarchy(root)
      .sum(d => d.value || 0)
      .sort((a, b) => b.value - a.value)

    // Create treemap layout
    const treemap = d3.treemap()
      .size([width, height])
      .padding(2)
      .paddingTop(20)
      .round(true)

    return treemap(hierarchy)
  }, [data, width, height])

  if (!chartData) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-dark-700 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-dark-400">
          Sem dados de hierarquia disponiveis
        </div>
      </div>
    )
  }

  // Get leaf nodes (products)
  const leaves = chartData.leaves()

  // Get category nodes (depth 1)
  const categories = chartData.children || []

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-dark-700 mb-4">{title}</h3>

      <svg width={width} height={height} className="mx-auto">
        {/* Category backgrounds */}
        {categories.map((cat, i) => {
          const color = CATEGORY_COLORS[cat.data.name] || '#64748b'
          return (
            <g key={`cat-${i}`}>
              <rect
                x={cat.x0}
                y={cat.y0}
                width={cat.x1 - cat.x0}
                height={cat.y1 - cat.y0}
                fill={color}
                fillOpacity={0.1}
                stroke={color}
                strokeWidth={2}
                className="cursor-pointer"
                onClick={() => onCategoriaClick?.(cat.data.name)}
              />
              {/* Category label */}
              {(cat.x1 - cat.x0) > 60 && (
                <text
                  x={cat.x0 + 5}
                  y={cat.y0 + 14}
                  fill={d3.color(color).darker(1).toString()}
                  fontSize={11}
                  fontWeight="600"
                >
                  {cat.data.name}
                </text>
              )}
            </g>
          )
        })}

        {/* Leaf rectangles */}
        {leaves.map((leaf, i) => {
          const w = leaf.x1 - leaf.x0
          const h = leaf.y1 - leaf.y0
          const categoria = leaf.data.categoria || leaf.parent?.parent?.data.name
          const color = CATEGORY_COLORS[categoria] || '#64748b'
          const isHovered = hoveredId === i

          return (
            <g key={`leaf-${i}`}>
              <rect
                x={leaf.x0}
                y={leaf.y0}
                width={w}
                height={h}
                fill={color}
                fillOpacity={isHovered ? 0.9 : 0.6}
                stroke="white"
                strokeWidth={1}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredId(i)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <title>
                  {`${categoria} > ${leaf.data.subcategoria || leaf.parent?.data.name} > ${leaf.data.name}`}
                </title>
              </rect>

              {/* Product label */}
              {w > 40 && h > 20 && (
                <text
                  x={leaf.x0 + w / 2}
                  y={leaf.y0 + h / 2}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill="white"
                  fontSize={Math.min(10, w / 8)}
                  className="pointer-events-none"
                >
                  {leaf.data.name.length > w / 6
                    ? leaf.data.name.slice(0, Math.floor(w / 7)) + '...'
                    : leaf.data.name}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {Object.entries(CATEGORY_COLORS).slice(0, 6).map(([cat, color]) => (
          <div
            key={cat}
            className="flex items-center gap-2 cursor-pointer hover:bg-dark-50 px-2 py-1 rounded"
            onClick={() => onCategoriaClick?.(cat)}
          >
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
            <span className="text-xs text-dark-600">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
