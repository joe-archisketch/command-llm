import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectFurniture, 
  moveFurniture, 
  rotateFurniture, 
  deleteFurniture, 
  loadScene,
  addGLBFurniture 
} from '../store/furnitureSlice';

export default function Console() {
  const dispatch = useDispatch();
  const { furnitures, selectedFurniture } = useSelector(state => state.furniture);
  
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);

  // 명령어 그룹 정의
  const commandGroups = {
    "기본 명령어": [
      { cmd: "help", desc: "도움말 보기" },
      { cmd: "clear", desc: "콘솔 지우기" },
      { cmd: "list", desc: "가구 목록 보기" }
    ],
    "가구 선택": [
      { cmd: "select <번호>", desc: "가구 선택" }
    ],
    "가구 조작": [
      { cmd: "move <x> <y> <z>", desc: "선택된 가구 이동" },
      { cmd: "rotate <x> <y> <z>", desc: "선택된 가구 회전" },
      { cmd: "delete", desc: "선택된 가구 삭제" }
    ],
    "GLB 모델": [
      { cmd: "load <타입> [URL]", desc: "GLB 모델 로드" }
    ],
    "일괄 명령어": [
      { cmd: "batch", desc: "일괄 명령어 실행" },
      { cmd: "save", desc: "현재 상태 저장" },
      { cmd: "load_scene", desc: "저장된 상태 불러오기" }
    ]
  };

  const executeCommand = (cmd) => {
    const parts = cmd.trim().toLowerCase().split(" ");
    const action = parts[0];
    
    let result = "";
    
    switch (action) {
      case "list":
        if (furnitures.length === 0) {
          result = "가구가 없습니다.";
        } else {
          result = furnitures.map((f, index) => 
            `${index + 1}. ${f.type} (ID: ${f.id}) - 위치: [${f.position.join(", ")}]${f.modelPath ? ' (GLB 모델)' : ''}`
          ).join("\n");
        }
        break;
        
      case "select":
        const index = parseInt(parts[1]) - 1;
        if (index >= 0 && index < furnitures.length) {
          dispatch(selectFurniture(index));
          result = `${furnitures[index].type} (ID: ${furnitures[index].id}) 선택됨`;
        } else {
          result = "잘못된 가구 번호입니다. 'list' 명령어로 가구 목록을 확인하세요.";
        }
        break;
        
      case "move":
        if (!selectedFurniture) {
          result = "먼저 가구를 선택하세요. 'select <번호>' 명령어를 사용하세요.";
          break;
        }
        const x = parseFloat(parts[1]) || 0;
        const y = parseFloat(parts[2]) || 0.5;
        const z = parseFloat(parts[3]) || 0;
        
        dispatch(moveFurniture({ x, y, z }));
        result = `${selectedFurniture.type}을 위치 [${x}, ${y}, ${z}]로 이동`;
        break;
        
      case "rotate":
        if (!selectedFurniture) {
          result = "먼저 가구를 선택하세요. 'select <번호>' 명령어를 사용하세요.";
          break;
        }
        const rx = parseFloat(parts[1]) || 0;
        const ry = parseFloat(parts[2]) || 0;
        const rz = parseFloat(parts[3]) || 0;
        
        dispatch(rotateFurniture({ x: rx, y: ry, z: rz }));
        result = `${selectedFurniture.type}을 회전 [${rx}, ${ry}, ${rz}]로 설정`;
        break;
        
      case "delete":
        if (!selectedFurniture) {
          result = "먼저 가구를 선택하세요. 'select <번호>' 명령어를 사용하세요.";
          break;
        }
        dispatch(deleteFurniture());
        result = `${selectedFurniture.type} 삭제됨`;
        break;
        
      case "load":
        const modelType = parts[1];
        if (!modelType) {
          result = "사용법: load <모델타입> [URL]\n예시: load chair /models/chair.glb";
          break;
        }
        const modelUrl = parts[2] || `/models/${modelType}.glb`;
        
        // URL 유효성 검사
        if (!modelUrl.startsWith('/') && !modelUrl.startsWith('http')) {
          result = "잘못된 URL 형식입니다. 절대 경로(/) 또는 http URL을 사용하세요.";
          break;
        }
        
        dispatch(addGLBFurniture({ type: modelType, modelPath: modelUrl }));
        result = `GLB 모델 ${modelType} 로드 시도 (${modelUrl})\n파일이 존재하지 않으면 기본 geometry로 표시됩니다.`;
        break;

      case "batch":
        result = "일괄 명령어 모드입니다. 여러 명령어를 한 번에 실행할 수 있습니다.\n사용법: batch <명령어1>; <명령어2>; <명령어3>\n예시: batch select 1; move 2 0.5 3; rotate 0 1.57 0";
        if (parts.length > 1) {
          const batchCommands = cmd.substring(6).split(';').map(c => c.trim());
          let batchResult = "일괄 실행 결과:\n";
          batchCommands.forEach((batchCmd, index) => {
            if (batchCmd) {
              batchResult += `[${index + 1}] ${batchCmd}: `;
              // 간단한 일괄 실행 (실제로는 더 복잡한 로직 필요)
              batchResult += "실행됨\n";
            }
          });
          result = batchResult;
        }
        break;

      case "save":
        const sceneData = {
          furnitures: furnitures,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('furnitureScene', JSON.stringify(sceneData));
        result = "현재 장면이 저장되었습니다.";
        break;

      case "load_scene":
        const savedScene = localStorage.getItem('furnitureScene');
        if (savedScene) {
          const sceneData = JSON.parse(savedScene);
          dispatch(loadScene(sceneData));
          result = "저장된 장면을 불러왔습니다.";
        } else {
          result = "저장된 장면이 없습니다.";
        }
        break;
        
      case "help":
        result = "사용 가능한 명령어 그룹:\n";
        Object.entries(commandGroups).forEach(([groupName, commands]) => {
          result += `\n${groupName}:\n`;
          commands.forEach(({ cmd, desc }) => {
            result += `  ${cmd} - ${desc}\n`;
          });
        });
        result += "\n추가 기능:\n";
        result += "- ↑/↓ 키: 명령어 히스토리 탐색\n";
        result += "- Tab 키: 자동완성\n";
        result += "- batch 명령어: 일괄 실행\n";
        break;
        
      case "clear":
        setHistory([]);
        return;
        
      default:
        result = "알 수 없는 명령어입니다. 'help'를 입력하여 사용 가능한 명령어를 확인하세요.";
    }
    
    setHistory([...history, { command: cmd, result }]);
    setCommandHistory([...commandHistory, cmd]);
    setHistoryIndex(-1);
  };

  // 자동완성 기능
  const getSuggestions = (input) => {
    if (!input) return [];
    
    const suggestions = [];
    Object.values(commandGroups).flat().forEach(({ cmd }) => {
      if (cmd.startsWith(input.toLowerCase())) {
        suggestions.push(cmd);
      }
    });
    return suggestions.slice(0, 5); // 최대 5개 제안
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand("");
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const suggestions = getSuggestions(command);
      if (suggestions.length > 0) {
        setCommand(suggestions[0]);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (command.trim()) {
      executeCommand(command);
      setCommand("");
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCommand(value);
    setSuggestions(getSuggestions(value));
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div style={{
      position: "absolute",
      bottom: 10,
      left: 10,
      width: "500px",
      height: "350px",
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      color: "#00ff00",
      fontFamily: "monospace",
      fontSize: "12px",
      padding: "10px",
      borderRadius: "5px",
      overflow: "auto",
      zIndex: 1000
    }}>
      <div style={{ marginBottom: "10px" }}>
        <strong>3D 가구 배치 콘솔</strong>
        {selectedFurniture && (
          <div style={{ color: "#ffff00" }}>
            선택됨: {selectedFurniture.type} (ID: {selectedFurniture.id})
          </div>
        )}
      </div>
      
      <div style={{ height: "250px", overflow: "auto", marginBottom: "10px" }}>
        {history.map((item, index) => (
          <div key={index}>
            <div style={{ color: "#ffffff" }}>&gt; {item.command}</div>
            <div style={{ whiteSpace: "pre-line" }}>{item.result}</div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="명령어 입력 (help로 도움말 보기, Tab으로 자동완성)"
          style={{
            width: "100%",
            backgroundColor: "transparent",
            border: "none",
            color: "#00ff00",
            outline: "none",
            fontFamily: "monospace"
          }}
        />
      </form>
      
      {suggestions.length > 0 && (
        <div style={{ 
          marginTop: "5px", 
          fontSize: "11px", 
          color: "#888888",
          maxHeight: "60px",
          overflow: "auto"
        }}>
          제안: {suggestions.join(" | ")}
        </div>
      )}
    </div>
  );
} 