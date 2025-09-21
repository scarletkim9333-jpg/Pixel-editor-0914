import React from 'react';
import { useTranslations } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  SparklesIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  UserPlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const CTASection: React.FC = () => {
  const { language } = useTranslations();
  const { user } = useAuth();

  const ctaTexts = {
    ko: {
      mainTitle: '지금 시작하세요!',
      subtitle: 'AI 기반 픽셀 아트의 무한한 가능성을 경험해보세요',
      freeTokens: '100 무료 토큰',
      freeTokensDesc: '신규 사용자에게 제공',
      securePayment: '안전한 결제',
      securePaymentDesc: 'TossPayments 연동',
      instantStart: '즉시 시작',
      instantStartDesc: '복잡한 설정 없음',
      primaryCta: user ? '앱으로 이동' : '무료로 시작하기',
      secondaryCta: '토큰 요금제 보기',
      footer: {
        copyright: '© 2024 Pixel Editor AI. All rights reserved.',
        privacy: '개인정보처리방침',
        terms: '이용약관',
        contact: '문의하기'
      }
    },
    en: {
      mainTitle: 'Start Creating Now!',
      subtitle: 'Experience the unlimited possibilities of AI-powered pixel art',
      freeTokens: '100 Free Tokens',
      freeTokensDesc: 'For new users',
      securePayment: 'Secure Payment',
      securePaymentDesc: 'TossPayments integration',
      instantStart: 'Instant Start',
      instantStartDesc: 'No complex setup',
      primaryCta: user ? 'Go to App' : 'Start for Free',
      secondaryCta: 'View Pricing Plans',
      footer: {
        copyright: '© 2024 Pixel Editor AI. All rights reserved.',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        contact: 'Contact Us'
      }
    }
  };

  const texts = ctaTexts[language];

  const handlePrimaryCTA = () => {
    // 커스텀 라우팅 시스템 사용
    window.history.pushState({}, '', '/app');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleSecondaryCTA = () => {
    // 커스텀 라우팅 시스템 사용
    window.history.pushState({}, '', '/app');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <section className="cta-section py-20 px-6 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Main CTA */}
        <div className="main-cta text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-800 font-neodgm flex items-center justify-center gap-4">
            <SparklesIcon className="w-12 h-12 md:w-16 md:h-16 text-yellow-500" />
            <span>{texts.mainTitle}</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 font-neodgm">
            {texts.subtitle}
          </p>

          {/* Benefits grid */}
          <div className="benefits-grid grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="benefit-item text-center">
              <div className="icon-wrapper w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 font-neodgm">{texts.freeTokens}</h3>
              <p className="text-gray-600 font-neodgm">{texts.freeTokensDesc}</p>
            </div>

            <div className="benefit-item text-center">
              <div className="icon-wrapper w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <ShieldCheckIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 font-neodgm">{texts.securePayment}</h3>
              <p className="text-gray-600 font-neodgm">{texts.securePaymentDesc}</p>
            </div>

            <div className="benefit-item text-center">
              <div className="icon-wrapper w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <RocketLaunchIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 font-neodgm">{texts.instantStart}</h3>
              <p className="text-gray-600 font-neodgm">{texts.instantStartDesc}</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="cta-buttons flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={handlePrimaryCTA}
              className="pixel-button text-lg px-8 py-4 min-w-[200px] transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {user ? <SparklesIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
              <span>{texts.primaryCta}</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>

            <button
              onClick={handleSecondaryCTA}
              className="pixel-button-secondary text-lg px-8 py-4 min-w-[200px] transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <CurrencyDollarIcon className="w-5 h-5" />
              <span>{texts.secondaryCta}</span>
            </button>
          </div>
        </div>


        {/* Final CTA banner */}
        <div className="final-cta pixel-border bg-gradient-to-r from-primary/20 to-purple-100 p-8 text-center">
          <h4 className="text-2xl font-bold mb-4 font-neodgm">
            🎁 {language === 'ko' ? '지금 가입하고 100토큰 무료 지급!' : 'Sign up now and get 100 free tokens!'}
          </h4>
          <p className="text-gray-700 mb-6 font-neodgm">
            {language === 'ko'
              ? '신용카드 등록 없이도 바로 시작할 수 있어요.'
              : 'Start immediately without credit card registration.'}
          </p>
          <button
            onClick={handlePrimaryCTA}
            className="pixel-button text-lg px-8 py-3 transform hover:scale-105 transition-transform duration-200"
          >
            {user ? '🎨 앱으로 이동' : '🚀 무료로 시작하기'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer-section mt-20 pt-12 border-t-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4 font-neodgm">{texts.footer.copyright}</p>
            <div className="footer-links flex flex-wrap justify-center gap-6 text-sm">
              <a href="#" className="text-gray-500 hover:text-primary transition-colors font-neodgm">
                {texts.footer.privacy}
              </a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors font-neodgm">
                {texts.footer.terms}
              </a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors font-neodgm">
                {texts.footer.contact}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
};

export default CTASection;