# OpenAI 챗봇

OpenAI API를 사용한 간단한 챗봇 애플리케이션입니다. 이 프로젝트는 Node.js와 Express를 기반으로 하며, 사용자가 OpenAI의 GPT 모델과 대화할 수 있는 웹 인터페이스를 제공합니다.

## 주요 기능

- OpenAI API를 사용한 대화형 챗봇
- 대화 기록 저장 및 관리
- 대화 목록 보기 및 선택
- 대화 제목 편집
- 시스템 메시지 설정 (AI의 역할 정의)
- 다양한 역할 프리셋 제공

## 기술 스택

- **백엔드**: Node.js, Express
- **프론트엔드**: HTML, CSS, JavaScript
- **API**: OpenAI API
- **데이터 저장**: 파일 시스템 기반 저장소

## 프로젝트 구조

```
.
├── data/                  # 대화 데이터 저장 디렉토리
├── public/                # 정적 파일 (HTML, CSS, JS)
│   ├── css/               # CSS 파일
│   ├── js/                # 클라이언트 JavaScript 파일
│   └── index.html         # 메인 HTML 파일
├── src/                   # 서버 소스 코드
│   ├── config/            # 설정 파일
│   ├── controllers/       # 컨트롤러
│   ├── models/            # 모델
│   ├── routes/            # 라우터
│   ├── services/          # 서비스
│   ├── utils/             # 유틸리티 함수
│   ├── app.js             # Express 앱 설정
│   └── server.js          # 서버 시작 파일
├── .env                   # 환경 변수 파일
├── .env.example           # 환경 변수 예시 파일
├── .gitignore             # Git 무시 파일 목록
└── package.json           # 프로젝트 메타데이터 및 의존성
```

## 설치 및 실행 방법

1. 저장소 클론
   ```bash
   git clone <repository-url>
   cd openai-chatbot
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 환경 변수 설정
   - `.env.example` 파일을 복사하여 `.env` 파일 생성
   - OpenAI API 키 및 기타 설정 입력

4. 서버 실행
   - 개발 모드: `npm run dev`
   - 프로덕션 모드: `npm start`

5. 웹 브라우저에서 접속
   - `http://localhost:3000`

## 환경 변수

`.env` 파일에 다음 환경 변수를 설정할 수 있습니다:

- `PORT`: 서버 포트 (기본값: 3000)
- `NODE_ENV`: 실행 환경 (development, production)
- `OPENAI_API_KEY`: OpenAI API 키 (필수)
- `OPENAI_MODEL`: 사용할 OpenAI 모델 (기본값: gpt-4o-mini)
- `DEFAULT_SYSTEM_MESSAGE`: 기본 시스템 메시지

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/model-info` | GET | 현재 사용 중인 모델 정보 조회 |
| `/api/system-message` | GET | 기본 시스템 메시지 조회 |
| `/api/conversations` | GET | 모든 대화 목록 조회 |
| `/api/conversations/new` | POST | 새 대화 생성 |
| `/api/conversations/:sessionId/title` | PUT | 대화 제목 업데이트 |
| `/api/conversations/:sessionId` | DELETE | 대화 삭제 |
| `/api/history/:sessionId` | GET | 특정 대화의 기록 조회 |
| `/api/clear-history` | POST | 대화 기록 초기화 |
| `/api/chat` | POST | 메시지 전송 및 응답 수신 |

## 보안 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요.
- OpenAI API 키는 안전하게 보관하세요.
- 프로덕션 환경에서는 적절한 보안 조치를 취하세요.

## 라이선스

ISC 