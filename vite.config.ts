import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDev = mode === 'development';

    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },

      // 성능 최적화 설정
      build: {
        // 코드 분할 최적화
        rollupOptions: {
          output: {
            manualChunks: {
              // React 관련 라이브러리
              'vendor-react': ['react', 'react-dom'],

              // UI 라이브러리
              'vendor-ui': ['@heroicons/react'],

              // 가상 스크롤링
              'vendor-virtualization': ['react-window'],

              // 유틸리티 라이브러리
              'vendor-utils': ['qrcode', 'axios'],

              // Supabase & 결제
              'vendor-services': ['@supabase/supabase-js', '@tosspayments/payment-sdk'],

              // AI 서비스
              'vendor-ai': ['@google/genai']
            },

            // 파일명 최적화
            chunkFileNames: (chunkInfo) => {
              if (chunkInfo.name === 'vendor-react') return 'assets/react.[hash].js';
              if (chunkInfo.name === 'vendor-ui') return 'assets/ui.[hash].js';
              if (chunkInfo.name === 'vendor-virtualization') return 'assets/virtual.[hash].js';
              if (chunkInfo.name === 'vendor-utils') return 'assets/utils.[hash].js';
              if (chunkInfo.name === 'vendor-services') return 'assets/services.[hash].js';
              if (chunkInfo.name === 'vendor-ai') return 'assets/ai.[hash].js';
              return 'assets/[name].[hash].js';
            },

            // 에셋 파일명
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name?.split('.') || [];
              const extType = info[info.length - 1];

              if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || '')) {
                return 'assets/images/[name].[hash].[ext]';
              }
              if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
                return 'assets/fonts/[name].[hash].[ext]';
              }
              if (/\.css$/i.test(assetInfo.name || '')) {
                return 'assets/styles/[name].[hash].[ext]';
              }

              return `assets/${extType}/[name].[hash].[ext]`;
            }
          }
        },

        // 번들 크기 최적화
        target: 'esnext',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: !isDev,
            drop_debugger: !isDev,
            pure_funcs: isDev ? [] : ['console.log', 'console.info', 'console.debug']
          }
        },

        // 청크 크기 경고 임계값
        chunkSizeWarningLimit: 1000,

        // gzip 압축
        reportCompressedSize: true,

        // 소스맵 설정
        sourcemap: isDev
      },

      // 개발 서버 최적화
      server: {
        // HMR 최적화
        hmr: {
          overlay: isDev
        },

        // 미리 번들링할 의존성
        optimizeDeps: {
          include: [
            'react',
            'react-dom',
            '@heroicons/react/24/outline',
            '@heroicons/react/24/solid',
            'react-window'
          ],
          exclude: ['@supabase/supabase-js']
        }
      },

      // 에셋 처리 최적화
      assetsInclude: ['**/*.woff2', '**/*.woff', '**/*.ttf'],

      // CSS 최적화
      css: {
        devSourcemap: isDev,
        preprocessorOptions: {
          // CSS 압축 최적화
        }
      },

      // 환경 변수 최적화
      envPrefix: 'VITE_'
    };
});
