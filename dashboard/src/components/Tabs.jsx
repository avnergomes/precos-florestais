import { useRef, useEffect, useState } from 'react';
import { LayoutDashboard, TrendingUp, MapPin, Package, Table2, Map, DollarSign, LineChart, ChevronLeft, ChevronRight } from 'lucide-react';

const tabs = [
  { id: 'preco-atual', label: 'Preço Atual', icon: DollarSign },
  { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'evolucao', label: 'Evolução', icon: TrendingUp },
  { id: 'regioes', label: 'Regiões', icon: MapPin },
  { id: 'categorias', label: 'Categorias', icon: Package },
  { id: 'produtos', label: 'Produtos', icon: Table2 },
  { id: 'previsoes', label: 'Previsões', icon: LineChart },
  { id: 'mapa', label: 'Mapa', icon: Map }
];

export default function Tabs({ activeTab, setActiveTab }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 150, behavior: 'smooth' });
  };

  return (
    <div className="relative mb-6" role="tablist">
      {canScrollLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/90 rounded-full shadow-md sm:hidden"
          aria-label="Rolar para esquerda"
        >
          <ChevronLeft className="w-4 h-4 text-forest-600" />
        </button>
      )}
      <div
        ref={scrollRef}
        className="flex gap-2 p-1 bg-neutral-100 rounded-xl overflow-x-auto scrollbar-thin"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button flex items-center gap-2 whitespace-nowrap transition-transform duration-200 ${
              activeTab === tab.id ? 'active scale-[1.02]' : ''
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/90 rounded-full shadow-md sm:hidden"
          aria-label="Rolar para direita"
        >
          <ChevronRight className="w-4 h-4 text-forest-600" />
        </button>
      )}
    </div>
  );
}
