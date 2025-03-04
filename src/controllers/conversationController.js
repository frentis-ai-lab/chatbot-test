const asyncHandler = require('express-async-handler');
const Conversation = require('../models/conversation');
const openaiService = require('../services/openaiService');

/**
 * 모든 대화 목록을 가져옵니다.
 * @route GET /api/conversations
 * @access Public
 */
const getConversations = asyncHandler(async (req, res) => {
  const conversations = Conversation.findAll();
  
  // 미리보기 정보만 반환
  const conversationPreviews = conversations.map(conversation => 
    conversation.getPreview()
  );
  
  res.json({ conversations: conversationPreviews });
});

/**
 * 새 대화를 생성합니다.
 * @route POST /api/conversations/new
 * @access Public
 */
const createConversation = asyncHandler(async (req, res) => {
  const conversation = Conversation.create('새 대화');
  res.json({ sessionId: conversation.sessionId });
});

/**
 * 대화 기록을 가져옵니다.
 * @route GET /api/history/:sessionId
 * @access Public
 */
const getConversationHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const conversation = Conversation.findById(sessionId);
  
  if (!conversation) {
    return res.json({ 
      messages: [], 
      title: null, 
      createdAt: null, 
      updatedAt: null 
    });
  }
  
  res.json({
    messages: conversation.messages,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  });
});

/**
 * 대화 제목을 업데이트합니다.
 * @route PUT /api/conversations/:sessionId/title
 * @access Public
 */
const updateConversationTitle = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { title } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: '제목이 필요합니다.' });
  }
  
  const conversation = Conversation.findById(sessionId);
  
  if (!conversation) {
    return res.status(404).json({ error: '대화를 찾을 수 없습니다.' });
  }
  
  const success = conversation.updateTitle(title);
  
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: '대화 제목 업데이트 중 오류가 발생했습니다.' });
  }
});

/**
 * 대화를 삭제합니다.
 * @route DELETE /api/conversations/:sessionId
 * @access Public
 */
const deleteConversation = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const conversation = Conversation.findById(sessionId);
  
  if (!conversation) {
    return res.status(404).json({ error: '대화를 찾을 수 없습니다.' });
  }
  
  const success = conversation.delete();
  
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: '대화 삭제 중 오류가 발생했습니다.' });
  }
});

/**
 * 대화 기록을 초기화합니다.
 * @route POST /api/clear-history
 * @access Public
 */
const clearConversationHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ error: '세션 ID가 필요합니다.' });
  }
  
  const conversation = Conversation.findById(sessionId);
  
  if (!conversation) {
    return res.status(404).json({ error: '대화를 찾을 수 없습니다.' });
  }
  
  const success = conversation.clearMessages();
  
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: '대화 기록 초기화 중 오류가 발생했습니다.' });
  }
});

/**
 * 채팅 메시지를 처리합니다.
 * @route POST /api/chat
 * @access Public
 */
const processChat = asyncHandler(async (req, res) => {
  const { message, systemMessage, sessionId } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: '메시지가 필요합니다.' });
  }
  
  // 세션 ID가 제공되지 않은 경우 새 대화 생성
  let conversation;
  let isNewConversation = false;
  
  if (sessionId) {
    conversation = Conversation.findById(sessionId);
    if (!conversation) {
      conversation = Conversation.create();
      isNewConversation = true;
    }
  } else {
    conversation = Conversation.create();
    isNewConversation = true;
  }
  
  // 사용자 메시지 추가
  const userMessage = { role: 'user', content: message };
  conversation.addMessage(userMessage);
  
  // OpenAI API 요청을 위한 메시지 배열 생성
  const messages = openaiService.createMessagesArray(
    systemMessage,
    conversation.messages
  );
  
  // OpenAI API 호출
  const reply = await openaiService.createChatCompletion(messages);
  
  // 봇 응답 추가
  const botMessage = { role: 'assistant', content: reply };
  conversation.addMessage(botMessage);
  
  // 첫 메시지인 경우 제목 설정
  if (isNewConversation || conversation.messages.length <= 2) {
    // 첫 번째 사용자 메시지를 제목으로 사용 (30자 제한)
    const title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
    conversation.updateTitle(title);
  }
  
  res.json({ reply, sessionId: conversation.sessionId });
});

/**
 * 모델 정보를 가져옵니다.
 * @route GET /api/model-info
 * @access Public
 */
const getModelInfo = asyncHandler(async (req, res) => {
  const modelInfo = openaiService.getModelInfo();
  res.json({ model: modelInfo.model });
});

/**
 * 시스템 메시지를 가져옵니다.
 * @route GET /api/system-message
 * @access Public
 */
const getSystemMessage = asyncHandler(async (req, res) => {
  const modelInfo = openaiService.getModelInfo();
  res.json({ systemMessage: modelInfo.defaultSystemMessage });
});

module.exports = {
  getConversations,
  createConversation,
  getConversationHistory,
  updateConversationTitle,
  deleteConversation,
  clearConversationHistory,
  processChat,
  getModelInfo,
  getSystemMessage
}; 