# Configuração do Google Apps Script para Tracking de Visitantes

## Instruções de Configuração

### Passo 1: Configurar o Google Apps Script

1. Acesse o projeto do Google Apps Script:
   https://script.google.com/u/0/home/projects/1bXQgK8Udr9f4gpnnqXWrZkDyA-p-wUswgo6iklcb-mRD2zt2y55qXYDH/edit

2. Cole o código abaixo no editor:

```javascript
// Google Apps Script para coletar dados de visitantes
// Planilha: https://docs.google.com/spreadsheets/d/1Pz57YYeQxhSgHc10kzSM71akB2VzlhzK_pXxwVnvcGA/edit

const SPREADSHEET_ID = '1Pz57YYeQxhSgHc10kzSM71akB2VzlhzK_pXxwVnvcGA';
const SHEET_NAME = 'Visitantes';

/**
 * Função que recebe os dados via POST
 */
function doPost(e) {
  try {
    // Parse dos dados recebidos
    const data = JSON.parse(e.postData.contents);

    // Abre a planilha
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Cria a aba se não existir
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Adiciona cabeçalhos
      sheet.appendRow([
        'Timestamp',
        'Data/Hora BR',
        'URL',
        'Caminho',
        'Referrer',
        'User Agent',
        'Idioma',
        'Resolução',
        'Viewport',
        'Timezone',
        'Session ID',
        'Navegador',
        'Sistema Operacional',
        'Dispositivo'
      ]);

      // Formata cabeçalho
      const headerRange = sheet.getRange(1, 1, 1, 14);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4a5568');
      headerRange.setFontColor('#ffffff');
    }

    // Extrai informações do user agent
    const userAgent = data.userAgent || '';
    const browserInfo = extractBrowserInfo(userAgent);

    // Converte timestamp para horário de Brasília
    const timestamp = new Date(data.timestamp);
    const brazilTime = Utilities.formatDate(
      timestamp,
      'America/Sao_Paulo',
      'dd/MM/yyyy HH:mm:ss'
    );

    // Adiciona os dados na planilha
    sheet.appendRow([
      data.timestamp,
      brazilTime,
      data.url || '',
      data.pathname || '',
      data.referrer || 'Direct',
      userAgent,
      data.language || '',
      data.screenResolution || '',
      data.viewportSize || '',
      data.timezone || '',
      data.sessionId || '',
      browserInfo.browser,
      browserInfo.os,
      browserInfo.device
    ]);

    // Auto-ajusta colunas (apenas nas primeiras 100 linhas para performance)
    if (sheet.getLastRow() <= 100) {
      sheet.autoResizeColumns(1, 14);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Erro: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Função GET para testar se o script está funcionando
 */
function doGet(e) {
  return ContentService
    .createTextOutput('Analytics tracking script is running!')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Extrai informações do navegador, SO e dispositivo do User Agent
 */
function extractBrowserInfo(userAgent) {
  const ua = userAgent.toLowerCase();

  // Detecta navegador
  let browser = 'Desconhecido';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('opera/') || ua.includes('opr/')) browser = 'Opera';

  // Detecta sistema operacional
  let os = 'Desconhecido';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Detecta tipo de dispositivo
  let device = 'Desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'Tablet';
  }

  return { browser, os, device };
}

/**
 * Função para criar estatísticas (opcional - executar manualmente)
 */
function createStatsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let statsSheet = ss.getSheetByName('Estatísticas');

  if (!statsSheet) {
    statsSheet = ss.insertSheet('Estatísticas');
  }

  statsSheet.clear();

  // Adiciona fórmulas de estatísticas
  statsSheet.appendRow(['Estatísticas de Visitantes']);
  statsSheet.appendRow(['']);
  statsSheet.appendRow(['Total de Visitas', `=COUNTA(Visitantes!A:A)-1`]);
  statsSheet.appendRow(['Visitas Hoje', `=COUNTIF(Visitantes!B:B,"*${Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy')}*")`]);
  statsSheet.appendRow(['Visitas Únicas (Sessions)', `=COUNTA(UNIQUE(Visitantes!K:K))-1`]);
  statsSheet.appendRow(['']);
  statsSheet.appendRow(['Top 5 Navegadores']);
  statsSheet.appendRow(['Navegador', 'Contagem']);

  // Formata
  statsSheet.getRange('A1').setFontSize(14).setFontWeight('bold');
  statsSheet.setColumnWidth(1, 200);
  statsSheet.setColumnWidth(2, 150);
}
```

### Passo 2: Publicar como Web App

1. No Google Apps Script, clique em **"Implantar"** > **"Nova implantação"**
2. Selecione o tipo: **"Aplicativo da Web"**
3. Configurações:
   - Descrição: "Analytics Tracking"
   - Executar como: **"Eu"**
   - Quem tem acesso: **"Qualquer pessoa"**
4. Clique em **"Implantar"**
5. Copie a **URL do aplicativo da Web** gerada

### Passo 3: Atualizar o código do dashboard

1. Abra o arquivo: `/dashboard/src/utils/analytics.js`
2. Substitua `'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'` pela URL copiada no passo anterior
3. Exemplo:
   ```javascript
   const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
   ```

### Passo 4: Verificar a planilha

Acesse a planilha para ver os dados coletados:
https://docs.google.com/spreadsheets/d/1Pz57YYeQxhSgHc10kzSM71akB2VzlhzK_pXxwVnvcGA/edit

Os dados serão salvos na aba "Visitantes" com as seguintes informações:
- Timestamp
- Data/Hora BR
- URL visitada
- Caminho
- Referrer (origem do acesso)
- User Agent
- Idioma
- Resolução da tela
- Tamanho do viewport
- Timezone
- Session ID
- Navegador
- Sistema Operacional
- Dispositivo (Mobile/Desktop/Tablet)

## Recursos Adicionais

### Criar estatísticas automáticas

Execute a função `createStatsSheet()` manualmente no Google Apps Script para criar uma aba de estatísticas com fórmulas automáticas.

### Tracking de eventos customizados

O arquivo `analytics.js` também inclui uma função `trackEvent()` que pode ser usada para rastrear eventos específicos:

```javascript
import { trackEvent } from './utils/analytics';

// Exemplo: rastrear quando um filtro é aplicado
trackEvent('filter_applied', {
  filterType: 'regiao',
  value: 'Norte'
});
```

## Troubleshooting

- **Dados não aparecem na planilha**: Verifique se a URL do script está correta no arquivo `analytics.js`
- **Erro de CORS**: Isso é normal com `mode: 'no-cors'`. Os dados ainda são enviados, mas a resposta não pode ser lida
- **Permissões**: Certifique-se de que o script tem permissão para acessar a planilha
