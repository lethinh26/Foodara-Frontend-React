import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User, UserRole, SessionDevice } from '../types/user';
import type { RootState } from './index';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  devices: SessionDevice[];
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  role: null,
  devices: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.role = action.payload.user.role;
      localStorage.setItem('foodara:lastRole', action.payload.user.role);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;
      state.devices = [];
      localStorage.removeItem('foodara:lastRole');
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
      localStorage.setItem('foodara:lastRole', action.payload);
    },
    setUser (state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.role = action.payload?.role || null;
      if (action.payload?.role) localStorage.setItem('foodara:lastRole', action.payload.role);
    },
    setToken (state, action: PayloadAction<string | null>) {
      state.token = action.payload;
    }
  },
});

export const { loginSuccess, logout, updateProfile, setDevices, removeDevice, switchRole, setUser, setToken } = authSlice.actions;

export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectRole = (state: RootState) => state.auth.role;
export const selectDevices = (state: RootState) => state.auth.devices;

export default authSlice.reducer;
