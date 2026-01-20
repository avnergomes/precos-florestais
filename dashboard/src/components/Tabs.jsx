import { LayoutDashboard, TrendingUp, MapPin, Package, Table2, Map, DollarSign } from 'lucide-react';

const tabs = [
  { id: 'preco-atual', label: 'Preço Atual', icon: DollarSign },
  { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'evolucao', label: 'Evolução', icon: TrendingUp },
  { id: 'regioes', label: 'Regiões', icon: MapPin },
  { id: 'categorias', label: 'Categorias', icon: Package },
  { id: 'produtos', label: 'Produtos', icon: Table2 },
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
