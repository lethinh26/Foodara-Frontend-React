import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useStore';
import { selectIsAuthenticated, selectRole } from '../../store/authSlice';
import type { UserRole } from '../../types/user';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectRole);
  const location = useLocation();

  if (!isAuthenticated) {
    const loginPath = requiredRole === 'customer' ? '/customer/login' : requiredRole === 'merchant' ? '/merchant/login' : '/admin/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
