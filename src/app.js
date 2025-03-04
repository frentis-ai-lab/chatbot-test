const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fileUtils = require('./utils/fileUtils');
const config = require('./config/config');
const conversationRoutes = require('./routes/conversationRoutes');

// 데이터 디렉토리 확인
fileUtils.ensureDataDir();

// Express 앱 초기화
const app = express();

// 미들웨어 설정
app.use(helmet({ contentSecurityPolicy: false })); // CSP 비활성화 (개발 환경용)
app.use(cors());
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(path.join(process.cwd(), 'public')));

// API 라우트
app.use('/api', conversationRoutes);

// 404 처리
app.use((req, res, next) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

// 오류 처리
app.use((err, req, res, next) => {
  console.error('서버 오류:', err);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: err.message || '서버 내부 오류가 발생했습니다.',
    stack: config.nodeEnv === 'development' ? err.stack : undefined
  });
});

module.exports = app; 