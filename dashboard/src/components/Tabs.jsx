import { LayoutDashboard, TrendingUp, MapPin, Package, Table2, Map, DollarSign, LineChart } from 'lucide-react';

const tabs = [
  { id: 'preco-atual', label: 'Preco Atual', icon: DollarSign },
  { id: 'visao-geral', label: 'Visao Geral', icon: LayoutDashboard },
  { id: 'evolucao', label: 'Evolucao', icon: TrendingUp },
  { id: 'regioes', label: 'Regioes', icon: MapPin },
  { id: 'categorias', label: 'Categorias', icon: Package },
  { id: 'produtos', label: 'Produtos', icon: Table2 },
  { id: 'previsoes', label: 'Previsoes', icon: LineChart },
  { id: 'mapa', label: 'Mapa', icon: Map }
];

export default function Tabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 p-1 bg-neutral-100 rounded-xl">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`tab-button flex items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
        >
          <tab.icon className="w-4 h-4" />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
