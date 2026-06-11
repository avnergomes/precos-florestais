// ATLAS-A11Y-HEX-SWEPT
/**
 * Funções de formatação para o dashboard
 */

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

function hashToColor(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const saturation = 55;
  const lightness = 45;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function getCategoryColor(categoria) {
  const colors = {
    'MUDAS': '#4A7C23',
    'TORAS': '#8B4513',
    'LENHA': '#a87f2d',
    'CAVACOS': '#6B7280',
    'PRODUTOSNAOMADEIREIROS': '#059669',
    'CUSTOSOPERACIONAIS': '#1F6FEB',
    'PRODUTOSPROCESSADOS': '#7C3AED',
    'SEMENTES': '#0EA5A8'
  };
  const key = String(categoria || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '')
    .toUpperCase();
  return colors[key] || hashToColor(key);
}

// ATLAS-PALETTE-V1
// Re-export the shared Atlas Editorial palette (daltonic-safe).
export { CHART_COLORS, MAP_GRADIENTS, ATLAS_CATEGORICAL, ATLAS_FOREST, ATLAS_WATER, ATLAS_CLAY, ATLAS_EARTH, ATLAS_HARVEST, ATLAS_DIVERGING, ATLAS_CHROME, categoricalColor, sequentialColor } from './chart-palette.js';
