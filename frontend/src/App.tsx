import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MapPage } from './pages/Map';
import { WeightsPage } from './pages/Weights';
import { ComparePage } from './pages/Compare';
import { ScoreboardPage } from './pages/Scoreboard';
import { AlertsPage } from './pages/Alerts';
import { ExportOverridePage } from './pages/ExportOverride';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Meteorological Control Room Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<MapPage />} />
          <Route path="/map" element={<Navigate to="/" replace />} />
          <Route path="/weights" element={<WeightsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/scoreboard" element={<ScoreboardPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/override" element={<ExportOverridePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
