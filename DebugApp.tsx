import React from 'react';

const DebugApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1>🚀 Debug App</h1>
      <p>If you can see this, React is working!</p>

      <h2>Environment Variables</h2>
      <ul>
        <li>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL}</li>
        <li>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</li>
      </ul>

      <h2>Imports Test</h2>
      <button onClick={() => console.log('Button clicked!')}>
        Test Console Log
      </button>
    </div>
  );
};

export default DebugApp;