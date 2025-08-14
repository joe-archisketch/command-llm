import React, { useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { addFurniture, addGLBFurniture } from '../store/furnitureSlice';

export default function FurnitureList() {
  const dispatch = useDispatch();
  const [localUploadedModels, setLocalUploadedModels] = useState({});

  // 기본 가구 타입들
  const basicFurnitureTypes = [
    { type: "chair", label: "큐브" },
    { type: "table", label: "판지" },
    { type: "sofa", label: "직사각형" }
  ];

  // GLB 모델 파일들
  const glbModels = [
    { type: "SheenWoodLeatherSofa", label: "가죽 소파", path: "./models/SheenWoodLeatherSofa.glb" },
    { type: "SheenChair", label: "Sheen 의자", path: "./models/SheenChair.glb" },
    { type: "LightsPunctualLamp", label: "조명 램프", path: "./models/LightsPunctualLamp.glb" },
    { type: "Lantern", label: "랜턴", path: "./models/Lantern.glb" },
    { type: "IridescenceLamp", label: "무지개 램프", path: "./models/IridescenceLamp.glb" },
    { type: "GlamVelvetSofa", label: "벨벳 소파", path: "./models/GlamVelvetSofa.glb" },
    { type: "ChairDamaskPurplegold", label: "다마스크 의자", path: "./models/ChairDamaskPurplegold.glb" }
  ];

  const handleAddFurniture = (type) => {
    dispatch(addFurniture({ type }));
  };

  const handleAddGLBFurniture = (type, modelPath) => {
    dispatch(addGLBFurniture({ type, modelPath }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.glb')) {
      alert('GLB 파일만 업로드 가능합니다.');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB 제한
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }
    
    try {
      const modelPath = URL.createObjectURL(file);
      const type = file.name.replace('.glb', '');
      handleAddGLBFurniture(type, modelPath);
      setLocalUploadedModels(prev => ({
        ...prev,
        [type]: modelPath
      }));
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      alert('파일 업로드에 실패했습니다.');
    }
  };

  return (
    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}>
      {/* 기본 가구 버튼들 */}
      <div style={{ marginBottom: "15px" }}>
        <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>기본 가구</h4>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {basicFurnitureTypes.map(({ type, label }) => (
            <button 
              key={type}
              onClick={() => handleAddFurniture(type)}
              style={{
                padding: "8px 12px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* GLB 모델 버튼들 */}
      <div style={{ marginBottom: "15px" }}>
        <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>GLB 모델</h4>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {glbModels.map(({ type, label, path }) => (
            <button 
              key={type}
              onClick={() => handleAddGLBFurniture(type, path)}
              style={{
                padding: "8px 12px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 파일 업로드 */}
      <div style={{ marginBottom: "10px" }}>
        <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>커스텀 GLB 업로드</h4>
        <input
          type="file"
          accept=".glb"
          onChange={handleFileUpload}
          style={{ display: "none" }}
          id="glb-upload"
        />
        <label htmlFor="glb-upload" style={{
          display: "inline-block",
          padding: "8px 16px",
          backgroundColor: "#FF9800",
          color: "white",
          cursor: "pointer",
          borderRadius: "4px",
          fontSize: "12px"
        }}>
          GLB 파일 업로드
        </label>
      </div>
      
      {/* 업로드된 모델 목록 */}
      {Object.keys(localUploadedModels).length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>업로드된 모델</h4>
          {Object.keys(localUploadedModels).map(type => (
            <div key={type} style={{ 
              fontSize: "12px", 
              marginLeft: "10px", 
              color: "#666",
              marginBottom: "2px"
            }}>
              {type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 