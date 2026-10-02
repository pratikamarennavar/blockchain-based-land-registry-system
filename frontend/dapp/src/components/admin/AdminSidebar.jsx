import { NavLink, useNavigate } from 'react-router-dom';

function AdminSidebar() {
  const navigate = useNavigate();

  const admin = JSON.parse(
    localStorage.getItem('admin') || '{}'
  );

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');

    navigate('/login', { replace: true });
  };

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard'
    },
    {
      label: 'Verify Sellers',
      path: '/admin/seller-verification'
    },
    {
      label: 'Verify Buyers',
      path: '/admin/buyer-verification'
    },
    {
      label: 'Verify Lands',
      path: '/admin/land-verification'
    }
  ];

  return (
    <aside style={styles.sidebar}>

      {/* HEADER */}
      <div style={styles.header}>

        <div style={styles.systemName}>
          Land Registry
        </div>

        <div style={styles.adminLabel}>
          Administrator
        </div>

      </div>

      {/* NAVIGATION */}
      <nav style={styles.navigation}>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.activeNavItem : {})
            })}
          >
            {item.label}
          </NavLink>
        ))}

      </nav>

      {/* BOTTOM */}
      <div style={styles.bottom}>

        <div style={styles.account}>

          <div style={styles.avatar}>
            {admin.name
              ? admin.name.charAt(0).toUpperCase()
              : 'A'}
          </div>

          <div style={styles.accountInfo}>

            <div style={styles.adminName}>
              {admin.name || 'Administrator'}
            </div>

            <div style={styles.adminEmail}>
              {admin.email || ''}
            </div>

          </div>

        </div>

        <button
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </button>

      </div>

    </aside>
  );
}

const styles = {
  sidebar: {
    width: '250px',
    height: '100vh',
    background: '#111827',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0
  },

  header: {
    padding: '28px 24px',
    borderBottom: '1px solid #263244'
  },

  systemName: {
    fontSize: '19px',
    fontWeight: '600',
    letterSpacing: '-0.2px'
  },

  adminLabel: {
    marginTop: '5px',
    fontSize: '12px',
    color: '#9ca3af'
  },

  navigation: {
    padding: '24px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },

  navItem: {
    textDecoration: 'none',
    color: '#cbd5e1',
    padding: '12px 14px',
    borderRadius: '7px',
    fontSize: '14px',
    fontWeight: '500',
    transition: '0.2s'
  },

  activeNavItem: {
    background: '#2563eb',
    color: '#ffffff'
  },

  bottom: {
    marginTop: 'auto',
    padding: '18px',
    borderTop: '1px solid #263244'
  },

  account: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px'
  },

  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    fontWeight: '600',
    flexShrink: 0
  },

  accountInfo: {
    minWidth: 0
  },

  adminName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  adminEmail: {
    marginTop: '3px',
    fontSize: '11px',
    color: '#9ca3af',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  logoutButton: {
    width: '100%',
    padding: '10px',
    border: '1px solid #374151',
    borderRadius: '7px',
    background: 'transparent',
    color: '#e5e7eb',
    cursor: 'pointer',
    fontSize: '13px'
  }
};

export default AdminSidebar;