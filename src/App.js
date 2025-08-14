import React from "react";
import { Canvas } from "@react-three/fiber";
import { useSelector } from 'react-redux';
import Room from "./components/Room";
import Furniture from "./components/Furniture";
import FurnitureList from "./components/FurnitureList";
import Controls from "./components/Controls";
import Console from "./components/Console";

function App() {
  const { furnitures, selectedFurniture } = useSelector(state => state.furniture);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <FurnitureList />
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }} shadows>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <Room />
        {furnitures.map((f) => (
          <Furniture 
            key={f.id} 
            {...f} 
            isSelected={selectedFurniture && selectedFurniture.id === f.id}
          />
        ))}
        <Controls />
      </Canvas>
      <Console />
    </div>
  );
}

export default App;
