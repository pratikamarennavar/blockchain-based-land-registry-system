import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../services/api';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ======================================================
  // LOGIN
  // ======================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');

    // Only check required fields during LOGIN.
    // Password-strength validation should be done during
    // registration/password creation, not login.
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);

      const data = await adminLogin(
        email.trim(),
        password
      );

      if (!data.success || !data.token) {
        setError(
          data.message ||
          'Invalid email or password.'
        );
        return;
      }

      // ==================================================
      // STORE REAL JWT TOKEN
      // ==================================================

      localStorage.setItem(
        'adminToken',
        data.token
      );

      // ==================================================
      // STORE ADMIN INFORMATION
      // ==================================================

      localStorage.setItem(
        'admin',
        JSON.stringify(data.admin)
      );

      // ==================================================
      // GO TO ADMIN DASHBOARD
      // ==================================================

      navigate('/admin/dashboard', {
        replace: true
      });

    } catch (error) {
      console.error('Login error:', error);

      setError(
        error.message ||
        'Unable to connect to the server.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.loginContainer}>

        {/* ==================================================
            LEFT GREEN BRAND SECTION
        ================================================== */}

        <div style={styles.introSection}>

          <div>

            {/* Brand */}
            <div style={styles.brandRow}>

              <div style={styles.brandIcon}>
                ⌂
              </div>

              <div>
                <div style={styles.brandName}>
                  Blockchain Land Registry
                </div>

                <div style={styles.brandSmall}>
                  Secure • Transparent • Trusted
                </div>
              </div>

            </div>


            <p style={styles.smallText}>
              LAND REGISTRY SYSTEM
            </p>


            <h1 style={styles.heading}>
              Administrator
              <br />
              Portal
            </h1>


            <p style={styles.description}>
              Secure administration of land records,
              user verification and blockchain-based
              ownership transactions.
            </p>


            {/* Feature Cards */}

            <div style={styles.featureList}>

              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>
                  ✓
                </div>

                <div>
                  <strong style={styles.featureTitle}>
                    Secure Records
                  </strong>

                  <span style={styles.featureText}>
                    Manage verified land information
                  </span>
                </div>
              </div>


              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>
                  ◈
                </div>

                <div>
                  <strong style={styles.featureTitle}>
                    Blockchain Security
                  </strong>

                  <span style={styles.featureText}>
                    Transparent ownership records
                  </span>
                </div>
              </div>


              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>
                  ✓
                </div>

                <div>
                  <strong style={styles.featureTitle}>
                    Admin Verification
                  </strong>

                  <span style={styles.featureText}>
                    Verify users and properties
                  </span>
                </div>
              </div>

            </div>

          </div>


          <p style={styles.footerText}>
            Authorized administrator access only
          </p>

        </div>


        {/* ==================================================
            RIGHT LOGIN SECTION
        ================================================== */}

        <div style={styles.formSection}>

          <div style={styles.formContainer}>

            {/* Login Header */}

            <div style={styles.loginHeader}>

              <div style={styles.loginIcon}>
                🔐
              </div>

              <div>
                <h2 style={styles.loginTitle}>
                  Welcome back
                </h2>

                <p style={styles.loginSubtitle}>
                  Sign in to your administrator account
                </p>
              </div>

            </div>


            <form onSubmit={handleLogin}>

              {/* ==================================================
                  EMAIL
              ================================================== */}

              <label style={styles.label}>
                Email address
              </label>

              <div style={styles.inputWrapper}>

                <span style={styles.inputIcon}>
                  ✉
                </span>

                <input
                  type="email"
                  value={email}
                  placeholder="Enter your email"
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  style={styles.input}
                  disabled={loading}
                  autoComplete="username"
                />

              </div>


              {/* ==================================================
                  PASSWORD
              ================================================== */}

              <label style={styles.label}>
                Password
              </label>

              <div style={styles.inputWrapper}>

                <span style={styles.inputIcon}>
                  🔒
                </span>

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  placeholder="Enter your password"
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  style={styles.passwordInput}
                  disabled={loading}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  style={styles.showButton}
                  disabled={loading}
                >
                  {showPassword
                    ? 'Hide'
                    : 'Show'}
                </button>

              </div>


              {/* ==================================================
                  ERROR
              ================================================== */}

              {error && (
                <div style={styles.error}>

                  <span style={styles.errorIcon}>
                    !
                  </span>

                  <span>
                    {error}
                  </span>

                </div>
              )}


              {/* ==================================================
                  LOGIN BUTTON
              ================================================== */}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.loginButton,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading
                    ? 'not-allowed'
                    : 'pointer'
                }}
              >

                {loading ? (
                  <>
                    <span style={styles.spinner}>
                      ⟳
                    </span>

                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <span style={styles.arrow}>
                      →
                    </span>
                  </>
                )}

              </button>

            </form>


            {/* ==================================================
                SECURITY INFORMATION
            ================================================== */}

            <div style={styles.securityBox}>

              <div style={styles.securityIcon}>
                ✓
              </div>

              <div>

                <strong style={styles.securityTitle}>
                  Secure administrator authentication
                </strong>

                <p style={styles.securityText}>
                  Your administrator session is protected
                  using authenticated server access.
                </p>

              </div>

            </div>


            <p style={styles.bottomText}>
              Blockchain Land Registry
            </p>

          </div>

        </div>

      </div>


      {/* Responsive CSS */}

      <style>
        {`

          @media (max-width: 850px) {

            .admin-login-container {
              grid-template-columns: 1fr !important;
              max-width: 520px !important;
            }

            .admin-login-intro {
              display: none !important;
            }

            .admin-login-form {
              padding: 40px 30px !important;
            }

          }

          @media (max-width: 500px) {

            .admin-login-page {
              padding: 15px !important;
            }

            .admin-login-form {
              padding: 30px 22px !important;
            }

          }

          .admin-login-input:focus {
            border-color: #159447 !important;
            box-shadow:
              0 0 0 3px rgba(21, 148, 71, 0.12) !important;
          }

          .admin-login-button:hover {
            transform: translateY(-1px);
            box-shadow:
              0 10px 22px rgba(5, 107, 56, 0.25) !important;
          }

          .admin-login-button:active {
            transform: translateY(0);
          }

        `}
      </style>

    </div>
  );
}


// ======================================================
// STYLES
// ======================================================

const styles = {

  // ====================================================
  // PAGE
  // ====================================================

  page: {
    minHeight: '100vh',

    background:
      'linear-gradient(135deg, #eef8f2 0%, #f7fbf8 45%, #e8f5ed 100%)',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',

    padding: '30px',

    boxSizing: 'border-box',

    position: 'relative',

    overflow: 'hidden'
  },


  // ====================================================
  // MAIN CONTAINER
  // ====================================================

  loginContainer: {
    width: '100%',

    maxWidth: '1080px',

    minHeight: '650px',

    background: '#ffffff',

    borderRadius: '24px',

    overflow: 'hidden',

    display: 'grid',

    gridTemplateColumns: '44% 56%',

    boxShadow:
      '0 25px 70px rgba(5, 107, 56, 0.16)',

    position: 'relative',

    zIndex: 2
  },


  // ====================================================
  // LEFT SECTION
  // ====================================================

  introSection: {
    background:
      'linear-gradient(145deg, #00583d 0%, #056b38 50%, #159447 100%)',

    color: '#ffffff',

    padding: '55px 50px',

    display: 'flex',

    flexDirection: 'column',

    justifyContent: 'space-between',

    boxSizing: 'border-box',

    position: 'relative',

    overflow: 'hidden'
  },


  brandRow: {
    display: 'flex',

    alignItems: 'center',

    gap: '12px',

    marginBottom: '55px'
  },


  brandIcon: {
    width: '48px',

    height: '48px',

    borderRadius: '14px',

    background:
      'rgba(255,255,255,0.16)',

    border:
      '1px solid rgba(255,255,255,0.22)',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    fontSize: '22px',

    fontWeight: '800'
  },


  brandName: {
    fontSize: '15px',

    fontWeight: '800',

    letterSpacing: '0.2px'
  },


  brandSmall: {
    marginTop: '4px',

    fontSize: '10px',

    color: '#ccebd7',

    letterSpacing: '0.4px'
  },


  smallText: {
    fontSize: '11px',

    letterSpacing: '2.5px',

    fontWeight: '700',

    color: '#c9ead4',

    margin: 0,

    marginBottom: '18px'
  },


  heading: {
    fontSize: '44px',

    lineHeight: '1.08',

    fontWeight: '700',

    margin: 0,

    letterSpacing: '-1.5px'
  },


  description: {
    maxWidth: '390px',

    marginTop: '24px',

    color: '#d7f1e1',

    fontSize: '14px',

    lineHeight: '1.75'
  },


  // ====================================================
  // FEATURES
  // ====================================================

  featureList: {
    marginTop: '38px',

    display: 'flex',

    flexDirection: 'column',

    gap: '14px'
  },


  featureItem: {
    display: 'flex',

    alignItems: 'center',

    gap: '13px',

    padding: '12px 14px',

    borderRadius: '12px',

    background:
      'rgba(255,255,255,0.08)',

    border:
      '1px solid rgba(255,255,255,0.10)'
  },


  featureIcon: {
    width: '30px',

    height: '30px',

    borderRadius: '9px',

    background:
      'rgba(255,255,255,0.15)',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    fontSize: '13px',

    fontWeight: '800'
  },


  featureTitle: {
    display: 'block',

    fontSize: '12px',

    fontWeight: '700',

    color: '#ffffff'
  },


  featureText: {
    display: 'block',

    marginTop: '3px',

    fontSize: '10px',

    color: '#bfe3cb'
  },


  footerText: {
    fontSize: '11px',

    color: '#b7ddc4',

    margin: 0
  },


  // ====================================================
  // RIGHT FORM
  // ====================================================

  formSection: {
    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    padding: '55px',

    boxSizing: 'border-box',

    background: '#ffffff'
  },


  formContainer: {
    width: '100%',

    maxWidth: '400px'
  },


  // ====================================================
  // LOGIN HEADER
  // ====================================================

  loginHeader: {
    display: 'flex',

    alignItems: 'center',

    gap: '13px',

    marginBottom: '35px'
  },


  loginIcon: {
    width: '48px',

    height: '48px',

    borderRadius: '14px',

    background: '#e8f7ed',

    color: '#087c42',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    fontSize: '20px'
  },


  loginTitle: {
    margin: 0,

    color: '#123125',

    fontSize: '29px',

    fontWeight: '750',

    letterSpacing: '-0.5px'
  },


  loginSubtitle: {
    margin: '5px 0 0',

    color: '#718178',

    fontSize: '13px',

    lineHeight: '1.5'
  },


  // ====================================================
  // LABEL
  // ====================================================

  label: {
    display: 'block',

    color: '#294b3c',

    fontSize: '13px',

    fontWeight: '700',

    marginBottom: '8px',

    marginTop: '20px'
  },


  // ====================================================
  // INPUT
  // ====================================================

  inputWrapper: {
    position: 'relative',

    width: '100%'
  },


  inputIcon: {
    position: 'absolute',

    left: '14px',

    top: '50%',

    transform: 'translateY(-50%)',

    color: '#159447',

    fontSize: '15px',

    zIndex: 1
  },


  input: {
    width: '100%',

    height: '52px',

    padding: '0 14px 0 43px',

    boxSizing: 'border-box',

    border: '1px solid #cfe3d5',

    borderRadius: '11px',

    outline: 'none',

    fontSize: '14px',

    color: '#123125',

    background: '#fbfefc',

    transition:
      'border-color 0.2s, box-shadow 0.2s'
  },


  passwordInput: {
    width: '100%',

    height: '52px',

    padding: '0 70px 0 43px',

    boxSizing: 'border-box',

    border: '1px solid #cfe3d5',

    borderRadius: '11px',

    outline: 'none',

    fontSize: '14px',

    color: '#123125',

    background: '#fbfefc',

    transition:
      'border-color 0.2s, box-shadow 0.2s'
  },


  showButton: {
    position: 'absolute',

    right: '12px',

    top: '50%',

    transform: 'translateY(-50%)',

    border: 'none',

    background: 'transparent',

    color: '#087c42',

    fontSize: '12px',

    cursor: 'pointer',

    fontWeight: '700'
  },


  // ====================================================
  // ERROR
  // ====================================================

  error: {
    marginTop: '16px',

    padding: '12px 13px',

    borderRadius: '10px',

    background: '#fff4f4',

    border: '1px solid #ffd8d8',

    color: '#c62828',

    fontSize: '12px',

    lineHeight: '1.5',

    display: 'flex',

    alignItems: 'center',

    gap: '9px'
  },


  errorIcon: {
    width: '21px',

    height: '21px',

    minWidth: '21px',

    borderRadius: '50%',

    background: '#c62828',

    color: '#ffffff',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    fontWeight: '800',

    fontSize: '12px'
  },


  // ====================================================
  // LOGIN BUTTON
  // ====================================================

  loginButton: {
    width: '100%',

    height: '52px',

    marginTop: '24px',

    border: 'none',

    borderRadius: '11px',

    background:
      'linear-gradient(135deg, #056b38 0%, #159447 100%)',

    color: '#ffffff',

    fontSize: '14px',

    fontWeight: '750',

    cursor: 'pointer',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    gap: '10px',

    transition:
      'transform 0.2s, box-shadow 0.2s',

    boxShadow:
      '0 7px 18px rgba(5, 107, 56, 0.18)'
  },


  arrow: {
    fontSize: '18px',

    lineHeight: 1
  },


  spinner: {
    fontSize: '18px',

    display: 'inline-block'
  },


  // ====================================================
  // SECURITY BOX
  // ====================================================

  securityBox: {
    marginTop: '28px',

    padding: '13px',

    borderRadius: '11px',

    background: '#f4fbf6',

    border: '1px solid #dcefe2',

    display: 'flex',

    gap: '11px',

    alignItems: 'flex-start'
  },


  securityIcon: {
    width: '25px',

    height: '25px',

    minWidth: '25px',

    borderRadius: '50%',

    background: '#dff4e5',

    color: '#087c42',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    fontSize: '12px',

    fontWeight: '800'
  },


  securityTitle: {
    display: 'block',

    color: '#28563f',

    fontSize: '11px'
  },


  securityText: {
    margin: '4px 0 0',

    color: '#789083',

    fontSize: '10px',

    lineHeight: '1.5'
  },


  bottomText: {
    textAlign: 'center',

    marginTop: '25px',

    color: '#9aaa9f',

    fontSize: '10px',

    letterSpacing: '0.3px'
  }

};

export default Login;