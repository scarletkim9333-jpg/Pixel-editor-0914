## 2025-09-17

**오늘의 변경 요약**

- 결제/토큰 플로우 개선 및 UI 업데이트 반영
- 신규 결제 콜백 컴포넌트 추가
- 토큰 관련 API 연동 정리 및 리팩터링

**세부 변경 사항**

- 서버
  - `server/src/routes/payment.ts`: 결제 처리 로직 보완
  - `server/src/routes/tokens.ts`: 토큰 잔액/구매 관련 엔드포인트 정리

- 클라이언트
  - `src/components/PaymentCallback.tsx`: 신규 결제 콜백 화면 추가
  - `src/components/TokenBalance.tsx`: 토큰 잔액 표시/갱신 로직 개선
  - `src/components/TokenPurchaseModal.tsx`: 토큰 구매 UI/흐름 개선
  - `src/lib/tokenApi.ts`: 토큰 API 호출 인터페이스 업데이트
  - `src/services/api.ts`: 공통 API 래퍼 조정
  - `App.tsx`: 결제/토큰 플로우 연결

- 기타
  - `package.json`, `package-lock.json`: 의존성 업데이트
  - `.claude/settings.local.json`: 로컬 설정 갱신

**변경 통계**

- 11 files changed, 506 insertions(+), 42 deletions(-)

**관련 커밋**

- `91fd28d` chore: sync latest updates (payments, tokens, UI)


