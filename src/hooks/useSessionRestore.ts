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

          const role = localStorage.getItem('foodara:lastRole') as 'customer' | 'merchant' | 'admin' | null;
          const user = await authService.getProfileWithToken(newAccessToken, role || 'customer');
          dispatch(setUser(user));
        }
      } catch {
        //
      }
    };

    restoreSession();
  }, [currentToken, dispatch]);
}
