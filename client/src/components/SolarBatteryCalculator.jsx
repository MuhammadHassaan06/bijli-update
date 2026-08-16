import React, { useState } from 'react';

export default function SolarBatteryCalculator() {
  const [fans, setFans] = useState(2);
  const [lights, setLights] = useState(4);
  const [tv, setTv] = useState(0);
  const [batteryAh, setBatteryAh] = useState(150); // 100, 150, 200, 230

  // Power ratings in Watts
  const FAN_WATT = 75;
  const LIGHT_WATT = 12;
  const TV_WATT = 100;

  const totalWatts = (fans * FAN_WATT) + (lights * LIGHT_WATT) + (tv * TV_WATT);

  // Battery energy in Watt-Hours (12V * Ah * 0.8 efficiency factor)
  const usableWh = 12 * batteryAh * 0.8;

  let backupHours = totalWatts > 0 ? usableWh / totalWatts : 0;
  if (backupHours > 24) backupHours = 24;

  const hours = Math.floor(backupHours);
  const mins = Math.round((backupHours - hours) * 60);

  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
          <span className="material-symbols-outlined text-[24px]">battery_charging_full</span>
        </div>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            UPS & Solar Backup Calculator 🔋
          </h3>
          <p className="text-xs text-on-surface-variant font-medium">
            Calculate how many hours your battery will last during load shedding.
          </p>
        </div>
      </div>

      {/* Appliance Controls */}
      <div className="grid grid-cols-3 gap-3 bg-surface-container-low p-3.5 rounded-xl border border-surface-container-high">
        {/* Fans Counter */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-xs font-bold text-on-surface">🌀 Ceiling Fans (75W)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFans(Math.max(0, fans - 1))}
              className="w-7 h-7 rounded-lg bg-surface-container border border-surface-container-high font-bold flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <span className="font-bold text-sm w-4 text-center">{fans}</span>
            <button
              onClick={() => setFans(fans + 1)}
              className="w-7 h-7 rounded-lg bg-surface-container border border-surface-container-high font-bold flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Lights Counter */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-xs font-bold text-on-surface">💡 LED Lights (12W)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLights(Math.max(0, lights - 1))}
              className="w-7 h-7 rounded-lg bg-surface-container border border-surface-container-high font-bold flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <span className="font-bold text-sm w-4 text-center">{lights}</span>
            <button
              onClick={() => setLights(lights + 1)}
              className="w-7 h-7 rounded-lg bg-surface-container border border-surface-container-high font-bold flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* TV Counter */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-xs font-bold text-on-surface">📺 LED TV (100W)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTv(Math.max(0, tv - 1))}
              className="w-7 h-7 rounded-lg bg-surface-container border border-surface-container-high font-bold flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <span className="font-bold text-sm w-4 text-center">{tv}</span>
            <button
              onClick={() => setTv(tv + 1)}
              className="w-7 h-7 rounded-lg bg-surface-container border border-surface-container-high font-bold flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Battery Ah Selector */}
      <div className="flex items-center gap-2 justify-between bg-surface-container-low p-3 rounded-xl border border-surface-container-high flex-wrap">
        <span className="text-xs font-bold text-on-surface-variant">Battery Capacity (12V):</span>
        <div className="flex items-center gap-1.5">
          {[100, 150, 200, 230].map((ah) => (
            <button
              key={ah}
              onClick={() => setBatteryAh(ah)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                batteryAh === ah
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                  : 'bg-surface-container text-on-surface border-surface-container-high hover:bg-surface-container-high'
              }`}
            >
              {ah} Ah
            </button>
          ))}
        </div>
      </div>

      {/* Result Display Box */}
      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Total Load: {totalWatts} Watts
          </span>
          <h4 className="font-headline-sm text-emerald-950 font-extrabold text-base">
            Estimated Backup Time:
          </h4>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-emerald-700">
            {hours}h {mins}m
          </span>
          <p className="text-[10px] font-bold text-emerald-800">
            {totalWatts > 0 ? 'Optimal for 12V UPS Inverter' : 'Add appliances above'}
          </p>
        </div>
      </div>
    </div>
  );
}
