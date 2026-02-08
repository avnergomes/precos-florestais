import { useEffect, useRef, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/format';

export default function MapChart({ aggregations, geoData, onRegiaoClick, selectedRegiao }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const regionData = useMemo(() => {
    if (!aggregations?.byRegiao) return {};
    const map = {};
    Object.entries(aggregations.byRegiao).forEach(([regiao, data]) => {
      map[regiao] = {
        media: data.media,
        count: data.count
      };
    });
    return map;
  }, [aggregations]);

  const { minVal, maxVal } = useMemo(() => {
    if (!aggregations?.byRegiao) return { minVal: 0, maxVal: 1 };
    const values = Object.values(aggregations.byRegiao)
      .filter(d => d.media > 0)
      .map(d => d.media);
    if (values.length === 0) return { minVal: 0, maxVal: 1 };
    return {
      minVal: Math.min(...values),
      maxVal: Math.max(...values),
    };
  }, [aggregations]);

  // Color gradient (forest green theme)
  const colorGradient = useMemo(() => [
    '#dcfce7', // very light green
    '#bbf7d0', // light green
    '#86efac', // medium-light green
    '#4ade80', // medium green
    '#22c55e', // bright green
    '#16a34a', // dark green
    '#166534', // very dark green
  ], []);

  useEffect(() => {
    if (!mapRef.current || !geoData || mapInstanceRef.current) return;

    setIsLoading(true);

    // Dynamically import Leaflet
    import('leaflet').then(L => {
      // Fix for default marker icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Initialize map
      const map = L.map(mapRef.current, {
        center: [-24.5, -51.5],
        zoom: 7,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Add tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 18
      }).addTo(map);

      mapInstanceRef.current = map;
      setIsLoading(false);
    }).catch(err => {
      console.error('Error loading Leaflet:', err);
      setIsLoading(false);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [geoData]);

  useEffect(() => {
    if (!mapInstanceRef.current || !geoData) return;

    import('leaflet').then(L => {
      // Remove existing layer
      if (layerRef.current) {
        mapInstanceRef.current.removeLayer(layerRef.current);
      }

      const getColor = (value) => {
        if (!value || value === 0) return '#f3f4f6';

        const normalized = (value - minVal) / (maxVal - minVal || 1);
        const index = Math.min(Math.floor(normalized * colorGradient.length), colorGradient.length - 1);
        return colorGradient[index];
      };

      const style = (feature) => {
        const regiao = feature.properties?.regiao;
        const rData = regionData[regiao];
        const value = rData ? rData.media : 0;
        const isSelected = selectedRegiao && regiao === selectedRegiao;
        const hasSelection = !!selectedRegiao;

        return {
          fillColor: getColor(value),
          weight: isSelected ? 3 : 2,
          opacity: 1,
          color: isSelected ? '#1f2937' : '#ffffff',
          fillOpacity: hasSelection ? (isSelected ? 0.95 : 0.4) : 0.8,
        };
      };

      const onEachFeature = (feature, layer) => {
        const regiao = feature.properties?.regiao || 'Desconhecido';
        const numMunicipios = feature.properties?.num_municipios || 0;
        const rData = regionData[regiao];

        const media = rData?.media || 0;
        const count = rData?.count || 0;

        layer.bindTooltip(`
          <div style="font-family: system-ui; min-width: 180px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #166534;">${regiao}</div>
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">${numMunicipios} municípios</div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
              <span style="color: #6b7280;">Preço Médio:</span>
              <span style="font-weight: 600; color: #166534;">${formatCurrency(media)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="color: #6b7280;">Registros:</span>
              <span style="font-weight: 500; color: #374151;">${formatNumber(count, 0)}</span>
            </div>
          </div>
        `, {
          className: 'custom-tooltip',
          sticky: true,
        });

        layer.on({
          mouseover: (e) => {
            e.target.setStyle({
              weight: 3,
              color: '#166534',
              fillOpacity: 0.9,
            });
          },
          mouseout: (e) => {
            layerRef.current.resetStyle(e.target);
          },
          click: () => {
            if (onRegiaoClick) {
              onRegiaoClick(regiao);
            }
          },
        });
      };

      const geoLayer = L.geoJSON(geoData, {
        style,
        onEachFeature,
      }).addTo(mapInstanceRef.current);

      layerRef.current = geoLayer;

      // Fit bounds to GeoJSON
      try {
        const bounds = geoLayer.getBounds();
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (e) {
        console.warn('Could not fit bounds:', e);
      }
    });
  }, [geoData, regionData, minVal, maxVal, colorGradient, onRegiaoClick, selectedRegiao]);

  return (
    <div className="chart-container">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-forest-100 rounded-lg">
          <MapPin className="w-5 h-5 text-forest-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-800">
          Mapa de Preços por Região
        </h3>
      </div>

      <div
        ref={mapRef}
        className="h-[500px] rounded-xl overflow-hidden border border-neutral-200 relative"
        style={{ background: '#f8fafc' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100/80 z-10">
            <div className="text-neutral-500">Carregando mapa...</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <span className="text-xs text-neutral-500">Menor preço</span>
        <div className="flex h-3 rounded overflow-hidden shadow-sm">
          {colorGradient.map((color, i) => (
            <div key={i} className="w-8 h-full" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span className="text-xs text-neutral-500">Maior preço</span>
      </div>

      <p className="text-xs text-neutral-400 text-center mt-2">
        Passe o mouse para ver detalhes • Clique para filtrar
      </p>
    </div>
  );
}
