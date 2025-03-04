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

// 대화 기록 저장을 위한 맵 (세션 ID를 키로 사용)
const conversationHistory = new Map();

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
    const { message, systemMessage, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '메시지가 필요합니다.' });
    }

    // 세션 ID가 없으면 임의의 ID 생성
    const currentSessionId = sessionId || Date.now().toString();
    
    // 시스템 메시지 설정 (요청에서 제공되지 않으면 기본값 사용)
    const finalSystemMessage = systemMessage || DEFAULT_SYSTEM_MESSAGE;
    
    // 해당 세션의 대화 기록 가져오기 (없으면 빈 배열 생성)
    if (!conversationHistory.has(currentSessionId)) {
      conversationHistory.set(currentSessionId, []);
    }
    
    const history = conversationHistory.get(currentSessionId);
    
    // 사용자 메시지를 대화 기록에 추가
    history.push({ role: "user", content: message });
    
    // 대화 기록에서 최근 5개의 메시지만 사용 (시스템 메시지 제외)
    const recentMessages = history.slice(-5);
    
    // OpenAI API 요청을 위한 메시지 배열 생성
    const messages = [
      { role: "system", content: finalSystemMessage },
      ...recentMessages
    ];

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: messages,
      max_tokens: 500
    });

    const reply = completion.choices[0].message.content;
    
    // 봇 응답을 대화 기록에 추가
    history.push({ role: "assistant", content: reply });
    
    // 대화 기록 업데이트
    conversationHistory.set(currentSessionId, history);
    
    res.json({ 
      reply,
      sessionId: currentSessionId
    });
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

// 대화 기록 초기화 API 엔드포인트
app.post('/api/clear-history', (req, res) => {
  const { sessionId } = req.body;
  
  if (sessionId && conversationHistory.has(sessionId)) {
    conversationHistory.delete(sessionId);
    res.json({ success: true, message: '대화 기록이 초기화되었습니다.' });
  } else {
    res.status(400).json({ success: false, error: '유효한 세션 ID가 필요합니다.' });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
  console.log(`사용 중인 OpenAI 모델: ${OPENAI_MODEL}`);
}); 