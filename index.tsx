
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './NewLayoutApp';
import DebugApp from './DebugApp';
import SimpleApp from './SimpleApp';
import TestApp from './TestApp';
import { LanguageProvider } from './contexts/LanguageContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);