# OpenAI API 챗봇

Node.js와 Express를 사용하여 만든 간단한 OpenAI API 기반 챗봇입니다.

## 기능

- OpenAI의 GPT 모델을 사용한 대화형 챗봇
- 간단한 웹 인터페이스
- 실시간 응답

## 설치 방법

1. 저장소를 클론합니다:
```
git clone <repository-url>
cd openai-chatbot
```

2. 필요한 패키지를 설치합니다:
```
npm install
```

3. `.env.example` 파일을 `.env`로 복사하고 OpenAI API 키를 설정합니다:
```
cp .env.example .env
```
그리고 `.env` 파일을 열어 `your_openai_api_key_here` 부분을 실제 API 키로 변경합니다.

## 실행 방법

다음 명령어로 서버를 시작합니다:
```
npm start
```

브라우저에서 `http://localhost:3000`으로 접속하여 챗봇을 사용할 수 있습니다.

## OpenAI API 키 얻는 방법

1. [OpenAI 웹사이트](https://platform.openai.com/)에 가입합니다.
2. API 키 섹션에서 새 API 키를 생성합니다.
3. 생성된 키를 `.env` 파일에 복사합니다.

## 주의사항

- OpenAI API는 사용량에 따라 요금이 부과될 수 있습니다.
- API 키를 공개 저장소에 올리지 않도록 주의하세요.
- `.env` 파일은 절대 Git에 커밋하지 마세요. (이미 .gitignore에 포함되어 있습니다)

## 기술 스택

- Node.js
- Express
- OpenAI API
- HTML/CSS/JavaScript 