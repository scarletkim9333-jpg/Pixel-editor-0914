
import React from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import NewLayoutApp from './NewLayoutApp';




const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NewLayoutApp />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
