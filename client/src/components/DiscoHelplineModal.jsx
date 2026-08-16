import React, { useEffect, useState } from 'react';
import { translations } from '../utils/translations';
import { apiFetch } from '../utils/api';

export default function DiscoHelplineModal({ city, lang, isOpen, onClose }) {
  const [helpline, setHelpline] = useState(null);
  const t = translations[lang] || translations.en;

  useEffect(() => {
    if (isOpen && city) {
      apiFetch(`/helplines?city=${encodeURIComponent(city)}`)
        .then(res => res.json())
        .then(data => setHelpline(data))
        .catch(err => console.error('Failed to load helpline:', err));
    }
  }, [isOpen, city]);

  if (!isOpen) return null;

  const companyName = helpline?.company || 'DISCO';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface-container-lowest text-on-surface rounded-2xl p-6 max-w-md w-full shadow-2xl relative border border-surface-container">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">headset_mic</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {t.discoModalTitle.replace('{company}', companyName)}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t.discoModalSub.replace('{city}', city)}
            </p>
          </div>
        </div>

        {/* Helpline Action Buttons */}
        <div className="flex flex-col gap-3 my-4">
          {/* Call 118 Helpline */}
          <a
            href="tel:118"
            className="flex items-center justify-between p-3.5 bg-primary text-on-primary rounded-xl font-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px]">call</span>
              <span>{t.callHelpline}</span>
            </div>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </a>

          {/* WhatsApp Support (if available, e.g. K-Electric) */}
          {helpline?.whatsapp ? (
            <a
              href={`https://wa.me/${helpline.whatsapp}?text=Hi%20${encodeURIComponent(companyName)},%20I%20want%20to%20report%20a%20power%20outage.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 bg-emerald-600 text-white rounded-xl font-label-md font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">chat</span>
                <span>{companyName} {t.whatsappSupport}</span>
              </div>
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </a>
          ) : null}

          {/* SMS Complaint */}
          <a
            href={`sms:8118?body=${encodeURIComponent(`COMPLAINT ${city}`)}`}
            className="flex items-center justify-between p-3.5 bg-surface-container-low text-on-surface rounded-xl font-label-md font-semibold hover:bg-surface-container transition-colors border border-surface-container-high"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px]">sms</span>
              <span>{t.smsComplaint}</span>
            </div>
            <span className="material-symbols-outlined text-[18px]">send</span>
          </a>

          {/* Official Website */}
          {helpline?.website ? (
            <a
              href={helpline.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-surface text-on-surface-variant rounded-xl font-body-sm text-xs hover:text-primary transition-colors text-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">language</span>
              <span>Official Website: {helpline.website.replace('https://', '').replace('http://', '')}</span>
            </a>
          ) : null}
        </div>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-surface-container">
          <p className="text-[11px] text-on-surface-variant opacity-70">
            Emergency helplines operate 24/7 across Pakistan power grids.
          </p>
        </div>
      </div>
    </div>
  );
}
