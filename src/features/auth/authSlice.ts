import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AuthUser = {
  id: number;
  name: string;
  email?: string;
};

export type AuthState = {
  user: AuthUser | null;
};

const STORAGE_KEY = 'cdj-auth';

export const loadAuthState = (): AuthState => {
  if (typeof window === 'undefined' || !window.localStorage) return { user: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null };
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    return { user: parsed.user ?? null };
  } catch {
    return { user: null };
  }
};

const initialState: AuthState = loadAuthState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
    },
    signOut(state) {
      state.user = null;
    }
  }
});

export const { setUser, signOut } = authSlice.actions;

export const persistAuthState = (state: AuthState) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore persistence errors (storage may be full or unavailable)
  }
};

export { STORAGE_KEY };
export default authSlice.reducer;