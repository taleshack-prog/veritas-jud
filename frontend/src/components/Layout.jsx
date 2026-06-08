import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/',            icon: '💬', label: 'Problema' },
  { path: '/cases',       icon: '📁', label: 'Casos' },
  { path: '/documents',   icon: '📄', label: 'Docs' },
  { path: '/marketplace', icon: '⚖️', label: 'Advogados' },
  { path: '/profile',     icon: '👤', label: 'Perfil' },
];

export default function Layout() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  function isActive(path) {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  }

  return (
    <div className="app">
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      <nav className="bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.path}
            className={`nav-item ${isActive(tab.path) ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <span className="nav-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
