import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from '../components/layout/RootLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleGuard from '../components/auth/RoleGuard';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import UsersPage from '../pages/UsersPage';
import NotFoundPage from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {/* Public routes */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Protected routes — require authentication */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />

          {/* User management — admin and manager can view; admin can mutate */}
          <Route
            path="users"
            element={
              <RoleGuard
                allowedRoles={['admin', 'manager']}
                fallback={<Navigate to="/dashboard" replace />}
              >
                <UsersPage />
              </RoleGuard>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

