const API_BASE_URL = 'http://localhost:5000/api';

// ======================================================
// ADMIN LOGIN
// ======================================================

export const adminLogin = async (email, password) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Login failed'
    );
  }

  return data;
};


// ======================================================
// ADMIN AUTH HEADER
// ======================================================

const getAdminHeaders = () => {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    throw new Error('Authentication required');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};


// ======================================================
// ADMIN PROFILE
// ======================================================

export const getAdminProfile = async () => {
  const response = await fetch(
    `${API_BASE_URL}/admin/profile`,
    {
      method: 'GET',
      headers: getAdminHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to load admin profile'
    );
  }

  return data;
};


// ======================================================
// ADMIN DASHBOARD
// ======================================================

export const getAdminDashboard = async () => {
  const response = await fetch(
    `${API_BASE_URL}/admin/dashboard`,
    {
      method: 'GET',
      headers: getAdminHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to load dashboard'
    );
  }

  return data;
};


// ======================================================
// SELLERS - GET
// ======================================================

export const getSellers = async () => {
  const response = await fetch(
    `${API_BASE_URL}/admin/sellers`,
    {
      method: 'GET',
      headers: getAdminHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to load sellers'
    );
  }

  return data;
};


// ======================================================
// SELLER - VERIFY
// ======================================================

export const verifySeller = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/sellers/${id}/verify`,
    {
      method: 'PUT',
      headers: getAdminHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to verify seller'
    );
  }

  return data;
};


// ======================================================
// SELLER - REJECT
// ======================================================

export const rejectSeller = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/sellers/${id}/reject`,
    {
      method: 'PUT',
      headers: getAdminHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to reject seller'
    );
  }

  return data;
};


// ======================================================
// BUYERS - GET
// ======================================================

export const getBuyers = async () => {
  const response = await fetch(
    `${API_BASE_URL}/admin/buyers`,
    {
      method: 'GET',
      headers: getAdminHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to load buyers'
    );
  }

  return data;
};


// ======================================================
// BUYER - VERIFY
// ======================================================

export const verifyBuyer = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/buyers/${id}/verify`,
    {
      method: 'PUT',
      headers: getAdminHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to verify buyer'
    );
  }

  return data;
};


// ======================================================
// BUYER - REJECT
// ======================================================

export const rejectBuyer = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/buyers/${id}/reject`,
    {
      method: 'PUT',
      headers: getAdminHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to reject buyer'
    );
  }

  return data;
};

// ======================================================
// LANDS - GET
// ======================================================

export const getLands = async () => {
  const response = await fetch(
    `${API_BASE_URL}/admin/lands`,
    {
      method: 'GET',
      headers: getAdminHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to load lands'
    );
  }

  return data;
};


// ======================================================
// LAND - VERIFY
// ======================================================

export const verifyLand = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/lands/${id}/verify`,
    {
      method: 'PUT',
      headers: getAdminHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to verify land'
    );
  }

  return data;
};


// ======================================================
// LAND - REJECT
// ======================================================

export const rejectLand = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/lands/${id}/reject`,
    {
      method: 'PUT',
      headers: getAdminHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to reject land'
    );
  }

  return data;
};