import React, { useState } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import TrendingPage from './pages/TrendingPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface font-body-md relative flex flex-col justify-between">
      {/* Fixed Top Header */}
      <Header />

      {/* Main Content Area */}
      <main className="pt-16 min-h-screen bg-surface-container-lowest">
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'trending' && <TrendingPage />}
        {activeTab === 'about' && <AboutPage />}

        {/* Global Footer (Single Instance) */}
        <footer className="py-stack-lg px-container-padding bg-surface-container-low mb-20 text-center border-t border-surface-container">
          <div className="flex justify-center gap-stack-lg mb-stack-md text-label-md font-label-md text-on-surface-variant">
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Help</a>
          </div>
          <p className="text-label-md text-on-surface-variant opacity-70">© 2024 Bijli Update Pakistan</p>
        </footer>
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
