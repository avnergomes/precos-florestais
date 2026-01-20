import { useMemo, useState, useEffect } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area
} from 'recharts';
import { formatCurrency, formatPeriod } from '../utils/format';

function buildForecastKey(filters) {
  const ano = '*';
  const regiao = filters?.regioes?.length ? filters.regioes[0] : '*';
  const categoria = filters?.categorias?.length ? filters.categorias[0] : '*';
  const subcategoria = filters?.subcategorias?.length && categoria !== '*'
    ? filters.subcategorias[0]
    : '*';
  const produto = filters?.produtos?.length && subcategoria !== '*'
    ? filters.produtos[0]
    : '*';

  return `ano=${ano}|regiao=${regiao}|categoria=${categoria}|subcategoria=${subcategoria}|produto=${produto}`;
}

export default function ForecastPanel({ data, filters, forecasts }) {
  const [modelId, setModelId] = useState('xgboost');
  const [horizonMode, setHorizonMode] = useState('target');

  const series = useMemo(() => {
    try {
      if (!data || data.length === 0) return [];
      let working = data;
      if (filters?.regioes?.length) {
        working = working.filter(d => d && filters.regioes.includes(d.regiao));
      }
      if (filters?.categorias?.length) {
        working = working.filter(d => d && filters.categorias.includes(d.categoria));
      }
      if (filters?.subcategorias?.length) {
        working = working.filter(d => d && filters.subcategorias.includes(d.subcategoria));
      }
      if (filters?.produtos?.length) {
        working = working.filter(d => d && filters.produtos.includes(d.produto));
      }
      // Filter out records with invalid preco or periodo
      working = working.filter(d => d && d.periodo && typeof d.preco === 'number' && !isNaN(d.preco));
      if (!working.length) return [];
      const grouped = {};
      working.forEach(d => {
        if (!grouped[d.periodo]) {
          grouped[d.periodo] = { sum: 0, count: 0 };
        }
        grouped[d.periodo].sum += d.preco;
        grouped[d.periodo].count += 1;
      });
      return Object.entries(grouped)
        .map(([periodo, info]) => ({
          periodo,
          value: info.count > 0 ? info.sum / info.count : 0
        }))
        .filter(item => item.value !== 0 && !isNaN(item.value))
        .sort((a, b) => a.periodo.localeCompare(b.periodo));
    } catch (err) {
      console.error('Error computing series:', err);
      return [];
    }
  }, [data, filters]);

  const forecastKey = useMemo(() => buildForecastKey(filters), [filters]);
  const forecastEntry = forecasts?.series?.[forecastKey] || null;
  const modelMeta = forecasts?.meta?.models || {};

  const availableModels = useMemo(() => {
    if (!forecastEntry) return [];
    return Object.keys(forecastEntry.models || {});
  }, [forecastEntry]);

  useEffect(() => {
    if (!availableModels.length) return;
    if (!availableModels.includes(modelId)) {
      setModelId(availableModels[0]);
    }
  }, [availableModels, modelId]);

  const modelData = forecastEntry?.models?.[modelId] || null;
  const fullForecast = modelData?.forecast || [];
  const horizonValue = horizonMode === 'target' ? fullForecast.length : Number(horizonMode);
  const forecastSlice = fullForecast.slice(0, Math.max(horizonValue, 0));
  const targetPeriod = forecastSlice.length ? forecastSlice[forecastSlice.length - 1].period : null;

  const chartData = useMemo(() => {
    try {
      if (!series.length) return [];
      const lastItem = series[series.length - 1];
      if (!lastItem) return [];
      const lastPeriod = lastItem.periodo;
      const lastValue = lastItem.value;
      const historyRows = series.map(row => ({
        periodo: row?.periodo || '',
        historico: row?.value ?? null,
        forecastLine: row?.periodo === lastPeriod ? lastValue : null
      }));
      const forecastRows = (forecastSlice || []).map(point => {
        if (!point) return null;
        const upper = point.upper ?? point.value;
        const lower = point.lower ?? point.value;
        return {
          periodo: point.period || '',
          previsao: point.value ?? null,
          forecastLine: point.value ?? null,
          ciLower: lower,
          ciUpper: upper,
          ciBand: (upper - lower) || 0
        };
      }).filter(Boolean);
      return [...historyRows, ...forecastRows];
    } catch (err) {
      console.error('Error computing chartData:', err);
      return [];
    }
  }, [series, forecastSlice]);

  const trendInfo = useMemo(() => {
    try {
      if (!series.length || !forecastSlice.length) return null;
      if (series.length < 2) return null;
      const windowSize = Math.min(12, series.length - 1);
      const baseIndex = series.length - 1 - windowSize;
      if (baseIndex < 0 || !series[baseIndex]) return null;
      const base = series[baseIndex].value;
      if (base === undefined || base === null || isNaN(base)) return null;
      const lastForecast = forecastSlice[forecastSlice.length - 1];
      const projected = lastForecast?.value;
      if (projected === undefined || projected === null || isNaN(projected)) return null;
      const delta = projected - base;
      const pct = base ? delta / base : null;
      let label = 'Estavel';
      if (base) {
        if (delta > base * 0.01) label = 'Alta';
        if (delta < -base * 0.01) label = 'Queda';
      }
      return { label, pct, windowSize, base, projected };
    } catch (err) {
      console.error('Error computing trendInfo:', err);
      return null;
    }
  }, [series, forecastSlice]);

  if (!forecasts) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <p className="text-neutral-500">Carregando previsoes...</p>
      </div>
    );
  }

  if (!series.length) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <p className="text-neutral-500">Sem dados suficientes para previsao</p>
      </div>
    );
  }

  if (!forecastEntry || !availableModels.length) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <p className="text-neutral-500">Sem previsao para o filtro selecionado</p>
      </div>
    );
  }

  const ForecastDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload || payload.periodo !== targetPeriod) return null;
    return <circle cx={cx} cy={cy} r={4} fill="#1F6FEB" />;
  };

  const metrics = modelData?.metrics || {};
  const lastForecast = forecastSlice[forecastSlice.length - 1] || null;

  return (
    <div className="space-y-6">
      <div className="chart-container">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-800">Previsao do proximo periodo</h3>
            <p className="text-sm text-neutral-500">
              Intervalo de confianca baseado nos residuos do modelo
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">Modelo</label>
              <select
                className="px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
              >
                {availableModels.map(id => (
                  <option key={id} value={id}>
                    {modelMeta[id]?.label || id}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">Horizonte</label>
              <select
                className="px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                value={horizonMode}
                onChange={(e) => setHorizonMode(e.target.value)}
              >
                <option value="6">6 meses</option>
                <option value="12">12 meses</option>
                <option value="18">18 meses</option>
                <option value="24">24 meses</option>
                <option value="36">36 meses</option>
                <option value="target">Ate Nov/2026</option>
              </select>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <pattern id="ciHatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#93C5FD" strokeWidth="2" />
              </pattern>
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
            <Tooltip
              formatter={(value, name) => {
                if (name === 'ciUpper') return [formatCurrency(value), 'IC superior'];
                if (name === 'ciLower') return [formatCurrency(value), 'IC inferior'];
                if (name === 'forecastLine' || name === 'previsao') return [formatCurrency(value), 'Previsao'];
                return [formatCurrency(value), 'Historico'];
              }}
              labelFormatter={(label) => `Periodo: ${formatPeriod(label)}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="ciLower"
              stackId="ci"
              stroke="none"
              fill="transparent"
              connectNulls={false}
              name="IC inferior"
            />
            <Area
              type="monotone"
              dataKey="ciBand"
              stackId="ci"
              stroke="none"
              fill="url(#ciHatch)"
              fillOpacity={0.45}
              connectNulls={false}
              name="Intervalo de confianca"
            />
            <Line
              type="monotone"
              dataKey="historico"
              stroke="#4A7C23"
              strokeWidth={2}
              dot={false}
              name="Historico"
            />
            <Line
              type="monotone"
              dataKey="forecastLine"
              stroke="#1F6FEB"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={<ForecastDot />}
              connectNulls={true}
              name="Previsao"
            />
            <Line
              type="monotone"
              dataKey="ciUpper"
              stroke="#93C5FD"
              strokeDasharray="4 4"
              dot={false}
              name="IC superior"
            />
            <Line
              type="monotone"
              dataKey="ciLower"
              stroke="#93C5FD"
              strokeDasharray="4 4"
              dot={false}
              name="IC inferior"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-100 p-4">
          <p className="text-sm text-neutral-500">Previsao</p>
          <p className="text-2xl font-semibold text-neutral-800">
            {lastForecast ? formatCurrency(lastForecast.value) : '-'}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {lastForecast ? `IC: ${formatCurrency(lastForecast.lower)} - ${formatCurrency(lastForecast.upper)}` : ''}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 p-4">
          <p className="text-sm text-neutral-500">MAE (teste)</p>
          <p className="text-2xl font-semibold text-neutral-800">
            {metrics.mae ? formatCurrency(metrics.mae) : '-'}
          </p>
          <p className="text-xs text-neutral-400 mt-1">Erro medio absoluto</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 p-4">
          <p className="text-sm text-neutral-500">RMSE / MAPE</p>
          <p className="text-2xl font-semibold text-neutral-800">
            {metrics.rmse ? formatCurrency(metrics.rmse) : '-'}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {metrics.mape ? `${(metrics.mape * 100).toFixed(1)}% MAPE` : 'MAPE indisponivel'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 p-4">
        <p className="text-sm text-neutral-500">Tendencia com previsao</p>
        <p className="text-2xl font-semibold text-neutral-800">
          {trendInfo ? trendInfo.label : '-'}
        </p>
        <p className="text-sm text-neutral-500 mt-1">
          {trendInfo?.pct !== null
            ? `${(trendInfo.pct * 100).toFixed(1)}% em ${trendInfo.windowSize} periodos`
            : 'Sem base para tendencia'}
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          {trendInfo
            ? `Base: ${formatCurrency(trendInfo.base)} | Previsto: ${formatCurrency(trendInfo.projected)}`
            : ''}
        </p>
      </div>
    </div>
  );
}
