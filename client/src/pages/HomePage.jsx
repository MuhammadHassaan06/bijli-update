import React, { useState, useEffect } from 'react';
import { translations } from '../utils/translations';
import { playOutageAlertSound, playRestoredSound, playClickSound } from '../utils/audio';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'just now';
  const reportDate = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
  const now = new Date();
  const diffSec = Math.floor((now - reportDate) / 1000);
  if (isNaN(diffSec) || diffSec < 45) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return `${Math.floor(diffHr / 24)} d ago`;
}

function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default function HomePage({ lang = 'en', selectedCity = 'Karachi', setSelectedCity, onOpenHelpline }) {
  const t = translations[lang] || translations.en;

  const [cities, setCities] = useState([
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Gujranwala'
  ]);
  const [areaInput, setAreaInput] = useState(() => localStorage.getItem('bijli_area') || '');
  const [popularAreas, setPopularAreas] = useState([]);

  // Selected duration for outage reporting
  const [selectedDuration, setSelectedDuration] = useState('1 Hour');
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const [reports, setReports] = useState([]);
  const [aggregate, setAggregate] = useState({
    outageCount: 0,
    restoredCount: 0,
    netStatus: 'Stable',
    confidence: 'STABLE',
    recentOutageCount: 0
  });
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [apiError, setApiError] = useState(false);

  // Button loading states: 'outage' | 'restored' | null
  const [submittingType, setSubmittingType] = useState(null);
  const [successType, setSuccessType] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Restore saved city on load
  useEffect(() => {
    const savedCity = localStorage.getItem('bijli_city');
    if (savedCity && setSelectedCity) {
      setSelectedCity(savedCity);
    }
  }, []);

  // Save selected city & area to localStorage
  useEffect(() => {
    if (selectedCity) {
      localStorage.setItem('bijli_city', selectedCity);
    }
  }, [selectedCity]);

  useEffect(() => {
    localStorage.setItem('bijli_area', areaInput);
  }, [areaInput]);

  // Fetch Cities
  useEffect(() => {
    fetch(`${API_BASE}/cities`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCities(data);
      })
      .catch(err => console.error('Failed to load cities:', err));
  }, []);

  // Fetch Popular Areas for Selected City
  useEffect(() => {
    if (selectedCity) {
      fetch(`${API_BASE}/popular-areas?city=${encodeURIComponent(selectedCity)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setPopularAreas(data);
        })
        .catch(err => console.error('Failed to load popular areas:', err));
    }
  }, [selectedCity]);

  // Fetch Reports function (Single Source of Truth)
  const fetchReports = () => {
    setApiError(false);
    let url = `${API_BASE}/reports?hours=24`;
    if (selectedCity) url += `&city=${encodeURIComponent(selectedCity)}`;
    if (areaInput.trim()) url += `&area=${encodeURIComponent(areaInput.trim())}`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('API server unavailable');
        return res.json();
      })
      .then(data => {
        if (data.reports) setReports(data.reports);
        if (data.aggregate) setAggregate(data.aggregate);
        setLoadingFeed(false);
      })
      .catch(err => {
        console.error('Error fetching reports:', err);
        setApiError(true);
        setLoadingFeed(false);
      });
  };

  // Poll reports every 30s
  useEffect(() => {
    setLoadingFeed(true);
    fetchReports();
    const interval = setInterval(() => {
      fetchReports();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedCity, areaInput]);

  // Handle reporting
  const handleReport = (type) => {
    const areaToReport = areaInput.trim() || 'General Area';
    const status = type === 'outage' ? 'OUTAGE' : 'RESTORED';

    setSubmittingType(type);
    setToastMessage(null);

    if (type === 'outage') {
      playOutageAlertSound();
    } else {
      playRestoredSound();
    }

    fetch(`${API_BASE}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: selectedCity,
        area: areaToReport,
        status: status,
        duration: type === 'outage' ? selectedDuration : 'Resolved'
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to submit report');
        }
        return data;
      })
      .then(() => {
        setSubmittingType(null);
        setSuccessType(type);
        fetchReports();

        setTimeout(() => {
          setSuccessType(null);
        }, 2000);
      })
      .catch(err => {
        setSubmittingType(null);
        setToastMessage(err.message);
        setTimeout(() => setToastMessage(null), 4000);
      });
  };

  const isHighAlert = aggregate.netStatus === 'Likely Outage';
  const displayLocation = areaInput.trim() ? `${areaInput.trim()} (${selectedCity})` : selectedCity;

  const handleShareWhatsApp = () => {
    playClickSound();
    const statusText = isHighAlert
      ? `🔴 Bijli Outage Alert in ${displayLocation}! Active load shedding reported.`
      : `🟢 Bijli Status Update: Grid in ${displayLocation} is reported stable.`;

    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${statusText}\n\nTrack live updates & report power status on Bijli Update:\n${window.location.origin}`)}`;
    window.open(shareUrl, '_blank');
  };

  // Filter autocomplete options based on user input
  const filteredAutocomplete = popularAreas.filter(a =>
    a.toLowerCase().includes(areaInput.toLowerCase().trim())
  );

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Toast Alert for Rate Limit / Error */}
      {toastMessage && (
        <div className="fixed top-20 left-4 right-4 z-50 bg-error text-on-error px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            <span className="font-body-sm text-body-sm font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-on-error opacity-80 hover:opacity-100 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <div className="px-container-padding py-stack-lg bg-surface flex flex-col gap-stack-lg">
        {/* Header Section */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-bold">
              {t.stayUpdated.replace('{city}', selectedCity)}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t.subtitle}
            </p>
          </div>

          {/* Quick Helpline trigger button */}
          <button
            onClick={() => {
              playClickSound();
              if (onOpenHelpline) onOpenHelpline();
            }}
            className="shrink-0 p-2.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl flex flex-col items-center justify-center hover:bg-amber-200 transition-colors shadow-xs cursor-pointer"
            title={t.discoHelpline}
          >
            <span className="material-symbols-outlined text-[22px] text-amber-700">headset_mic</span>
            <span className="text-[10px] font-bold mt-0.5">{t.discoHelpline}</span>
          </button>
        </div>

        {/* Selection Area */}
        <div className="flex flex-col gap-stack-md bg-surface-container-lowest p-gutter rounded-xl shadow-sm border border-surface-container relative">
          <div className="flex flex-col gap-stack-sm">
            <label className="font-label-md text-label-md text-on-surface font-bold" htmlFor="city-select">{t.cityLabel}</label>
            <div className="relative">
              <select
                id="city-select"
                value={selectedCity}
                onChange={(e) => {
                  playClickSound();
                  setSelectedCity(e.target.value);
                  setAreaInput('');
                }}
                className="w-full appearance-none bg-surface-container-low text-on-surface font-body-md text-body-md p-stack-md pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors cursor-pointer"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-stack-sm relative">
            <label className="font-label-md text-label-md text-on-surface font-bold" htmlFor="area-input">{t.areaLabel}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                id="area-input"
                type="text"
                value={areaInput}
                onFocus={() => setShowAutocomplete(true)}
                onChange={(e) => {
                  setAreaInput(e.target.value);
                  setShowAutocomplete(true);
                }}
                placeholder={t.areaPlaceholder}
                className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md p-stack-md pl-12 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors"
              />
              {areaInput && (
                <button
                  onClick={() => {
                    playClickSound();
                    setAreaInput('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                </button>
              )}
            </div>

            {/* Search Autocomplete Dropdown */}
            {showAutocomplete && areaInput.trim() && filteredAutocomplete.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-xl overflow-hidden divide-y divide-surface-container">
                {filteredAutocomplete.map((areaName) => (
                  <button
                    key={areaName}
                    onClick={() => {
                      playClickSound();
                      setAreaInput(areaName);
                      setShowAutocomplete(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-body-sm font-semibold text-on-surface hover:bg-surface-container-low flex items-center justify-between transition-colors"
                  >
                    <span>{areaName}</span>
                    <span className="text-[10px] text-primary font-bold px-2 py-0.5 rounded bg-primary/10">Select</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Area Quick Filter Chips */}
            {popularAreas.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] font-semibold text-on-surface-variant opacity-80 mr-1">
                  {t.popularAreas}
                </span>
                {popularAreas.map((areaName) => (
                  <button
                    key={areaName}
                    onClick={() => {
                      playClickSound();
                      setAreaInput(areaName === areaInput ? '' : areaName);
                      setShowAutocomplete(false);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border cursor-pointer ${
                      areaInput.toLowerCase() === areaName.toLowerCase()
                        ? 'bg-primary text-on-primary border-primary shadow-xs font-semibold'
                        : 'bg-surface-container-low text-on-surface-variant border-surface-container-high hover:bg-surface-container'
                    }`}
                  >
                    {areaName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Outage Duration Selector Chips */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-container">
            <span className="text-[11px] font-bold text-on-surface-variant">
              Expected Outage Duration Tag:
            </span>
            <div className="flex gap-2">
              {['1 Hour', '2 Hours', '3+ Hours', 'Unscheduled'].map((dur) => (
                <button
                  key={dur}
                  onClick={() => {
                    playClickSound();
                    setSelectedDuration(dur);
                  }}
                  className={`flex-1 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    selectedDuration === dur
                      ? 'bg-tertiary text-on-tertiary border-tertiary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant border-surface-container-high hover:bg-surface-container'
                  }`}
                >
                  {dur}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reporting Buttons */}
        <div className="flex flex-col sm:flex-row gap-stack-md">
          {/* Outage Button */}
          <button
            onClick={() => handleReport('outage')}
            disabled={submittingType !== null}
            className="flex-1 bg-error text-on-error p-stack-lg rounded-xl flex flex-col items-center justify-center gap-stack-sm shadow-md active:scale-95 transition-transform disabled:opacity-80 cursor-pointer"
          >
            {submittingType === 'outage' ? (
              <>
                <span className="material-symbols-outlined text-[32px] animate-spin">refresh</span>
                <span className="font-headline-sm text-headline-sm">{t.sending}</span>
              </>
            ) : successType === 'outage' ? (
              <>
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                <span className="font-headline-sm text-headline-sm">{t.reported}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                <span className="font-headline-sm text-headline-sm">{t.reportOutage}</span>
                <span className="font-label-md text-label-md opacity-80">{t.reportOutageSub} ({selectedDuration})</span>
              </>
            )}
          </button>

          {/* Restored Button */}
          <button
            onClick={() => handleReport('restored')}
            disabled={submittingType !== null}
            className="flex-1 bg-primary text-on-primary p-stack-lg rounded-xl flex flex-col items-center justify-center gap-stack-sm shadow-md active:scale-95 transition-transform disabled:opacity-80 cursor-pointer"
          >
            {submittingType === 'restored' ? (
              <>
                <span className="material-symbols-outlined text-[32px] animate-spin">refresh</span>
                <span className="font-headline-sm text-headline-sm">{t.sending}</span>
              </>
            ) : successType === 'restored' ? (
              <>
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                <span className="font-headline-sm text-headline-sm">{t.reported}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-headline-sm text-headline-sm">{t.reportRestored}</span>
                <span className="font-label-md text-label-md opacity-80">{t.reportRestoredSub}</span>
              </>
            )}
          </button>
        </div>

        {/* Live Status Banner */}
        <div className="bg-surface-container-lowest rounded-xl p-gutter shadow-sm flex flex-col gap-3 relative overflow-hidden border border-surface-container">
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${isHighAlert ? 'bg-error' : 'bg-primary'}`}></div>

          <div className="flex items-start gap-stack-md">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isHighAlert ? 'bg-error-container text-error' : 'bg-primary-container/20 text-primary'}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isHighAlert ? 'warning' : 'check_circle'}
              </span>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  {isHighAlert
                    ? t.highAlert.replace('{location}', displayLocation)
                    : t.gridStable.replace('{location}', displayLocation)}
                </h3>
                {/* Confidence Badge */}
                {isHighAlert && (
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                    aggregate.confidence === 'CONFIRMED'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    <span className="material-symbols-outlined text-[12px]">
                      {aggregate.confidence === 'CONFIRMED' ? 'verified' : 'help_outline'}
                    </span>
                    {aggregate.confidence === 'CONFIRMED' ? t.confirmedOutage : t.unverifiedReport}
                  </span>
                )}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {isHighAlert
                  ? t.recentOutageDesc.replace('{count}', pluralize(aggregate.recentOutageCount || 1, 'outage report', 'outage reports'))
                  : t.gridStableDesc}
              </p>
            </div>
          </div>

          {/* 1-Tap WhatsApp Share Button */}
          <div className="pt-2 border-t border-surface-container flex justify-end">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-body-sm font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span>{t.shareWhatsApp}</span>
            </button>
          </div>
        </div>

        {/* API Error State Banner */}
        {apiError && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">wifi_off</span>
              <span className="font-body-sm font-semibold">Unable to connect to backend server.</span>
            </div>
            <button
              onClick={fetchReports}
              className="px-3 py-1 bg-amber-600 text-white text-body-sm rounded-lg font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Recent Activity Feed */}
        <div className="flex flex-col gap-stack-md mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">{t.liveFeed}</h2>
            <span className="flex items-center gap-1 font-label-md text-label-md text-primary bg-primary-container/10 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {t.liveTag}
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col divide-y divide-surface-container-highest overflow-hidden border border-surface-container">
            {loadingFeed ? (
              <div className="p-gutter flex flex-col gap-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high"></div>
                      <div className="flex flex-col gap-1">
                        <div className="w-32 h-4 bg-surface-container-high rounded"></div>
                        <div className="w-20 h-3 bg-surface-container-high rounded"></div>
                      </div>
                    </div>
                    <div className="w-16 h-3 bg-surface-container-high rounded"></div>
                  </div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-3 text-on-surface-variant">
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">power_off</span>
                </div>
                <div>
                  <p className="font-body-md text-on-surface font-semibold">
                    {t.noReports.replace('{location}', displayLocation)}
                  </p>
                  <p className="font-body-sm text-on-surface-variant mt-1">{t.beFirst}</p>
                </div>
              </div>
            ) : (
              reports.map((item) => {
                const isOutage = item.status === 'OUTAGE';
                const isConfirmed = item.confidence === 'CONFIRMED';
                return (
                  <div key={item.id} className="p-gutter flex items-center justify-between">
                    <div className="flex items-center gap-stack-md min-w-0">
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${isOutage ? 'bg-error-container text-error' : 'bg-primary-container/20 text-primary'}`}>
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {isOutage ? 'bolt' : 'check_circle'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-body-md text-body-md text-on-surface font-semibold truncate">
                            {item.area} <span className="text-on-surface-variant font-normal text-body-sm">({item.city})</span>
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {isConfirmed ? t.confirmed : t.unverified}
                          </span>
                          {item.duration && isOutage && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              ⏱️ {item.duration}
                            </span>
                          )}
                        </div>
                        <span className={`font-label-md text-label-md ${isOutage ? 'text-error' : 'text-primary'}`}>
                          {isOutage ? t.outageReported : t.powerRestored}
                        </span>
                      </div>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant shrink-0 ml-2">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
