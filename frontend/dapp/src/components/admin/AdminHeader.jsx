function AdminHeader() {
  const admin = JSON.parse(
    localStorage.getItem('admin') || '{}'
  );

  return (
    <header style={styles.header}>

      <div>
        <span style={styles.systemText}>
          ADMINISTRATOR PORTAL
        </span>
      </div>

      <div style={styles.profile}>

        <div style={styles.avatar}>
          {(admin.name || 'A')
            .charAt(0)
            .toUpperCase()}
        </div>

        <div>
          <div style={styles.name}>
            {admin.name || 'Administrator'}
          </div>

          <div style={styles.email}>
            {admin.email || ''}
          </div>
        </div>

      </div>

    </header>
  );
}

const styles = {

  header: {
    height: '70px',
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 30px',
    boxSizing: 'border-box'
  },

  systemText: {
    fontSize: '11px',
    letterSpacing: '1.2px',
    fontWeight: '600',
    color: '#6b7280'
  },

  profile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },

  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#4f46e5',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600'
  },

  name: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111827'
  },

  email: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '2px'
  }

};

export default AdminHeader;