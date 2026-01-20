import { useMemo, useState } from 'react';
import { formatCurrency, formatNumber, getCategoryLabel } from '../utils/format';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download } from 'lucide-react';

export default function ProductTable({ aggregations, filteredData }) {
  const [sortField, setSortField] = useState('media');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const tableData = useMemo(() => {
    if (!aggregations?.byProduto) return [];

    let data = Object.entries(aggregations.byProduto)
      .map(([produto, info]) => ({
        produto,
        categoria: getCategoryLabel(info.categoria),
        subcategoria: info.subcategoria,
        unidade: info.unidade || '-',
        media: info.media,
        min: info.min,
        max: info.max,
        count: info.count
      }));

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(d =>
        d.produto.toLowerCase().includes(term) ||
        d.categoria.toLowerCase().includes(term) ||
        d.subcategoria.toLowerCase().includes(term)
      );
    }

    // Sort
    data.sort((a, b) => {
      const multiplier = sortOrder === 'desc' ? -1 : 1;
      if (sortField === 'produto' || sortField === 'categoria' || sortField === 'subcategoria') {
        return multiplier * a[sortField].localeCompare(b[sortField]);
      }
      return multiplier * (a[sortField] - b[sortField]);
    });

    return data;
  }, [aggregations, sortField, sortOrder, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return tableData.slice(start, start + itemsPerPage);
  }, [tableData, currentPage]);

  const totalPages = Math.ceil(tableData.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['Produto', 'Categoria', 'Subcategoria', 'Unidade', 'Preço Médio', 'Preço Mín', 'Preço Máx', 'Registros'];
    const rows = tableData.map(d => [
      d.produto,
      d.categoria,
      d.subcategoria,
      d.unidade,
      d.media.toFixed(2),
      d.min.toFixed(2),
      d.max.toFixed(2),
      d.count
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `precos_florestais_produtos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    return sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />;
  };

  if (tableData.length === 0 && !searchTerm) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <p className="text-neutral-500">Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">
          Ranking de Produtos
          <span className="text-sm font-normal text-neutral-500 ml-2">
            ({tableData.length} produtos)
          </span>
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/50 focus:border-forest-500"
            />
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left px-4 py-3 cursor-pointer hover:bg-forest-100 transition-colors" onClick={() => handleSort('produto')}>
                <div className="flex items-center gap-1">
                  Produto <SortIcon field="produto" />
                </div>
              </th>
              <th className="text-left px-4 py-3 cursor-pointer hover:bg-forest-100 transition-colors" onClick={() => handleSort('categoria')}>
                <div className="flex items-center gap-1">
                  Categoria <SortIcon field="categoria" />
                </div>
              </th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Unidade</th>
              <th className="text-right px-4 py-3 cursor-pointer hover:bg-forest-100 transition-colors" onClick={() => handleSort('media')}>
                <div className="flex items-center justify-end gap-1">
                  Preço Médio <SortIcon field="media" />
                </div>
              </th>
              <th className="text-right px-4 py-3 hidden lg:table-cell cursor-pointer hover:bg-forest-100 transition-colors" onClick={() => handleSort('min')}>
                <div className="flex items-center justify-end gap-1">
                  Mín <SortIcon field="min" />
                </div>
              </th>
              <th className="text-right px-4 py-3 hidden lg:table-cell cursor-pointer hover:bg-forest-100 transition-colors" onClick={() => handleSort('max')}>
                <div className="flex items-center justify-end gap-1">
                  Máx <SortIcon field="max" />
                </div>
              </th>
              <th className="text-right px-4 py-3 cursor-pointer hover:bg-forest-100 transition-colors" onClick={() => handleSort('count')}>
                <div className="flex items-center justify-end gap-1">
                  Registros <SortIcon field="count" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={row.produto} className="table-row">
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-800">{row.produto}</div>
                  <div className="text-xs text-neutral-500 md:hidden">{row.categoria}</div>
                </td>
                <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">
                  <div>{row.categoria}</div>
                  <div className="text-xs text-neutral-400">{row.subcategoria}</div>
                </td>
                <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">{row.unidade}</td>
                <td className="px-4 py-3 text-right font-semibold text-forest-700">{formatCurrency(row.media)}</td>
                <td className="px-4 py-3 text-right text-neutral-500 hidden lg:table-cell">{formatCurrency(row.min)}</td>
                <td className="px-4 py-3 text-right text-neutral-500 hidden lg:table-cell">{formatCurrency(row.max)}</td>
                <td className="px-4 py-3 text-right text-neutral-600">{formatNumber(row.count, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
          <p className="text-sm text-neutral-500">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, tableData.length)} de {tableData.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm rounded ${currentPage === page
                    ? 'bg-forest-600 text-white'
                    : 'border border-neutral-300 hover:bg-neutral-100'
                    }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
