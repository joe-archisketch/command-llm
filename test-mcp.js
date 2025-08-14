// MCP 서버 테스트 스크립트
import WebSocket from 'ws';

const ws = new WebSocket('ws://127.0.0.1:7801/rpc');

ws.on('open', () => {
  console.log('✅ MCP 서버에 연결됨');
  
  // 1. 사용 가능한 도구 목록 조회
  sendRequest('describeTools', {});
  
  // 2. 현재 가구 목록 조회
  setTimeout(() => sendRequest('list_furnitures', {}), 500);
  
  // 3. 의자 추가
  setTimeout(() => sendRequest('add_furniture', { type: 'chair' }), 1000);
  
  // 4. 첫 번째 가구 선택
  setTimeout(() => sendRequest('select_furniture', { index: 0 }), 1500);
  
  // 5. 가구 이동
  setTimeout(() => sendRequest('move_furniture', { id: 0, position: [2, 0.5, 1] }), 2000);
  
  // 6. 가구 회전
  setTimeout(() => sendRequest('rotate_furniture', { id: 0, rotation: [0, 1.57, 0] }), 2500);
  
  // 7. 장면 저장
  setTimeout(() => sendRequest('save_scene', {}), 3000);
  
  // 8. 최종 상태 확인
  setTimeout(() => {
    sendRequest('list_furnitures', {});
    setTimeout(() => {
      console.log('🧪 테스트 완료');
      ws.close();
    }, 500);
  }, 3500);
});

ws.on('message', (data) => {
  try {
    const response = JSON.parse(data.toString());
    console.log(`📨 응답 (ID: ${response.id}):`, response.result || response.error);
  } catch (e) {
    console.log('📨 원시 응답:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket 오류:', error.message);
});

ws.on('close', () => {
  console.log('🔌 연결 종료');
});

function sendRequest(method, params) {
  const request = {
    id: Date.now(),
    method,
    params
  };
  console.log(`🚀 요청: ${method}`, params);
  ws.send(JSON.stringify(request));
}
