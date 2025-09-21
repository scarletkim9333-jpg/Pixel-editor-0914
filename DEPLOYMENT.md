# 🚀 Pixel Editor 배포 가이드

이 문서는 Pixel Editor를 프로덕션 환경에 배포하는 방법을 설명합니다.

## 📋 목차
- [배포 전 체크리스트](#-배포-전-체크리스트)
- [환경 변수 설정](#-환경-변수-설정)
- [자동 배포](#-자동-배포)
- [수동 배포](#-수동-배포)
- [플랫폼별 가이드](#-플랫폼별-가이드)
- [배포 후 확인](#-배포-후-확인)
- [트러블슈팅](#-트러블슈팅)

---

## ✅ 배포 전 체크리스트

### 코드 준비
- [ ] 모든 변경사항이 커밋되어 있음
- [ ] TypeScript 타입 에러가 없음 (`npm run type-check`)
- [ ] 빌드가 성공함 (`npm run build`)
- [ ] 로컬에서 프로덕션 빌드 테스트 완료 (`npm run preview`)

### 환경 설정
- [ ] 프로덕션 환경 변수 설정 완료
- [ ] API 키들이 실제 값으로 설정됨
- [ ] 디버그 모드가 비활성화됨
- [ ] 보안 설정이 활성화됨

### 서비스 연동
- [ ] Supabase 프로덕션 프로젝트 준비
- [ ] TossPayments 라이브 키 설정
- [ ] Google Gemini API 키 설정
- [ ] FAL.ai API 키 설정
- [ ] 모니터링 도구 설정 (선택사항)

### 인프라
- [ ] 도메인 준비 (선택사항)
- [ ] SSL 인증서 설정
- [ ] CDN 설정 (선택사항)

---

## 🔐 환경 변수 설정

### 1. 프로덕션 환경 변수 파일 생성

`.env.production` 템플릿을 복사하여 실제 값으로 설정:

```bash
cp .env.production .env.production.local
```

### 2. 필수 환경 변수

```bash
# Supabase (필수)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key

# AI Services (필수)
VITE_GEMINI_API_KEY=your_actual_gemini_key
VITE_FAL_KEY=your_actual_fal_key

# TossPayments (결제 기능 사용시)
VITE_TOSS_CLIENT_KEY=live_ck_your_live_key

# Production Settings
VITE_DEBUG_MODE=false
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_MONITORING=true
```

### 3. 환경 변수 검증

환경 변수가 올바르게 설정되었는지 확인:

```bash
npm run build:prod
```

---

## 🤖 자동 배포

### 배포 스크립트 사용

```bash
# 스테이징 환경 배포
./scripts/deploy.sh staging

# 프로덕션 환경 배포
./scripts/deploy.sh production
```

### 스크립트 기능
- ✅ 환경 검증
- ✅ 의존성 설치
- ✅ 타입 체크
- ✅ 빌드
- ✅ 배포
- ✅ 헬스 체크
- ✅ 백업 관리

---

## 🔧 수동 배포

### 1. 빌드

```bash
# 의존성 설치
npm ci

# 타입 체크
npm run type-check

# 프로덕션 빌드
npm run build:prod
```

### 2. 빌드 검증

```bash
# 로컬에서 프로덕션 빌드 테스트
npm run preview:prod

# 빌드 크기 분석
npm run analyze
```

### 3. 배포 플랫폼별 명령어

#### Vercel
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로덕션 배포
vercel --prod
```

#### Netlify
```bash
# Netlify CLI 설치
npm i -g netlify-cli

# 배포
netlify deploy --prod --dir=dist
```

#### AWS S3 + CloudFront
```bash
# AWS CLI로 S3에 업로드
aws s3 sync dist/ s3://your-bucket-name --delete

# CloudFront 캐시 무효화
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

---

## 🏗️ 플랫폼별 가이드

### Vercel (권장)

#### 설정
1. Vercel 계정에 프로젝트 연결
2. 환경 변수 설정 (Settings > Environment Variables)
3. 빌드 설정:
   - Build Command: `npm run build:prod`
   - Output Directory: `dist`
   - Install Command: `npm ci`

#### vercel.json 설정
프로젝트 루트의 `vercel.json` 파일이 자동으로 적용됩니다.

### Netlify

#### 설정
1. Netlify에서 새 사이트 생성
2. 빌드 설정:
   - Build command: `npm run build:prod`
   - Publish directory: `dist`
3. 환경 변수 설정 (Site settings > Environment variables)

#### netlify.toml (선택사항)
```toml
[build]
  publish = "dist"
  command = "npm run build:prod"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/app/*"
  to = "/app/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Docker

#### Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:prod

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  pixel-editor:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

---

## 🔍 배포 후 확인

### 1. 기본 확인사항
- [ ] 사이트가 정상적으로 로드됨
- [ ] 모든 페이지가 작동함 (`/`, `/app`, `/share/*`)
- [ ] 이미지와 아이콘이 제대로 표시됨
- [ ] 에러가 없음 (개발자 도구 콘솔 확인)

### 2. 기능 테스트
- [ ] AI 이미지 생성 기능
- [ ] 갤러리 저장/불러오기
- [ ] 공유 기능
- [ ] 결제 기능 (설정된 경우)
- [ ] 반응형 디자인 (모바일/태블릿/데스크톱)

### 3. 성능 측정

```bash
# Lighthouse 성능 측정
npm run lighthouse

# 번들 크기 분석
npm run analyze
```

### 4. 모니터링 확인
- [ ] Google Analytics 데이터 수집 (설정된 경우)
- [ ] 에러 모니터링 작동 (Sentry 등)
- [ ] 성능 모니터링 작동

---

## 🚨 트러블슈팅

### 빌드 에러

#### TypeScript 에러
```bash
# 타입 에러 확인
npm run type-check

# 에러 수정 후 재빌드
npm run build:prod
```

#### 메모리 부족
```bash
# Node.js 메모리 제한 증가
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build:prod
```

### 환경 변수 문제

#### 환경 변수가 적용되지 않는 경우
```bash
# 환경 변수 확인 (개발자 도구 콘솔)
console.log(window.pixelEnv)

# 빌드 시 환경 변수 확인
npm run build:prod -- --mode production
```

#### Supabase 연결 오류
- Supabase URL과 키가 올바른지 확인
- RLS (Row Level Security) 정책 확인
- 네트워크 설정 확인

### 배포 플랫폼 문제

#### Vercel 배포 실패
```bash
# Vercel 로그 확인
vercel logs your-deployment-url

# 재배포
vercel --prod --force
```

#### 도메인 연결 문제
- DNS 설정 확인 (A/CNAME 레코드)
- SSL 인증서 상태 확인
- 캐시 클리어 후 재확인

### 성능 문제

#### 로딩 속도 개선
- 이미지 최적화 확인
- CDN 사용 여부 확인
- 번들 크기 분석 후 최적화

#### 메모리 누수
- React DevTools로 컴포넌트 상태 확인
- 브라우저 메모리 사용량 모니터링
- 이벤트 리스너 정리 확인

---

## 📊 성능 목표

### Lighthouse 점수 목표
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 85+

### 번들 크기 목표
- Initial Bundle: < 500KB (gzipped)
- Total Bundle: < 2MB
- 이미지 최적화: WebP 사용

### 로딩 시간 목표
- First Contentful Paint (FCP): < 2초
- Largest Contentful Paint (LCP): < 3초
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

---

## 🔧 배포 자동화 (CI/CD)

### GitHub Actions 예시

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Type check
      run: npm run type-check

    - name: Build
      run: npm run build:prod
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}

    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-args: '--prod'
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 📞 지원

배포 중 문제가 발생하면:

1. 이 문서의 트러블슈팅 섹션 확인
2. GitHub Issues에서 유사한 문제 검색
3. 새로운 이슈 생성 (에러 로그와 환경 정보 포함)

---

*마지막 업데이트: 2025-09-22*