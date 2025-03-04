const dotenv = require('dotenv');
const path = require('path');

// 환경 변수 로드
dotenv.config();

const config = {
  // 서버 설정
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // OpenAI API 설정
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    defaultSystemMessage: process.env.DEFAULT_SYSTEM_MESSAGE || '당신은 도움이 되는 AI 어시스턴트입니다.'
  },
  
  // 데이터 저장 경로
  dataDir: path.join(process.cwd(), 'data')
};

module.exports = config; 