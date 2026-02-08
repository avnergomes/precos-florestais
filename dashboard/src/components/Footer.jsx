import { Database, ExternalLink } from 'lucide-react';

export default function Footer({ stats }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-800 text-neutral-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Fonte de Dados */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-forest-400" />
              Fonte de Dados
            </h4>
            <ul className="space-y-1.5 text-xs text-neutral-400">
              <li>DERAL - Departamento de Economia Rural</li>
              <li>SEAB - Secretaria da Agricultura do Paraná</li>
            </ul>
            {stats && (
              <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-700">
                <p>Período: {stats.periodo_inicio} a {stats.periodo_fim}</p>
                <p>{stats.total_registros?.toLocaleString('pt-BR')} registros</p>
              </div>
            )}
          </div>

          {/* Datageo Paraná */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm">
              <a
                href="https://datageoparana.github.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-forest-400 transition-colors inline-flex items-center gap-1"
              >
                Datageo Paraná
                <ExternalLink className="w-3 h-3" />
              </a>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              <a
                href="https://avnergomes.github.io/vbp-parana/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2.5 py-1 text-[10px] rounded-full border border-neutral-600 text-neutral-300 hover:text-forest-300 hover:border-forest-400 transition-colors"
              >
                VBP Paraná
              </a>
              <a
                href="https://avnergomes.github.io/precos-diarios/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2.5 py-1 text-[10px] rounded-full border border-neutral-600 text-neutral-300 hover:text-forest-300 hover:border-forest-400 transition-colors"
              >
                Preços Diários
              </a>
              <a
                href="https://avnergomes.github.io/precos-de-terras/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2.5 py-1 text-[10px] rounded-full border border-neutral-600 text-neutral-300 hover:text-forest-300 hover:border-forest-400 transition-colors"
              >
                Preços de Terras
              </a>
              <a
                href="https://avnergomes.github.io/comexstat-parana/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2.5 py-1 text-[10px] rounded-full border border-neutral-600 text-neutral-300 hover:text-forest-300 hover:border-forest-400 transition-colors"
              >
                ComexStat Paraná
              </a>
              <a
                href="https://avnergomes.github.io/emprego-agro-parana/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2.5 py-1 text-[10px] rounded-full border border-neutral-600 text-neutral-300 hover:text-forest-300 hover:border-forest-400 transition-colors"
              >
                Emprego Agro
              </a>
            </div>
          </div>

          {/* Developer */}
          <div className="space-y-3 flex flex-col items-start md:items-end">
            <a
              href="https://avnergomes.github.io/portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-neutral-400 hover:text-forest-400 transition-colors group"
              title="Portfolio"
            >
              <img
                src={`${import.meta.env.BASE_URL}assets/logo.png`}
                alt="Avner Gomes"
                className="w-8 h-8 rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <span className="text-xs">Desenvolvido por Avner Gomes</span>
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-6 pt-4 border-t border-neutral-700 flex items-center justify-between text-[10px] text-neutral-500">
          <p>&copy; {currentYear} Preços Florestais PR. Dados públicos.</p>
        </div>
      </div>
    </footer>
  );
}
