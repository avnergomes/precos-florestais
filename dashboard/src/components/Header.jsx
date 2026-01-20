import { TreePine, BarChart3, Calendar, MapPin } from 'lucide-react';

export default function Header({ stats }) {
  return (
    <header className="bg-gradient-to-r from-forest-700 via-forest-600 to-forest-700 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
              <TreePine className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Preços Florestais
              </h1>
              <p className="text-forest-100 text-sm md:text-base">
                DERAL/SEAB - Paraná
              </p>
            </div>
          </div>

          {stats && (
            <div className="flex flex-wrap gap-4 md:gap-6">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Calendar className="w-4 h-4 text-forest-200" />
                <span className="text-sm">
                  <span className="text-forest-200">Anos:</span>{' '}
                  <span className="font-semibold">{stats.total_anos}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                <MapPin className="w-4 h-4 text-forest-200" />
                <span className="text-sm">
                  <span className="text-forest-200">Regiões:</span>{' '}
                  <span className="font-semibold">{stats.total_regioes}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                <BarChart3 className="w-4 h-4 text-forest-200" />
                <span className="text-sm">
                  <span className="text-forest-200">Produtos:</span>{' '}
                  <span className="font-semibold">{stats.total_produtos}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
