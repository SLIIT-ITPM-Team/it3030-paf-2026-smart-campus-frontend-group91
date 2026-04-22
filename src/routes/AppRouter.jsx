import { Navigate, Route, Routes } from 'react-router-dom';
import App from '../App';
import { useAuth } from '../auth/AuthContext';
import AppLayout from '../layout/AppLayout';
import AdminDashboard from '../pages/AdminDashboard';
import AdminBookingManagementPage from '../pages/booking_services/AdminBookings';
import UserBookingManagementPage from '../pages/booking_services/StudentBooking';
import BookingDetails from '../pages/booking_services/BookingDetails';
import BookingFormPage from '../pages/booking_services/BookingFormPage';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import OAuthCallbackPage from '../pages/OAuthCallbackPage';
import RegisterPage from '../pages/RegisterPage';
import TechnicianDashboard from '../pages/TechnicianDashboard';
import UserDashboard from '../pages/UserDashboard';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import RoleRoute from './RoleRoute';

const DashboardEntry = () => {
  const { hasRoles } = useAuth();
  const isAdmin = hasRoles(['ADMIN']);
  const isTechnician = hasRoles(['TECHNICIAN']);
  const isUserOnly = hasRoles(['USER']) && !hasRoles(['ADMIN', 'TECHNICIAN']);

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (isUserOnly) {
    return <Navigate to="/user" replace />;
  }

  if (isTechnician) {
    return <Navigate to="/technician" replace />;
  }

  return <App />;
};

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
          <Route path="/dashboard" element={<DashboardEntry />} />

          <Route element={<RoleRoute allowedRoles={['USER']} />}>
            <Route
              path="/user"
              element={<UserDashboard />}
            />
          </Route>

          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route
              path="/admin/bookings"
              element={<AdminBookingManagementPage />}
            />
          </Route>

          <Route element={<RoleRoute allowedRoles={['USER']} />}>
            <Route
              path="/user/bookings"
              element={<UserBookingManagementPage />}
            />
            <Route
              path="/user/bookings/new"
              element={<BookingFormPage />}
            />
            <Route
              path="/booking/:bookingId"
              element={<BookingDetails />}
            />
          </Route>

          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route
              path="/admin/bookings"
              element={<AdminBookingManagementPage />}
            />
            <Route
              path="/admin/booking/:bookingId"
              element={<BookingDetails />}
            />
          </Route>

          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />
          </Route>

          <Route element={<RoleRoute allowedRoles={['TECHNICIAN']} />}>
            <Route
              path="/technician"
              element={<TechnicianDashboard />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
