import React, { useState, useEffect } from 'react';
import { playOutageAlertSound, playClickSound } from '../utils/audio';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function SubscribeCard({ lang = 'en' }) {
  const [channel, setChannel] = useState('whatsapp'); // 'whatsapp' | 'email'
  const [contactInput, setContactInput] = useState('');
  const [subCity, setSubCity] = useState('Karachi');
  const [subArea, setSubArea] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [testBanner, setTestBanner] = useState(false);

  // Email Inbox Modal state
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [inboxLogs, setInboxLogs] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  // Load active subscription from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bijli_subscription');
    const savedCity = localStorage.getItem('bijli_city') || 'Karachi';
    const savedArea = localStorage.getItem('bijli_area') || '';

    if (savedCity) setSubCity(savedCity);
    if (savedArea) setSubArea(savedArea);

    if (saved) {
      try {
        setActiveSubscription(JSON.parse(saved));
      } catch (e) {
        // Parse error
      }
    }
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const rawContact = contactInput.trim();
    if (!rawContact) {
      setErrorMsg('Please enter your email or WhatsApp phone number.');
      return;
    }

    if (channel === 'email') {
      if (!rawContact.includes('@')) {
        setErrorMsg('Please enter a valid email address (e.g. user@example.com).');
        return;
      }
    }

    if (channel === 'whatsapp') {
      const digitsOnly = rawContact.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        setErrorMsg('Please enter a valid 11-digit WhatsApp phone number (e.g. 03001234567).');
        return;
      }
    }

    setLoading(true);

    fetch(`${API_BASE}/notify-map`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: channel === 'email' ? rawContact : null,
        phone: channel === 'whatsapp' ? rawContact : null,
        city: subCity,
        area: subArea.trim() || 'General Area',
        channel: channel
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Subscription failed');
        return data;
      })
      .then((data) => {
        setLoading(false);
        const subData = {
          contact: data.contact || rawContact,
          channel: data.channel || channel,
          city: data.city || subCity,
          area: data.area || subArea.trim() || 'General Area'
        };
        localStorage.setItem('bijli_subscription', JSON.stringify(subData));
        setActiveSubscription(subData);
        playOutageAlertSound();

        // If WhatsApp, auto open confirmation chat link option
        if (channel === 'whatsapp') {
          const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(subData.contact)}&text=${encodeURIComponent(`✅ Bijli Update: I have subscribed to live load-shedding alerts for ${subData.area} (${subData.city}).`)}`;
          window.open(waUrl, '_blank');
        }
      })
      .catch((err) => {
        setLoading(false);
        setErrorMsg(err.message);
      });
  };

  const handleUnsubscribe = () => {
    playClickSound();
    localStorage.removeItem('bijli_subscription');
    setActiveSubscription(null);
    setContactInput('');
  };

  const triggerTestAlert = () => {
    playOutageAlertSound();
    setTestBanner(true);

    // Also trigger backend alert dispatch simulation
    if (activeSubscription) {
      fetch(`${API_BASE}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: activeSubscription.city,
          area: activeSubscription.area,
          status: 'OUTAGE',
          duration: '1 Hour'
        })
      }).catch(e => console.error('Simulated report dispatch error:', e));
    }

    setTimeout(() => setTestBanner(false), 5000);
  };

  const fetchInbox = () => {
    if (!activeSubscription?.contact) return;
    setLoadingInbox(true);
    fetch(`${API_BASE}/notifications/inbox?contact=${encodeURIComponent(activeSubscription.contact)}`)
      .then(res => res.json())
      .then(data => {
        setInboxLogs(Array.isArray(data) ? data : []);
        setLoadingInbox(false);
        setShowInboxModal(true);
      })
      .catch(err => {
        console.error('Failed to fetch inbox:', err);
        setLoadingInbox(false);
      });
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm flex flex-col gap-4 relative overflow-hidden">
      {/* Test Alert Simulated Banner */}
      {testBanner && (
        <div className="bg-amber-500 text-slate-950 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between font-body-sm font-bold animate-bounce">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">notifications_active</span>
            <span>🚨 TEST ALERT: Load Shedding reported in {activeSubscription?.area || 'your area'}!</span>
          </div>
          <button onClick={() => setTestBanner(false)} className="opacity-80 hover:opacity-100 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Received Email Inbox Modal */}
      {showInboxModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">mark_email_read</span>
                <h3 className="font-bold text-base">Received Email Notifications Inbox</h3>
              </div>
              <button
                onClick={() => setShowInboxModal(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 bg-slate-50">
              <p className="text-xs text-slate-600">
                Email inbox history for <strong>{activeSubscription?.contact}</strong>:
              </p>

              {loadingInbox ? (
                <div className="p-6 text-center text-slate-500 font-semibold animate-pulse">Loading inbox emails...</div>
              ) : inboxLogs.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                  No emails logged yet for this address. Try clicking "Send Test Alert" or reporting an outage in your area!
                </div>
              ) : (
                inboxLogs.map((mail) => (
                  <div key={mail.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <strong className="text-xs text-slate-900 font-bold">{mail.subject}</strong>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(mail.sent_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {mail.html ? (
                      <div
                        className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: mail.html }}
                      />
                    ) : (
                      <p className="text-xs text-slate-700">{mail.text}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowInboxModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Inbox
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-[24px]">notifications_active</span>
        </div>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Live Outage Mobile Alerts 🔔
          </h3>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Get instant WhatsApp or Email alerts the moment load shedding hits your neighborhood.
          </p>
        </div>
      </div>

      {activeSubscription ? (
        /* Active Subscription Card */
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
              <span>Alerts Active for {activeSubscription.area} ({activeSubscription.city})</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 uppercase">
              {activeSubscription.channel}
            </span>
          </div>

          <p className="text-xs text-emerald-800">
            Receiving live status notifications at: <strong>{activeSubscription.contact}</strong>
          </p>

          <div className="flex items-center gap-2 pt-2 border-t border-emerald-200 flex-wrap">
            <button
              onClick={triggerTestAlert}
              className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">campaign</span>
              <span>Send Test Alert</span>
            </button>

            {activeSubscription.channel === 'email' ? (
              <button
                onClick={fetchInbox}
                className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">mark_email_read</span>
                <span>View Received Emails</span>
              </button>
            ) : (
              <a
                href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(activeSubscription.contact)}&text=${encodeURIComponent(`✅ Bijli Update: Checking active WhatsApp load shedding alerts for ${activeSubscription.area} (${activeSubscription.city}).`)}`}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>Open WhatsApp</span>
              </a>
            )}

            <button
              onClick={handleUnsubscribe}
              className="py-1.5 px-3 bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Unsubscribe
            </button>
          </div>
        </div>
      ) : (
        /* Subscription Form */
        <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
          {errorMsg && (
            <div className="p-2.5 bg-error-container text-error rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Channel Selector Tabs */}
          <div className="flex gap-2 bg-surface-container-low p-1 rounded-lg border border-surface-container-high">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setChannel('whatsapp');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                channel === 'whatsapp' ? 'bg-emerald-600 text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>WhatsApp Alert</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setChannel('email');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                channel === 'email' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">mail</span>
              <span>Email Push</span>
            </button>
          </div>

          {/* Location inputs */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={subCity}
              onChange={(e) => setSubCity(e.target.value)}
              placeholder="City (e.g. Karachi)"
              className="px-3 py-2 text-xs bg-surface-container-low text-on-surface border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
              required
            />
            <input
              type="text"
              value={subArea}
              onChange={(e) => setSubArea(e.target.value)}
              placeholder="Area (e.g. DHA Phase 5)"
              className="px-3 py-2 text-xs bg-surface-container-low text-on-surface border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
              required
            />
          </div>

          {/* Contact Input */}
          <div className="flex gap-2">
            <input
              type={channel === 'whatsapp' ? 'tel' : 'email'}
              value={contactInput}
              onChange={(e) => setContactInput(e.target.value)}
              placeholder={channel === 'whatsapp' ? 'WhatsApp Number (e.g. 03001234567)' : 'Your Email Address'}
              className="flex-1 px-3 py-2 text-xs bg-surface-container-low text-on-surface border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-on-primary font-label-md font-bold rounded-lg hover:bg-primary-container transition-colors disabled:opacity-80 flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
            >
              {loading ? (
                <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
              ) : (
                <>
                  <span>Subscribe</span>
                  <span className="material-symbols-outlined text-[16px]">notifications</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
