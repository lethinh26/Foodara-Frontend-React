import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User, UserRole, SessionDevice } from '../types/user';
import type { RootState } from './index';

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  authStatus: AuthStatus;
  role: UserRole | null;
  devices: SessionDevice[];
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  authStatus: 'idle',
  role: null,
  devices: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthChecking(state) {
      state.authStatus = 'checking';
    },
    loginSuccess(state, action: PayloadAction<{ user: User }>) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.authStatus = 'authenticated';
      state.role = action.payload.user.role;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.authStatus = 'unauthenticated';
      state.role = null;
      state.devices = [];
    },
    updateProfile(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setDevices(state, action: PayloadAction<SessionDevice[]>) {
      state.devices = action.payload;
    },
    removeDevice(state, action: PayloadAction<string>) {
      state.devices = state.devices.filter(d => d.id !== action.payload);
    },
    switchRole(state, action: PayloadAction<UserRole>) {
      state.role = action.payload;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.authStatus = action.payload ? 'authenticated' : 'unauthenticated';
      state.role = action.payload?.role || null;
    },
  },
});

export const { loginSuccess, logout, updateProfile, setDevices, removeDevice, switchRole, setUser, setAuthChecking } = authSlice.actions;

export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthStatus = (state: RootState) => state.auth.authStatus;
export const selectRole = (state: RootState) => state.auth.role;
export const selectDevices = (state: RootState) => state.auth.devices;

export default authSlice.reducer;

