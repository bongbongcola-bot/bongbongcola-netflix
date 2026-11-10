# bongbongcola-netflix

TMDB API로 만든 넷플릭스풍 영화 탐색 페이지 (순수 HTML/CSS/JS, 빌드 없음).

## 실행

1. `.env.example`을 `.env`로 복사하고 `TMDB_API_KEY`(v3 API 키)를 넣는다.
2. `node serve.js` → http://localhost:5173 (`.env`를 읽어 `config.js`를 만들고 허용된 파일만 서빙한다).
3. `node make-config.js`는 `config.js`만 다시 만든다.

## 고유 규칙

- 키는 `.env`에만 둔다. `config.js`는 생성물이라 커밋하지 않는다.
- 정적 방식이라 키가 브라우저에서 보인다. 외부에 배포하기 전에 키를 재발급하거나 프록시를 붙인다.
- 외부 데이터는 `innerHTML` 없이 `js/dom.js`의 `el()`로만 DOM에 넣는다.
- 폴더의 키 캡처 파일(rtf, 스크린샷)은 git 대상이 아니다. 작업 폴더 밖으로 옮기는 것을 권장한다.
