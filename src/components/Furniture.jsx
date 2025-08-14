import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import { selectFurniture } from '../store/furnitureSlice';
import GLBFurniture from "./GLBFurniture";

export default function Furniture({ id, type, position, rotation, modelPath, isSelected }) {
  const dispatch = useDispatch();
  const { furnitures } = useSelector(state => state.furniture);

  const handleClick = () => {
    const index = furnitures.findIndex(f => f.id === id);
    if (index !== -1) {
      dispatch(selectFurniture(index));
    }
  };

  if (modelPath) {
    return (
      <GLBFurniture
        modelPath={modelPath}
        position={position}
        rotation={rotation}
        isSelected={isSelected}
        onClick={handleClick}
      />
    );
  }

  const getGeometry = () => {
    switch (type) {
      case "chair":
        return <boxGeometry args={[0.5, 0.5, 0.5]} />;
      case "table":
        return <boxGeometry args={[1, 0.1, 1]} />;
      case "sofa":
        return <boxGeometry args={[2, 0.5, 0.8]} />;
      default:
        return <boxGeometry args={[0.5, 0.5, 0.5]} />;
    }
  };

  const getMaterial = () => {
    if (isSelected) {
      return <meshStandardMaterial color="#ffff00" />;
    }
    switch (type) {
      case "chair":
        return <meshStandardMaterial color="#8B4513" />;
      case "table":
        return <meshStandardMaterial color="#654321" />;
      case "sofa":
        return <meshStandardMaterial color="#4169E1" />;
      default:
        return <meshStandardMaterial color="#808080" />;
    }
  };

  return (
    <mesh
      position={position}
      rotation={rotation}
      onClick={handleClick}
    >
      {getGeometry()}
      {getMaterial()}
    </mesh>
  );
} 