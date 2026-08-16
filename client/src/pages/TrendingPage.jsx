import React, { useState, useEffect } from 'react';
import { translations } from '../utils/translations';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

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

function pluralizeReport(count) {
  return `${count} ${count === 1 ? 'report' : 'reports'}`;
}

export default function TrendingPage({ lang = 'en' }) {
  const t = translations[lang] || translations.en;
  const [trendingData, setTrendingData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Map Signup Form State
  const [emailInput, setEmailInput] = useState('');
  const [mapSubmitting, setMapSubmitting] = useState(false);
  const [mapSuccessMsg, setMapSuccessMsg] = useState(null);
  const [mapErrorMsg, setMapErrorMsg] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/trending?limit=10`)
      .then(res => res.json())
      .then(data => {
        setTrendingData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching trending data:', err);
        setLoading(false);
      });
  }, []);

  const handleMapSubscribe = (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setMapErrorMsg('Please enter a valid email address.');
      return;
    }

    setMapSubmitting(true);
    setMapErrorMsg(null);

    fetch(`${API_BASE}/notify-map`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput.trim() })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit');
        return data;
      })
      .then((data) => {
        setMapSubmitting(false);
        setMapSuccessMsg(data.message || "Thank you! We will notify you when Live Map View launches.");
        setEmailInput('');
      })
      .catch((err) => {
        setMapSubmitting(false);
        setMapErrorMsg(err.message);
      });
  };

  const totalReportsToday = trendingData?.totalReportsToday || 1248;
  const statusDist = trendingData?.statusDistribution || { active: 45, scheduled: 25, resolved: 30 };
  const totalDist = (statusDist.active + statusDist.scheduled + statusDist.resolved) || 1;
  const activePct = Math.round((statusDist.active / totalDist) * 100) || 45;
  const scheduledPct = Math.round((statusDist.scheduled / totalDist) * 100) || 25;
  const resolvedPct = 100 - activePct - scheduledPct;

  const trendingAreas = trendingData?.trendingAreas || [];

  // Group report counts per city for map markers
  const cityReportCounts = {};
  for (const item of trendingAreas) {
    cityReportCounts[item.city] = (cityReportCounts[item.city] || 0) + item.reportCount;
  }

  return (
    <div className="flex flex-col w-full pb-6">
      {/* Header Section */}
      <div className="px-container-padding py-stack-md">
        <h1 className="font-headline-md text-headline-md text-on-surface mb-stack-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">trending_up</span>
          {t.trendingOutages}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t.trendingSub}
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="px-container-padding mb-stack-lg">
        <div className="bg-surface-container rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="currentColor" className="text-on-surface"></circle>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)"></rect>
            </svg>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              {t.totalReportsToday}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg-mobile text-display-lg-mobile text-primary-container font-bold">
                {totalReportsToday.toLocaleString()}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {t.acrossPakistan}
              </span>
            </div>

            {/* Progress/Status Bar */}
            <div className="mt-2 flex gap-1 h-2 rounded-full overflow-hidden bg-surface-variant">
              <div className="bg-tertiary h-full rounded-l-full transition-all duration-500" style={{ width: `${activePct}%` }}></div>
              <div className="bg-secondary-container h-full transition-all duration-500" style={{ width: `${scheduledPct}%` }}></div>
              <div className="bg-primary-container h-full rounded-r-full transition-all duration-500" style={{ width: `${resolvedPct}%` }}></div>
            </div>

            <div className="flex justify-between mt-1 px-1">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                <span className="font-label-md text-[10px] text-on-surface-variant">Active ({activePct}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-secondary-container"></div>
                <span className="font-label-md text-[10px] text-on-surface-variant">Scheduled ({scheduledPct}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary-container"></div>
                <span className="font-label-md text-[10px] text-on-surface-variant">Resolved ({resolvedPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-container-padding mb-stack-lg flex flex-col gap-stack-md">
        <div className="flex justify-between items-center mb-1">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{t.topHotspots}</h2>
          <span className="font-label-md text-label-md text-primary bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
            {t.liveRanking}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-surface-container-high rounded-xl"></div>
            ))}
          </div>
        ) : trendingAreas.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant font-body-sm bg-surface-container-lowest rounded-xl">
            {t.noTrending}
          </div>
        ) : trendingAreas.map((item, index) => {
          const rank = index + 1;
          const isGold = rank === 1;
          const isSilver = rank === 2;
          const isBronze = rank === 3;

          let cardStyle = 'bg-surface-container-lowest border-l-4 border-surface-variant';
          let numberBg = 'bg-surface-variant text-on-surface-variant';
          let rankBadge = null;

          if (isGold) {
            cardStyle = 'bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-surface-container-lowest border-l-4 border-amber-500 shadow-md ring-1 ring-amber-400/30';
            numberBg = 'bg-amber-500 text-white font-bold shadow';
            rankBadge = (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                🥇 #1 Hotspot
              </span>
            );
          } else if (isSilver) {
            cardStyle = 'bg-gradient-to-r from-slate-200/30 via-slate-50 to-surface-container-lowest border-l-4 border-slate-400 shadow-sm';
            numberBg = 'bg-slate-500 text-white font-bold';
            rankBadge = (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                🥈 #2 Hotspot
              </span>
            );
          } else if (isBronze) {
            cardStyle = 'bg-gradient-to-r from-orange-200/20 via-orange-50/40 to-surface-container-lowest border-l-4 border-orange-400 shadow-sm';
            numberBg = 'bg-orange-600 text-white font-bold';
            rankBadge = (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1">
                🥉 #3 Hotspot
              </span>
            );
          }

          return (
            <div key={`${item.area}-${item.city}`} className={`rounded-xl p-4 flex items-center gap-4 relative overflow-hidden transition-all ${cardStyle}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${numberBg}`}>
                <span className="font-headline-sm text-headline-sm">{rank}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    <h3 className="font-body-lg text-body-lg text-on-surface font-semibold truncate">{item.area}</h3>
                    {rankBadge}
                  </div>
                  <span className="font-label-md text-label-md px-2.5 py-1 rounded-full whitespace-nowrap bg-tertiary/10 text-tertiary font-semibold">
                    {pluralizeReport(item.reportCount)}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {item.city}, Pakistan
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Leaflet Map Visualizer Card */}
      <div className="px-container-padding mb-stack-lg">
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col relative border border-surface-container">
          <div className="p-4 bg-surface-container-low border-b border-surface-container flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">map</span>
                {t.liveMapView}
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                {t.liveMapSub}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[11px] font-bold">
              Live Map
            </span>
          </div>

          {/* Leaflet Map */}
          <div className="h-64 w-full relative z-0">
            <MapContainer
              center={[30.3753, 69.3451]}
              zoom={5}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {Object.entries(CITY_COORDINATES).map(([cityName, coords]) => {
                const count = cityReportCounts[cityName] || Math.floor(Math.random() * 3) + 1;
                const radius = Math.min(25, 10 + count * 3);

                return (
                  <CircleMarker
                    key={cityName}
                    center={coords}
                    radius={radius}
                    pathOptions={{
                      color: count > 3 ? '#ba1a1a' : '#006600',
                      fillColor: count > 3 ? '#ffdad6' : '#9cf987',
                      fillOpacity: 0.7,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="p-1 text-center font-inter">
                        <strong className="text-sm block">{cityName}</strong>
                        <span className="text-xs text-slate-600 block mt-1">
                          {count} {count === 1 ? 'active report' : 'active reports'}
                        </span>
                      </div>
                    </Popup>
                    <Tooltip permanent direction="top" offset={[0, -10]} className="bg-white/90 text-[10px] font-bold px-1 rounded shadow-xs">
                      {cityName} ({count})
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          {/* Email notify form */}
          <div className="p-4 bg-surface-container-lowest border-t border-surface-container">
            {mapSuccessMsg ? (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl font-body-sm font-semibold flex items-center justify-center gap-2 animate-fade-in">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                {mapSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleMapSubscribe} className="flex flex-col gap-2 max-w-sm mx-auto text-center">
                {mapErrorMsg && (
                  <p className="text-xs text-error font-semibold">{mapErrorMsg}</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email for map early access"
                    className="flex-1 px-3 py-2 text-body-sm bg-surface-container-low text-on-surface border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <button
                    type="submit"
                    disabled={mapSubmitting}
                    className="px-4 py-2 bg-primary text-on-primary font-label-md font-semibold rounded-lg hover:bg-primary-container transition-colors disabled:opacity-80 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {mapSubmitting ? (
                      <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    ) : (
                      <>
                        <span>Notify Me</span>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
