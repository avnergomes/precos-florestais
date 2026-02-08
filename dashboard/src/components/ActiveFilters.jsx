import { X } from 'lucide-react';
import { getCategoryLabel } from '../utils/format';

const labels = {
  regiao: 'Região',
  categoria: 'Categoria',
  subcategoria: 'Subcategoria',
  ano: 'Ano',
};

export default function ActiveFilters({ filters, onRemove, onClear }) {
  const activeFilters = Object.entries(filters).filter(([_, value]) => value !== null);

  if (activeFilters.length === 0) return null;

  const formatValue = (key, value) => {
    if (key === 'categoria') return getCategoryLabel(value);
    return value;
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-forest-50 rounded-lg mb-4">
      <span className="text-sm font-medium text-forest-700">Filtros do gráfico:</span>
      {activeFilters.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-forest-100 text-forest-800 rounded-full text-sm font-medium"
        >
          <span className="text-forest-600">{labels[key]}:</span>
          <span>{formatValue(key, value)}</span>
          <button
            onClick={() => onRemove(key)}
            className="ml-0.5 p-0.5 hover:bg-forest-200 rounded-full transition-colors"
            aria-label={`Remover filtro ${labels[key]}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
      <button
        onClick={onClear}
        className="text-sm text-forest-600 hover:text-forest-800 hover:underline ml-2 font-medium"
      >
        Limpar todos
      </button>
    </div>
  );
}
