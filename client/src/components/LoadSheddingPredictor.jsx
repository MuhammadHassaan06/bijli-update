import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function LoadSheddingPredictor({ city = 'Karachi', area = 'General' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/schedule-prediction?city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load schedule prediction:', err);
        setLoading(false);
      });
  }, [city, area]);

  if (loading) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container shadow-sm animate-pulse flex flex-col gap-3">
        <div className="h-4 bg-surface-container-high rounded w-1/3"></div>
        <div className="h-12 bg-surface-container-high rounded"></div>
      </div>
    );
  }

  const currentRisk = data?.currentRisk || 15;
  const isHighRisk = currentRisk >= 60;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary text-[22px]">schedule</span>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              24-Hour Load Shedding Predictor
            </h3>
            <p className="text-xs text-on-surface-variant font-medium">
              {data?.discoName} — Forecast for {area} ({city})
            </p>
          </div>
        </div>

        {/* Current Risk Gauge Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
          isHighRisk
            ? 'bg-red-50 text-red-800 border-red-300'
            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isHighRisk ? 'bg-red-600 animate-ping' : 'bg-emerald-600'}`}></span>
          <span>Current Hour Risk: {currentRisk}% {isHighRisk ? '⚡ High' : '🟢 Low'}</span>
        </div>
      </div>

      {/* Predicted Slots Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <span className="text-[11px] font-bold text-on-surface-variant shrink-0">
          Predicted Daily Slots:
        </span>
        {data?.predictedSlots?.map((slot, idx) => (
          <span
            key={idx}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 shrink-0"
          >
            ⏱️ {slot}
          </span>
        ))}
      </div>

      {/* 24-Hour Probability Timeline Bars */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-container">
        <div className="flex justify-between items-center text-[11px] font-bold text-on-surface-variant">
          <span>00:00 (Midnight)</span>
          <span>12:00 (Noon)</span>
          <span>23:00 (Night)</span>
        </div>

        <div className="flex items-end gap-1 h-20 bg-surface-container-low p-2 rounded-xl border border-surface-container-high overflow-x-auto no-scrollbar">
          {data?.hourlyRisk?.map((item) => {
            const heightPct = item.riskPercentage;
            let barBg = 'bg-emerald-500';
            if (item.riskPercentage >= 70) barBg = 'bg-red-500';
            else if (item.riskPercentage >= 40) barBg = 'bg-amber-500';

            return (
              <div
                key={item.hour}
                className="flex-1 flex flex-col items-center gap-1 group relative min-w-[12px]"
                title={`Hour ${item.label}: ${item.riskPercentage}% outage risk ${item.isPeak ? '(Peak Slot)' : ''}`}
              >
                <div className="w-full bg-slate-200 rounded-t h-full flex items-end overflow-hidden">
                  <div
                    className={`w-full ${barBg} transition-all ${item.isCurrent ? 'ring-2 ring-primary ring-offset-1 font-bold' : ''}`}
                    style={{ height: `${heightPct}%` }}
                  ></div>
                </div>
                {item.isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
