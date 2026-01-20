import { TrendingUp, TrendingDown, DollarSign, BarChart2, Database } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/format';

export default function KpiCards({ aggregations, filteredData }) {
  if (!aggregations) return null;

  const { precoMedio, precoMin, precoMax, totalRegistros, byCategoria, byProduto } = aggregations;

  // Calculate variation from first to last period
  const periodos = aggregations.periodos;
  let variacao = null;
  if (periodos.length >= 2) {
    const primeiroPreco = aggregations.byPeriodo[periodos[0]]?.media;
    const ultimoPreco = aggregations.byPeriodo[periodos[periodos.length - 1]]?.media;
    if (primeiroPreco && ultimoPreco) {
      variacao = (ultimoPreco - primeiroPreco) / primeiroPreco;
    }
  }

  const cards = [
    {
      label: 'Preço Médio',
      value: formatCurrency(precoMedio),
      icon: DollarSign,
      color: 'from-forest-500 to-forest-600',
      subtext: `Min: ${formatCurrency(precoMin)} | Max: ${formatCurrency(precoMax)}`
    },
    {
      label: 'Total de Registros',
      value: formatNumber(totalRegistros, 0),
      icon: Database,
      color: 'from-wood-500 to-wood-600',
      subtext: `${Object.keys(byProduto).length} produtos diferentes`
    },
    {
      label: 'Variação no Período',
      value: variacao !== null ? `${variacao > 0 ? '+' : ''}${(variacao * 100).toFixed(1)}%` : '-',
      icon: variacao >= 0 ? TrendingUp : TrendingDown,
      color: variacao >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600',
      subtext: periodos.length >= 2 ? `${periodos[0]} a ${periodos[periodos.length - 1]}` : '-'
    },
    {
      label: 'Categorias',
      value: Object.keys(byCategoria).length,
      icon: BarChart2,
      color: 'from-blue-500 to-blue-600',
      subtext: Object.keys(byCategoria).slice(0, 3).join(', ')
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="stat-card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="kpi-label">{card.label}</p>
              <p className="kpi-value mt-1">{card.value}</p>
              <p className="text-xs text-neutral-400 mt-2 truncate" title={card.subtext}>
                {card.subtext}
              </p>
            </div>
            <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} text-white`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
