/**
 * Google Apps Script para tracking do Dashboard Precos Florestais
 *
 * PASSO A PASSO PARA CONFIGURACAO:
 * 1. Cole TODO este codigo no Google Apps Script
 * 2. Substitua 'SEU_SPREADSHEET_ID_AQUI' pelo ID da sua planilha
 * 3. Salve o projeto
 * 4. Execute a funcao setupSheet()
 * 5. Implante como Web App:
 *    - Tipo: Aplicativo da Web
 *    - Executar como: Eu
 *    - Acesso: Qualquer pessoa
 * 6. Copie a URL gerada
 * 7. Atualize SCRIPT_URL no src/utils/analytics.js
 */

const SPREADSHEET_ID = 'SEU_SPREADSHEET_ID_AQUI';
const SHEET_NAME = 'Tracking Data';

// ─── Seguranca ──────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://avnergomes.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_SEC = 60;
const MAX_PAYLOAD_SIZE = 10000;

function isAllowedOrigin_(data) {
  var origin = data.origin || '';
  if (!origin) return true;
  for (var i = 0; i < ALLOWED_ORIGINS.length; i++) {
    if (origin.indexOf(ALLOWED_ORIGINS[i]) === 0) return true;
  }
  return false;
}

function checkRateLimit_(sessionId) {
  if (!sessionId) return true;
  var cache = CacheService.getScriptCache();
  var key = 'rl_' + sessionId;
  var current = cache.get(key);
  var count = current ? parseInt(current, 10) : 0;
  if (count >= RATE_LIMIT_MAX) return false;
  cache.put(key, String(count + 1), RATE_LIMIT_WINDOW_SEC);
  return true;
}

function validatePayload_(raw) {
  if (!raw || raw.length > MAX_PAYLOAD_SIZE) return null;
  try {
    var data = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function jsonError_(msg) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error', message: msg
  })).setMimeType(ContentService.MimeType.JSON);
}

// ─── Endpoints ───────────────────────────────────

function doPost(e) {
  try {
    var data = validatePayload_(e.postData.contents);
    if (!data) return jsonError_('invalid payload');
    if (!isAllowedOrigin_(data)) return jsonError_('forbidden');
    if (!checkRateLimit_(data.sessionId || '')) return jsonError_('rate limited');

    saveToSheet(data);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Dados salvos com sucesso'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Precos Florestais Tracking API funcionando',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// ─── Salvar dados ────────────────────────────────

function saveToSheet(data) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    var keys = Object.keys(data);
    sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
    var headerRange = sheet.getRange(1, 1, 1, keys.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#0ea5e9');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = headers.map(function (col) {
    var value = data[col];
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
  });

  var nextRow = sheet.getLastRow() + 1;
  sheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);
}

// ─── Setup ───────────────────────────────────────

function setupSheet() {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (sheet) {
    spreadsheet.deleteSheet(sheet);
  }
  sheet = spreadsheet.insertSheet(SHEET_NAME);
  sheet.setFrozenRows(1);
}
