# 마이크온 스피치 홈페이지

정적 홈페이지와 Netlify 기반 공지 팝업 관리 기능을 포함합니다.

## 주요 파일

- `index.html`: 방문자용 홈페이지
- `poppop.html`: 팝업 관리자 페이지
- `assets/popup.js`: 방문자용 팝업 표시 스크립트
- `netlify/functions/auth.mjs`: 관리자 로그인 API
- `netlify/functions/popups.mjs`: 팝업 조회/저장/삭제 API
- `netlify.toml`: Netlify 배포 설정

## Netlify 환경변수

Netlify 사이트 설정에서 아래 환경변수를 추가해야 합니다.

```text
ADMIN_PASSWORD=관리자비밀번호
ADMIN_TOKEN_SECRET=충분히긴임의문자열
```

`ADMIN_PASSWORD`는 `poppop.html` 로그인에 사용합니다. `ADMIN_TOKEN_SECRET`은 로그인 토큰 서명에 사용하므로 외부에 노출하지 않습니다.

## 로컬 확인

```bash
npm install --omit=dev
npm run check
npx netlify dev
```

Netlify Blobs는 Netlify 환경에서 영구 저장됩니다. 일반 `node` 단독 실행에서는 임시 메모리 fallback으로만 동작합니다.

## 관리자 사용 흐름

1. `/poppop.html` 접속
2. 관리자 비밀번호 입력
3. 팝업 추가/수정/삭제
4. 활성화된 팝업은 `index.html` 방문자에게 표시

팝업에는 제목, 본문, 버튼 문구, 버튼 링크, 시작일, 종료일, 우선순위를 설정할 수 있습니다.
