import React from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AuthProvider } from '../contexts/AuthContext';
import NewLayoutApp from '../NewLayoutApp';

const MainApp: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <NewLayoutApp />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default MainApp;