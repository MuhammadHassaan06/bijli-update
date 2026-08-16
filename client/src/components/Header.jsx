import React from 'react';

export default function Header({ lang, setLang, onOpenHelpline }) {
  return (
    <header className="fixed top-0 w-full z-50 bg-primary pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.08)]">
      <div className="h-16 flex items-center justify-between px-container-padding">
        <div className="flex items-center gap-stack-md">
          <img alt="Bijli Update Logo" className="h-8 w-auto object-contain" src="/logo.png" />
          <span className="font-headline-md text-headline-sm text-on-primary font-bold">Bijli Update</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Emergency Helpline Button */}
          <button
            onClick={onOpenHelpline}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-400 text-amber-950 hover:bg-amber-300 transition-colors rounded-full font-label-md text-[12px] font-bold shadow-sm cursor-pointer"
            title="DISCO Helpline Contacts"
          >
            <span className="material-symbols-outlined text-[16px]">headset_mic</span>
            <span className="hidden sm:inline">118 Helpline</span>
          </button>

          {/* Language Toggle Switcher */}
          <div className="bg-on-primary/20 rounded-full p-0.5 flex items-center">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                lang === 'en' ? 'bg-on-primary text-primary shadow-xs' : 'text-on-primary/80 hover:text-on-primary'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ur')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                lang === 'ur' ? 'bg-on-primary text-primary shadow-xs' : 'text-on-primary/80 hover:text-on-primary'
              }`}
            >
              UR
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
