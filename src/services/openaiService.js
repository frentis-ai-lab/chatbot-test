const { OpenAI } = require('openai');
const config = require('../config/config');

/**
 * OpenAI 서비스 클래스
 */
class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
    this.model = config.openai.model;
    this.defaultSystemMessage = config.openai.defaultSystemMessage;
  }

  /**
   * 채팅 완성 API를 호출합니다.
   * @param {Array} messages - 메시지 배열
   * @returns {Promise<string>} 응답 텍스트
   */
  async createChatCompletion(messages) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API 오류:', error);
      throw new Error('메시지 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 시스템 메시지와 대화 기록을 포함한 메시지 배열을 생성합니다.
   * @param {string} systemMessage - 시스템 메시지
   * @param {Array} conversationMessages - 대화 메시지 배열
   * @param {number} maxMessages - 최대 메시지 수
   * @returns {Array} 메시지 배열
   */
  createMessagesArray(systemMessage, conversationMessages, maxMessages = 5) {
    const messages = [
      { role: 'system', content: systemMessage || this.defaultSystemMessage }
    ];
    
    // 최근 N개의 메시지만 사용
    if (conversationMessages && conversationMessages.length > 0) {
      const recentMessages = conversationMessages.slice(-maxMessages);
      messages.push(...recentMessages);
    }
    
    return messages;
  }

  /**
   * 모델 정보를 가져옵니다.
   * @returns {Object} 모델 정보
   */
  getModelInfo() {
    return {
      model: this.model,
      defaultSystemMessage: this.defaultSystemMessage
    };
  }
}

module.exports = new OpenAIService(); 