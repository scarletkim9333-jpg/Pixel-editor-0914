# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소의 코드를 작업할 때 사용하는 지침을 제공합니다.

## 개발 명령어

- **개발 서버 시작**: `npm run dev`
- **프로덕션 빌드**: `npm run build`
- **프로덕션 빌드 미리보기**: `npm run preview`
- **의존성 설치**: `npm install`

## 아키텍처 개요

이것은 구글의 Gemini AI와 통합되어 이미지 편집 기능을 제공하는 React 기반 픽셀 에디터 애플리케이션입니다. 이 앱은 Vite와 TypeScript로 구축되었습니다.

### 핵심 구조

- **App.tsx**: 이미지, 사용자 인증, 생성 요청 및 히스토리에 대한 상태 관리를 처리하는 메인 애플리케이션 컴포넌트
- **components/**: 기능별로 구성된 React 컴포넌트
  - `Controls.tsx`: 이미지 생성 제어 (프롬프트, 프리셋, 모델 선택)
  - `OutputViewer.tsx`: 생성된 이미지와 토큰 사용량 표시
  - `ImageUploader.tsx`: 이미지 업로드 및 드래그 앤 드롭 처리
  - `DrawingCanvas.tsx`: 이미지 생성을 위한 내장 그리기 도구
  - `HistoryPanel.tsx`: 로드/삭제 기능이 있는 생성 히스토리 표시
  - `HelpModal.tsx`: 사용자 도움말 및 문서
- **services/**: 핵심 비즈니스 로직
  - `geminiService.ts`: 이미지 편집을 위한 Google Gemini AI 통합
  - `historyService.ts`: 생성 히스토리를 위한 로컬 스토리지 관리
- **contexts/**: React 컨텍스트
  - `LanguageContext.tsx`: 국제화 지원 (영어/한국어)

### 주요 기능

- **이미지 편집**: AI 기반 이미지 편집을 위해 Google Gemini AI 모델 ('nanobanana', 'seedance') 사용
- **다중 이미지 지원**: 메인 이미지 + 참조 이미지 워크플로우
- **프리셋 시스템**: 사용자 정의 옵션이 있는 사전 구성된 편집 스타일
- **히스토리 관리**: 로드/복원 기능이 있는 생성의 로컬 스토리지
- **그리기 도구**: 처음부터 이미지를 생성하기 위한 내장 캔버스
- **국제화**: 영어 및 한국어 지원

### 환경 설정

Google Gemini API 액세스를 위해 `.env.local` 파일에 `GEMINI_API_KEY` 환경 변수 설정이 필요합니다.

### 중요한 파일들

- **types.ts**: 전체 애플리케이션의 TypeScript 인터페이스
- **translations.ts**: 로컬라이제이션 문자열 및 프리셋 정의
- **utils.ts**: 파일 처리 및 데이터 변환을 위한 유틸리티 함수
- **constants.ts**: 애플리케이션 상수 (현재 최소한)

### 상태 관리

앱은 메인 App 컴포넌트가 대부분의 상태를 보유하는 React 상태 관리를 사용합니다. 주요 상태는 다음과 같습니다:
- 이미지 파일 (메인 + 참조 이미지)
- 생성 매개변수 (프롬프트, 창의성, 프리셋, 모델, 종횡비, 해상도)
- 생성 결과 및 히스토리
- UI 상태 (로딩, 오류, 활성 탭)

### 인증

현재 모의 인증 시스템을 사용합니다 (Google 로그인 통합을 위한 플레이스홀더).