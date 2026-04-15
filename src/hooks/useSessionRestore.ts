import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useStore';
import { setUser, setToken } from '../store/authSlice';
import { refreshAccessToken } from '../utils/tokenRefresh';
import { authService } from '../services/authService';


export function useSessionRestore() {
  const dispatch = useAppDispatch();
  const currentToken = useAppSelector(state => state.auth.token);

  useEffect(() => {
    if (currentToken) {
      return;
    }

    const restoreSession = async () => {
      try {
        const newAccessToken = await refreshAccessToken();
        
        if (newAccessToken) {
          dispatch(setToken(newAccessToken));
          
          const user = await authService.getProfile();
          dispatch(setUser(user));
          
          console.log('✅ Session restored successfully');
        }
      } catch (error) {
        console.log('ℹ️ No valid session to restore');
      }
    };

    restoreSession();
  }, [currentToken, dispatch]);
}
