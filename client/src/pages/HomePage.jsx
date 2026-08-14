import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

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

export default function HomePage() {
  const [cities, setCities] = useState([
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Gujranwala'
  ]);
  const [selectedCity, setSelectedCity] = useState('Karachi');
  const [areaInput, setAreaInput] = useState('');
  
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

  // Fetch Cities
  useEffect(() => {
    fetch(`${API_BASE}/cities`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCities(data);
      })
      .catch(err => console.error('Failed to load cities:', err));
  }, []);

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

    fetch(`${API_BASE}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: selectedCity,
        area: areaToReport,
        status: status
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

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Toast Alert for Rate Limit / Error */}
      {toastMessage && (
        <div className="fixed top-20 left-4 right-4 z-50 bg-error text-on-error px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            <span className="font-body-sm text-body-sm font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-on-error opacity-80 hover:opacity-100">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <div className="px-container-padding py-stack-lg bg-surface flex flex-col gap-stack-lg">
        {/* Header Section (Issue #4 Placeholder Text Fix) */}
        <div className="flex flex-col gap-stack-sm">
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface">
            Stay Updated in {selectedCity} 🇵🇰
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Hyperlocal crowdsourced power status tracker.
          </p>
        </div>

        {/* Selection Area */}
        <div className="flex flex-col gap-stack-md bg-surface-container-lowest p-gutter rounded-xl shadow-sm">
          <div className="flex flex-col gap-stack-sm">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="city-select">City</label>
            <div className="relative">
              <select
                id="city-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
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

          <div className="flex flex-col gap-stack-sm">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="area-input">Area/Sector/Mohalla</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                id="area-input"
                type="text"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                placeholder="e.g. G-11, DHA Phase 5, Gulshan-e-Iqbal"
                className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md p-stack-md pl-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors"
              />
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
                <span className="font-headline-sm text-headline-sm">Sending...</span>
              </>
            ) : successType === 'outage' ? (
              <>
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                <span className="font-headline-sm text-headline-sm">Reported!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                <span className="font-headline-sm text-headline-sm">Bijli Chali Gayi</span>
                <span className="font-label-md text-label-md opacity-80">Report Outage</span>
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
                <span className="font-headline-sm text-headline-sm">Sending...</span>
              </>
            ) : successType === 'restored' ? (
              <>
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                <span className="font-headline-sm text-headline-sm">Reported!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-headline-sm text-headline-sm">Bijli Aa Gayi</span>
                <span className="font-label-md text-label-md opacity-80">Report Restored</span>
              </>
            )}
          </button>
        </div>

        {/* Live Status Banner (Single Source of Truth - Issue #1) */}
        <div className="bg-surface-container-lowest rounded-xl p-gutter shadow-sm flex items-start gap-stack-md relative overflow-hidden">
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${isHighAlert ? 'bg-error' : 'bg-primary'}`}></div>
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isHighAlert ? 'bg-error-container text-error' : 'bg-primary-container/20 text-primary'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isHighAlert ? 'warning' : 'check_circle'}
            </span>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                {isHighAlert ? `🔴 High Alert in ${displayLocation}` : `🟢 Grid Stable in ${displayLocation}`}
              </h3>
              {/* Confidence Badge (Issue #7) */}
              {isHighAlert && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                  aggregate.confidence === 'CONFIRMED'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  <span className="material-symbols-outlined text-[12px]">
                    {aggregate.confidence === 'CONFIRMED' ? 'verified' : 'help_outline'}
                  </span>
                  {aggregate.confidence === 'CONFIRMED' ? 'Confirmed Outage' : 'Unverified Report'}
                </span>
              )}
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {isHighAlert
                ? `${pluralize(aggregate.recentOutageCount || 1, 'outage report', 'outage reports')} in the last hour.`
                : `Power grid operating normally based on recent community updates.`}
            </p>
          </div>
        </div>

        {/* API Error State Banner (Issue #8) */}
        {apiError && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">wifi_off</span>
              <span className="font-body-sm font-semibold">Unable to connect to backend server.</span>
            </div>
            <button
              onClick={fetchReports}
              className="px-3 py-1 bg-amber-600 text-white text-body-sm rounded-lg font-semibold hover:bg-amber-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Recent Activity Feed */}
        <div className="flex flex-col gap-stack-md mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">Live Feed</h2>
            <span className="flex items-center gap-1 font-label-md text-label-md text-primary bg-primary-container/10 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Live
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col divide-y divide-surface-container-highest overflow-hidden">
            {/* Skeleton Loading State (Issue #8) */}
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
              /* Empty State (Issue #8) */
              <div className="p-8 text-center flex flex-col items-center gap-3 text-on-surface-variant">
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">power_off</span>
                </div>
                <div>
                  <p className="font-body-md text-on-surface font-semibold">No recent reports for {displayLocation}</p>
                  <p className="font-body-sm text-on-surface-variant mt-1">Be the first to report power status in your area!</p>
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
                          {/* Item Confidence Badge (Issue #7) */}
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {isConfirmed ? 'Confirmed' : 'Unverified'}
                          </span>
                        </div>
                        <span className={`font-label-md text-label-md ${isOutage ? 'text-error' : 'text-primary'}`}>
                          {isOutage ? 'Outage Reported' : 'Power Restored'}
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
