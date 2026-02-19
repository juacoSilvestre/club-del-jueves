import { configureStore } from '@reduxjs/toolkit';
import appReducer from './features/app/appSlice';
import authReducer, { loadAuthState, persistAuthState } from './features/auth/authSlice';

const preloadedAuth = loadAuthState();

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer
  },
  preloadedState: {
    auth: preloadedAuth
  }
});

store.subscribe(() => {
  persistAuthState(store.getState().auth);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
