import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useStore';
import { loginSuccess, logout } from '../store/authSlice';
import { authService } from '../services/authService';


export function useSessionRestore() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) return;

    const restoreSession = async () => {
      try {
        const user = await authService.getProfile();
        dispatch(loginSuccess({ user }));
      } catch {
        dispatch(logout());
      }
    };

    restoreSession();
  }, [isAuthenticated, dispatch]);
}
