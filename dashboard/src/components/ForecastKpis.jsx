import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../utils/format';

const MODEL_META = {
  xgboost:       { color: '#ef4444', bg: 'bg-red-100',    text: 'text-red-600',    label: 'XGBoost' },
  lightgbm:      { color: '#8b5cf6', bg: 'bg-purple-100', text: 'text-purple-600', label: 'LightGBM' },
  random_forest: { color: '#f97316', bg: 'bg-orange-100', text: 'text-orange-600', label: 'Random Forest' },
  naive:         { color: '#6b7280', bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Persistencia' },
  linear:        { color: '#3b82f6', bg: 'bg-blue-100',   text: 'text-blue-600',   label: 'Linear' },
  arima:         { color: '#06b6d4', bg: 'bg-cyan-100',   text: 'text-cyan-600',   label: 'ARIMA' },
};

function getMeta(key) {
  return MODEL_META[key] || { color: '#6366f1', bg: 'bg-indigo-100', text: 'text-indigo-600', label: key };
}

export default function ForecastKpis({ modelos = {}, historico = [], horizon = 12 }) {
  const modelKeys = Object.keys(modelos);
  const lastHistorico = historico.length > 0 ? historico[historico.length - 1] : null;
  const currentPrice = lastHistorico?.value || lastHistorico?.valor || 0;

  if (modelKeys.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-100 p-6 text-center text-neutral-400">
        Nenhum modelo de previsao disponivel
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {modelKeys.map(key => {
        const model = modelos[key];
        const meta = getMeta(key);
        const forecasts = model.forecast || model.previsoes || [];
        const firstForecast = forecasts[0]?.value || forecasts[0]?.previsto || 0;
        const lastForecast = forecasts[forecasts.length - 1]?.value || forecasts[forecasts.length - 1]?.previsto || 0;
        const variation = currentPrice > 0 ? ((lastForecast - currentPrice) / currentPrice) * 100 : 0;
        const metrics = model.metrics || model.metricas || {};

        return (
          <div key={key} className="bg-white rounded-xl border border-neutral-100 p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-8 rounded-full" style={{ backgroundColor: meta.color }} />
              <div>
                <h4 className="font-semibold text-neutral-800">{meta.label}</h4>
                <p className="text-xs text-neutral-400">
                  {forecasts.length} meses de previsao
                </p>
              </div>
            </div>

            {/* Forecast value + variation */}
            <div className="mb-4">
              <p className="text-xs text-neutral-500 mb-1">Previsao final</p>
              <p className="text-xl font-bold" style={{ color: meta.color }}>
                {formatCurrency(lastForecast)}
              </p>
              <p className={`text-sm flex items-center gap-1 ${variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {variation >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {variation >= 0 ? '+' : ''}{variation.toFixed(1)}% vs. atual
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-1.5 border-t border-neutral-100 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">MAE:</span>
                <span className="font-medium">
                  {metrics.mae != null && metrics.mae > 0 ? formatCurrency(metrics.mae) : '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">RMSE:</span>
                <span className="font-medium">
                  {metrics.rmse != null && metrics.rmse > 0 ? formatCurrency(metrics.rmse) : '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">MAPE:</span>
                <span className="font-medium">
                  {metrics.mape != null && metrics.mape > 0
                    ? `${(metrics.mape * 100).toFixed(1)}%`
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
