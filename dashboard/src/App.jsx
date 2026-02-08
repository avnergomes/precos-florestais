import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData, useFilteredData, useAggregations } from './hooks/useData';
import Header from './components/Header';
import Filters from './components/Filters';
import ActiveFilters from './components/ActiveFilters';
import KpiCards from './components/KpiCards';
import Tabs from './components/Tabs';
import TimeSeriesChart from './components/TimeSeriesChart';
import RegionalChart from './components/RegionalChart';
import CategoryChart from './components/CategoryChart';
import ProductTable from './components/ProductTable';
import MapChart from './components/MapChart';
import CurrentPrices from './components/CurrentPrices';
import ForecastChart from './components/ForecastChart';
import ForecastKpis from './components/ForecastKpis';
import ForecastTable from './components/ForecastTable';
import Loading from './components/Loading';
import Footer from './components/Footer';
import { AlertCircle } from 'lucide-react';
import { getCategoryLabel } from './utils/format';

export default function App() {
  const { data, aggregated, geoData, forecasts, loading, error } = useData();
  const [activeTab, setActiveTab] = useState('preco-atual');
  const [filters, setFilters] = useState({
    anos: [],
    regioes: [],
    categorias: [],
    subcategorias: [],
    produtos: []
  });

  // Estado de filtros interativos (clique nos gráficos)
  const [interactiveFilters, setInteractiveFilters] = useState({
    regiao: null,
    categoria: null,
    subcategoria: null,
    ano: null,
  });

  // Handlers para filtros interativos
  const handleRegiaoClick = useCallback((regiao) => {
    setInteractiveFilters(prev => ({
      ...prev,
      regiao: prev.regiao === regiao ? null : regiao,
    }));
  }, []);

  const handleCategoriaClick = useCallback((categoria) => {
    setInteractiveFilters(prev => ({
      ...prev,
      categoria: prev.categoria === categoria ? null : categoria,
      subcategoria: null,
    }));
  }, []);

  const handleSubcategoriaClick = useCallback((subcategoria) => {
    setInteractiveFilters(prev => ({
      ...prev,
      subcategoria: prev.subcategoria === subcategoria ? null : subcategoria,
    }));
  }, []);

  const handleAnoClick = useCallback((ano) => {
    setInteractiveFilters(prev => ({
      ...prev,
      ano: prev.ano === ano ? null : ano,
    }));
  }, []);

  const handleRemoveInteractiveFilter = useCallback((key) => {
    setInteractiveFilters(prev => ({
      ...prev,
      [key]: null,
    }));
  }, []);

  const clearInteractiveFilters = useCallback(() => {
    setInteractiveFilters({
      regiao: null,
      categoria: null,
      subcategoria: null,
      ano: null,
    });
  }, []);

  // Verifica se há filtros interativos ativos
  const hasInteractiveFilters = useMemo(() => {
    return Object.values(interactiveFilters).some(v => v !== null);
  }, [interactiveFilters]);

  const filteredData = useFilteredData(data, filters);

  // Aplica filtros interativos aos dados filtrados
  const interactiveFilteredData = useMemo(() => {
    if (!filteredData?.length) return filteredData;

    return filteredData.filter(item => {
      if (interactiveFilters.regiao && item.regiao !== interactiveFilters.regiao) return false;
      if (interactiveFilters.categoria && item.categoria !== interactiveFilters.categoria) return false;
      if (interactiveFilters.subcategoria && item.subcategoria !== interactiveFilters.subcategoria) return false;
      if (interactiveFilters.ano) {
        const itemAno = item.periodo ? parseInt(item.periodo.split('-')[0]) : item.ano;
        if (itemAno !== interactiveFilters.ano) return false;
      }
      return true;
    });
  }, [filteredData, interactiveFilters]);

  const aggregations = useAggregations(interactiveFilteredData);

  const filterSummary = useMemo(() => {
    const yearLabel = filters.anos.length ? filters.anos.join(', ') : 'Todos os anos';
    const regionLabel = filters.regioes.length ? filters.regioes.join(', ') : 'Todas as regi\u00f5es';
    const categoryLabel = filters.categorias.length
      ? getCategoryLabel(filters.categorias[0])
      : 'Todas as categorias';
    const subcategoryLabel = filters.subcategorias.length
      ? filters.subcategorias[0]
      : 'Todas as subcategorias';
    const productLabel = filters.produtos.length ? filters.produtos[0] : 'Todos os produtos';

    return `Ano: ${yearLabel} \u2022 Regi\u00e3o: ${regionLabel} \u2022 Categoria: ${categoryLabel} \u2022 Subcategoria: ${subcategoryLabel} \u2022 Produto: ${productLabel}`;
  }, [filters]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Erro ao carregar dados
          </h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header stats={aggregated?.stats} />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <Filters
          aggregated={aggregated}
          filters={filters}
          setFilters={setFilters}
        />

        <div className="text-sm text-neutral-500">{filterSummary}</div>

        <ActiveFilters
          filters={interactiveFilters}
          onRemove={handleRemoveInteractiveFilter}
          onClear={clearInteractiveFilters}
        />

        <KpiCards
          aggregations={aggregations}
          filteredData={filteredData}
        />

        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'preco-atual' && (
          <CurrentPrices
            filteredData={filteredData}
            aggregated={aggregated}
          />
        )}

        {activeTab === 'visao-geral' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimeSeriesChart
                filteredData={filteredData}
                aggregations={aggregations}
                onAnoClick={handleAnoClick}
                selectedAno={interactiveFilters.ano}
              />
              <CategoryChart
                aggregations={aggregations}
                filteredData={filteredData}
                onCategoriaClick={handleCategoriaClick}
                selectedCategoria={interactiveFilters.categoria}
              />
            </div>
            <RegionalChart
              aggregations={aggregations}
              onRegiaoClick={handleRegiaoClick}
              selectedRegiao={interactiveFilters.regiao}
            />
          </div>
        )}

        {activeTab === 'evolucao' && (
          <div className="space-y-6">
            <TimeSeriesChart
              filteredData={filteredData}
              aggregations={aggregations}
              onAnoClick={handleAnoClick}
              selectedAno={interactiveFilters.ano}
            />
            <TimeSeriesChart
              filteredData={filteredData}
              aggregations={aggregations}
              showByCategory={true}
              onCategoriaClick={handleCategoriaClick}
              selectedCategoria={interactiveFilters.categoria}
            />
            {filters.categorias.length > 0 && (
              <TimeSeriesChart
                filteredData={filteredData}
                aggregations={aggregations}
                showBySubcategory={true}
                title={`Subcategorias de ${filters.categorias.join(', ')}`}
              />
            )}
          </div>
        )}

        {activeTab === 'regioes' && (
          <div className="space-y-6">
            <RegionalChart
              aggregations={aggregations}
              onRegiaoClick={handleRegiaoClick}
              selectedRegiao={interactiveFilters.regiao}
            />
            <div className="chart-container">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                Detalhamento por Região
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(aggregations.byRegiao || {})
                  .filter(([regiao]) => regiao !== 'Média Estado')
                  .sort((a, b) => b[1].media - a[1].media)
                  .slice(0, 6)
                  .map(([regiao, data]) => (
                    <div key={regiao} className="bg-neutral-50 rounded-lg p-4">
                      <h4 className="font-semibold text-neutral-800">{regiao}</h4>
                      <p className="text-2xl font-bold text-forest-600 mt-1">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(data.media)}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        {data.count} registros
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categorias' && (
          <div className="space-y-6">
            <CategoryChart
              aggregations={aggregations}
              filteredData={filteredData}
              onCategoriaClick={handleCategoriaClick}
              selectedCategoria={interactiveFilters.categoria}
            />
            <div className="chart-container">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                Detalhamento por Categoria
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(aggregations.byCategoria || {})
                  .sort((a, b) => b[1].media - a[1].media)
                  .map(([categoria, data]) => {
                    const labels = {
                      'MUDAS': { name: 'Mudas', color: 'bg-forest-100 text-forest-800' },
                      'TORAS': { name: 'Toras', color: 'bg-wood-100 text-wood-800' },
                      'LENHA': { name: 'Lenha', color: 'bg-amber-100 text-amber-800' },
                      'CAVACOS': { name: 'Cavacos', color: 'bg-neutral-200 text-neutral-800' },
                      'PRODUTOS_NAO_MADEIREIROS': { name: 'Não Madeireiros', color: 'bg-emerald-100 text-emerald-800' }
                    };
                    const label = labels[categoria] || { name: categoria, color: 'bg-neutral-100' };
                    return (
                      <div key={categoria} className={`${label.color} rounded-lg p-4`}>
                        <h4 className="font-semibold">{label.name}</h4>
                        <p className="text-2xl font-bold mt-1">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(data.media)}
                        </p>
                        <div className="flex justify-between text-sm mt-2 opacity-75">
                          <span>{data.count} registros</span>
                          <span>{data.totalProdutos} produtos</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'produtos' && (
          <ProductTable
            aggregations={aggregations}
            filteredData={filteredData}
          />
        )}

        {activeTab === 'previsoes' && forecasts?.series && (() => {
          // Encontrar série baseada nos filtros ou usar a geral (todos *)
          const seriesKeys = Object.keys(forecasts.series);
          const generalKey = seriesKeys.find(k => k.includes('regiao=*') && k.includes('categoria=*')) || seriesKeys[0];
          const selectedKey = filters.regioes.length === 1
            ? seriesKeys.find(k => k.includes(`regiao=${filters.regioes[0]}`)) || generalKey
            : generalKey;
          const selectedSeries = forecasts.series[selectedKey];

          // Construir histórico a partir dos dados filtrados
          const historico = Object.entries(aggregations.byPeriodo || {})
            .map(([periodo, data]) => ({ periodo, value: data.media }))
            .sort((a, b) => a.periodo.localeCompare(b.periodo))
            .slice(-24); // últimos 24 meses

          return (
            <div className="space-y-6">
              <ForecastKpis
                modelos={selectedSeries?.models || {}}
                historico={historico}
              />
              <ForecastChart
                historico={historico}
                modelos={selectedSeries?.models || {}}
                title="Previsão de preços florestais"
                description="Projeção de preços para os próximos 12 meses utilizando múltiplos modelos de machine learning"
              />
              <ForecastTable
                modelos={selectedSeries?.models || {}}
                title="Previsões detalhadas por modelo"
              />
            </div>
          );
        })()}

        {activeTab === 'previsoes' && !forecasts?.series && (
          <div className="bg-white rounded-xl border border-neutral-100 p-8 text-center text-neutral-400">
            Dados de previsão não disponíveis
          </div>
        )}

        {activeTab === 'mapa' && (
          <MapChart
            aggregations={aggregations}
            geoData={geoData}
          />
        )}
      </main>

      <Footer stats={aggregated?.stats} />
    </div>
  );
}
