// ATLAS-A11Y-HEX-SWEPT
/**
 * Funções de formatação para o dashboard
 */
import { ATLAS_CATEGORICAL } from './chart-palette.js';

export function formatCurrency(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

export function formatPeriod(periodo) {
  if (!periodo) return '-';
  const [year, month] = periodo.split('-');
  const months = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
    '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
  };
  return `${months[month] || month}/${year}`;
}

export function formatPeriodFull(periodo) {
  if (!periodo) return '-';
  const [year, month] = periodo.split('-');
  const months = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
  };
  return `${months[month] || month} de ${year}`;
}

export function getCategoryLabel(categoria) {
  return categoria || '';
}

// Mapeamento fixo categoria -> cor Okabe-Ito (paleta categorica daltonico-segura
// de chart-palette.js). Compartilhado por TimeSeriesChart, TreemapChart e
// LollipopChart para manter a mesma cor por categoria em todos os graficos.
const CATEGORY_COLORS_A11Y = {
  'TORAS': '#0072B2',                 // azul
  'MADEIRASERRADA': '#D55E00',        // vermelhao
  'MUDAS': '#009E73',                 // verde-azulado
  'ENERGIA': '#E69F00',               // laranja
  'LENHA': '#E69F00',                 // laranja (legado)
  'PFNM': '#CC79A7',                  // roxo-avermelhado
  'PRODUTOSNAOMADEIREIROS': '#CC79A7',
  'PRODUTOSBENEFICIADOS': '#56B4E9',  // azul-ceu
  'PRODUTOSPROCESSADOS': '#56B4E9',
  'CAVACOS': '#2a2419',               // tinta atlas
  'RESIDUOS': '#6e6453',              // neutro
  'SEMENTES': '#F0E442',              // amarelo
  'CUSTOSOPERACIONAIS': '#254e69'     // azul escuro (agua)
};

export function getCategoryColor(categoria) {
  const key = String(categoria || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '')
    .toUpperCase();
  if (!key) return '#6e6453';
  if (CATEGORY_COLORS_A11Y[key]) return CATEGORY_COLORS_A11Y[key];
  // Fallback estavel dentro da paleta Okabe-Ito (nunca um matiz arbitrario).
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ATLAS_CATEGORICAL[Math.abs(hash) % ATLAS_CATEGORICAL.length];
}

// ATLAS-PALETTE-V1
// Re-export the shared Atlas Editorial palette (daltonic-safe).
export { CHART_COLORS, MAP_GRADIENTS, ATLAS_CATEGORICAL, ATLAS_FOREST, ATLAS_WATER, ATLAS_CLAY, ATLAS_EARTH, ATLAS_HARVEST, ATLAS_DIVERGING, ATLAS_CHROME, categoricalColor, sequentialColor } from './chart-palette.js';
