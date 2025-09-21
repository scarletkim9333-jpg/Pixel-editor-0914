import React from 'react';
import { SparklesIcon, PhotoIcon, CubeIcon, FireIcon, BoltIcon } from '@heroicons/react/24/outline';
import { useTranslations } from '../../contexts/LanguageContext';

const HeroSection: React.FC = () => {
  const { language, t: translations } = useTranslations();

  const handleStartCreating = () => {
    // 커스텀 라우팅 시스템 사용
    window.history.pushState({}, '', '/app');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleViewExamples = () => {
    // Scroll to features section
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-section relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Pixel dot pattern background */}
      <div className="pixel-dots-bg absolute inset-0 opacity-30"></div>

      {/* Hero content */}
      <div className="pixel-container relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="pixel-title animate-float text-6xl md:text-8xl font-bold mb-6 text-primary-dark drop-shadow-lg flex items-center justify-center gap-4">
          <span>Pixel Editor AI</span>
          <SparklesIcon className="w-16 h-16 md:w-20 md:h-20 text-yellow-500" />
        </h1>

        <p className="pixel-subtitle text-xl md:text-2xl mb-8 text-gray-700 max-w-2xl mx-auto leading-relaxed">
          {language === 'ko'
            ? 'AI 기반 픽셀 아트로 당신의 이미지를 마법같이 변환하세요'
            : 'Transform your images with AI-powered pixel magic'}
        </p>

        <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleStartCreating}
            className="pixel-button text-lg px-8 py-4 min-w-[200px] transform hover:scale-105 transition-transform duration-200 flex items-center justify-center gap-2"
          >
            <SparklesIcon className="w-5 h-5" />
            <span>{language === 'ko' ? '시작하기' : 'Start Creating'}</span>
          </button>

          <button
            onClick={handleViewExamples}
            className="pixel-button-secondary text-lg px-8 py-4 min-w-[200px] transform hover:scale-105 transition-transform duration-200 flex items-center justify-center gap-2"
          >
            <PhotoIcon className="w-5 h-5" />
            <span>{language === 'ko' ? '예시 보기' : 'View Examples'}</span>
          </button>
        </div>

        {/* Floating badges */}
        <div className="hero-badges mt-12 flex flex-wrap justify-center gap-4 text-sm">
          <div className="badge bg-white/90 px-4 py-2 border-2 border-gray-300 rounded-none shadow-sm flex items-center gap-2">
            <CubeIcon className="w-4 h-4" />
            <span>AI Models</span>
          </div>
          <div className="badge bg-white/90 px-4 py-2 border-2 border-gray-300 rounded-none shadow-sm flex items-center gap-2">
            <FireIcon className="w-4 h-4" />
            <span>Free Tokens</span>
          </div>
          <div className="badge bg-white/90 px-4 py-2 border-2 border-gray-300 rounded-none shadow-sm flex items-center gap-2">
            <BoltIcon className="w-4 h-4" />
            <span>Instant Results</span>
          </div>
        </div>
      </div>

      {/* Decorative pixel elements */}
      <div className="pixel-decorations absolute inset-0 pointer-events-none">
        <div className="pixel-square animate-bounce-slow absolute top-20 left-10 w-8 h-8 bg-primary/30"></div>
        <div className="pixel-square animate-bounce-slow-delayed absolute top-40 right-20 w-6 h-6 bg-secondary/30"></div>
        <div className="pixel-square animate-bounce-slow absolute bottom-32 left-20 w-10 h-10 bg-primary/20"></div>
        <div className="pixel-square animate-bounce-slow-delayed absolute bottom-20 right-10 w-8 h-8 bg-secondary/20"></div>
      </div>
    </section>
  );
};

export default HeroSection;