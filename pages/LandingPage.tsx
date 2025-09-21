import React from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AuthProvider } from '../contexts/AuthContext';
import HeroSection from '../components/landing/HeroSection';
import FeaturesGrid from '../components/landing/FeaturesGrid';
import DemoSection from '../components/landing/DemoSection';
import CTASection from '../components/landing/CTASection';

const LandingPage: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <div className="landing-page min-h-screen bg-white">
          <div className="pixel-bg fixed inset-0 pointer-events-none z-0"></div>
          <div className="relative z-10">
            <HeroSection />
            <FeaturesGrid />
            <DemoSection />
            <CTASection />
          </div>
        </div>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default LandingPage;