import { Download } from 'lucide-react';
import { formatCurrency, formatPeriod } from '../utils/format';

const MODEL_LABELS = {
  xgboost: 'XGBoost',
  lightgbm: 'LightGBM',
  random_forest: 'Random Forest',
  naive: 'Persistencia',
  linear: 'Linear',
  arima: 'ARIMA',
};

const MODEL_COLORS = {
  xgboost: 'text-red-600',
  lightgbm: 'text-purple-600',
  random_forest: 'text-orange-600',
  naive: 'text-gray-600',
  linear: 'text-blue-600',
  arima: 'text-cyan-600',
};

export default function ForecastTable({
  modelos = {},
  title = 'Previsoes detalhadas',
}) {
  const modelKeys = Object.keys(modelos).filter(k => {
    const forecasts = modelos[k]?.forecast || modelos[k]?.previsoes || [];
    return forecasts.length > 0;
  });

  // Merge all forecasts by date
  const forecastMap = {};

  modelKeys.forEach(key => {
    const previsoes = modelos[key]?.forecast || modelos[key]?.previsoes || [];
    previsoes.forEach(item => {
      const period = item.period || item.data;
      if (!forecastMap[period]) {
        forecastMap[period] = { periodo: period };
      }
      forecastMap[period][key] = item.value || item.previsto;
      const lower = item.lower || item.ic_inferior;
      const upper = item.upper || item.ic_superior;
      forecastMap[period][`${key}_ic`] = `${formatCurrency(lower)} - ${formatCurrency(upper)}`;
    });
  });

  const forecasts = Object.values(forecastMap).sort(
    (a, b) => a.periodo.localeCompare(b.periodo)
  );

  const exportCSV = () => {
    const headers = ['Periodo'];
    modelKeys.forEach(key => {
      const label = MODEL_LABELS[key] || key;
      headers.push(label, `IC 95% ${label}`);
    });

    const rows = forecasts.map(f => {
      const row = [f.periodo];
      modelKeys.forEach(key => {
        row.push(f[key]?.toFixed(2) || '', f[`${key}_ic`] || '');
      });
      return row;
    });

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'previsoes_florestais.csv';
    link.click();
  };

  if (forecasts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-100 p-6">
        <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
        <div className="text-center text-neutral-400 py-8">
          Nenhuma previsao disponivel
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Periodo</th>
              {modelKeys.map(key => (
                <th key={key} className={`px-4 py-3 text-right text-sm font-medium ${MODEL_COLORS[key] || 'text-neutral-600'}`}>
                  {MODEL_LABELS[key] || key}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-sm font-medium text-neutral-500">IC 95%</th>
            </tr>
          </thead>
          <tbody>
            {forecasts.map(forecast => (
              <tr key={forecast.periodo} className="border-b border-neutral-50 hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-800">
                  {formatPeriod(forecast.periodo)}
                </td>
                {modelKeys.map(key => (
                  <td key={key} className={`px-4 py-3 text-right font-medium ${MODEL_COLORS[key] || ''}`}>
                    {forecast[key] != null ? formatCurrency(forecast[key]) : '-'}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-neutral-400 text-sm">
                  {modelKeys.map(k => forecast[`${k}_ic`]).find(v => v) || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
