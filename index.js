// OpenAI API를 사용한 간단한 챗봇
import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 환경 변수 로드
dotenv.config();

// Express 앱 초기화
const app = express();
const port = process.env.PORT || 3001;

// 기본 시스템 메시지 설정
const DEFAULT_SYSTEM_MESSAGE = process.env.DEFAULT_SYSTEM_MESSAGE || "당신은 도움이 되는 AI 어시스턴트입니다.";

// 사용할 OpenAI 모델 설정
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// JSON 파싱 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// __dirname 설정 (ES 모듈에서는 __dirname이 기본적으로 제공되지 않음)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 루트 경로 핸들러
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 챗봇 API 엔드포인트
app.post('/api/chat', async (req, res) => {
  try {
    const { message, systemMessage } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '메시지가 필요합니다.' });
    }

    // 시스템 메시지 설정 (요청에서 제공되지 않으면 기본값 사용)
    const finalSystemMessage = systemMessage || DEFAULT_SYSTEM_MESSAGE;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: finalSystemMessage },
        { role: "user", content: message }
      ],
      max_tokens: 500
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 시스템 메시지 설정 API 엔드포인트
app.get('/api/system-message', (req, res) => {
  res.json({ systemMessage: DEFAULT_SYSTEM_MESSAGE });
});

// 모델 정보 API 엔드포인트
app.get('/api/model-info', (req, res) => {
  res.json({ model: OPENAI_MODEL });
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
  console.log(`사용 중인 OpenAI 모델: ${OPENAI_MODEL}`);
}); 