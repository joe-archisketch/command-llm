import { configureStore } from '@reduxjs/toolkit';
import furnitureReducer from './furnitureSlice';

export const store = configureStore({
  reducer: {
    furniture: furnitureReducer,
  },
}); 