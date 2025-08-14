import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  furnitures: [],
  selectedFurniture: null,
  uploadedModels: {}
};

const furnitureSlice = createSlice({
  name: 'furniture',
  initialState,
  reducers: {
    addFurniture: (state, action) => {
      const newFurniture = {
        id: Date.now(),
        type: action.payload.type,
        position: [0, 0.5, 0],
        rotation: [0, 0, 0],
        modelPath: action.payload.modelPath || null
      };
      state.furnitures.push(newFurniture);
    },
    
    addGLBFurniture: (state, action) => {
      const { type, modelPath } = action.payload;
      const newFurniture = {
        id: Date.now(),
        type,
        position: [0, 0.5, 0],
        rotation: [0, 0, 0],
        modelPath
      };
      state.furnitures.push(newFurniture);
      state.uploadedModels[type] = modelPath;
    },
    
    selectFurniture: (state, action) => {
      const index = action.payload;
      if (index >= 0 && index < state.furnitures.length) {
        state.selectedFurniture = state.furnitures[index];
      }
    },
    
    moveFurniture: (state, action) => {
      const { x, y, z } = action.payload;
      if (state.selectedFurniture) {
        const furniture = state.furnitures.find(f => f.id === state.selectedFurniture.id);
        if (furniture) {
          furniture.position = [x, y, z];
          state.selectedFurniture.position = [x, y, z];
        }
      }
    },
    
    rotateFurniture: (state, action) => {
      const { x, y, z } = action.payload;
      if (state.selectedFurniture) {
        const furniture = state.furnitures.find(f => f.id === state.selectedFurniture.id);
        if (furniture) {
          furniture.rotation = [x, y, z];
          state.selectedFurniture.rotation = [x, y, z];
        }
      }
    },
    
    deleteFurniture: (state) => {
      if (state.selectedFurniture) {
        state.furnitures = state.furnitures.filter(f => f.id !== state.selectedFurniture.id);
        state.selectedFurniture = null;
      }
    },
    
    clearSelection: (state) => {
      state.selectedFurniture = null;
    },
    
    loadScene: (state, action) => {
      state.furnitures = action.payload.furnitures || [];
      state.selectedFurniture = null;
    },
    
    clearFurnitures: (state) => {
      state.furnitures = [];
      state.selectedFurniture = null;
    },
    
    updateFurniturePosition: (state, action) => {
      const { id, position } = action.payload;
      const furniture = state.furnitures.find(f => f.id === id);
      if (furniture) {
        furniture.position = position;
        if (state.selectedFurniture && state.selectedFurniture.id === id) {
          state.selectedFurniture.position = position;
        }
      }
    },
    
    updateFurnitureRotation: (state, action) => {
      const { id, rotation } = action.payload;
      const furniture = state.furnitures.find(f => f.id === id);
      if (furniture) {
        furniture.rotation = rotation;
        if (state.selectedFurniture && state.selectedFurniture.id === id) {
          state.selectedFurniture.rotation = rotation;
        }
      }
    }
  }
});

export const {
  addFurniture,
  addGLBFurniture,
  selectFurniture,
  moveFurniture,
  rotateFurniture,
  deleteFurniture,
  clearSelection,
  loadScene,
  clearFurnitures,
  updateFurniturePosition,
  updateFurnitureRotation
} = furnitureSlice.actions;

export default furnitureSlice.reducer; 