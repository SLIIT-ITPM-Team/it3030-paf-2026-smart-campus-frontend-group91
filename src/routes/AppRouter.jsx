import { Navigate, Route, Routes } from 'react-router-dom';
import App from '../App';
import AppLayout from '../layout/AppLayout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import OAuthCallbackPage from '../pages/OAuthCallbackPage';
import RegisterPage from '../pages/RegisterPage';
import RolePage from '../pages/RolePage';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import RoleRoute from './RoleRoute';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<App />} />

          <Route element={<RoleRoute allowedRoles={['USER']} />}>
            <Route
              path="/user"
              element={
                <RolePage
                  title="User Space"
                  description="This page is available for USER role members."
                />
              }
            />
          </Route>

          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route
              path="/admin"
              element={
                <RolePage
                  title="Admin Space"
                  description="This page is restricted to ADMIN role members."
                />
              }
            />
          </Route>

          <Route element={<RoleRoute allowedRoles={['TECHNICIAN']} />}>
            <Route
              path="/technician"
              element={
                <RolePage
                  title="Technician Space"
                  description="This page is restricted to TECHNICIAN role members."
                />
              }
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
