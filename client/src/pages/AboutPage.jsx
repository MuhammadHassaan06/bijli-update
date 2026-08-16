import React from 'react';
import { translations } from '../utils/translations';

export default function AboutPage({ lang = 'en' }) {
  const t = translations[lang] || translations.en;

  return (
    <div className="flex flex-col w-full pb-8 px-container-padding py-stack-lg">
      <div className="flex flex-col gap-stack-md bg-surface-container-lowest p-gutter rounded-xl shadow-sm mb-stack-lg border border-surface-container">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[28px]">electric_bolt</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold">{t.aboutTitle}</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t.aboutSub}</p>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface">
          {t.aboutDesc}
        </p>
      </div>

      <div className="flex flex-col gap-stack-md bg-surface-container-lowest p-gutter rounded-xl shadow-sm mb-stack-lg border border-surface-container">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">shield</span>
          {t.keyFeatures}
        </h2>

        <ul className="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface-variant">
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">check_circle</span>
            <span><strong>{t.feature1Title}</strong> {t.feature1Desc}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">check_circle</span>
            <span><strong>{t.feature2Title}</strong> {t.feature2Desc}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">check_circle</span>
            <span><strong>{t.feature3Title}</strong> {t.feature3Desc}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">check_circle</span>
            <span><strong>{t.feature4Title}</strong> {t.feature4Desc}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
