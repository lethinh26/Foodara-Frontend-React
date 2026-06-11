import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useAppSelector } from '../../hooks/useStore';
import { selectIsAuthenticated, selectRole, selectAuthStatus } from '../../store/authSlice';
import type { UserRole } from '../../types/user';

interface AuthGuardProps {
  children?: React.ReactNode;
  requiredRole: UserRole;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectRole);
  const authStatus = useAppSelector(selectAuthStatus);
  const location = useLocation();

  if (authStatus === 'idle' || authStatus === 'checking') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginPath = requiredRole === 'customer' ? '/customer/login' : requiredRole === 'merchant' ? '/merchant/login' : '/admin/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Support both children (wrapper mode) and Outlet (route nesting mode)
  return <>{children || <Outlet />}</>;
};

