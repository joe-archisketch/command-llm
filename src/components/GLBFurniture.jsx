import React, { Suspense } from "react";
import { useGLTF } from "@react-three/drei";

function GLBModel({ modelPath, position, rotation, isSelected, onClick }) {
  const { scene } = useGLTF(modelPath);
  
  return (
    <primitive
      object={scene}
      position={position}
      rotation={rotation}
      onClick={onClick}
      scale={isSelected ? 1.1 : 1}
    />
  );
}

export default function GLBFurniture({ modelPath, position, rotation, isSelected, onClick }) {
  return (
    <Suspense fallback={
      <mesh position={position} rotation={rotation} onClick={onClick}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={isSelected ? "#ffff00" : "#808080"} />
      </mesh>
    }>
      <GLBModel
        modelPath={modelPath}
        position={position}
        rotation={rotation}
        isSelected={isSelected}
        onClick={onClick}
      />
    </Suspense>
  );
} 