import { Filter, X, RotateCcw } from 'lucide-react';
import { getCategoryLabel } from '../utils/format';

export default function Filters({ aggregated, filters, setFilters }) {
  if (!aggregated) return null;

  const { anos, regioes, categorias, subcategorias, produtos } = aggregated;

  const handleAnoChange = (e) => {
    const value = parseInt(e.target.value);
    if (value === 0) {
      setFilters(f => ({ ...f, anos: [] }));
    } else {
      setFilters(f => ({ ...f, anos: [value] }));
    }
  };

  const handleRegiaoChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setFilters(f => ({ ...f, regioes: [] }));
    } else {
      setFilters(f => ({ ...f, regioes: [value] }));
    }
  };

  const handleCategoriaChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setFilters(f => ({ ...f, categorias: [], subcategorias: [], produtos: [] }));
    } else {
      setFilters(f => ({ ...f, categorias: [value], subcategorias: [], produtos: [] }));
    }
  };

  const handleSubcategoriaChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setFilters(f => ({ ...f, subcategorias: [], produtos: [] }));
    } else {
      setFilters(f => ({ ...f, subcategorias: [value], produtos: [] }));
    }
  };

  const handleProdutoChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setFilters(f => ({ ...f, produtos: [] }));
    } else {
      setFilters(f => ({ ...f, produtos: [value] }));
    }
  };

  const clearFilters = () => {
    setFilters({
      anos: [],
      regioes: [],
      categorias: [],
      subcategorias: [],
      produtos: []
    });
  };

  const hasFilters = filters.anos.length > 0 || filters.regioes.length > 0 ||
    filters.categorias.length > 0 || filters.subcategorias.length > 0 ||
    filters.produtos.length > 0;

  // Get available subcategorias based on selected categoria
  const availableSubcategorias = filters.categorias.length > 0
    ? subcategorias[filters.categorias[0]] || []
    : [];

  // Get available produtos based on selected categoria and subcategoria
  const availableProdutos = filters.categorias.length > 0 && filters.subcategorias.length > 0
    ? produtos[filters.categorias[0]]?.[filters.subcategorias[0]] || []
    : [];

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-forest-600" />
          <h2 className="font-semibold text-neutral-800">Filtros</h2>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-forest-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Ano */}
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            Ano
          </label>
          <select
            className="filter-select"
            value={filters.anos[0] || 0}
            onChange={handleAnoChange}
          >
            <option value={0}>Todos os anos</option>
            {anos.map(ano => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
        </div>

        {/* Região */}
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            Região
          </label>
          <select
            className="filter-select"
            value={filters.regioes[0] || ''}
            onChange={handleRegiaoChange}
          >
            <option value="">Todas as regiões</option>
            {regioes.filter(r => r !== 'Média Estado').map(regiao => (
              <option key={regiao} value={regiao}>{regiao}</option>
            ))}
          </select>
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            Categoria
          </label>
          <select
            className="filter-select"
            value={filters.categorias[0] || ''}
            onChange={handleCategoriaChange}
          >
            <option value="">Todas as categorias</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
            ))}
          </select>
        </div>

        {/* Subcategoria */}
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            Subcategoria
          </label>
          <select
            className="filter-select"
            value={filters.subcategorias[0] || ''}
            onChange={handleSubcategoriaChange}
            disabled={availableSubcategorias.length === 0}
          >
            <option value="">Todas</option>
            {availableSubcategorias.map(subcat => (
              <option key={subcat} value={subcat}>{subcat}</option>
            ))}
          </select>
        </div>

        {/* Produto */}
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            Produto
          </label>
          <select
            className="filter-select"
            value={filters.produtos[0] || ''}
            onChange={handleProdutoChange}
            disabled={availableProdutos.length === 0}
          >
            <option value="">Todos</option>
            {availableProdutos.map(prod => (
              <option key={prod} value={prod}>{prod}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filters badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-200">
          {filters.anos.map(ano => (
            <span key={ano} className="badge bg-forest-100 text-forest-700 flex items-center gap-1">
              {ano}
              <X
                className="w-3 h-3 cursor-pointer hover:text-forest-900"
                onClick={() => setFilters(f => ({ ...f, anos: f.anos.filter(a => a !== ano) }))}
              />
            </span>
          ))}
          {filters.regioes.map(regiao => (
            <span key={regiao} className="badge bg-wood-100 text-wood-700 flex items-center gap-1">
              {regiao}
              <X
                className="w-3 h-3 cursor-pointer hover:text-wood-900"
                onClick={() => setFilters(f => ({ ...f, regioes: f.regioes.filter(r => r !== regiao) }))}
              />
            </span>
          ))}
          {filters.categorias.map(cat => (
            <span key={cat} className="badge bg-blue-100 text-blue-700 flex items-center gap-1">
              {getCategoryLabel(cat)}
              <X
                className="w-3 h-3 cursor-pointer hover:text-blue-900"
                onClick={() => setFilters(f => ({ ...f, categorias: [], subcategorias: [], produtos: [] }))}
              />
            </span>
          ))}
          {filters.subcategorias.map(subcat => (
            <span key={subcat} className="badge bg-purple-100 text-purple-700 flex items-center gap-1">
              {subcat}
              <X
                className="w-3 h-3 cursor-pointer hover:text-purple-900"
                onClick={() => setFilters(f => ({ ...f, subcategorias: [], produtos: [] }))}
              />
            </span>
          ))}
          {filters.produtos.map(prod => (
            <span key={prod} className="badge bg-amber-100 text-amber-700 flex items-center gap-1">
              {prod}
              <X
                className="w-3 h-3 cursor-pointer hover:text-amber-900"
                onClick={() => setFilters(f => ({ ...f, produtos: f.produtos.filter(p => p !== prod) }))}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
