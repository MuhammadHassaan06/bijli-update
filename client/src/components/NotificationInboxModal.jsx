import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function NotificationInboxModal({ isOpen, onClose }) {
  const [subData, setSubData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('bijli_subscription');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSubData(parsed);
          fetchLogs(parsed.contact);
        } catch (e) {}
      } else {
        setSubData(null);
        fetchLogs('');
      }
    }
  }, [isOpen]);

  const fetchLogs = (contact) => {
    setLoading(true);
    let path = `/notifications/inbox`;
    if (contact) path += `?contact=${encodeURIComponent(contact)}`;

    apiFetch(path)
      .then(res => res.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch notifications:', err);
        setLoading(false);
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400">notifications_active</span>
            <div>
              <h3 className="font-bold text-base">Notification & Email Inbox</h3>
              <p className="text-[11px] text-slate-300">
                {subData ? `Subscribed: ${subData.contact} (${subData.area})` : 'All Outage Notifications'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 bg-slate-50">
          {!subData && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-medium">
              💡 <strong>Tip:</strong> Go to the <strong>Trending</strong> tab to subscribe with your Email or WhatsApp to receive automated load shedding notifications!
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">
              Loading inbox emails & alerts...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
              No notifications logged yet. When an outage is reported in your area, alert emails will show up here!
            </div>
          ) : (
            logs.map((mail) => (
              <div key={mail.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${mail.subject.includes('🔴') ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                    <strong className="text-xs text-slate-900 font-bold">{mail.subject}</strong>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {new Date(mail.sent_at).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 font-medium">
                  To: <strong>{mail.recipient}</strong> ({mail.channel.toUpperCase()})
                </div>

                {mail.html ? (
                  <div
                    className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: mail.html }}
                  />
                ) : (
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">{mail.text}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={() => fetchLogs(subData?.contact || '')}
            className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh Inbox
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
