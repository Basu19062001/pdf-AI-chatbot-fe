import { Navigate, Outlet } from 'react-router-dom';

import { FullScreenLoader } from '../components/common/FullScreenLoader';
import { useAuth } from '../hooks/useAuth';

export function PublicOnlyRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <FullScreenLoader label="Preparing your workspace..." variant="auth" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
