import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { formatCurrency, formatPeriod } from '../utils/format';

const MODEL_STYLES = {
  xgboost:       { color: '#ef4444', label: 'XGBoost' },
  lightgbm:      { color: '#8b5cf6', label: 'LightGBM' },
  random_forest: { color: '#f97316', label: 'Random Forest' },
  naive:         { color: '#6b7280', label: 'Persistencia' },
  linear:        { color: '#3b82f6', label: 'Linear' },
  arima:         { color: '#06b6d4', label: 'ARIMA' },
};

const FALLBACK_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#eab308'];

function getModelStyle(key, index) {
  if (MODEL_STYLES[key]) return MODEL_STYLES[key];
  return {
    color: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    label: key,
  };
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
  return `${monthName}/${year.slice(-2)}`;
}

export default function ForecastChart({
  historico = [],
  modelos = {},
  title = 'Previsao de precos',
  description,
  height = 420,
}) {
  const modelKeys = Object.keys(modelos);
  const [visibleModels, setVisibleModels] = useState(() =>
    Object.fromEntries(modelKeys.map(k => [k, true]))
  );

  // Find best model by lowest MAE (or RMSE)
  const bestModel = useMemo(() => {
    let best = null;
    let bestScore = Infinity;
    for (const key of modelKeys) {
      const mae = modelos[key]?.metrics?.mae;
      if (mae != null && mae < bestScore && mae > 0) {
        bestScore = mae;
        best = key;
      }
    }
    // If no MAE, try RMSE
    if (!best) {
      for (const key of modelKeys) {
        const rmse = modelos[key]?.metrics?.rmse;
        if (rmse != null && rmse < bestScore && rmse > 0) {
          bestScore = rmse;
          best = key;
        }
      }
    }
    // Default to first non-naive model
    if (!best && modelKeys.length > 0) {
      best = modelKeys.find(k => k !== 'naive') || modelKeys[0];
    }
    return best;
  }, [modelos, modelKeys]);

  // Sort model keys (best first, naive last)
  const sortedModelKeys = useMemo(() => {
    return [...modelKeys].sort((a, b) => {
      if (a === bestModel) return -1;
      if (b === bestModel) return 1;
      if (a === 'naive') return 1;
      if (b === 'naive') return -1;
      return 0;
    });
  }, [modelKeys, bestModel]);

  const toggleModel = (key) => {
    setVisibleModels(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Build chart data with bridge point
  const { chartData, lastHistLabel, firstForecastLabel } = useMemo(() => {
    const data = [];

    // Historical points
    historico.forEach(item => {
      data.push({
        data: item.periodo || item.data,
        label: formatDateLabel(item.periodo || item.data),
        historico: item.value || item.valor,
      });
    });

    const lastHist = historico.length > 0 ? historico[historico.length - 1] : null;
    const lastLabel = lastHist ? formatDateLabel(lastHist.periodo || lastHist.data) : null;

    // Bridge: add last historical value as first forecast point for each model
    if (lastHist && data.length > 0) {
      const bridgeEntry = data[data.length - 1];
      for (const key of modelKeys) {
        bridgeEntry[key] = lastHist.value || lastHist.valor;
      }
    }

    let firstFcLabel = null;

    // Forecast points
    modelKeys.forEach(key => {
      const previsoes = modelos[key]?.forecast || modelos[key]?.previsoes || [];
      previsoes.forEach(item => {
        const periodKey = item.period || item.data;
        const lbl = formatDateLabel(periodKey);
        if (!firstFcLabel) firstFcLabel = lbl;
        const existing = data.find(d => d.data === periodKey);
        if (existing) {
          existing[key] = item.value || item.previsto;
          existing[`${key}_lower`] = item.lower || item.ic_inferior;
          existing[`${key}_upper`] = item.upper || item.ic_superior;
          existing[`${key}_range`] = [item.lower || item.ic_inferior, item.upper || item.ic_superior];
        } else {
          const entry = {
            data: periodKey,
            label: lbl,
          };
          entry[key] = item.value || item.previsto;
          entry[`${key}_lower`] = item.lower || item.ic_inferior;
          entry[`${key}_upper`] = item.upper || item.ic_superior;
          entry[`${key}_range`] = [item.lower || item.ic_inferior, item.upper || item.ic_superior];
          data.push(entry);
        }
      });
    });

    data.sort((a, b) => a.data.localeCompare(b.data));

    return {
      chartData: data,
      lastHistLabel: lastLabel,
      firstForecastLabel: firstFcLabel,
    };
  }, [historico, modelos, modelKeys]);

  const lastForecastLabel = chartData.length > 0
    ? chartData[chartData.length - 1].label
    : null;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const dp = payload[0]?.payload;

    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-neutral-200 min-w-[200px]">
        <p className="font-semibold text-neutral-800 mb-2 text-sm">{dp?.label}</p>

        {dp?.historico != null && (
          <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-neutral-200">
            <span className="w-2.5 h-2.5 rounded-full bg-forest-600 shrink-0" />
            <span className="text-sm text-neutral-600">Historico</span>
            <span className="text-sm font-semibold text-neutral-800 ml-auto">{formatCurrency(dp.historico)}</span>
          </div>
        )}

        <div className="space-y-1">
          {sortedModelKeys.map((key, i) => {
            if (dp?.[key] == null || !visibleModels[key]) return null;
            const style = getModelStyle(key, modelKeys.indexOf(key));
            const isBest = key === bestModel;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: style.color }} />
                <span className="text-xs text-neutral-600 truncate">
                  {style.label}
                  {isBest && <span className="text-[10px] font-medium text-amber-600 ml-1">Melhor</span>}
                </span>
                <span className="text-xs font-semibold ml-auto" style={{ color: style.color }}>
                  {formatCurrency(dp[key])}
                </span>
              </div>
            );
          })}
        </div>

        {/* Show IC for best visible model */}
        {bestModel && visibleModels[bestModel] && dp?.[`${bestModel}_lower`] != null && dp?.[bestModel] != null && (
          <div className="mt-2 pt-1.5 border-t border-neutral-200 text-[10px] text-neutral-400">
            IC 95%: {formatCurrency(dp[`${bestModel}_lower`])} - {formatCurrency(dp[`${bestModel}_upper`])}
          </div>
        )}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-100 p-6">
        <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
        {description && <p className="text-sm text-neutral-500 mb-4">{description}</p>}
        <div className="flex items-center justify-center text-neutral-400" style={{ height: height - 80 }}>
          Sem dados para exibir
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-6">
      <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
      {description && <p className="text-sm text-neutral-500 mb-4">{description}</p>}

      {/* Interactive legend */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Historical chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-xs font-medium text-neutral-700">
          <span className="w-2.5 h-0.5 bg-forest-600 rounded" />
          Historico
        </div>

        {/* Model chips */}
        {modelKeys.map((key, i) => {
          const style = getModelStyle(key, i);
          const active = visibleModels[key];
          const isBest = key === bestModel;
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleModel(key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                ${active
                  ? 'bg-white shadow-sm border border-neutral-200 text-neutral-700'
                  : 'bg-neutral-100 text-neutral-400 border border-transparent'
                }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 transition-opacity"
                style={{
                  backgroundColor: style.color,
                  opacity: active ? 1 : 0.3,
                }}
              />
              {style.label}
              {isBest && active && (
                <span className="text-[10px] font-semibold text-amber-500 ml-0.5">Melhor</span>
              )}
            </button>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
          <defs>
            {modelKeys.map((key, i) => {
              const style = getModelStyle(key, i);
              return (
                <linearGradient key={key} id={`grad_${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={style.color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={style.color} stopOpacity={0.02} />
                </linearGradient>
              );
            })}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

          {/* Forecast zone background */}
          {firstForecastLabel && lastForecastLabel && (
            <ReferenceArea
              x1={firstForecastLabel}
              x2={lastForecastLabel}
              fill="#f8fafc"
              fillOpacity={0.8}
            />
          )}

          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />

          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `R$${v.toFixed(0)}`}
            width={65}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Divider line */}
          {lastHistLabel && (
            <ReferenceLine
              x={lastHistLabel}
              stroke="#cbd5e1"
              strokeDasharray="4 4"
              label={{
                value: 'Previsao',
                position: 'top',
                fill: '#94a3b8',
                fontSize: 10,
                fontWeight: 500,
              }}
            />
          )}

          {/* Confidence interval bands for visible models */}
          {modelKeys.map((key, i) => {
            if (!visibleModels[key]) return null;
            const style = getModelStyle(key, i);
            return (
              <Area
                key={`band_${key}`}
                type="monotone"
                dataKey={`${key}_range`}
                stroke="none"
                fill={style.color}
                fillOpacity={key === bestModel ? 0.1 : 0.05}
                connectNulls
                legendType="none"
                isAnimationActive={false}
              />
            );
          })}

          {/* Historical line */}
          <Line
            type="monotone"
            dataKey="historico"
            stroke="#4A7C23"
            strokeWidth={2.5}
            dot={false}
            connectNulls
            legendType="none"
          />

          {/* Model forecast lines */}
          {modelKeys.map((key, i) => {
            if (!visibleModels[key]) return null;
            const style = getModelStyle(key, i);
            const isBest = key === bestModel;
            return (
              <Line
                key={`line_${key}`}
                type="monotone"
                dataKey={key}
                stroke={style.color}
                strokeWidth={isBest ? 2.5 : 1.5}
                strokeDasharray={isBest ? undefined : '6 3'}
                dot={false}
                connectNulls
                legendType="none"
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
