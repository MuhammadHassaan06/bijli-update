import React, { useState, useEffect } from 'react';
import { translations } from '../utils/translations';
import OutageMap from '../components/OutageMap';
import SubscribeCard from '../components/SubscribeCard';
import { apiFetch } from '../utils/api';

function pluralizeReport(count) {
  return `${count} ${count === 1 ? 'report' : 'reports'}`;
}

export default function TrendingPage({ lang = 'en', onSelectCity }) {
  const t = translations[lang] || translations.en;
  const [trendingData, setTrendingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCityFilter, setSelectedCityFilter] = useState('All');

  // Map Signup Form State
  const [emailInput, setEmailInput] = useState('');
  const [mapSubmitting, setMapSubmitting] = useState(false);
  const [mapSuccessMsg, setMapSuccessMsg] = useState(null);
  const [mapErrorMsg, setMapErrorMsg] = useState(null);

  useEffect(() => {
    apiFetch('/trending?limit=15')
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

    apiFetch('/notify-map', {
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

  const rawTrendingAreas = trendingData?.trendingAreas || [];

  // Group report counts per city for map markers
  const cityReportCounts = {};
  for (const item of rawTrendingAreas) {
    cityReportCounts[item.city] = (cityReportCounts[item.city] || 0) + item.reportCount;
  }

  // Filter leaderboard by selected city
  const filteredTrendingAreas = selectedCityFilter === 'All'
    ? rawTrendingAreas
    : rawTrendingAreas.filter(a => a.city.toLowerCase() === selectedCityFilter.toLowerCase());

  const availableCities = ['All', ...new Set(rawTrendingAreas.map(a => a.city))];

  return (
    <div className="flex flex-col w-full pb-6">
      {/* Header Section */}
      <div className="px-container-padding py-stack-md">
        <h1 className="font-headline-md text-headline-md text-on-surface mb-stack-sm flex items-center gap-2 font-bold">
          <span className="material-symbols-outlined text-tertiary">trending_up</span>
          {t.trendingOutages}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t.trendingSub}
        </p>
      </div>

      {/* Realistic GIS Outage Map */}
      <div className="px-container-padding mb-stack-lg">
        <OutageMap
          cityReportCounts={cityReportCounts}
          lang={lang}
          onSelectCity={onSelectCity}
        />
      </div>

      {/* Summary Statistics */}
      <div className="px-container-padding mb-stack-lg">
        <div className="bg-surface-container rounded-xl p-4 shadow-sm relative overflow-hidden border border-surface-container">
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
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">
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
            <div className="mt-2 flex gap-1 h-2.5 rounded-full overflow-hidden bg-surface-variant">
              <div className="bg-tertiary h-full rounded-l-full transition-all duration-500" style={{ width: `${activePct}%` }}></div>
              <div className="bg-secondary-container h-full transition-all duration-500" style={{ width: `${scheduledPct}%` }}></div>
              <div className="bg-primary-container h-full rounded-r-full transition-all duration-500" style={{ width: `${resolvedPct}%` }}></div>
            </div>

            <div className="flex justify-between mt-1 px-1">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-tertiary"></div>
                <span className="font-label-md text-[11px] text-on-surface-variant font-semibold">Active ({activePct}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary-container"></div>
                <span className="font-label-md text-[11px] text-on-surface-variant font-semibold">Scheduled ({scheduledPct}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-container"></div>
                <span className="font-label-md text-[11px] text-on-surface-variant font-semibold">Resolved ({resolvedPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-container-padding mb-stack-lg flex flex-col gap-stack-md">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{t.topHotspots}</h2>
            <span className="font-label-md text-label-md text-primary bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
              {t.liveRanking}
            </span>
          </div>

          {/* City Filter Tabs */}
          {availableCities.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {availableCities.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCityFilter(c)}
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all border cursor-pointer ${
                    selectedCityFilter === c
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface-container-lowest text-on-surface-variant border-surface-container-high hover:bg-surface-container'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-surface-container-high rounded-xl"></div>
            ))}
          </div>
        ) : filteredTrendingAreas.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant font-body-sm bg-surface-container-lowest rounded-xl border border-surface-container">
            {t.noTrending}
          </div>
        ) : filteredTrendingAreas.map((item, index) => {
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

          const isRising = item.reportCount >= 4;

          return (
            <div key={`${item.area}-${item.city}`} className={`rounded-xl p-4 flex items-center gap-4 relative overflow-hidden transition-all ${cardStyle}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${numberBg}`}>
                <span className="font-headline-sm text-headline-sm font-bold">{rank}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    <h3 className="font-body-lg text-body-lg text-on-surface font-bold truncate">{item.area}</h3>
                    {rankBadge}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isRising ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 flex items-center gap-0.5">
                        📈 Outages Rising
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                        📉 Stable Trend
                      </span>
                    )}
                    <span className="font-label-md text-label-md px-2.5 py-1 rounded-full whitespace-nowrap bg-tertiary/10 text-tertiary font-bold">
                      {pluralizeReport(item.reportCount)}
                    </span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {item.city}, Pakistan
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Outage Alerts & Push Notifications Subscription Card */}
      <div className="px-container-padding mb-stack-lg">
        <SubscribeCard lang={lang} />
      </div>
    </div>
  );
}
