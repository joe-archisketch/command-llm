import React from "react";

export default function Room() {
  return (
    <mesh receiveShadow>
      <boxGeometry args={[10, 0.1, 10]} />
      <meshStandardMaterial color="#e0e0e0" />
    </mesh>
  );
} 