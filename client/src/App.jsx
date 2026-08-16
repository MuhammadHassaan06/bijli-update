import React, { useState } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import TrendingPage from './pages/TrendingPage';
import AboutPage from './pages/AboutPage';
import DiscoHelplineModal from './components/DiscoHelplineModal';
import NotificationInboxModal from './components/NotificationInboxModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [lang, setLang] = useState('en');
  const [selectedCity, setSelectedCity] = useState('Karachi');
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface font-body-md relative flex flex-col justify-between">
      {/* Fixed Top Header */}
      <Header
        lang={lang}
        setLang={setLang}
        onOpenHelpline={() => setIsHelplineOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
      />

      {/* Main Content Area */}
      <main className="pt-16 min-h-screen bg-surface-container-lowest">
        {activeTab === 'home' && (
          <HomePage
            lang={lang}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            onOpenHelpline={() => setIsHelplineOpen(true)}
          />
        )}
        {activeTab === 'trending' && <TrendingPage lang={lang} />}
        {activeTab === 'about' && <AboutPage lang={lang} />}

        {/* Global Footer (Single Instance) */}
        <footer className="py-stack-lg px-container-padding bg-surface-container-low mb-20 text-center border-t border-surface-container">
          <div className="flex justify-center gap-stack-lg mb-stack-md text-label-md font-label-md text-on-surface-variant">
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Help</a>
          </div>
          <p className="text-label-md text-on-surface-variant opacity-70">© 2024 Bijli Update Pakistan 🇵🇰</p>
        </footer>
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} />

      {/* Emergency DISCO Helpline Modal */}
      <DiscoHelplineModal
        city={selectedCity}
        lang={lang}
        isOpen={isHelplineOpen}
        onClose={() => setIsHelplineOpen(false)}
      />

      {/* Received Email & Push Notification Inbox Modal */}
      <NotificationInboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
      />
    </div>
  );
}
