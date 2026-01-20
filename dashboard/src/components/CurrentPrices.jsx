import { useMemo, useState } from 'react';
import { formatCurrency, formatNumber, formatPeriodFull, getCategoryLabel } from '../utils/format';
import { Download, Search, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

export default function CurrentPrices({ filteredData, aggregated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('categoria');
  const [sortOrder, setSortOrder] = useState('asc');

  // Get the latest period from filtered data
  const latestPeriod = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;
    const periods = [...new Set(filteredData.map(d => d.periodo))].sort();
    return periods[periods.length - 1];
  }, [filteredData]);

  // Get previous period for comparison
  const previousPeriod = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;
    const periods = [...new Set(filteredData.map(d => d.periodo))].sort();
    if (periods.length < 2) return null;
    return periods[periods.length - 2];
  }, [filteredData]);

  // Get current prices (latest period) with comparison to previous
  const currentPrices = useMemo(() => {
    if (!filteredData || !latestPeriod) return [];

    // Get data for latest period
    const latestData = filteredData.filter(d => d.periodo === latestPeriod);

    // Get data for previous period
    const previousData = previousPeriod
      ? filteredData.filter(d => d.periodo === previousPeriod)
      : [];

    // Group by product and calculate average price per region
    const productMap = {};

    latestData.forEach(d => {
      const key = d.produto;
      if (!productMap[key]) {
        productMap[key] = {
          produto: d.produto,
          categoria: d.categoria,
          subcategoria: d.subcategoria,
          unidade: d.unidade,
          precos: [],
          regioes: new Set()
        };
      }
      productMap[key].precos.push(d.preco);
      productMap[key].regioes.add(d.regiao);
    });

    // Calculate previous period prices
    const previousMap = {};
    previousData.forEach(d => {
      const key = d.produto;
      if (!previousMap[key]) {
        previousMap[key] = { precos: [] };
      }
      previousMap[key].precos.push(d.preco);
    });

    // Calculate statistics
    return Object.values(productMap).map(item => {
      const precos = item.precos;
      const media = precos.reduce((a, b) => a + b, 0) / precos.length;
      const min = Math.min(...precos);
      const max = Math.max(...precos);

      // Previous period comparison
      const prevData = previousMap[item.produto];
      let variacao = null;
      let precoAnterior = null;
      if (prevData && prevData.precos.length > 0) {
        precoAnterior = prevData.precos.reduce((a, b) => a + b, 0) / prevData.precos.length;
        variacao = (media - precoAnterior) / precoAnterior;
      }

      return {
        produto: item.produto,
        categoria: item.categoria,
        subcategoria: item.subcategoria,
        unidade: item.unidade || '-',
        precoMedio: media,
        precoMin: min,
        precoMax: max,
        precoAnterior,
        variacao,
        numRegioes: item.regioes.size,
        numRegistros: precos.length
      };
    });
  }, [filteredData, latestPeriod, previousPeriod]);

  // Filter and sort
  const displayData = useMemo(() => {
    let data = [...currentPrices];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(d =>
        d.produto.toLowerCase().includes(term) ||
        getCategoryLabel(d.categoria).toLowerCase().includes(term) ||
        d.subcategoria.toLowerCase().includes(term)
      );
    }

    // Sort
    data.sort((a, b) => {
      const multiplier = sortOrder === 'desc' ? -1 : 1;
      if (sortField === 'produto' || sortField === 'categoria' || sortField === 'subcategoria' || sortField === 'unidade') {
        const valA = sortField === 'categoria' ? getCategoryLabel(a[sortField]) : a[sortField];
        const valB = sortField === 'categoria' ? getCategoryLabel(b[sortField]) : b[sortField];
        return multiplier * valA.localeCompare(valB);
      }
      if (sortField === 'variacao') {
        const valA = a.variacao ?? -999;
        const valB = b.variacao ?? -999;
        return multiplier * (valA - valB);
      }
      return multiplier * (a[sortField] - b[sortField]);
    });

    return data;
  }, [currentPrices, searchTerm, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder(field === 'precoMedio' || field === 'variacao' ? 'desc' : 'asc');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Produto',
      'Categoria',
      'Subcategoria',
      'Unidade',
      'Preço Médio (R$)',
      'Preço Mín (R$)',
      'Preço Máx (R$)',
      'Preço Anterior (R$)',
      'Variação (%)',
      'Regiões',
      'Registros'
    ];

    const rows = displayData.map(d => [
      d.produto,
      getCategoryLabel(d.categoria),
      d.subcategoria,
      d.unidade,
      d.precoMedio.toFixed(2).replace('.', ','),
      d.precoMin.toFixed(2).replace('.', ','),
      d.precoMax.toFixed(2).replace('.', ','),
      d.precoAnterior ? d.precoAnterior.toFixed(2).replace('.', ',') : '',
      d.variacao !== null ? (d.variacao * 100).toFixed(2).replace('.', ',') : '',
      d.numRegioes,
      d.numRegistros
    ]);

    const csvContent = [
      `Preços Florestais - ${formatPeriodFull(latestPeriod)}`,
      `Exportado em: ${new Date().toLocaleDateString('pt-BR')}`,
      '',
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `precos_florestais_${latestPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />;
  };

  const VariationBadge = ({ value }) => {
    if (value === null) return <span className="text-neutral-400">-</span>;

    const percent = (value * 100).toFixed(1);
    if (value > 0.01) {
      return (
        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
          <TrendingUp className="w-3 h-3" />
          +{percent}%
        </span>
      );
    }
    if (value < -0.01) {
      return (
        <span className="inline-flex items-center gap-1 text-red-600 font-medium">
          <TrendingDown className="w-3 h-3" />
          {percent}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-neutral-500">
        <Minus className="w-3 h-3" />
        {percent}%
      </span>
    );
  };

  if (!latestPeriod) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <p className="text-neutral-500">Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="chart-container">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-800">
              Preços Atuais
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Referência: <span className="font-medium text-forest-600">{formatPeriodFull(latestPeriod)}</span>
              {previousPeriod && (
                <span className="ml-2">
                  (comparado com {formatPeriodFull(previousPeriod)})
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/50 focus:border-forest-500"
              />
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-neutral-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-forest-600">{displayData.length}</p>
            <p className="text-xs text-neutral-500">Produtos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-700">
              {formatCurrency(displayData.reduce((sum, d) => sum + d.precoMedio, 0) / displayData.length || 0)}
            </p>
            <p className="text-xs text-neutral-500">Preço Médio Geral</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {displayData.filter(d => d.variacao !== null && d.variacao > 0).length}
            </p>
            <p className="text-xs text-neutral-500">Em Alta</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {displayData.filter(d => d.variacao !== null && d.variacao < 0).length}
            </p>
            <p className="text-xs text-neutral-500">Em Baixa</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="chart-container overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th
                  className="text-left px-4 py-3 cursor-pointer hover:bg-forest-100 transition-colors"
                  onClick={() => handleSort('produto')}
                >
                  <div className="flex items-center gap-1">
                    Produto <SortIcon field="produto" />
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 cursor-pointer hover:bg-forest-100 transition-colors hidden md:table-cell"
                  onClick={() => handleSort('categoria')}
                >
                  <div className="flex items-center gap-1">
                    Categoria <SortIcon field="categoria" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Unidade</th>
                <th
                  className="text-right px-4 py-3 cursor-pointer hover:bg-forest-100 transition-colors"
                  onClick={() => handleSort('precoMedio')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Preço Médio <SortIcon field="precoMedio" />
                  </div>
                </th>
                <th className="text-right px-4 py-3 hidden lg:table-cell">Mín</th>
                <th className="text-right px-4 py-3 hidden lg:table-cell">Máx</th>
                <th
                  className="text-right px-4 py-3 cursor-pointer hover:bg-forest-100 transition-colors group relative"
                  onClick={() => handleSort('variacao')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Variação
                    <div className="relative">
                      <Info className="w-3 h-3 text-neutral-400 group-hover:text-forest-600" />
                      {latestPeriod && previousPeriod && (
                        <div className="absolute right-0 top-full mt-2 z-50 hidden group-hover:block">
                          <div className="bg-neutral-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                            <div className="font-medium mb-1">Comparação de períodos:</div>
                            <div className="text-neutral-300">
                              <span className="text-green-400">{formatPeriodFull(latestPeriod)}</span>
                              <span className="mx-1">vs</span>
                              <span className="text-yellow-400">{formatPeriodFull(previousPeriod)}</span>
                            </div>
                            <div className="absolute -top-1 right-3 w-2 h-2 bg-neutral-800 rotate-45"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <SortIcon field="variacao" />
                  </div>
                </th>
                <th className="text-center px-4 py-3 hidden sm:table-cell">Regiões</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, index) => (
                <tr key={`${row.produto}-${index}`} className="table-row">
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-800">{row.produto}</div>
                    <div className="text-xs text-neutral-500 md:hidden">
                      {getCategoryLabel(row.categoria)}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-neutral-700">{getCategoryLabel(row.categoria)}</div>
                    <div className="text-xs text-neutral-400">{row.subcategoria}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden lg:table-cell">{row.unidade}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-forest-700">{formatCurrency(row.precoMedio)}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-500 hidden lg:table-cell">
                    {formatCurrency(row.precoMin)}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-500 hidden lg:table-cell">
                    {formatCurrency(row.precoMax)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <VariationBadge value={row.variacao} />
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-600 hidden sm:table-cell">
                    {row.numRegioes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayData.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            Nenhum produto encontrado para os filtros selecionados
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-neutral-200 text-sm text-neutral-500 text-center">
          Exibindo {displayData.length} de {currentPrices.length} produtos
        </div>
      </div>
    </div>
  );
}
