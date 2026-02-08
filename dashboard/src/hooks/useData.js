import { useState, useEffect, useMemo } from 'react';

const BASE_URL = import.meta.env.BASE_URL || '/';

export function useData() {
  const [data, setData] = useState(null);
  const [aggregated, setAggregated] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [forecasts, setForecasts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [detailedRes, aggregatedRes, geoRes, forecastRes] = await Promise.all([
          fetch(`${BASE_URL}data/detailed.json`),
          fetch(`${BASE_URL}data/aggregated.json`),
          fetch(`${BASE_URL}data/regioes.geojson`),
          fetch(`${BASE_URL}data/forecasts.json`)
        ]);

        if (!detailedRes.ok || !aggregatedRes.ok) {
          throw new Error('Erro ao carregar dados');
        }

        const [detailedData, aggregatedData] = await Promise.all([
          detailedRes.json(),
          aggregatedRes.json()
        ]);

        setData(detailedData);
        setAggregated(aggregatedData);

        if (forecastRes.ok) {
          const forecastData = await forecastRes.json();
          setForecasts(forecastData);
        }

        if (geoRes.ok) {
          const geoJson = await geoRes.json();
          setGeoData(geoJson);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { data, aggregated, geoData, forecasts, loading, error };
}

export function useFilteredData(data, filters) {
  return useMemo(() => {
    if (!data) return [];

    let filtered = [...data];

    // Filtro por ano
    if (filters.anos && filters.anos.length > 0) {
      filtered = filtered.filter(d => filters.anos.includes(d.ano));
    }

    // Filtro por região
    if (filters.regioes && filters.regioes.length > 0) {
      filtered = filtered.filter(d => filters.regioes.includes(d.regiao));
    }

    // Filtro por categoria
    if (filters.categorias && filters.categorias.length > 0) {
      filtered = filtered.filter(d => filters.categorias.includes(d.categoria));
    }

    // Filtro por subcategoria
    if (filters.subcategorias && filters.subcategorias.length > 0) {
      filtered = filtered.filter(d => filters.subcategorias.includes(d.subcategoria));
    }

    // Filtro por produto
    if (filters.produtos && filters.produtos.length > 0) {
      filtered = filtered.filter(d => filters.produtos.includes(d.produto));
    }

    return filtered;
  }, [data, filters]);
}

export function useAggregations(filteredData) {
  return useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        precoMedio: 0,
        precoMin: 0,
        precoMax: 0,
        totalRegistros: 0,
        periodos: [],
        byPeriodo: {},
        byRegiao: {},
        byCategoria: {},
        byProduto: {}
      };
    }

    const precos = filteredData.map(d => d.preco);
    const precoMedio = precos.reduce((a, b) => a + b, 0) / precos.length;
    const precoMin = Math.min(...precos);
    const precoMax = Math.max(...precos);

    // Agrupar por período
    const byPeriodo = {};
    filteredData.forEach(d => {
      if (!byPeriodo[d.periodo]) {
        byPeriodo[d.periodo] = { precos: [], count: 0 };
      }
      byPeriodo[d.periodo].precos.push(d.preco);
      byPeriodo[d.periodo].count++;
    });

    Object.keys(byPeriodo).forEach(periodo => {
      const precos = byPeriodo[periodo].precos;
      byPeriodo[periodo].media = precos.reduce((a, b) => a + b, 0) / precos.length;
    });

    // Agrupar por região
    const byRegiao = {};
    filteredData.forEach(d => {
      if (!byRegiao[d.regiao]) {
        byRegiao[d.regiao] = { precos: [], count: 0 };
      }
      byRegiao[d.regiao].precos.push(d.preco);
      byRegiao[d.regiao].count++;
    });

    Object.keys(byRegiao).forEach(regiao => {
      const precos = byRegiao[regiao].precos;
      byRegiao[regiao].media = precos.reduce((a, b) => a + b, 0) / precos.length;
    });

    // Agrupar por categoria
    const byCategoria = {};
    filteredData.forEach(d => {
      if (!byCategoria[d.categoria]) {
        byCategoria[d.categoria] = { precos: [], count: 0, produtos: new Set() };
      }
      byCategoria[d.categoria].precos.push(d.preco);
      byCategoria[d.categoria].count++;
      byCategoria[d.categoria].produtos.add(d.produto);
    });

    Object.keys(byCategoria).forEach(cat => {
      const precos = byCategoria[cat].precos;
      byCategoria[cat].media = precos.reduce((a, b) => a + b, 0) / precos.length;
      byCategoria[cat].totalProdutos = byCategoria[cat].produtos.size;
    });

    // Agrupar por produto
    const byProduto = {};
    filteredData.forEach(d => {
      if (!byProduto[d.produto]) {
        byProduto[d.produto] = {
          precos: [],
          count: 0,
          categoria: d.categoria,
          subcategoria: d.subcategoria,
          unidade: d.unidade
        };
      }
      byProduto[d.produto].precos.push(d.preco);
      byProduto[d.produto].count++;
    });

    Object.keys(byProduto).forEach(prod => {
      const precos = byProduto[prod].precos;
      byProduto[prod].media = precos.reduce((a, b) => a + b, 0) / precos.length;
      byProduto[prod].min = Math.min(...precos);
      byProduto[prod].max = Math.max(...precos);
    });

    const periodos = Object.keys(byPeriodo).sort();

    return {
      precoMedio,
      precoMin,
      precoMax,
      totalRegistros: filteredData.length,
      periodos,
      byPeriodo,
      byRegiao,
      byCategoria,
      byProduto
    };
  }, [filteredData]);
}
