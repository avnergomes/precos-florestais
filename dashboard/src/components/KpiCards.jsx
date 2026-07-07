import { TrendingUp, TrendingDown, DollarSign, BarChart2, Database } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/format';

export default function KpiCards({ aggregations, filteredData }) {
  if (!aggregations) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="skeleton h-24 md:h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const { precoMedio, precoMin, precoMax, totalRegistros, byCategoria, byProduto, unidadeDominante } = aggregations;

  // Variação calculada dentro da unidade dominante (preços comensuráveis);
  // misturar R$/unid com R$/m3 faria a variação refletir o mix de unidades.
  const byPeriodoVar = aggregations.byPeriodoDominante && Object.keys(aggregations.byPeriodoDominante).length > 0
    ? aggregations.byPeriodoDominante
    : aggregations.byPeriodo;
  const periodos = Object.keys(byPeriodoVar || {}).sort();
  let variacao = null;
  if (periodos.length >= 2) {
    const primeiroPreco = byPeriodoVar[periodos[0]]?.media;
    const ultimoPreco = byPeriodoVar[periodos[periodos.length - 1]]?.media;
    if (primeiroPreco && ultimoPreco) {
      variacao = (ultimoPreco - primeiroPreco) / primeiroPreco;
    }
  }

  const cards = [
    {
      label: 'Preço Médio',
      value: formatCurrency(precoMedio),
      unit: unidadeDominante,
      icon: DollarSign,
      color: 'from-forest-500 to-forest-600',
      subtext: `${unidadeDominante ? `${unidadeDominante} · ` : ''}Min: ${formatCurrency(precoMin)} | Max: ${formatCurrency(precoMax)}`
    },
    {
      label: 'Total de Registros',
      value: formatNumber(totalRegistros, 0),
      icon: Database,
      color: 'from-earth-500 to-earth-600',
      subtext: `${Object.keys(byProduto).length} produtos diferentes`
    },
    {
      label: 'Variação no Período',
      value: variacao !== null ? `${variacao > 0 ? '+' : ''}${(variacao * 100).toFixed(1)}%` : '-',
      icon: variacao >= 0 ? TrendingUp : TrendingDown,
      color: variacao >= 0 ? 'from-sky-600 to-sky-700' : 'from-orange-600 to-orange-700',
      subtext: periodos.length >= 2 ? `${periodos[0]} a ${periodos[periodos.length - 1]}${unidadeDominante ? ` · ${unidadeDominante}` : ''}` : '-'
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
        <div key={index} className="stat-card transition-opacity duration-500" style={{ animationDelay: `${index * 75}ms` }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="kpi-label">{card.label}</p>
              <p className="kpi-value mt-1">
                {card.value}
                {card.unit && (
                  <span className="text-sm font-normal text-neutral-400 ml-1.5 align-baseline" data-i18n-skip>
                    {card.unit}
                  </span>
                )}
              </p>
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
