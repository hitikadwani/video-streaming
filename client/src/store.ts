import { configureStore } from '@reduxjs/toolkit';
import authReducer from './redux/slices/authSlice';
import videoReducer from './redux/slices/videoSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    videos: videoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;