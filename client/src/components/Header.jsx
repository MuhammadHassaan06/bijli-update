import React from 'react';

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-primary pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.08)]">
      <div className="h-16 flex items-center justify-between px-container-padding">
        <div className="flex items-center gap-stack-md">
          <img alt="Bijli Update Logo" className="h-8 w-auto object-contain" src="/logo.png" />
          <span className="font-headline-md text-headline-sm text-on-primary font-bold">Bijli Update</span>
        </div>
        <div className="flex items-center gap-stack-md">
          <div className="w-8 h-8 rounded-full bg-on-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}

