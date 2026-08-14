import React from 'react';

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full pb-8 px-container-padding py-stack-lg">
      <div className="flex flex-col gap-stack-md bg-surface-container-lowest p-gutter rounded-xl shadow-sm mb-stack-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[28px]">electric_bolt</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface">About Bijli Update</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Hyperlocal Crowdsourced Outage Tracker 🇵🇰</p>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface">
          <strong>Bijli Update</strong> is a real-time, community-driven platform designed to provide transparent, crowdsourced power outage and load-shedding reporting across major cities and sectors in Pakistan.
        </p>
      </div>

      <div className="flex flex-col gap-stack-md bg-surface-container-lowest p-gutter rounded-xl shadow-sm mb-stack-lg">
        <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">shield</span>
          Key Features
        </h2>

        <ul className="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface-variant">
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">check_circle</span>
            <span><strong>Single Source Status:</strong> Unified area status logic based on real-time community report feeds.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">check_circle</span>
            <span><strong>Report Confidence:</strong> Automatic "Confirmed" and "Unverified" confidence rating system.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">check_circle</span>
            <span><strong>Spam Prevention:</strong> Hashed IP rate limiting to prevent duplicate submissions per area.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">check_circle</span>
            <span><strong>Crescent Utility System:</strong> Mobile-first UI using Pakistan national palette tokens and 48px touch targets.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
