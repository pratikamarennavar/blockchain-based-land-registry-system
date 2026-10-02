import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/auth";

const SellerLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/seller/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error(
          "Backend response:",
          text
        );

        throw new Error(
          `Server returned ${response.status}.`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Seller login failed."
        );
      }

      // ==================================
      // STORE SELLER AUTHENTICATION
      // ==================================

      localStorage.setItem(
        "sellerToken",
        data.token
      );

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "userRole",
        "SELLER"
      );

      if (data.seller) {
        localStorage.setItem(
          "sellerUser",
          JSON.stringify(data.seller)
        );
      }

      // ==================================
      // SELLER ONLY
      // ==================================

      navigate("/seller/dashboard");

    } catch (err) {
      console.error(
        "Seller login error:",
        err
      );

      setError(
        err.message ||
          "Cannot connect to backend. Make sure the backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          background: #eef8f3;
        }

        .seller-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 25px;

          background:
            linear-gradient(
              135deg,
              #e8f7ee,
              #f8fbfa,
              #e4f5eb
            );
        }

        .login-card {
          width: 100%;
          max-width: 900px;
          min-height: 570px;

          display: grid;
          grid-template-columns: 45% 55%;

          background: white;
          border-radius: 22px;
          overflow: hidden;

          box-shadow:
            0 18px 50px
            rgba(0,0,0,0.10);
        }

        /* LEFT */

        .login-left {
          background:
            linear-gradient(
              160deg,
              #004d40,
              #00695c,
              #00965e
            );

          color: white;
          padding: 50px;

          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .login-logo {
          width: 75px;
          height: 75px;

          background:
            rgba(255,255,255,0.15);

          border-radius: 20px;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 38px;
          margin-bottom: 25px;
        }

        .login-left h1 {
          font-size: 32px;
          line-height: 1.2;
          margin: 0 0 16px;
        }

        .login-left p {
          color: #d9f7e7;
          line-height: 1.7;
          font-size: 15px;
          margin: 0;
        }

        /* RIGHT */

        .login-right {
          padding: 65px 55px;

          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .login-right h2 {
          font-size: 30px;
          margin: 0 0 8px;
          color: #14231d;
        }

        .login-subtitle {
          color: #78847f;
          margin:
            0 0 30px;
          font-size: 14px;
        }

        .error-message {
          padding: 12px;

          border-radius: 8px;

          background: #fff0f0;

          border:
            1px solid #ffcaca;

          color: #c62828;

          margin-bottom: 20px;

          font-size: 13px;
        }

        .field {
          margin-bottom: 20px;
        }

        .field label {
          display: block;

          font-size: 13px;
          font-weight: 600;

          color: #35453e;

          margin-bottom: 8px;
        }

        .password-container {
          display: flex;

          width: 100%;

          border:
            1px solid #d5e0da;

          border-radius: 9px;

          overflow: hidden;

          background: #fbfdfc;
        }

        .field input {
          width: 100%;

          padding: 14px;

          border:
            1px solid #d5e0da;

          border-radius: 9px;

          background: #fbfdfc;

          outline: none;

          font-size: 14px;

          color: #17251e;
        }

        .password-container input {
          border: none;
          border-radius: 0;
          flex: 1;
        }

        .field input:focus {
          border-color: #16a34a;

          box-shadow:
            0 0 0 3px
            rgba(22,163,74,0.10);

          background: white;
        }

        .password-container input:focus {
          box-shadow: none;
        }

        .show-password {
          border: none;

          border-left:
            1px solid #dce5df;

          background: #f5f9f6;

          color: #087a41;

          padding: 0 14px;

          cursor: pointer;

          font-size: 12px;
          font-weight: 700;
        }

        .login-button {
          width: 100%;

          padding: 14px;

          border: none;

          border-radius: 9px;

          background:
            linear-gradient(
              90deg,
              #087a41,
              #16a34a
            );

          color: white;

          font-weight: 700;

          font-size: 15px;

          cursor: pointer;

          margin-top: 5px;
        }

        .login-button:hover {
          background:
            linear-gradient(
              90deg,
              #056333,
              #118a3f
            );
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .verification-note {
          margin-top: 25px;

          padding: 13px;

          border-radius: 8px;

          background: #f0faf4;

          color: #397153;

          font-size: 12px;

          line-height: 1.5;
        }

        .register-link {
          text-align: center;

          margin-top: 25px;

          color: #727e78;

          font-size: 13px;
        }

        .register-link a {
          color: #07833e;

          font-weight: 700;

          text-decoration: none;

          margin-left: 5px;
        }

        @media(max-width: 750px) {

          .login-card {
            grid-template-columns: 1fr;
          }

          .login-left {
            padding: 35px;
          }

          .login-right {
            padding: 40px 25px;
          }
        }

      `}</style>

      <div className="seller-login-page">

        <div className="login-card">

          {/* LEFT */}

          <div className="login-left">

            <div className="login-logo">
              🏠
            </div>

            <h1>
              Blockchain
              <br />
              Land Registry
            </h1>

            <p>
              Securely access your Seller Module
              to manage land records, properties,
              buyer requests and blockchain
              transactions.
            </p>

          </div>

          {/* RIGHT */}

          <div className="login-right">

            <h2>
              Seller Login
            </h2>

            <p className="login-subtitle">
              Sign in to your seller account
            </p>

            {error && (
              <div className="error-message">
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleLogin}>

              {/* EMAIL */}

              <div className="field">

                <label>
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your email"
                  disabled={loading}
                />

              </div>

              {/* PASSWORD */}

              <div className="field">

                <label>
                  Password
                </label>

                <div className="password-container">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) => {
                      setPassword(
                        e.target.value
                      );
                      setError("");
                    }}
                    placeholder="Enter your password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="show-password"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading
                  ? "Signing In..."
                  : "Sign In"}
              </button>

            </form>

            <div className="verification-note">
              🔐 Your seller account must be
              verified before you can access
              the Seller Module.
            </div>

            <div className="register-link">

              Don't have a seller account?

              <Link to="/seller/register">
                Create Account
              </Link>

            </div>

          </div>

        </div>

      </div>
    </>
  );
};

export default SellerLogin;