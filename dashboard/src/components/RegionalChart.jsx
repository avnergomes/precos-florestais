import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import { formatCurrency, formatNumber } from '../utils/format';
import { ArrowUpDown } from 'lucide-react';

export default function RegionalChart({ aggregations }) {
  const [sortBy, setSortBy] = useState('media'); // 'media' or 'count'
  const [sortOrder, setSortOrder] = useState('desc');

  const chartData = useMemo(() => {
    if (!aggregations?.byRegiao) return [];

    return Object.entries(aggregations.byRegiao)
      .filter(([regiao]) => regiao !== 'Média Estado')
      .map(([regiao, data]) => ({
        regiao,
        media: data.media,
        count: data.count
      }))
      .sort((a, b) => {
        const multiplier = sortOrder === 'desc' ? -1 : 1;
        return multiplier * (a[sortBy] - b[sortBy]);
      });
  }, [aggregations, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <p className="text-neutral-500">Sem dados para exibir</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-neutral-200">
          <p className="font-semibold text-neutral-800 mb-2">{label}</p>
          <p className="text-sm text-forest-600">
            Preço Médio: <span className="font-medium">{formatCurrency(data.media)}</span>
          </p>
          <p className="text-sm text-neutral-500">
            Registros: <span className="font-medium">{formatNumber(data.count, 0)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Color scale based on price
  const maxPrice = Math.max(...chartData.map(d => d.media));
  const minPrice = Math.min(...chartData.map(d => d.media));
  const getColor = (price) => {
    const ratio = (price - minPrice) / (maxPrice - minPrice || 1);
    const r = Math.round(74 + ratio * (139 - 74));
    const g = Math.round(124 + ratio * (69 - 124));
    const b = Math.round(35 + ratio * (19 - 35));
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">
          Preços por Região
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => toggleSort('media')}
            className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors
              ${sortBy === 'media' ? 'bg-forest-100 text-forest-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
          >
            Preço
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => toggleSort('count')}
            className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors
              ${sortBy === 'count' ? 'bg-forest-100 text-forest-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
          >
            Registros
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            type="number"
            tickFormatter={(v) => formatCurrency(v, 0)}
            tick={{ fontSize: 11 }}
            stroke="#737373"
          />
          <YAxis
            type="category"
            dataKey="regiao"
            tick={{ fontSize: 11 }}
            stroke="#737373"
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="media" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.media)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
