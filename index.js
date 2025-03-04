// OpenAI API를 사용한 간단한 챗봇
import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// 환경 변수 로드
dotenv.config();

// Express 앱 초기화
const app = express();
const port = process.env.PORT || 3001;

// 기본 시스템 메시지 설정
const DEFAULT_SYSTEM_MESSAGE = process.env.DEFAULT_SYSTEM_MESSAGE || "당신은 도움이 되는 AI 어시스턴트입니다.";

// 사용할 OpenAI 모델 설정
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// __dirname 설정 (ES 모듈에서는 __dirname이 기본적으로 제공되지 않음)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 데이터 디렉토리 확인 및 생성
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// JSON 파싱 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

// 대화 기록 저장 함수
async function saveConversationHistory(sessionId, messages, title = null) {
  try {
    const filePath = path.join(DATA_DIR, `${sessionId}.json`);
    
    // 기존 데이터 확인
    let existingData = { messages: [], title: title, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      existingData = JSON.parse(fileContent);
      existingData.updatedAt = new Date().toISOString();
      
      // 제목이 제공된 경우에만 업데이트
      if (title !== null) {
        existingData.title = title;
      }
    }
    
    // 새 메시지가 배열인 경우 (초기화 또는 대량 업데이트)
    if (Array.isArray(messages)) {
      existingData.messages = messages;
    } 
    // 단일 메시지인 경우 (일반적인 대화 추가)
    else if (messages) {
      existingData.messages.push(messages);
    }
    
    // 파일에 저장
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
    return true;
  } catch (error) {
    console.error('대화 기록 저장 오류:', error);
    return false;
  }
}

// 대화 기록 가져오기 함수
async function getConversationHistory(sessionId) {
  try {
    const filePath = path.join(DATA_DIR, `${sessionId}.json`);
    
    if (!fs.existsSync(filePath)) {
      return { messages: [], title: null, createdAt: null, updatedAt: null };
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('대화 기록 가져오기 오류:', error);
    return { messages: [], title: null, createdAt: null, updatedAt: null };
  }
}

// 대화 제목 업데이트 함수
async function updateConversationTitle(sessionId, title) {
  try {
    const filePath = path.join(DATA_DIR, `${sessionId}.json`);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    data.title = title;
    data.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('대화 제목 업데이트 오류:', error);
    return false;
  }
}

// 모든 대화 목록 가져오기 함수
async function getAllConversations() {
  try {
    const conversations = [];
    const files = fs.readdirSync(DATA_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const sessionId = file.replace('.json', '');
        const filePath = path.join(DATA_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        // 첫 번째 사용자 메시지를 찾아 제목으로 사용 (제목이 없는 경우)
        let firstUserMessage = '';
        if (!data.title) {
          const userMessage = data.messages.find(msg => msg.role === 'user');
          if (userMessage) {
            firstUserMessage = userMessage.content.substring(0, 30) + (userMessage.content.length > 30 ? '...' : '');
          }
        }
        
        conversations.push({
          id: sessionId,
          title: data.title || firstUserMessage || '새 대화',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          messageCount: data.messages.length
        });
      }
    }
    
    // 최신 업데이트 순으로 정렬
    return conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (error) {
    console.error('대화 목록 가져오기 오류:', error);
    return [];
  }
}

// 대화 삭제 함수
async function deleteConversation(sessionId) {
  try {
    const filePath = path.join(DATA_DIR, `${sessionId}.json`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('대화 삭제 오류:', error);
    return false;
  }
}

// 모델 정보 API
app.get('/api/model-info', (req, res) => {
  res.json({ model: OPENAI_MODEL });
});

// 시스템 메시지 API
app.get('/api/system-message', (req, res) => {
  res.json({ systemMessage: DEFAULT_SYSTEM_MESSAGE });
});

// 대화 목록 API
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await getAllConversations();
    res.json({ conversations });
  } catch (error) {
    console.error('대화 목록 API 오류:', error);
    res.status(500).json({ error: '대화 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 새 대화 시작 API
app.post('/api/conversations/new', async (req, res) => {
  try {
    const sessionId = uuidv4();
    // 빈 대화 기록 생성
    await saveConversationHistory(sessionId, [], '새 대화');
    res.json({ sessionId });
  } catch (error) {
    console.error('새 대화 시작 API 오류:', error);
    res.status(500).json({ error: '새 대화를 시작하는 중 오류가 발생했습니다.' });
  }
});

// 대화 제목 업데이트 API
app.put('/api/conversations/:sessionId/title', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: '제목이 제공되지 않았습니다.' });
    }
    
    const success = await updateConversationTitle(sessionId, title);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: '대화를 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error('대화 제목 업데이트 API 오류:', error);
    res.status(500).json({ error: '대화 제목을 업데이트하는 중 오류가 발생했습니다.' });
  }
});

// 대화 삭제 API
app.delete('/api/conversations/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const success = await deleteConversation(sessionId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: '대화를 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error('대화 삭제 API 오류:', error);
    res.status(500).json({ error: '대화를 삭제하는 중 오류가 발생했습니다.' });
  }
});

// 대화 기록 가져오기 API
app.get('/api/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await getConversationHistory(sessionId);
    res.json(history);
  } catch (error) {
    console.error('대화 기록 가져오기 API 오류:', error);
    res.status(500).json({ error: '대화 기록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 대화 기록 초기화 API
app.post('/api/clear-history', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: '세션 ID가 제공되지 않았습니다.' });
    }
    
    // 대화 기록 초기화 (빈 배열로 저장)
    const success = await saveConversationHistory(sessionId, []);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: '대화 기록 초기화 중 오류가 발생했습니다.' });
    }
  } catch (error) {
    console.error('대화 기록 초기화 API 오류:', error);
    res.status(500).json({ error: '대화 기록 초기화 중 오류가 발생했습니다.' });
  }
});

// 채팅 API
app.post('/api/chat', async (req, res) => {
  try {
    const { message, systemMessage, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '메시지가 제공되지 않았습니다.' });
    }
    
    // 세션 ID 확인
    const currentSessionId = sessionId || uuidv4();
    
    // 대화 기록 가져오기
    const history = await getConversationHistory(currentSessionId);
    
    // 사용자 메시지 저장
    const userMessage = { role: 'user', content: message };
    await saveConversationHistory(currentSessionId, userMessage);
    
    // 메시지 배열 구성
    const messages = [];
    
    // 시스템 메시지 추가 (제공된 경우 사용, 아니면 기본값)
    messages.push({ 
      role: 'system', 
      content: systemMessage || DEFAULT_SYSTEM_MESSAGE 
    });
    
    // 대화 기록에서 최근 5개의 메시지만 사용 (시스템 메시지 제외)
    const recentMessages = history.messages.slice(-5);
    messages.push(...recentMessages);
    
    // 현재 사용자 메시지 추가
    messages.push(userMessage);
    
    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: messages,
    });
    
    const reply = completion.choices[0].message.content;
    
    // 봇 응답 저장
    const botMessage = { role: 'assistant', content: reply };
    await saveConversationHistory(currentSessionId, botMessage);
    
    // 첫 메시지인 경우 제목 설정
    if (history.messages.length === 0) {
      // 첫 번째 사용자 메시지를 제목으로 사용 (30자 제한)
      const title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
      await updateConversationTitle(currentSessionId, title);
    }
    
    res.json({ reply, sessionId: currentSessionId });
  } catch (error) {
    console.error('채팅 API 오류:', error);
    res.status(500).json({ error: '메시지 처리 중 오류가 발생했습니다.' });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
  console.log(`사용 중인 OpenAI 모델: ${OPENAI_MODEL}`);
}); 