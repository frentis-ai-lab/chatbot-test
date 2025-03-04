const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

// 모델 정보 API
router.get('/model-info', conversationController.getModelInfo);

// 시스템 메시지 API
router.get('/system-message', conversationController.getSystemMessage);

// 대화 목록 API
router.get('/conversations', conversationController.getConversations);

// 새 대화 시작 API
router.post('/conversations/new', conversationController.createConversation);

// 대화 제목 업데이트 API
router.put('/conversations/:sessionId/title', conversationController.updateConversationTitle);

// 대화 삭제 API
router.delete('/conversations/:sessionId', conversationController.deleteConversation);

// 대화 기록 API
router.get('/history/:sessionId', conversationController.getConversationHistory);

// 대화 기록 초기화 API
router.post('/clear-history', conversationController.clearConversationHistory);

// 채팅 API
router.post('/chat', conversationController.processChat);

module.exports = router; 