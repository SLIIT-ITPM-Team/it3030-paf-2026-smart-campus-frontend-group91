import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', roles: ['USER', 'TECHNICIAN'] },
  { to: '/user', label: 'User Space', roles: ['USER'] },
  { to: '/user/bookings', label: 'My Bookings', roles: ['USER'] },
  { to: '/user/bookings/new', label: 'Book Resource', roles: ['USER'] },
  { to: '/admin', label: 'Admin Dashboard', roles: ['ADMIN'] },
  { to: '/admin/bookings', label: 'Manage Bookings', roles: ['ADMIN'] },
  { to: '/technician', label: 'Technician Space', roles: ['TECHNICIAN'] },
];

const AppLayout = () => {
  const { user, hasRoles, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header className="app-nav">
        <div className="app-nav-brand">Smart Campus Operations Hub</div>
        <nav className="app-nav-links" aria-label="Primary navigation">
          {NAV_ITEMS.filter((item) => hasRoles(item.roles)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link-active' : 'nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-nav-user">
          <span className="app-nav-email">{user?.email || 'Signed in user'}</span>
          <button type="button" className="counter" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>
      <Outlet />
    </>
  );
};

export default AppLayout;
