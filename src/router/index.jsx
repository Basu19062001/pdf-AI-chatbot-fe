import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AppShell } from '../components/layout/AppShell';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ChatSessionDetailPage } from '../pages/ChatSessionDetailPage';
import { ChatsPage } from '../pages/ChatsPage';
import { DocumentDetailPage } from '../pages/DocumentDetailPage';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { PublicOnlyRoute } from '../routes/PublicOnlyRoute';
import { DashboardPage } from '../pages/DashboardPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProfilePage } from '../pages/ProfilePage';
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
            element: <Navigate to="/app/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'documents',
            element: <DocumentsPage />,
          },
          {
            path: 'documents/:documentId',
            element: <DocumentDetailPage />,
          },
          {
            path: 'chats',
            element: <ChatsPage />,
          },
          {
            path: 'chats/:chatId',
            element: <ChatSessionDetailPage />,
          },
          {
            path: 'sessions',
            element: <SessionsPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
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
