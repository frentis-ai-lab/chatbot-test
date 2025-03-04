const app = require('./app');
const config = require('./config/config');

// 서버 시작
const server = app.listen(config.port, () => {
  console.log(`서버가 http://localhost:${config.port} 에서 실행 중입니다.`);
  console.log(`사용 중인 OpenAI 모델: ${config.openai.model}`);
  console.log(`환경: ${config.nodeEnv}`);
});

// 예기치 않은 오류 처리
process.on('unhandledRejection', (err) => {
  console.error('처리되지 않은 Promise 거부:', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('처리되지 않은 예외:', err);
  server.close(() => {
    process.exit(1);
  });
}); 