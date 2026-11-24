import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { Navbar } from './components/Navbar';
import { BottomTabBar } from './components/BottomTabBar';
import { Home } from './pages/Home';
import { JoinQueue } from './pages/JoinQueue';
import { MyStatus } from './pages/MyStatus';
import { ReceptionDashboard } from './pages/ReceptionDashboard';
import { BarberView } from './pages/BarberView';
import { WaitingDisplay } from './pages/WaitingDisplay';
import { OwnerSettings } from './pages/OwnerSettings';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 pb-20 md:pb-8">
            <Routes>
              {/* Screen 1: Home */}
              <Route path="/" element={<Home />} />
              {/* Screen 2: Join Queue */}
              <Route path="/join" element={<JoinQueue />} />
              {/* Screen 3: My Status */}
              <Route path="/status/:id" element={<MyStatus />} />
              {/* Screen 4: Reception Dashboard */}
              <Route path="/reception" element={<ReceptionDashboard />} />
              {/* Screen 5: Barber View */}
              <Route path="/barber/:name" element={<BarberView />} />
              <Route path="/barber" element={<Navigate to="/barber/Ravi" replace />} />
              {/* Screen 6: Waiting Area TV Display */}
              <Route path="/display" element={<WaitingDisplay />} />
              {/* Screen 7: Owner Settings */}
              <Route path="/admin" element={<OwnerSettings />} />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomTabBar />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
};

export default App;
