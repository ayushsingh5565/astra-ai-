import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { ChatInterface } from './components/ChatInterface';
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LANDING);
  const [isHackerMode, setIsHackerMode] = useState(false);

  const handleStart = () => {
    setMode(AppMode.CHAT);
  };

  const handleBack = () => {
    setMode(AppMode.LANDING);
  };

  const toggleHackerMode = () => {
    setIsHackerMode(!isHackerMode);
  };

  return (
    <div className="w-full min-h-screen bg-astra-black">
      {mode === AppMode.LANDING ? (
        <LandingPage onStart={handleStart} />
      ) : (
        <ChatInterface 
            isHackerMode={isHackerMode} 
            toggleHackerMode={toggleHackerMode} 
            onBack={handleBack}
        />
      )}
    </div>
  );
};

export default App;