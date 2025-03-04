// 전역 변수
let currentSessionId = localStorage.getItem('chatSessionId');
let currentConversationTitle = '새 대화';
let conversations = [];

// DOM 요소
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const loadingIndicator = document.getElementById('loading');
const systemMessageInput = document.getElementById('system-message');
const settingsToggle = document.getElementById('settings-toggle');
const settingsContent = document.getElementById('settings-content');
const toggleIcon = document.getElementById('toggle-icon');
const presetButtons = document.querySelectorAll('.preset-button');
const modelInfoElement = document.getElementById('model-info');
const clearHistoryButton = document.getElementById('clear-history-button');
const sessionInfoElement = document.getElementById('session-info');
const conversationsList = document.getElementById('conversations-list');
const newChatButton = document.getElementById('new-chat-button');
const mobileToggle = document.getElementById('mobile-toggle');
const sidebar = document.getElementById('sidebar');
const editTitleModal = document.getElementById('edit-title-modal');
const titleInput = document.getElementById('title-input');
const saveTitleButton = document.getElementById('save-title-button');
const cancelTitleButton = document.getElementById('cancel-title-button');
const emptyStateContainer = document.getElementById('empty-state');
const emptyStateButton = document.getElementById('empty-state-button');

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    // marked.js 설정
    marked.setOptions({
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });
    
    // 세션 ID가 없으면 대화 목록 표시
    if (!currentSessionId) {
        showEmptyState();
    } else {
        // 대화 기록 로드
        loadConversation(currentSessionId);
    }
    
    // 이벤트 리스너 등록
    registerEventListeners();
    
    // 모델 정보 가져오기
    fetchModelInfo();
    
    // 기본 시스템 메시지 가져오기
    fetchDefaultSystemMessage();
    
    // 대화 목록 가져오기
    fetchConversations();
    
    // 설정 패널 초기 상태 설정 (열린 상태로)
    settingsContent.classList.add('active');
});

// 빈 상태 표시
function showEmptyState() {
    chatContainer.innerHTML = '';
    emptyStateContainer.style.display = 'flex';
    chatContainer.style.display = 'none';
}

// 빈 상태 숨기기
function hideEmptyState() {
    emptyStateContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
}

// 이벤트 리스너 등록
function registerEventListeners() {
    // 메시지 전송 버튼
    sendButton.addEventListener('click', sendMessage);
    
    // 엔터 키로 메시지 전송
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 설정 토글
    settingsToggle.addEventListener('click', () => {
        settingsContent.classList.toggle('active');
        toggleIcon.classList.toggle('fa-chevron-up');
        toggleIcon.classList.toggle('fa-chevron-down');
    });
    
    // 프리셋 버튼
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            systemMessageInput.value = button.getAttribute('data-preset');
            systemMessageInput.focus();
        });
    });
    
    // 대화 기록 초기화 버튼
    clearHistoryButton.addEventListener('click', clearCurrentConversation);
    
    // 새 대화 버튼
    newChatButton.addEventListener('click', startNewConversation);
    
    // 빈 상태에서 새 대화 시작 버튼
    emptyStateButton.addEventListener('click', startNewConversation);
    
    // 모바일 토글 버튼
    mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    // 모달 닫기 버튼
    cancelTitleButton.addEventListener('click', closeEditTitleModal);
    
    // 제목 저장 버튼
    saveTitleButton.addEventListener('click', saveConversationTitle);
}

// 모델 정보 가져오기
async function fetchModelInfo() {
    try {
        const response = await fetch('/api/model-info');
        const data = await response.json();
        modelInfoElement.innerHTML = `<i class="fas fa-microchip"></i> 모델: ${data.model}`;
    } catch (error) {
        console.error('모델 정보 가져오기 오류:', error);
        modelInfoElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 모델 정보 로드 실패';
    }
}

// 기본 시스템 메시지 가져오기
async function fetchDefaultSystemMessage() {
    try {
        const response = await fetch('/api/system-message');
        const data = await response.json();
        systemMessageInput.value = data.systemMessage;
    } catch (error) {
        console.error('시스템 메시지 가져오기 오류:', error);
        systemMessageInput.value = "당신은 도움이 되는 AI 어시스턴트입니다.";
    }
}

// 대화 목록 가져오기
async function fetchConversations() {
    try {
        const response = await fetch('/api/conversations');
        const data = await response.json();
        conversations = data.conversations || [];
        renderConversationsList();
    } catch (error) {
        console.error('대화 목록 가져오기 오류:', error);
        conversations = [];
        renderConversationsList();
    }
}

// 대화 목록 렌더링
function renderConversationsList() {
    conversationsList.innerHTML = '';
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = '<div class="empty-conversations">대화 기록이 없습니다</div>';
        return;
    }
    
    conversations.forEach(conversation => {
        const conversationItem = document.createElement('div');
        conversationItem.classList.add('conversation-item');
        
        if (conversation.id === currentSessionId) {
            conversationItem.classList.add('active');
        }
        
        // 날짜 포맷팅
        const date = new Date(conversation.updatedAt);
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        conversationItem.innerHTML = `
            <div class="conversation-info" data-id="${conversation.id}">
                <div class="conversation-title">${conversation.title}</div>
                <div class="conversation-preview">${conversation.messageCount}개의 메시지</div>
                <div class="conversation-date">${formattedDate}</div>
            </div>
            <div class="conversation-actions">
                <button class="conversation-action-button edit-button" data-id="${conversation.id}" data-title="${conversation.title}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="conversation-action-button delete-button" data-id="${conversation.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        conversationsList.appendChild(conversationItem);
        
        // 대화 선택 이벤트
        const conversationInfo = conversationItem.querySelector('.conversation-info');
        conversationInfo.addEventListener('click', () => {
            loadConversation(conversation.id);
        });
        
        // 편집 버튼 이벤트
        const editButton = conversationItem.querySelector('.edit-button');
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditTitleModal(conversation.id, conversation.title);
        });
        
        // 삭제 버튼 이벤트
        const deleteButton = conversationItem.querySelector('.delete-button');
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`"${conversation.title}" 대화를 삭제하시겠습니까?`)) {
                deleteConversation(conversation.id);
            }
        });
    });
}

// 대화 로드
async function loadConversation(sessionId) {
    try {
        // 로딩 표시
        chatContainer.innerHTML = '<div class="loading">대화 기록을 불러오는 중...<div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>';
        hideEmptyState();
        
        const response = await fetch(`/api/history/${sessionId}`);
        const data = await response.json();
        
        // 세션 ID 업데이트
        currentSessionId = sessionId;
        localStorage.setItem('chatSessionId', sessionId);
        
        // 대화 제목 업데이트
        currentConversationTitle = data.title || '새 대화';
        
        // 세션 정보 표시
        sessionInfoElement.innerHTML = `<i class="fas fa-key"></i> 세션 ID: ${sessionId.substring(0, 8)}...`;
        
        // 채팅 컨테이너 초기화
        chatContainer.innerHTML = '';
        
        if (data.messages && data.messages.length > 0) {
            // 대화 기록 표시
            data.messages.forEach(msg => {
                addMessage(msg.content, msg.role === 'user' ? 'user' : 'bot');
            });
        } else {
            // 대화 기록이 없으면 초기 메시지 표시
            addMessage('안녕하세요! 무엇을 도와드릴까요?', 'bot');
        }
        
        // 대화 목록 업데이트
        fetchConversations();
    } catch (error) {
        console.error('대화 로드 오류:', error);
        chatContainer.innerHTML = '<div class="message bot-message">대화 기록을 불러오는 중 오류가 발생했습니다.</div>';
    }
}

// 새 대화 시작
async function startNewConversation() {
    try {
        const response = await fetch('/api/conversations/new', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.sessionId) {
            // 세션 ID 업데이트
            currentSessionId = data.sessionId;
            localStorage.setItem('chatSessionId', data.sessionId);
            
            // 세션 정보 표시
            sessionInfoElement.innerHTML = `<i class="fas fa-key"></i> 세션 ID: ${data.sessionId.substring(0, 8)}...`;
            
            // 채팅 컨테이너 초기화
            chatContainer.innerHTML = '';
            addMessage('안녕하세요! 무엇을 도와드릴까요?', 'bot');
            
            // 빈 상태 숨기기
            hideEmptyState();
            
            // 설정 패널 열기
            settingsContent.classList.add('active');
            toggleIcon.classList.remove('fa-chevron-down');
            toggleIcon.classList.add('fa-chevron-up');
            
            // 대화 목록 업데이트
            fetchConversations();
        }
    } catch (error) {
        console.error('새 대화 시작 오류:', error);
    }
}

// 현재 대화 초기화
async function clearCurrentConversation() {
    if (!currentSessionId) return;
    
    if (!confirm('현재 대화 기록을 초기화하시겠습니까?')) return;
    
    try {
        const response = await fetch('/api/clear-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId: currentSessionId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 채팅 컨테이너 초기화
            chatContainer.innerHTML = '';
            addMessage('대화 기록이 초기화되었습니다. 새로운 대화를 시작하세요!', 'bot');
            
            // 대화 목록 업데이트
            fetchConversations();
        } else {
            console.error('대화 기록 초기화 오류:', data.error);
        }
    } catch (error) {
        console.error('대화 기록 초기화 요청 오류:', error);
    }
}

// 대화 삭제
async function deleteConversation(sessionId) {
    try {
        const response = await fetch(`/api/conversations/${sessionId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 대화 목록 업데이트
            fetchConversations();
            
            // 현재 대화가 삭제된 경우
            if (sessionId === currentSessionId) {
                currentSessionId = null;
                localStorage.removeItem('chatSessionId');
                showEmptyState();
            }
        } else {
            console.error('대화 삭제 오류:', data.error);
        }
    } catch (error) {
        console.error('대화 삭제 요청 오류:', error);
    }
}

// 제목 편집 모달 열기
function openEditTitleModal(sessionId, currentTitle) {
    editTitleModal.classList.add('active');
    titleInput.value = currentTitle || '';
    titleInput.dataset.sessionId = sessionId;
    
    // 포커스 설정
    setTimeout(() => {
        titleInput.focus();
        titleInput.select();
    }, 100);
}

// 제목 편집 모달 닫기
function closeEditTitleModal() {
    editTitleModal.classList.remove('active');
}

// 대화 제목 저장
async function saveConversationTitle() {
    const sessionId = titleInput.dataset.sessionId;
    const newTitle = titleInput.value.trim();
    
    if (!sessionId || !newTitle) {
        return;
    }
    
    try {
        const response = await fetch(`/api/conversations/${sessionId}/title`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: newTitle })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 모달 닫기
            closeEditTitleModal();
            
            // 현재 대화인 경우 제목 업데이트
            if (sessionId === currentSessionId) {
                currentConversationTitle = newTitle;
            }
            
            // 대화 목록 업데이트
            fetchConversations();
        } else {
            console.error('대화 제목 업데이트 오류:', data.error);
        }
    } catch (error) {
        console.error('대화 제목 업데이트 요청 오류:', error);
    }
}

// 메시지 전송
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    // 세션 ID가 없으면 새 대화 시작
    if (!currentSessionId) {
        await startNewConversation();
    }
    
    // 사용자 메시지 표시
    addMessage(message, 'user');
    messageInput.value = '';
    
    // 로딩 표시
    loadingIndicator.style.display = 'flex';
    
    try {
        // 시스템 메시지 가져오기
        const systemMessage = systemMessageInput.value.trim();
        
        // API 요청
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message,
                systemMessage: systemMessage || undefined,
                sessionId: currentSessionId
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // 세션 ID 업데이트 (필요한 경우)
            if (data.sessionId && data.sessionId !== currentSessionId) {
                currentSessionId = data.sessionId;
                localStorage.setItem('chatSessionId', currentSessionId);
                sessionInfoElement.innerHTML = `<i class="fas fa-key"></i> 세션 ID: ${currentSessionId.substring(0, 8)}...`;
            }
            
            // 봇 응답 표시
            addMessage(data.reply, 'bot');
            
            // 대화 목록 업데이트
            fetchConversations();
        } else {
            // 오류 메시지 표시
            addMessage(`⚠️ 오류: ${data.error || '알 수 없는 오류가 발생했습니다.'}`, 'bot');
        }
    } catch (error) {
        console.error('API 요청 오류:', error);
        addMessage('⚠️ 서버와 통신 중 오류가 발생했습니다.', 'bot');
    } finally {
        // 로딩 숨기기
        loadingIndicator.style.display = 'none';
    }
}

// 메시지 추가
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    
    // 사용자 메시지는 일반 텍스트로, 봇 메시지는 마크다운으로 렌더링
    if (sender === 'user') {
        messageElement.textContent = text;
    } else {
        // 마크다운으로 렌더링
        messageElement.innerHTML = marked.parse(text);
        
        // 코드 블록에 하이라이팅 적용
        messageElement.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }
    
    chatContainer.appendChild(messageElement);
    
    // 스크롤을 최신 메시지로 이동
    chatContainer.scrollTop = chatContainer.scrollHeight;
} 