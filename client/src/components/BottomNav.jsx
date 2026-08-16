import React from 'react';
import { translations } from '../utils/translations';

export default function BottomNav({ activeTab, setActiveTab, lang }) {
  const t = translations[lang] || translations.en;

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-50 pb-safe bg-surface/95 backdrop-blur-xl border-t border-surface-container shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">home</span>
          <span className="text-label-md font-label-md text-[11px]">{t.navHome}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trending')}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'trending' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">trending_up</span>
          <span className="text-label-md font-label-md text-[11px]">{t.navTrending}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'about' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">info</span>
          <span className="text-label-md font-label-md text-[11px]">{t.navAbout}</span>
        </button>
      </div>
    </nav>
  );
}
