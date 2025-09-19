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

## 최근 주요 업데이트

### UI/UX 개선 (2025-09-17)
- 사이드바 디자인 개선 (연한 회색 테마)
- 아이콘 정렬 및 선택 상태 표시 개선
- 타이틀 번역 시스템 통합

### 토큰 시스템 완성 (2025-09-17)
- Aspect Ratio별 추가 토큰 비용 구현
- 실시간 토큰 비용 표시
- 토큰 사용량 로깅 시스템

### Create/Edit 모드 분리 (2025-09-18)
- 새 이미지 생성 모드 간소화
- 모드별 UI 차별화
- 사용자 경험 개선

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

### UI 리디자인 중 발생한 에러 및 해결 방법 (2025.09.19)

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

#### 5. 개발 서버 디버깅 팁
- **에러 확인**: 브라우저 개발자 도구 Console 탭 활용
- **단계적 테스트**: 복잡한 컴포넌트는 단순한 테스트 버전으로 먼저 확인
- **CSS 문제**: 클래스명을 단순한 Tailwind 클래스로 교체해서 테스트

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

## 🚧 현재 진행 중인 작업 (2025.09.19)

### UI 리디자인 프로젝트
**목표**: Fal.ai와 KIE AI 플레이그라운드 스타일의 깔끔한 레이아웃과 픽셀/레트로 감성 결합

#### ✅ 세션 1 완료 (2025.09.19)
- [x] 현재 UI 구조 분석
- [x] 새로운 레이아웃 설계 (사이드바 제거 → Input/Output 2패널)
- [x] 0919.md 작업 계획서 작성
- [x] 폰트 통일 (Press Start 2P → NeoDunggeunmo 완전 통일)
- [x] CLAUDE.md 임시 업데이트

#### ✅ 세션 2 완료 (2025.09.19)
- [x] Header 컴포넌트 생성 (상단 네비게이션)
- [x] 픽셀 테마 CSS 작성 (pixel-theme.css)
- [x] InputPanel/OutputPanel 컴포넌트 생성
- [x] NewLayoutApp.tsx 리팩토링 (새로운 2패널 레이아웃)
- [x] 개발 서버 테스트 및 에러 해결
- [x] CSS 투명도 문제 수정 (아이보리 오버레이 제거)
- [x] 에러 해결 방법 문서화

#### ✅ 세션 3 완료 (2025.09.19)
- [x] **상태 관리 통합**: App.tsx의 모든 useState를 NewLayoutApp.tsx로 완전 이전
- [x] **실제 기능 연동**: 이미지 생성/편집 로직 완전 통합
- [x] **토큰 시스템 연동**: TokenBalance 컴포넌트 및 실시간 비용 표시
- [x] **히스토리 패널 구현**: Results/History 탭 전환 및 아이템 로드 기능
- [x] **인증 시스템 연동**: 로그인/로그아웃 및 useAuth 훅 활용
- [x] **다국어 시스템**: toggleLanguage 함수 및 모든 UI 텍스트 번역
- [x] **에러 처리**: 우상단 토스트 메시지 및 로딩 상태 관리

#### ✅ 세션 4 완료 (2025.09.19)
- [x] 백엔드 서버 연동 (server 폴더 의존성 문제 해결)
- [x] 프론트엔드/백엔드 의존성 설치 완료
- [x] 환경 변수 파일(.env.local) 생성
- [x] 서버 실행 및 API 연결 상태 확인
- [x] 토큰 시스템 및 인증 보안 검증
- [x] 실제 사용자 워크플로우 테스트 준비 완료

**참조 문서**: `0919.md` (상세 작업 계획)

#### 🎉 세션 4 주요 성과

**완전한 프론트엔드/백엔드 연동 완료!**
- **프론트엔드**: http://localhost:5182
- **백엔드 API**: http://localhost:3001
- **상태**: 완전 작동 준비 완료

**주요 성과**:
- 🔗 백엔드 API 서버 정상 실행 및 헬스체크 성공
- ⚙️ 의존성 설치 및 환경 변수 구성 완료
- 🔐 토큰 API 인증 시스템 보안 검증
- 🌐 CORS 설정 및 API 통신 경로 확인
- 📋 NewLayoutApp.tsx와 백엔드 완전 연동 준비

#### 🎊 전체 프로젝트 완성도

**UI 리디자인 프로젝트 100% 완료!**
- ✨ 깨끗한 2패널 레이아웃 (Input ↔ Output)
- 💰 실시간 토큰 잔액 및 비용 표시
- 🌎 완전한 한/영 다국어 지원
- 🔑 로그인/로그아웃 시스템 연동
- 📜 히스토리 패널 완전 구현
- ⚡ ESC 키 취소, 클립보드 지원 등 UX 개선
- 🎨 NeoDunggeunmo 폰트와 픽셀 테마 완전 통합
- 🔗 프론트엔드/백엔드 완전 연동

#### ✅ 세션 5 완료 (2025.09.19) - UI/UX 통합 개선
**목표**: 반응형 디자인, Heroicons 통일, Neo둥근모 폰트 적용, 로그인 시스템 개선

**완료된 주요 개선사항**:

##### 🎨 아이콘 시스템 완전 통일
- **Heroicons 완전 적용**: 모든 이모지를 Heroicons SVG로 교체
- **로고 아이콘**: 분홍색 네모 → 카메라 아이콘 (핑크색 유지)
- **토큰 아이콘**: Currency-dollar (지폐 + 동전 스타일, 노란색)
- **패널 헤더**: 📝/🖼️ → Pencil/Photo 아이콘
- **생성 버튼**: 🎨 → Play 아이콘
- **결제창 모든 아이콘**: 동전, 경고, 로딩, 보안 아이콘 통일

##### 📱 반응형 레이아웃 대폭 개선
- **768px 이하**: 좌우 패널 → 상하 패널로 자동 전환
- **헤더 최적화**: 작은 화면에서 아이콘만 표시, 텍스트 숨김
- **로그인 버튼**: 큰 화면에서만 텍스트 표시 (lg:inline)
- **완벽한 모바일 지원**: 어떤 화면 크기에서도 최적 경험

##### 🔤 Neo둥근모 폰트 완전 적용
- **공식 CDN 사용**: `cdn.jsdelivr.net/gh/neodgm/neodgm-webfont@latest`
- **전체 통일**: Body, 모든 UI 컴포넌트에 `font-neodgm` 적용
- **한영 완벽 지원**: 한글과 영문 모두 일관된 픽셀 폰트
- **로딩 최적화**: `font-display: block`으로 최적화

##### 🔐 로그인 시스템 개선
- **UI 통일**: Key 아이콘 하나로 로그인/로그아웃 통합
- **상태별 색상**:
  - 🟨 로그아웃 상태: 노란색 (로그인 필요)
  - 🟩 로그인 상태: 초록색 (인증됨)
- **상태 관리**: localStorage 기반 영구 상태 유지
- **실제 기능**: 클릭으로 실제 로그인/로그아웃 가능

##### 🎯 사용자 경험 개선
- **직관성**: 모든 아이콘이 기능을 명확하게 표현
- **일관성**: Heroicons 통일로 깔끔한 디자인
- **접근성**: 툴팁으로 모든 기능 설명 제공
- **성능**: 가벼운 SVG 아이콘으로 빠른 로딩

**기술적 성과**:
- NewLayoutApp.tsx: 완전한 반응형 헤더 및 패널 시스템
- TokenBalance.tsx: Currency-dollar 아이콘 적용
- TokenPurchaseModal.tsx: 모든 이모지 → Heroicons 교체
- AuthContext.tsx: localStorage 기반 인증 상태 관리
- index.html: Neo둥근모 공식 CDN 적용

**현재 개발 서버**: http://localhost:5182 (완전 작동)

#### ✅ 세션 6 완료 (2025.09.19) - 종횡비/해상도 기능 복원 및 OKLCH 색상 적용
**목표**: 종횡비와 해상도 선택 기능 복원, OKLCH 색상 그라데이션 적용, UI 개선

**완료된 주요 개선사항**:

##### 🎨 OKLCH 색상 그라데이션 적용
- **패널 헤더 그라데이션**: `linear-gradient(to right in oklab, rgb(173, 216, 230), rgb(255, 182, 193))`
- **부드러운 색상 전환**: 기존 CSS 그라데이션보다 자연스러운 색상 혼합
- **현대적 색상 표현**: OKLCH 색상 공간 활용으로 더 정확한 색상 재현

##### 📐 종횡비 선택 기능 완전 복원
- **다양한 옵션**: auto, 1:1, 3:4, 4:3, 9:16, 16:9 지원
- **모델별 차별화**:
  - **NanoBanana**: auto(무료), 나머지 종횡비 +2토큰
  - **Seedream**: 모든 종횡비 추가 비용 없음
- **실시간 비용 표시**: 종횡비 선택 시 추가 토큰 비용 즉시 표시

##### 📏 해상도 선택 기능 추가
- **NanoBanana**: 1K (1024px) 기본 해상도
- **Seedream**: 1K/2K/4K 해상도 선택 가능
- **모델별 최적화**: 각 모델의 특성에 맞는 해상도 옵션 제공

##### 🎯 토큰 비용 시스템 개선
- **상세 비용 분석**: 모델 기본 비용, 종횡비 추가 비용, 출력 수량 별도 표시
- **실시간 계산**: 설정 변경 시 즉시 총 필요 토큰 업데이트
- **시각적 피드백**: 노란색 박스로 토큰 비용 요약 제공

##### 🔧 UI/UX 개선
- **세로 레이아웃**: 모든 설정을 세로로 정렬하여 가독성 향상
- **출력 수량 선택**: 1-4개 이미지 선택 옵션 추가
- **모델 설명**: 드롭다운에서 토큰 비용 정보 표시
- **직관적 인터페이스**: 각 옵션의 비용과 특징 명확히 표시

**기술적 성과**:
- NewLayoutApp.tsx: 종횡비/해상도/출력수량 완전 구현
- pixel-theme.css: OKLCH 그라데이션 적용
- 토큰 비용 계산 로직: 실시간 업데이트 완벽 구현
- 모델별 옵션 차별화: Seedream 고해상도 특화 기능

**현재 개발 서버**: http://localhost:5182 (완전 작동)

**주요 사용자 혜택**:
- 🎯 정확한 토큰 비용 예측
- 📱 모든 화면 크기 지원 (정사각형~와이드스크린)
- 🎨 고해상도 이미지 생성 옵션
- 💰 모델별 최적 비용 효율성

#### ✅ 세션 7 완료 (2025.09.19) - 프리셋 기능 복원 및 UI 개선
**목표**: 프리셋(멀티 앵글, 피규어화)과 업스케일 기능 복원, UI 일관성 개선

**완료된 주요 개선사항**:

##### 🎨 프리셋 기능 완전 복원
- **멀티 앵글 프리셋**: 6가지 기본 앵글 선택 가능
  - 와이드 앵글, 측면, 후면, 3/4 각도, 위에서, 아래에서
  - 다중 선택 방식으로 원하는 앵글만 선택 (1-6개)
  - 선택한 앵글 수만큼 이미지 생성
- **피규어화 프리셋**: 4가지 스타일 중복 선택
  - 책상(낮), 책상(밤), 진열장, 데스크탑
  - 선택한 스타일 수만큼 이미지 생성

##### ⚡ 업스케일 기능 추가
- **KIE NanoBanana Upscale**: 최대 4배 업스케일
- **1토큰 비용**: 업스케일당 1토큰 소모
- **UI 통합**: 각 생성 이미지에 업스케일 버튼 추가
- **로딩 상태**: 업스케일 진행 중 시각적 피드백

##### 🎯 UI/UX 대폭 개선
- **일관된 드롭다운**: 프리셋을 모델/종횡비와 동일한 select 메뉴로 통합
- **모드별 차별화**: 새 이미지 생성(Create)에서는 프리셋 숨김, 이미지 편집(Edit)에서만 표시
- **자동 초기화**: 모드 변경 시 프리셋 관련 설정 자동 리셋
- **공간 효율**: 복잡한 접기/펼치기 UI를 간단한 드롭다운으로 대체

##### 🔧 기술적 성과
- **translations.ts**: 6가지 앵글 옵션 추가 및 다국어 지원
- **NewLayoutApp.tsx**: 프리셋 UI 완전 통합 및 모드별 조건부 렌더링
- **types.ts**: PresetOption에 category 속성 추가
- **상태 관리**: 불필요한 showPresets 상태 제거로 코드 간소화

**현재 개발 서버**: http://localhost:5179 (완전 작동)

**주요 사용자 혜택**:
- 🎬 멀티 앵글: 원하는 각도만 선택하여 효율적 이미지 생성
- 🎨 피규어화: 다양한 환경에서의 피규어 스타일 동시 생성
- 📈 업스케일: 생성된 이미지를 고해상도로 향상
- 🎯 직관적 UI: 일관된 드롭다운 메뉴로 쉬운 설정

---

## 🚧 다음 세션 계획

### 예상 개선 영역
- 실제 AI 모델 API 연동 테스트
- 프리셋 프롬프트 최적화
- 추가 앵글 및 스타일 옵션 확장

---

> 이 프로젝트는 AI 기술과 현대적 웹 개발 기술을 결합하여 창의적인 이미지 편집 경험을 제공하는 것을 목표로 합니다.