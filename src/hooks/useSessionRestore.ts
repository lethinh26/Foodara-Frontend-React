import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useStore';
import { loginSuccess, logout, setAuthChecking, selectAuthStatus } from '../store/authSlice';
import { authService } from '../services/authService';


export function useSessionRestore() {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);

  useEffect(() => {
    if (authStatus !== 'idle') return;
    dispatch(setAuthChecking());

    const restoreSession = async () => {
      try {
        const user = await authService.getProfile();
        dispatch(loginSuccess({ user }));
      } catch {
        dispatch(logout());
      }
    };

    restoreSession();
  }, [authStatus, dispatch]);
}

