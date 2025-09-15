# 멀티 스테이지 빌드를 사용하여 최적화된 프로덕션 이미지 생성
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# 프로덕션 스테이지
FROM node:18-alpine AS production

# 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 빌드된 애플리케이션 복사
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# nodejs 사용자로 전환
USER nodejs

# 포트 노출
EXPOSE 3001

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node dist/healthcheck.js || exit 1

# 애플리케이션 실행
CMD ["node", "dist/index.js"]