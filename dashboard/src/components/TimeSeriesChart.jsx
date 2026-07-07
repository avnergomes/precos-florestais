// ATLAS-A11Y-HEX-SWEPT
import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { formatCurrency, formatPeriod, getCategoryColor, getCategoryLabel, categoricalColor } from '../utils/format';

// Cores de subcategoria vindas da paleta Okabe-Ito (daltonico-segura) de
// chart-palette.js, com indice estavel por ordem de aparicao.
function getSubcategoryColor(subcategoria, index) {
  return categoricalColor(index);
}

// Redundancia nao-cromatica: quando ha mais series do que cores na paleta,
// as series repetidas ganham tracejado distinto.
function getSubcategoryDash(index) {
  if (index < 8) return undefined;
  return index < 16 ? '6 3' : '2 3';
}

export default function TimeSeriesChart({ filteredData, aggregations, showByCategory = false, showBySubcategory = false, title, onAnoClick, selectedAno, onCategoriaClick, selectedCategoria }) {
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    if (showBySubcategory) {
      // Group by period and subcategory
      const grouped = {};
      filteredData.forEach(d => {
        if (!grouped[d.periodo]) {
          grouped[d.periodo] = {};
        }
        if (!grouped[d.periodo][d.subcategoria]) {
          grouped[d.periodo][d.subcategoria] = { precos: [], count: 0 };
        }
        grouped[d.periodo][d.subcategoria].precos.push(d.preco);
        grouped[d.periodo][d.subcategoria].count++;
      });

      return Object.entries(grouped)
        .map(([periodo, subs]) => {
          const row = { periodo };
          Object.entries(subs).forEach(([sub, data]) => {
            row[sub] = data.precos.reduce((a, b) => a + b, 0) / data.precos.length;
          });
          return row;
        })
        .sort((a, b) => a.periodo.localeCompare(b.periodo));
    }

    if (showByCategory) {
      // Group by period and category
      const grouped = {};
      filteredData.forEach(d => {
        if (!grouped[d.periodo]) {
          grouped[d.periodo] = {};
        }
        if (!grouped[d.periodo][d.categoria]) {
          grouped[d.periodo][d.categoria] = { precos: [], count: 0 };
        }
        grouped[d.periodo][d.categoria].precos.push(d.preco);
        grouped[d.periodo][d.categoria].count++;
      });

      return Object.entries(grouped)
        .map(([periodo, cats]) => {
          const row = { periodo };
          Object.entries(cats).forEach(([cat, data]) => {
            row[cat] = data.precos.reduce((a, b) => a + b, 0) / data.precos.length;
          });
          return row;
        })
        .sort((a, b) => a.periodo.localeCompare(b.periodo));
    }

    // Simple average by period
    const { byPeriodo, periodos } = aggregations;
    return periodos.map(periodo => ({
      periodo,
      preco: byPeriodo[periodo]?.media || 0
    }));
  }, [filteredData, aggregations, showByCategory, showBySubcategory]);

  const categories = useMemo(() => {
    if ((!showByCategory && !showBySubcategory) || chartData.length === 0) return [];
    const cats = new Set();
    chartData.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== 'periodo') cats.add(key);
      });
    });
    return Array.from(cats);
  }, [chartData, showByCategory, showBySubcategory]);

  if (chartData.length === 0) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <p className="text-neutral-500">Sem dados para exibir</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-neutral-200">
          <p className="font-semibold text-neutral-800 mb-2">{formatPeriod(label)}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {(showByCategory || showBySubcategory) ? entry.dataKey : 'Preço Médio'}:{' '}
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartTitle = title || (showBySubcategory ? 'Evolução por Subcategoria' : showByCategory ? 'Evolução por Categoria' : 'Evolução dos Preços');

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">
        {chartTitle}
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        {(showByCategory || showBySubcategory) ? (
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="periodo"
              tickFormatter={formatPeriod}
              tick={{ fontSize: 12 }}
              stroke="#737373"
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v, 0)}
              tick={{ fontSize: 12 }}
              stroke="#737373"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => showBySubcategory ? value : getCategoryLabel(value)}
              wrapperStyle={{ fontSize: 12 }}
            />
            {categories.map((cat, index) => (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={showBySubcategory ? getSubcategoryColor(cat, index) : getCategoryColor(cat)}
                strokeWidth={2}
                strokeDasharray={showBySubcategory ? getSubcategoryDash(index) : undefined}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        ) : (
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onClick={(event) => {
              if (event?.activePayload?.[0]?.payload?.periodo && onAnoClick) {
                const ano = parseInt(event.activePayload[0].payload.periodo.split('-')[0]);
                onAnoClick(ano);
              }
            }}
            style={{ cursor: onAnoClick ? 'pointer' : 'default' }}
          >
            <defs>
              <linearGradient id="colorPreco" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4A7C23" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4A7C23" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="periodo"
              tickFormatter={formatPeriod}
              tick={{ fontSize: 12 }}
              stroke="#737373"
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v, 0)}
              tick={{ fontSize: 12 }}
              stroke="#737373"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="preco"
              stroke="#4A7C23"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPreco)"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
      {selectedAno && (
        <p className="text-xs text-center text-forest-600 mt-2 font-medium">
          Ano selecionado: {selectedAno}
        </p>
      )}
      {onAnoClick && !selectedAno && (
        <p className="text-xs text-center text-neutral-500 mt-2">
          Clique no gráfico para filtrar por ano
        </p>
      )}
    </div>
  );
}
