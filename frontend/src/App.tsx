import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AppView } from './components/AppView';

export const App: React.FC = () => {
  // Start on the landing page just like the original index.html
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'app'>('landing');

  return (
    <div className="w-full min-h-screen bg-[#1f1d2b]">
      {currentScreen === 'landing' ? (
        <LandingPage onExplore={() => setCurrentScreen('app')} />
      ) : (
        <AppView onGoBack={() => setCurrentScreen('landing')} />
      )}
    </div>
  );
};

export default App;
