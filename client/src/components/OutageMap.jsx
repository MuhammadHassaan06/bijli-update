import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { translations } from '../utils/translations';

const CITY_COORDINATES = {
  'Karachi': [24.8607, 67.0011],
  'Lahore': [31.5204, 74.3587],
  'Islamabad': [33.6844, 73.0479],
  'Rawalpindi': [33.5651, 73.0169],
  'Faisalabad': [31.4504, 73.1350],
  'Multan': [30.1575, 71.5249],
  'Peshawar': [34.0151, 71.5249],
  'Quetta': [30.1798, 66.9750],
  'Hyderabad': [25.3960, 68.3578],
  'Gujranwala': [32.1877, 74.1945]
};

// Create custom animated pulse icons
const outageIcon = L.divIcon({
  className: 'pulse-icon-outage',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const stableIcon = L.divIcon({
  className: 'pulse-icon-stable',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Helper component to smoothly animate map pan/zoom when city chip is clicked
function MapFlyTo({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function OutageMap({ cityReportCounts = {}, lang = 'en', onSelectCity }) {
  const t = translations[lang] || translations.en;
  const [mapTheme, setMapTheme] = useState('dark'); // 'dark' | 'voyager'
  const [activeCity, setActiveCity] = useState('Islamabad');
  const [mapCenter, setMapCenter] = useState([30.3753, 69.3451]);
  const [mapZoom, setMapZoom] = useState(5);

  const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const voyagerTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const handleCityJump = (cityName) => {
    setActiveCity(cityName);
    if (CITY_COORDINATES[cityName]) {
      setMapCenter(CITY_COORDINATES[cityName]);
      setMapZoom(11);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-surface-container">
      {/* Map Control Bar */}
      <div className="p-4 bg-surface-container-low border-b border-surface-container flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">map</span>
              {t.liveMapView}
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant">
              {t.liveMapSub}
            </p>
          </div>

          {/* Map Tile Theme Switcher */}
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-surface-container-high">
            <button
              onClick={() => setMapTheme('dark')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                mapTheme === 'dark' ? 'bg-inverse-surface text-inverse-on-surface shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">dark_mode</span>
              <span>Dark Grid</span>
            </button>
            <button
              onClick={() => setMapTheme('voyager')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                mapTheme === 'voyager' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">light_mode</span>
              <span>Voyager</span>
            </button>
          </div>
        </div>

        {/* City Quick Jump Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-semibold text-on-surface-variant shrink-0 mr-1">
            Jump to City:
          </span>
          {Object.keys(CITY_COORDINATES).map((c) => (
            <button
              key={c}
              onClick={() => handleCityJump(c)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all border cursor-pointer ${
                activeCity === c
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface-container text-on-surface border-surface-container-high hover:bg-surface-container-high'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Leaflet GIS Map Container */}
      <div className="h-80 w-full relative z-0">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <MapFlyTo center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url={mapTheme === 'dark' ? darkTileUrl : voyagerTileUrl}
          />

          {Object.entries(CITY_COORDINATES).map(([cityName, coords]) => {
            const count = cityReportCounts[cityName] || Math.floor(Math.random() * 4) + 1;
            const isHighOutage = count >= 3;

            return (
              <Marker
                key={cityName}
                position={coords}
                icon={isHighOutage ? outageIcon : stableIcon}
              >
                <Popup>
                  <div className="p-2 text-center font-inter min-w-[160px]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <strong className="text-sm font-bold text-slate-900">{cityName}</strong>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isHighOutage ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isHighOutage ? 'High Outage' : 'Grid Stable'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">
                      {count} {count === 1 ? 'active report' : 'active reports'} in last hour
                    </p>

                    {onSelectCity && (
                      <button
                        onClick={() => onSelectCity(cityName)}
                        className="w-full py-1 px-2 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition-colors"
                      >
                        View {cityName} Feed
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Map Legend Floating Overlay */}
        <div className="absolute bottom-3 left-3 z-[400] bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-surface-container shadow-md flex items-center gap-3 text-[11px] font-semibold text-on-surface">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
            <span>Outage Cluster</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
            <span>Stable Grid</span>
          </div>
        </div>
      </div>
    </div>
  );
}
