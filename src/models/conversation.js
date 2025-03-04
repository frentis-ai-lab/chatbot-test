const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const fileUtils = require('../utils/fileUtils');

/**
 * 대화 모델 클래스
 */
class Conversation {
  /**
   * 새 대화 인스턴스를 생성합니다.
   * @param {string} sessionId - 대화 세션 ID
   * @param {Array} messages - 대화 메시지 배열
   * @param {string} title - 대화 제목
   */
  constructor(sessionId = null, messages = [], title = null) {
    this.sessionId = sessionId || uuidv4();
    this.messages = messages || [];
    this.title = title || '새 대화';
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 대화 파일 경로를 가져옵니다.
   * @param {string} sessionId - 대화 세션 ID
   * @returns {string} 파일 경로
   */
  static getFilePath(sessionId) {
    return path.join(config.dataDir, `${sessionId}.json`);
  }

  /**
   * 대화를 파일에 저장합니다.
   * @returns {boolean} 저장 성공 여부
   */
  save() {
    this.updatedAt = new Date().toISOString();
    return fileUtils.writeJsonFile(
      Conversation.getFilePath(this.sessionId),
      this
    );
  }

  /**
   * 메시지를 대화에 추가합니다.
   * @param {Object} message - 추가할 메시지 객체 (role, content)
   * @returns {boolean} 저장 성공 여부
   */
  addMessage(message) {
    this.messages.push(message);
    return this.save();
  }

  /**
   * 대화 제목을 업데이트합니다.
   * @param {string} title - 새 제목
   * @returns {boolean} 저장 성공 여부
   */
  updateTitle(title) {
    this.title = title;
    return this.save();
  }

  /**
   * 대화 기록을 초기화합니다.
   * @returns {boolean} 저장 성공 여부
   */
  clearMessages() {
    this.messages = [];
    return this.save();
  }

  /**
   * 대화를 삭제합니다.
   * @returns {boolean} 삭제 성공 여부
   */
  delete() {
    return fileUtils.deleteFile(Conversation.getFilePath(this.sessionId));
  }

  /**
   * 세션 ID로 대화를 찾습니다.
   * @param {string} sessionId - 대화 세션 ID
   * @returns {Conversation|null} 대화 객체 또는 null
   */
  static findById(sessionId) {
    const filePath = Conversation.getFilePath(sessionId);
    const data = fileUtils.readJsonFile(filePath);
    
    if (!data) {
      return null;
    }
    
    const conversation = new Conversation(
      data.sessionId,
      data.messages,
      data.title
    );
    
    conversation.createdAt = data.createdAt;
    conversation.updatedAt = data.updatedAt;
    
    return conversation;
  }

  /**
   * 새 대화를 생성합니다.
   * @param {string} title - 대화 제목 (선택 사항)
   * @returns {Conversation} 새 대화 객체
   */
  static create(title = null) {
    const conversation = new Conversation(null, [], title);
    conversation.save();
    return conversation;
  }

  /**
   * 모든 대화 목록을 가져옵니다.
   * @returns {Array} 대화 객체 배열
   */
  static findAll() {
    fileUtils.ensureDataDir();
    
    const files = fileUtils.getFilesInDir(config.dataDir, '.json');
    const conversations = [];
    
    for (const filePath of files) {
      const data = fileUtils.readJsonFile(filePath);
      if (data && data.sessionId) {
        const conversation = new Conversation(
          data.sessionId,
          data.messages,
          data.title
        );
        
        conversation.createdAt = data.createdAt;
        conversation.updatedAt = data.updatedAt;
        
        conversations.push(conversation);
      }
    }
    
    // 최신 업데이트 순으로 정렬
    return conversations.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  }

  /**
   * 대화 미리보기를 생성합니다.
   * @returns {Object} 미리보기 정보
   */
  getPreview() {
    let preview = '대화 내용 없음';
    let messageCount = 0;
    
    if (this.messages && this.messages.length > 0) {
      messageCount = this.messages.length;
      
      // 마지막 메시지를 미리보기로 사용
      const lastMessage = this.messages[this.messages.length - 1];
      
      // 50자로 제한
      preview = lastMessage.content.substring(0, 50);
      if (lastMessage.content.length > 50) {
        preview += '...';
      }
    }
    
    return {
      id: this.sessionId,
      title: this.title,
      preview,
      messageCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * 최근 메시지를 가져옵니다.
   * @param {number} count - 가져올 메시지 수
   * @returns {Array} 최근 메시지 배열
   */
  getRecentMessages(count = 5) {
    if (!this.messages || this.messages.length === 0) {
      return [];
    }
    
    return this.messages.slice(-count);
  }
}

module.exports = Conversation; 