#!/bin/bash

# 🚀 Pixel Editor 배포 스크립트
# 사용법: ./scripts/deploy.sh [staging|production]

set -e # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수들
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 환경 변수 설정
ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"

log_info "🚀 Pixel Editor 배포 시작"
log_info "환경: $ENVIRONMENT"
log_info "시간: $TIMESTAMP"

# 환경 검증
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "잘못된 환경입니다. 'staging' 또는 'production'을 사용하세요."
    exit 1
fi

# 프로덕션 배포 확인
if [[ "$ENVIRONMENT" == "production" ]]; then
    log_warning "⚠️  프로덕션 환경에 배포하려고 합니다!"
    echo "계속하시겠습니까? (yes/no): "
    read -r confirmation
    if [[ "$confirmation" != "yes" ]]; then
        log_info "배포가 취소되었습니다."
        exit 0
    fi
fi

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

# 1. 환경 확인
log_info "📋 1. 환경 확인 중..."

# Node.js 버전 확인
if ! command -v node &> /dev/null; then
    log_error "Node.js가 설치되지 않았습니다."
    exit 1
fi

NODE_VERSION=$(node --version)
log_info "Node.js 버전: $NODE_VERSION"

# npm 버전 확인
NPM_VERSION=$(npm --version)
log_info "npm 버전: $NPM_VERSION"

# Git 상태 확인
if [[ -d ".git" ]]; then
    CURRENT_BRANCH=$(git branch --show-current)
    UNCOMMITTED_CHANGES=$(git status --porcelain | wc -l)

    log_info "현재 브랜치: $CURRENT_BRANCH"

    if [[ $UNCOMMITTED_CHANGES -gt 0 ]]; then
        log_warning "커밋되지 않은 변경사항이 있습니다."
        git status --short

        echo "계속하시겠습니까? (yes/no): "
        read -r git_confirmation
        if [[ "$git_confirmation" != "yes" ]]; then
            log_info "배포가 취소되었습니다."
            exit 0
        fi
    fi
fi

# 2. 의존성 설치
log_info "📦 2. 의존성 설치 중..."
npm ci --silent || {
    log_error "의존성 설치에 실패했습니다."
    exit 1
}
log_success "의존성 설치 완료"

# 3. 타입 체크
log_info "🔍 3. TypeScript 타입 체크 중..."
npm run type-check || {
    log_error "타입 체크에 실패했습니다."
    exit 1
}
log_success "타입 체크 완료"

# 4. 테스트 실행 (테스트가 있는 경우)
if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
    log_info "🧪 4. 테스트 실행 중..."
    npm test || {
        log_error "테스트에 실패했습니다."
        exit 1
    }
    log_success "테스트 완료"
else
    log_warning "테스트 스크립트가 없습니다. 건너뛰기..."
fi

# 5. 빌드
log_info "🏗️  5. 프로덕션 빌드 중..."

# 환경별 빌드 명령어
if [[ "$ENVIRONMENT" == "production" ]]; then
    BUILD_COMMAND="npm run build:prod"
else
    BUILD_COMMAND="npm run build:staging"
fi

$BUILD_COMMAND || {
    log_error "빌드에 실패했습니다."
    exit 1
}

# 빌드 크기 확인
DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "Unknown")
log_success "빌드 완료 (크기: $DIST_SIZE)"

# 6. 빌드 검증
log_info "🔍 6. 빌드 검증 중..."

# 필수 파일 확인
REQUIRED_FILES=("dist/index.html" "dist/assets")
for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -e "$file" ]]; then
        log_error "필수 파일이 없습니다: $file"
        exit 1
    fi
done

log_success "빌드 검증 완료"

# 7. 백업 (기존 배포본이 있는 경우)
if [[ -d "dist.backup" ]]; then
    log_info "🗂️  7. 기존 배포본 백업 중..."
    mv dist.backup "$BACKUP_DIR/dist_backup_$TIMESTAMP" || {
        log_warning "백업에 실패했습니다."
    }
fi

# 현재 dist를 백업으로 이동
if [[ -d "dist" ]]; then
    cp -r dist dist.backup
    log_success "현재 빌드 백업 완료"
fi

# 8. 배포 플랫폼별 처리
log_info "🚀 8. 배포 실행 중..."

case "$ENVIRONMENT" in
    "staging")
        log_info "Vercel Preview 배포 중..."
        if command -v vercel &> /dev/null; then
            vercel --prod=false || {
                log_error "Vercel 배포에 실패했습니다."
                exit 1
            }
        else
            log_warning "Vercel CLI가 설치되지 않았습니다."
            log_info "수동으로 배포하거나 Vercel CLI를 설치하세요: npm i -g vercel"
        fi
        ;;

    "production")
        log_info "프로덕션 배포 중..."
        if command -v vercel &> /dev/null; then
            vercel --prod || {
                log_error "프로덕션 배포에 실패했습니다."
                exit 1
            }
        else
            log_warning "Vercel CLI가 설치되지 않았습니다."
            log_info "다음 명령어로 수동 배포하세요:"
            log_info "1. npm i -g vercel"
            log_info "2. vercel --prod"
        fi
        ;;
esac

# 9. 배포 후 확인
log_info "🔍 9. 배포 확인 중..."

# 환경별 URL 설정
if [[ "$ENVIRONMENT" == "production" ]]; then
    SITE_URL="https://your-production-domain.com"
else
    SITE_URL="https://your-staging-domain.com"
fi

# 간단한 헬스 체크 (curl이 있는 경우)
if command -v curl &> /dev/null; then
    log_info "사이트 응답 확인 중..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL" || echo "000")

    if [[ "$HTTP_STATUS" == "200" ]]; then
        log_success "사이트가 정상적으로 응답합니다 ($HTTP_STATUS)"
    else
        log_warning "사이트 응답이 비정상입니다 ($HTTP_STATUS)"
    fi
else
    log_info "수동으로 사이트를 확인하세요: $SITE_URL"
fi

# 10. 배포 완료 리포트
log_success "🎉 배포 완료!"
echo
echo "📊 배포 정보:"
echo "  환경: $ENVIRONMENT"
echo "  시간: $TIMESTAMP"
echo "  브랜치: ${CURRENT_BRANCH:-'Unknown'}"
echo "  빌드 크기: $DIST_SIZE"
echo "  URL: $SITE_URL"
echo

if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "🔔 프로덕션 배포 체크리스트:"
    echo "  □ 사이트 정상 작동 확인"
    echo "  □ 주요 기능 테스트"
    echo "  □ 성능 모니터링 확인"
    echo "  □ 에러 로그 확인"
    echo "  □ 분석 도구 작동 확인"
fi

# 11. 정리
log_info "🧹 정리 중..."

# 오래된 백업 파일 정리 (7일 이상)
find "$BACKUP_DIR" -name "dist_backup_*" -mtime +7 -delete 2>/dev/null || true

log_success "정리 완료"
log_success "배포 스크립트 실행 완료! 🚀"