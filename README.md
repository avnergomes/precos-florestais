# Preços Florestais — Produtos Florestais do Paraná

Dashboard de preços de produtos florestais do Paraná, cobrindo 29 anos de dados (1997–2025) em 10 categorias, 96 produtos e 22 regiões. Inclui previsões e mapa regional interativo.

**🔗 [Acessar dashboard](https://avnergomes.github.io/precos-florestais/)**

Parte do ecossistema **[Datageo Paraná](https://datageoparana.github.io)**.

## Sobre

O setor florestal é um componente relevante da cadeia do agronegócio paranaense, abrangendo madeira, papel, celulose, resinas e outros produtos de origem florestal. Este dashboard reúne as compilações históricas de preços da SEAB/IDR-Paraná desde 1997, permitindo análises de longo prazo sobre a evolução de preços em diferentes regiões e categorias.

Com 96 produtos distribuídos em 10 categorias e dados de 22 regiões, o dashboard oferece filtros interativos com badges de filtros ativos, treemap para visualizar a composição do mercado florestal, mapa regional e previsões de curto prazo para os principais produtos.

Os dados brutos, fornecidos em arquivos XLS/XLSX anuais, são processados por um pipeline Python que gera os JSONs consumidos pelo frontend React.

## Fonte de Dados

- **SEAB/IDR-Paraná** — Compilações de preços de produtos florestais da Secretaria da Agricultura e do Abastecimento / Instituto de Desenvolvimento Rural do Paraná
- Período: 1997–2025
- Arquivos brutos: planilhas XLS/XLSX anuais em `/data/`

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Gráficos | Recharts, D3.js |
| Mapas | Leaflet |
| Pipeline | Python (Pandas) |
| Deploy | GitHub Pages via GitHub Actions |
| Tracking | LGPD-compliant (19 métricas anônimas) |

## Estrutura do Projeto

```
precos-florestais/
├── dashboard/          # Aplicação React
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/ # 20 componentes
│   │   └── hooks/      # useData.js
│   ├── public/
│   │   └── data/       # JSONs processados
│   └── index.html
├── scripts/            # Pipeline de dados (Python)
│   ├── preprocess_data.py
│   └── generate_forecasts.py
├── data/               # Dados brutos (XLS/XLSX 1997–2025)
├── .github/workflows/  # CI/CD
│   ├── data-pipeline.yml
│   └── deploy.yml
└── README.md
```

## Funcionalidades

- Cobertura de 96 produtos florestais em 10 categorias
- Séries históricas de 29 anos (1997–2025) em 22 regiões
- Previsões de curto prazo por produto
- Mapa regional interativo do Paraná
- Treemap de composição do mercado florestal
- Filtros ativos com badges visuais
- Tabela de preços por produto e região
- KPIs de preço médio, total de registros, variação no período e número de categorias

## Desenvolvimento Local

```bash
# Clone
git clone https://github.com/avnergomes/precos-florestais.git
cd precos-florestais/dashboard

# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Pipeline de Dados

O script `scripts/preprocess_data.py` lê os arquivos XLS/XLSX anuais em `/data/`, normaliza os dados por produto, categoria e região via Pandas e gera os JSONs `aggregated.json`, `detailed.json` em `dashboard/public/data/`. O script `scripts/generate_forecasts.py` produz o `forecasts.json` com as previsões. Os workflows `data-pipeline.yml` e `deploy.yml` automatizam o processamento e a publicação no GitHub Pages.

## Licença

Dados públicos. Dashboard desenvolvido por [Avner Gomes](https://avnergomes.github.io/portfolio/).
