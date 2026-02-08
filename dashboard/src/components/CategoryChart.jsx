import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Treemap
} from 'recharts';
import { formatCurrency, formatNumber, getCategoryLabel, getCategoryColor } from '../utils/format';
import { BarChart3, PieChartIcon, Grid3X3 } from 'lucide-react';

export default function CategoryChart({ aggregations, filteredData, onCategoriaClick, selectedCategoria }) {
  const [chartType, setChartType] = useState('bar');

  const chartData = useMemo(() => {
    if (!aggregations?.byCategoria) return [];

    return Object.entries(aggregations.byCategoria)
      .map(([categoria, data]) => ({
        categoria,
        name: getCategoryLabel(categoria),
        media: data.media,
        count: data.count,
        totalProdutos: data.totalProdutos,
        color: getCategoryColor(categoria)
      }))
      .sort((a, b) => b.media - a.media);
  }, [aggregations]);

  const treemapData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    // Group by category and subcategory
    const grouped = {};
    filteredData.forEach(d => {
      if (!grouped[d.categoria]) {
        grouped[d.categoria] = {
          name: getCategoryLabel(d.categoria),
          children: {}
        };
      }
      if (!grouped[d.categoria].children[d.subcategoria]) {
        grouped[d.categoria].children[d.subcategoria] = {
          name: d.subcategoria,
          precos: [],
          count: 0
        };
      }
      grouped[d.categoria].children[d.subcategoria].precos.push(d.preco);
      grouped[d.categoria].children[d.subcategoria].count++;
    });

    return Object.entries(grouped).map(([cat, data]) => ({
      name: data.name,
      children: Object.entries(data.children).map(([subcat, subdata]) => ({
        name: subdata.name,
        size: subdata.count,
        media: subdata.precos.reduce((a, b) => a + b, 0) / subdata.precos.length,
        color: getCategoryColor(cat)
      }))
    }));
  }, [filteredData]);

  if (chartData.length === 0) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <p className="text-neutral-500">Sem dados para exibir</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-neutral-200">
          <p className="font-semibold text-neutral-800 mb-2">{data.name}</p>
          <p className="text-sm text-forest-600">
            Preço Médio: <span className="font-medium">{formatCurrency(data.media)}</span>
          </p>
          <p className="text-sm text-neutral-500">
            Registros: <span className="font-medium">{formatNumber(data.count, 0)}</span>
          </p>
          <p className="text-sm text-neutral-500">
            Produtos: <span className="font-medium">{data.totalProdutos}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const TreemapTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-neutral-200">
          <p className="font-semibold text-neutral-800">{data.name}</p>
          {data.media && (
            <p className="text-sm text-forest-600">
              Preço Médio: <span className="font-medium">{formatCurrency(data.media)}</span>
            </p>
          )}
          <p className="text-sm text-neutral-500">
            Registros: <span className="font-medium">{formatNumber(data.size, 0)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomTreemapContent = ({ x, y, width, height, name, color }) => {
    if (width < 40 || height < 30) return null;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: '#fff',
            strokeWidth: 2,
            opacity: 0.85
          }}
        />
        {width > 60 && height > 40 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: Math.min(12, width / 8),
              fill: '#fff',
              fontWeight: 500
            }}
          >
            {name.length > 15 ? name.substring(0, 12) + '...' : name}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">
          Preços por Categoria
        </h3>
        <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded transition-colors ${chartType === 'bar' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'}`}
            title="Gráfico de Barras"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-2 rounded transition-colors ${chartType === 'pie' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'}`}
            title="Gráfico de Pizza"
          >
            <PieChartIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('treemap')}
            className={`p-2 rounded transition-colors ${chartType === 'treemap' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'}`}
            title="Treemap"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        {chartType === 'bar' ? (
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              stroke="#737373"
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v, 0)}
              tick={{ fontSize: 11 }}
              stroke="#737373"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="media"
              radius={[4, 4, 0, 0]}
              onClick={(data) => onCategoriaClick?.(data.categoria)}
              cursor={onCategoriaClick ? 'pointer' : 'default'}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={selectedCategoria && entry.categoria !== selectedCategoria ? 0.4 : 1}
                  stroke={entry.categoria === selectedCategoria ? '#1f2937' : 'none'}
                  strokeWidth={entry.categoria === selectedCategoria ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        ) : chartType === 'pie' ? (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              dataKey="count"
              onClick={(data) => onCategoriaClick?.(data.categoria)}
              cursor={onCategoriaClick ? 'pointer' : 'default'}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={selectedCategoria && entry.categoria !== selectedCategoria ? 0.4 : 1}
                  stroke={entry.categoria === selectedCategoria ? '#1f2937' : 'none'}
                  strokeWidth={entry.categoria === selectedCategoria ? 3 : 0}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        ) : (
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            content={<CustomTreemapContent />}
          >
            <Tooltip content={<TreemapTooltip />} />
          </Treemap>
        )}
      </ResponsiveContainer>

      <p className="text-xs text-center text-neutral-500 mt-3">
        Clique para filtrar por categoria
      </p>
    </div>
  );
}
