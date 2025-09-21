# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소의 코드를 작업할 때 사용하는 지침을 제공합니다.

## 프로젝트 개요

**Pixel Editor 0914**는 AI 기반 이미지 생성 및 편집을 제공하는 React 웹 애플리케이션입니다. 8-bit 픽셀 아트 스타일의 레트로 게임 UI/UX와 현대적인 AI 기술을 결합한 창의적인 이미지 편집 도구입니다.

### 핵심 기술 스택

- **Frontend**: React 19.1.1, TypeScript 5.8.2, Vite 6.2.0
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment**: TossPayments 1.9.1
- **AI Models**: Google Gemini, FAL.ai
- **Styling**: Tailwind CSS (8-bit 픽셀 테마)

## 개발 명령어

### 프론트엔드
```bash
npm run dev      # 개발 서버 시작 (포트 5174)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 미리보기
npm install      # 의존성 설치
```

### 백엔드
```bash
cd server
npm run dev      # 백엔드 개발 서버 (포트 3001)
npm run build    # TypeScript 컴파일
npm start        # 프로덕션 실행
```

## 아키텍처 구조

### 프론트엔드 구조

```
src/
├── components/          # React 컴포넌트
│   ├── Sidebar.tsx         # 네비게이션 사이드바
│   ├── Controls.tsx        # 이미지 생성 제어판
│   ├── OutputViewer.tsx    # 결과 이미지 표시
│   ├── ImageUploader.tsx   # 이미지 업로드 인터페이스
│   ├── DrawingCanvas.tsx   # 내장 그리기 도구
│   ├── HistoryPanel.tsx    # 생성 히스토리 관리
│   ├── TokenBalance.tsx    # 토큰 잔액 표시
│   └── TokenPurchaseModal.tsx # 토큰 구매 인터페이스
├── contexts/            # React 컨텍스트
│   ├── LanguageContext.tsx # 다국어 지원 (한/영)
│   └── AuthContext.tsx     # 사용자 인증 상태
├── services/            # 비즈니스 로직
│   ├── geminiService.ts    # AI 모델 통합
│   ├── historyService.ts   # 히스토리 관리
│   └── api.ts             # API 통신 레이어
├── lib/                 # 유틸리티 라이브러리
│   ├── supabase.ts        # Supabase 클라이언트
│   └── tokenApi.ts        # 토큰 관리 API
├── types.ts            # TypeScript 타입 정의
├── translations.ts     # 다국어 번역
└── utils.ts            # 공통 유틸리티
```

### 백엔드 구조

```
server/src/
├── routes/              # API 라우터
│   ├── auth.ts             # 인증 관련
│   ├── generation.ts       # 이미지 생성
│   ├── tokens.ts          # 토큰 관리
│   ├── payment.ts         # 결제 처리
│   └── user.ts            # 사용자 관리
├── services/            # 외부 서비스 연동
│   ├── gemini.ts          # Google Gemini AI
│   ├── fal.ts             # FAL.ai 모델
│   ├── toss.ts            # TossPayments
│   └── supabase.ts        # Supabase 연동
├── middleware/          # Express 미들웨어
│   ├── auth.ts            # JWT 인증
│   └── rateLimit.ts       # 요청 제한
└── lib/
    └── supabase.ts        # Supabase 서버 클라이언트
```

## 주요 기능

### 1. 이미지 생성 모드

- **새 이미지 생성**: 프롬프트만으로 완전히 새로운 이미지 생성
- **이미지 편집**: 기존 이미지를 AI로 편집 및 수정
- **채팅으로 편집**: 대화형 인터페이스로 이미지 편집 (개발 중)

### 2. AI 모델 지원

#### 기본 모델
- **NanoBanana**: 일반적인 이미지 생성 및 편집 (기본 2토큰)
  - 기본 해상도: 1024px (native)
  - 종횡비 선택 시: +2토큰 추가
  - 업스케일 지원: KIE NanoBanana Upscale (최대 4배)
- **Seedream**: 고해상도 이미지 생성 특화 (기본 4토큰)
  - 기본 해상도: 2K~4K
  - 종횡비 선택: 추가 비용 없음
  - 업스케일: 불필요 (자체적으로 고해상도 생성)

### 3. 토큰 시스템

#### 모델별 토큰 비용

**NanoBanana**
- 기본 (1024px, native): 2토큰
- 종횡비 선택 시: 4토큰 (2+2)
- 업스케일: 1토큰 (KIE NanoBanana Upscale, 최대 4배)

**Seedream**
- 모든 설정: 4토큰 (종횡비/해상도 추가 비용 없음)
- 지원 해상도: 2K~4K

#### 토큰 관리
- **신규 사용자**: 100토큰 지급
- **구매**: TossPayments 통합
- **사용 내역**: 실시간 추적 및 기록

### 4. UI/UX 특징

- **8-bit 픽셀 아트 테마**: 레트로 게임 스타일
- **사이드바 네비게이션**: 접이식 모드 전환
- **실시간 토큰 표시**: 생성 버튼에 필요 토큰 실시간 표시
- **반응형 디자인**: 모바일/데스크톱 완벽 지원
- **다국어 지원**: 한국어/영어 완벽 번역

### 5. 고급 기능

- **다중 이미지 지원**: 메인 + 참조 이미지 워크플로우
- **프리셋 시스템**: 멀티 앵글, 피규어화 등 사전 정의된 스타일
- **히스토리 관리**: 생성 기록 저장 및 불러오기
- **내장 그리기 도구**: 캔버스로 직접 그리기
- **창의성 조절**: AI 창의도 슬라이더

## 데이터베이스 구조 (Supabase)

### 테이블

1. **users**: 사용자 정보
2. **user_tokens**: 토큰 잔액 관리
3. **token_transactions**: 토큰 거래 내역
4. **generation_history**: 이미지 생성 히스토리
5. **payments**: 결제 내역

### 주요 함수

- `use_tokens(user_id, amount)`: 토큰 차감 (원자적 작업)
- `add_tokens(user_id, amount, type, description)`: 토큰 충전

### 보안 (RLS)

- Row Level Security 적용
- 사용자별 데이터 격리
- JWT 기반 인증

## API 연동

### 인증 시스템

- **Supabase Auth**: JWT 기반 인증
- **자동 토큰 갱신**: 만료 시 자동 리프레시
- **미들웨어**: Express에서 JWT 검증

### 결제 시스템

- **TossPayments**: 한국 대표 결제 서비스
- **지원 결제 수단**: 카드, 계좌이체, 간편결제
- **Webhook**: 결제 상태 실시간 업데이트
- **환불 지원**: 부분/전체 환불 가능

### AI 서비스

- **Google Gemini**: 이미지 생성 및 편집
- **FAL.ai**: 추가 AI 모델 지원
- **프롬프트 제안**: AI 기반 프롬프트 추천

## 환경 설정

### 프론트엔드 (.env.local)

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# TossPayments
VITE_TOSS_CLIENT_KEY=your_toss_client_key

# API
VITE_API_URL=http://localhost:3001/api
```

### 백엔드 (.env)

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# TossPayments
TOSS_SECRET_KEY=your_toss_secret_key
PAYMENT_SUCCESS_URL=http://localhost:3000/payment/success
PAYMENT_FAIL_URL=http://localhost:3000/payment/fail

# AI Services
GEMINI_API_KEY=your_gemini_api_key
FAL_KEY=your_fal_key

# 서버 설정
PORT=3001
NODE_ENV=development
```

## 배포 및 인프라

### 프론트엔드
- **Vercel**: 권장 배포 플랫폼
- **Build 명령어**: `npm run build`
- **정적 파일**: `dist/` 폴더

### 백엔드
- **Google Cloud Platform**: Docker 컨테이너
- **Cloud Build**: 자동 빌드/배포
- **Load Balancer**: 트래픽 분산

### 데이터베이스
- **Supabase**: 관리형 PostgreSQL
- **백업**: 자동 일일 백업
- **스케일링**: 자동 확장

## 주요 업데이트 (2025-09-19~21)

### UI 리디자인 완성 (2025-09-19~21)
- **새로운 2패널 레이아웃**: Input ↔ Output 패널로 완전 재설계
- **현대적 색상 테마**: oklab 그라데이션 + 파스텔 핑크 픽셀 아트 스타일
- **반응형 중앙 정렬**: 1280px 최대 너비, 완벽한 모바일/데스크톱 지원
- **Heroicons 완전 통일**: 모든 UI 요소에서 일관된 아이콘 시스템
- **Neo둥근모 폰트**: 한영 완벽 지원하는 픽셀 폰트 적용

### 토큰 시스템 완성 (2025-09-20)
- **실시간 업데이트**: 커스텀 이벤트 기반 즉시 동기화
- **모델별 차별 비용**: NanoBanana/Seedream 특성에 맞는 토큰 시스템
- **종횡비/해상도**: 선택에 따른 정확한 토큰 비용 계산

### 기능 통합 완성 (2025-09-19~21)
- **프리셋 시스템**: 멀티 앵글, 피규어화 프리셋 완전 복원
- **DrawingCanvas**: 픽셀 테마 통합 및 워크플로우 최적화
- **히스토리 관리**: Results/History 탭 및 생성 기록 완전 구현
- **다국어 지원**: 한국어/영어 완벽 번역 시스템

## 개발 가이드라인

### Claude Code 세션 관리
- **세션 완료 시**: 세션이 완료될 때마다 내용을 정리해서 git commit을 실행해줘

### 코딩 스타일
- **TypeScript**: 엄격한 타입 검사
- **ESLint**: 코드 품질 관리
- **Prettier**: 코드 포맷팅

### 컴포넌트 설계
- **단일 책임 원칙**: 하나의 기능에 집중
- **Props 인터페이스**: 명확한 타입 정의
- **재사용성**: 공통 컴포넌트 추출

### 상태 관리
- **React Context**: 전역 상태 (인증, 언어)
- **useState/useEffect**: 로컬 상태
- **Custom Hooks**: 비즈니스 로직 분리

### API 설계
- **RESTful**: 표준 HTTP 메서드
- **에러 핸들링**: 일관된 에러 응답
- **Rate Limiting**: 요청 제한

## 트러블슈팅

### 개발 환경
- **포트 충돌**: 프론트엔드(5174), 백엔드(3001)
- **CORS 이슈**: 개발 시 proxy 설정
- **환경 변수**: .env 파일 누락 확인

### UI 리디자인 중 발생한 에러 및 해결 방법 (2025.09.19-20)

#### 1. React 컴포넌트 렌더링 에러
**문제**: `mainImage is not defined` 에러
```
App.tsx:194 Uncaught ReferenceError: mainImage is not defined
```
**원인**: 컴포넌트 리팩토링 중 변수 정의 누락
**해결**: 사용되는 곳에서 적절히 변수 정의
```typescript
const mainImage = images[0] || null;
const referenceImages = images.slice(1);
```

#### 2. 중복 변수 선언 에러
**문제**: `The symbol "currentMode" has already been declared`
**원인**: 동일 스코프에서 변수 중복 선언
**해결**: 기존 선언 제거하고 하나만 유지

#### 3. Import 경로 에러
**문제**: `The requested module does not provide an export named 'AuthProvider'`
**원인**: 잘못된 import 경로
**해결**: 올바른 경로로 수정
```typescript
// 잘못된 예
import { LanguageProvider, AuthProvider } from './contexts/LanguageContext';

// 올바른 예
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
```

#### 4. CSS 배경 투명도 문제
**문제**: 아이보리색 불투명한 화면 오버레이
**원인**: CSS의 `opacity: 0.1` 속성이 전체 요소에 적용
**해결**:
```css
/* 문제가 된 코드 */
.pixel-bg {
  opacity: 0.1; /* 전체 요소를 투명하게 만듦 */
}

/* 수정된 코드 */
.pixel-bg {
  background-color: var(--bg-pattern);
  /* opacity 제거 */
}
```

#### 5. 토큰 실시간 업데이트 문제 (2025.09.20)
**문제**: 토큰이 차감되지만 UI가 실시간으로 업데이트되지 않음
```
콘솔: "토큰 차감 완료 - 남은 토큰: 48"
UI: 새로고침해야만 변경사항 반영
```
**원인**: React 컴포넌트 간 상태 격리 - 각 `useTokens` 훅이 독립적인 상태를 가짐
**해결**: 커스텀 이벤트 시스템으로 실시간 상태 동기화
```typescript
// 해결 방법 1: 커스텀 이벤트 발생
const event = new CustomEvent('tokenBalanceChanged', {
  detail: { balance: newBalance, totalUsed: newTotalUsed }
});
window.dispatchEvent(event);

// 해결 방법 2: 이벤트 감지
useEffect(() => {
  const handleCustomTokenChange = ((e: CustomEvent) => {
    if (e.detail.balance !== undefined) {
      setBalance(e.detail.balance);
    }
  }) as EventListener;

  window.addEventListener('tokenBalanceChanged', handleCustomTokenChange);
  return () => window.removeEventListener('tokenBalanceChanged', handleCustomTokenChange);
}, []);
```

#### 6. 개발 서버 디버깅 팁
- **에러 확인**: 브라우저 개발자 도구 Console 탭 활용
- **단계적 테스트**: 복잡한 컴포넌트는 단순한 테스트 버전으로 먼저 확인
- **CSS 문제**: 클래스명을 단순한 Tailwind 클래스로 교체해서 테스트
- **상태 동기화**: 여러 컴포넌트에서 같은 상태를 사용할 때는 이벤트 시스템이나 Context API 활용

### 배포 이슈
- **빌드 에러**: TypeScript 타입 검사
- **API 연결**: 프로덕션 URL 설정
- **환경 변수**: 배포 플랫폼 설정 확인

## 향후 개발 계획

- **채팅 편집 모드**: 대화형 이미지 편집
- **업스케일 기능**: 이미지 해상도 향상
- **소셜 기능**: 이미지 공유 및 갤러리
- **모바일 앱**: React Native 기반
- **AI 모델 확장**: 더 다양한 스타일 지원

## 문의 및 지원

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **개발자**: scarletkim9333-jpg
- **라이선스**: MIT License

---

## 🏆 현재 프로젝트 상태 (2025.09.21 완성)

### ✅ 완성된 핵심 기능

#### UI/UX 시스템
- **2패널 레이아웃**: Input ↔ Output 완전 반응형 디자인 (1280px 최대 너비)
- **파스텔 픽셀 테마**: oklab 그라데이션 + 파스텔 핑크 + 3px 사각형 테두리
- **Heroicons 통일**: 모든 UI 요소에서 일관된 아이콘 시스템
- **Neo둥근모 폰트**: 한영 완벽 지원하는 픽셀 폰트 적용
- **완벽한 반응형**: 모바일부터 대형 모니터까지 최적화

#### 기능 시스템
- **실시간 토큰 관리**: 커스텀 이벤트 기반 즉시 동기화 + 애니메이션
- **모델별 토큰 비용**: NanoBanana(2토큰)/Seedream(4토큰) + 종횡비/해상도 추가 비용
- **프리셋 시스템**: 멀티 앵글(6가지), 피규어화(4가지) 완전 복원
- **DrawingCanvas**: 픽셀 테마 통합 + 워크플로우 최적화
- **히스토리 관리**: Results/History 탭 + 생성 기록 완전 구현
- **다국어 지원**: 한국어/영어 완벽 번역

#### 개발/배포 준비
- **프론트엔드/백엔드 연동**: 완전 작동 상태 (포트 5173/3001)
- **불필요한 컴포넌트 제거**: 7개 파일 정리 + App.tsx 700줄→20줄 간소화
- **Heroicons 완전 통일**: 커스텀 아이콘 완전 제거
- **코드 품질**: console.log 정리 + 모달 스타일 통일

### 🎯 기술 스택 현황
- **Frontend**: React 19.1.1 + TypeScript 5.8.2 + Vite 6.2.0 + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript (완전 연동)
- **Database**: Supabase (PostgreSQL) + JWT 인증
- **Payment**: TossPayments 1.9.1 통합
- **AI Models**: Google Gemini + FAL.ai (API 연동 준비 완료)

**개발 서버**: http://localhost:5173 ✅ 완전 작동

## 🚧 새로운 개발 계획 (2025.09.21)

> **세션별 실행 플랜이 작성되었습니다!**
> 상세 내용은 `docs/session-plans.md` 문서를 참고하세요.

### 📋 8개 세션으로 구성된 체계적 개발 로드맵

#### 🎯 주요 추가 기능
1. **예시 시스템 (Example Tab)**
   - KIE AI처럼 Input/Output 패널 아래에 예시 탭 추가
   - 클릭 한 번으로 설정 자동 적용
   - Before/After 비교 뷰

2. **개인 갤러리 저장 시스템**
   - 티어별 저장 (무료/등록/프리미엄)
   - 이미지 압축 및 썸네일 자동 생성
   - 공유 및 소셜 기능

3. **랜딩페이지 구축**
   - 매력적인 HeroSection
   - 인터랙티브 예시 쇼케이스
   - 기능 소개 그리드

#### 📊 예상 개발 일정 및 비용
- **총 개발 시간**: 20-30시간 (8개 세션)
- **예상 운영 비용**:
  - 초기 (1,000명): $0-5/월 (Supabase Free)
  - 성장기: $20-30/월 (Vercel Pro + Supabase)
  - 대규모: $50-100/월 (클라우드 확장)

#### 🏗️ 세션별 구성
1. **Session 1**: 이미지 압축 서비스 구축 (2-3시간)
2. **Session 2**: 예시 시스템 구현 (3-4시간)
3. **Session 3**: 랜딩페이지 구축 (3-4시간)
4. **Session 4**: 저장소 서비스 구축 (2-3시간)
5. **Session 5**: 갤러리 시스템 구현 (4-5시간)
6. **Session 6**: 공유 기능 (2-3시간)
7. **Session 7**: 성능 최적화 (3-4시간)
8. **Session 8**: 배포 준비 (2-3시간)

#### 🔧 디버깅 친화적 구조
- 각 서비스별 독립적 테스트 페이지
- 환경 변수로 디버깅 모드 제어
- 모듈화된 서비스 구조로 유지보수 최적화

### 기존 우선순위와 병행 진행

#### 우선순위 1: AI 모델 실제 연동 (기존)
- Google Gemini + FAL.ai API 실제 연동 테스트
- 프리셋 프롬프트 최적화 및 이미지 생성 워크플로우 완성
- 업스케일 기능 실제 구현 (KIE NanoBanana Upscale)

#### 우선순위 2: 고급 기능 확장 (신규 + 기존)
- **신규**: 예시 시스템 + 갤러리 + 랜딩페이지
- DrawingCanvas 픽셀 브러시 기능 추가
- 추가 앵글 및 스타일 프리셋 옵션
- 성능 최적화 및 번들 크기 개선

#### 우선순위 3: 배포 및 운영
- 프로덕션 빌드 최적화 및 환경 변수 설정
- Vercel 배포 준비 및 도메인 연결
- 사용자 피드백 시스템 구축

---

> 이 프로젝트는 AI 기술과 현대적 웹 개발 기술을 결합하여 창의적인 이미지 편집 경험을 제공하는 것을 목표로 합니다.