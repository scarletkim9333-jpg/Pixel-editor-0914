import React from 'react';
import { useTranslations } from './contexts/LanguageContext';

const SimpleApp: React.FC = () => {
  const { t } = useTranslations();

  return (
    <div style={{ padding: '20px', backgroundColor: '#white', color: 'black', minHeight: '100vh' }}>
      <h1>🎨 Pixel Editor</h1>
      <p>Simple version is working!</p>
      <p>Language: {t.dev}</p>
    </div>
  );
};

export default SimpleApp;