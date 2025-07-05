import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Goals } from './pages/Goals';
import { Progress } from './pages/Progress';
import Settings from './pages/Settings';
import { CreateGoalModal } from './components/CreateGoalModal';
import { AuthSync } from './components/AuthSync';

import { GoalProvider, UserProvider } from './context/GoalContext';
import { ThemeProvider } from './context/ThemeContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  return (
    <AuthProvider>
    <ThemeProvider>
      <UserProvider>
        <GoalProvider>
          <AnalyticsProvider>
              <AuthSync />
            <Router>
              <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
                <div className="max-w-md mx-auto bg-white dark:bg-black min-h-screen relative transition-colors duration-300 pb-20">
                  <Routes>
                      <Route path="/" element={<Dashboard onCreateGoalClick={() => setShowCreateModal(true)} />} />
                      <Route path="/goals" element={<Goals onCreateGoalClick={() => setShowCreateModal(true)} />} />
                    <Route path="/progress" element={<Progress />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                  <Navigation />
                    {showCreateModal && (
                      <CreateGoalModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
                    )}
                </div>
              </div>
            </Router>
          </AnalyticsProvider>
        </GoalProvider>
      </UserProvider>
    </ThemeProvider>
    </AuthProvider>
  );
}

export default App;