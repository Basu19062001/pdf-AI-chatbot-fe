import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AppShell } from '../components/layout/AppShell';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { PublicOnlyRoute } from '../routes/PublicOnlyRoute';
import { DashboardPage } from '../pages/DashboardPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { SessionsPage } from '../pages/SessionsPage';
import { SignupPage } from '../pages/SignupPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <LoginPage />,
          },
          {
            path: '/signup',
            element: <SignupPage />,
          },
        ],
      },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'sessions',
            element: <SessionsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '/dashboard',
    element: <Navigate to="/app" replace />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

