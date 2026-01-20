import { ExternalLink, Database, Github } from 'lucide-react';

export default function Footer({ stats }) {
  return (
    <footer className="bg-neutral-800 text-neutral-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-3">Sobre</h3>
            <p className="text-sm leading-relaxed">
              Dashboard interativo para visualização dos preços de produtos florestais
              do estado do Paraná, com dados coletados pelo DERAL - Departamento de
              Economia Rural da SEAB.
            </p>
          </div>

          {/* Data Source */}
          <div>
            <h3 className="text-white font-semibold mb-3">Fonte dos Dados</h3>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <Database className="w-4 h-4 mt-0.5 text-forest-400" />
                <span>
                  DERAL/SEAB - Departamento de Economia Rural
                </span>
              </li>
              <li>
                <a
                  href="https://www.agricultura.pr.gov.br/deral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-forest-400 hover:text-forest-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Acessar site do DERAL
                </a>
              </li>
            </ul>
          </div>

          {/* Stats */}
          <div>
            <h3 className="text-white font-semibold mb-3">Estatísticas</h3>
            {stats && (
              <ul className="text-sm space-y-1">
                <li>
                  <span className="text-neutral-400">Período:</span>{' '}
                  {stats.periodo_inicio} a {stats.periodo_fim}
                </li>
                <li>
                  <span className="text-neutral-400">Total de registros:</span>{' '}
                  {stats.total_registros?.toLocaleString('pt-BR')}
                </li>
                <li>
                  <span className="text-neutral-400">Regiões:</span>{' '}
                  {stats.total_regioes}
                </li>
                <li>
                  <span className="text-neutral-400">Produtos:</span>{' '}
                  {stats.total_produtos}
                </li>
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <p>
              Dados públicos do Governo do Estado do Paraná
            </p>
            <span className="hidden sm:inline text-neutral-600">•</span>
            <p>
              Última atualização: {stats?.ultimo_periodo || '-'}
            </p>
          </div>
          <a
            href="https://avnergomes.github.io/portfolio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-neutral-400 hover:text-forest-400 transition-colors group"
            title="Desenvolvido por Avner Gomes"
          >
            <img
              src={`${import.meta.env.BASE_URL}assets/logo.png`}
              alt="Avner Gomes"
              className="w-6 h-6 rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <span className="text-xs">Desenvolvido por Avner Gomes</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>
    </footer>
  );
}
