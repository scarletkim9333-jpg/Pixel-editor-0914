# [](https://github.com/scarletkim9333-jpg/Pixel-editor-0914/compare/v0.1.1...v) (2025-09-18)


### Features

* UI/UX 대폭 개선 및 용어 통일 ([da54880](https://github.com/scarletkim9333-jpg/Pixel-editor-0914/commit/da54880e1e2b3bf7a226be1f5ede2fdb0e127ae2))
* 픽셀 에디터 UI/UX 대폭 개선 및 토큰 시스템 완성 ([ee315b7](https://github.com/scarletkim9333-jpg/Pixel-editor-0914/commit/ee315b7f793969a182e40b31839c82f979de03d8))



# [](https://github.com/scarletkim9333-jpg/Pixel-editor-0914/compare/v0.1.1...v) (2025-09-17)


### Features

* 픽셀 에디터 UI/UX 대폭 개선 및 토큰 시스템 완성 ([ee315b7](https://github.com/scarletkim9333-jpg/Pixel-editor-0914/commit/ee315b7f793969a182e40b31839c82f979de03d8))



#  (2025-09-17)


### Bug Fixes

* 인증 및 토큰 로직 수정으로 무한 새로고침 루프 해결 ([ef4996c](https://github.com/scarletkim9333-jpg/Pixel-editor-0914/commit/ef4996ca47c4586bf8572e3b08b24cd4db6a6b9b))


### Features

* Add user authentication and token management ([ba16d55](https://github.com/scarletkim9333-jpg/Pixel-editor-0914/commit/ba16d5514a42c0ddb181a58c8d906dd20c336e7e))
* Initialize pixel Editor project with Vite ([2416607](https://github.com/scarletkim9333-jpg/Pixel-editor-0914/commit/24166072d612363b2e2d4533e73b20fb9e9e4828))



#  (2025-09-17)


### Bug Fixes

* 인증 및 토큰 로직 수정으로 무한 새로고침 루프 해결 ([ef4996c](https://github.com/scarletkim9333-jpg/Pixel-editor-0914/commit/ef4996ca47c4586bf8572e3b08b24cd4db6a6b9b))


### Features

* Add user authentication and token management ([ba16d55](https://github.com/scarletkim9333-jpg/Pixel-editor-0914/commit/ba16d5514a42c0ddb181a58c8d906dd20c336e7e))
* Initialize pixel Editor project with Vite ([2416607](https://github.com/scarletkim9333-jpg/Pixel-editor-0914/commit/24166072d612363b2e2d4533e73b20fb9e9e4828))



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


