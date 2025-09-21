import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SimpleLandingPage from './pages/SimpleLandingPage';
import AppPage from './pages/AppPage';
import PaymentCallback from './src/components/PaymentCallback';
import SimpleCompressionTest from './src/components/SimpleCompressionTest';
// import './styles/landing.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <Router>
    <Routes>
      <Route path="/" element={<SimpleLandingPage />} />
      <Route path="/app" element={<AppPage />} />
      <Route path="/payment/success" element={<PaymentCallback />} />
      <Route path="/payment/fail" element={<PaymentCallback />} />
      <Route path="/test/compression" element={<SimpleCompressionTest />} />
    </Routes>
  </Router>
);