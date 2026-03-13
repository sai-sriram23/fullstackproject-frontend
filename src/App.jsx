import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages & Components
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import Translator from './components/UnifiedTranslator';
import OCR from './components/OCR';
import Models from './components/ModelManager';
import CameraTranslator from './components/CameraTranslator';
import Home from './components/Home';

// Layout wrappper
import Layout from './components/Layout';

const App = () => {
  const isAuthenticated = !!localStorage.getItem('username');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />

        {/* Main App Layout */}
        <Route
          path="/"
          element={isAuthenticated ? <Layout /> : <Navigate to="/auth" />}
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="translator" element={<Translator />} />
          <Route path="ocr" element={<OCR />} />
          <Route path="camera" element={<CameraTranslator />} />
          <Route path="models" element={<Models />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
