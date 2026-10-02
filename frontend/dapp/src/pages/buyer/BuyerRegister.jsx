import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BuyerRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    password: "",
    confirmPassword: "",
    wallet_address: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !formData.name ||
      !formData.email ||
      !formData.mobile ||
      !formData.address ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (!/^[6-9][0-9]{9}$/.test(formData.mobile.trim())) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (
      !/[A-Z]/.test(formData.password) ||
      !/[a-z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password) ||
      !/[^A-Za-z0-9]/.test(formData.password)
    ) {
      setError(
        "Password must contain uppercase, lowercase, number and special character."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/buyer/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            mobile: formData.mobile.trim(),
            address: formData.address.trim(),
            password: formData.password,
            wallet_address:
              formData.wallet_address.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Buyer registration failed.");
        return;
      }

      setMessage(
        "Buyer account created successfully. Waiting for admin verification."
      );

      setTimeout(() => {
        navigate("/buyer/login");
      }, 1800);
    } catch (err) {
      console.error("Buyer registration error:", err);
      setError(
        "Unable to connect to the server. Make sure the backend is running."
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
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;

          background:
            linear-gradient(
              135deg,
              #eefaf4,
              #f8fbfa
            );

          color: #172033;
        }

        .buyer-register-page {
          min-height: 100vh;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 32px;
        }

        .buyer-register-container {
          width: 100%;
          max-width: 1100px;

          min-height: 650px;

          background: #fff;

          border-radius: 20px;

          overflow: hidden;

          box-shadow:
            0 20px 55px
            rgba(0, 70, 50, .12);

          display: grid;

          grid-template-columns:
            42% 58%;
        }

        /* =========================================
           LEFT PANEL
        ========================================= */

        .buyer-register-left {
          background:
            linear-gradient(
              180deg,
              #005447 0%,
              #00765d 48%,
              #008d61 100%
            );

          color: #fff;

          padding: 58px 50px;

          display: flex;
          flex-direction: column;

          justify-content: center;
        }

        .buyer-logo {
          width: 52px;
          height: 52px;

          border-radius: 13px;

          background:
            rgba(255,255,255,.16);

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 28px;

          margin-bottom: 22px;
        }

        .buyer-register-left h1 {
          margin: 0;

          font-size: 32px;

          line-height: 1.12;

          font-weight: 800;
        }

        .buyer-register-left p {
          margin: 18px 0 28px;

          font-size: 13px;

          line-height: 1.7;

          color: #e4fff5;
        }

        .buyer-feature {
          display: flex;

          align-items: center;

          gap: 10px;

          margin: 14px 0;

          font-size: 12px;

          font-weight: 600;
        }

        .buyer-feature-check {
          width: 19px;
          height: 19px;

          border-radius: 50%;

          background:
            rgba(255,255,255,.18);

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 11px;
        }

        /* =========================================
           RIGHT PANEL
        ========================================= */

        .buyer-register-right {
          padding: 38px 48px;

          overflow-y: auto;

          max-height: 720px;
        }

        .buyer-register-right h2 {
          margin: 0;

          font-size: 24px;

          color: #071f18;
        }

        .buyer-register-subtitle {
          margin-top: 5px;

          font-size: 12px;

          color: #6b7280;
        }

        .buyer-register-form {
          margin-top: 24px;
        }

        .buyer-form-row {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 12px;
        }

        .buyer-form-group {
          margin-bottom: 13px;
        }

        .buyer-form-group label {
          display: block;

          font-size: 11px;

          font-weight: 700;

          margin-bottom: 6px;

          color: #172033;
        }

        .buyer-required {
          color: #e11d48;
        }

        .buyer-form-group input,
        .buyer-form-group textarea {
          width: 100%;

          border: 1px solid #cfded8;

          background: #fbfdfc;

          border-radius: 7px;

          padding: 9px 11px;

          outline: none;

          font-size: 12px;

          color: #172033;

          transition: .2s;
        }

        .buyer-form-group input {
          height: 39px;
        }

        .buyer-form-group textarea {
          min-height: 66px;

          resize: vertical;
        }

        .buyer-form-group input:focus,
        .buyer-form-group textarea:focus {
          border-color: #159447;

          box-shadow:
            0 0 0 3px
            rgba(21,148,71,.08);
        }

        .buyer-input-hint {
          font-size: 8px;

          color: #7a8794;

          margin-top: 4px;
        }

        /* =========================================
           PASSWORD
        ========================================= */

        .buyer-password-wrap {
          display: flex;

          border:
            1px solid #cfded8;

          border-radius: 7px;

          overflow: hidden;

          background: #fbfdfc;
        }

        .buyer-password-wrap input {
          border: 0 !important;

          border-radius: 0 !important;

          box-shadow: none !important;

          flex: 1;
        }

        .buyer-show-password {
          width: 55px;

          border: 0;

          border-left:
            1px solid #dbe5e1;

          background: #f7faf8;

          color: #087c42;

          font-size: 10px;

          font-weight: 700;
        }

        /* =========================================
           INFO
        ========================================= */

        .buyer-verification-box {
          margin-top: 8px;

          padding: 10px 12px;

          border-radius: 7px;

          border:
            1px solid #bfe5d1;

          background: #f0faf5;

          color: #285d48;

          font-size: 10px;

          line-height: 1.5;
        }

        .buyer-message {
          margin-top: 10px;

          padding: 10px;

          border-radius: 7px;

          font-size: 11px;
        }

        .buyer-message.error {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #be123c;
        }

        .buyer-message.success {
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          color: #15803d;
        }

        /* =========================================
           BUTTON
        ========================================= */

        .buyer-register-button {
          width: 100%;

          height: 42px;

          margin-top: 13px;

          border: 0;

          border-radius: 7px;

          background:
            linear-gradient(
              90deg,
              #07863e,
              #16a34a
            );

          color: #fff;

          font-size: 12px;

          font-weight: 800;

          transition: .2s;
        }

        .buyer-register-button:hover {
          transform: translateY(-1px);

          box-shadow:
            0 7px 17px
            rgba(22,163,74,.20);
        }

        .buyer-register-button:disabled {
          opacity: .65;

          cursor: not-allowed;

          transform: none;
        }

        .buyer-login-link {
          text-align: center;

          margin-top: 14px;

          padding-top: 13px;

          border-top:
            1px solid #e7ece9;

          font-size: 11px;

          color: #6b7280;
        }

        .buyer-login-link button {
          border: 0;

          background: transparent;

          color: #008b45;

          font-weight: 700;

          cursor: pointer;
        }

        @media(max-width: 850px) {

          .buyer-register-container {
            grid-template-columns: 1fr;
          }

          .buyer-register-left {
            padding: 35px;
          }

          .buyer-register-right {
            max-height: none;
          }
        }

        @media(max-width: 550px) {

          .buyer-register-page {
            padding: 15px;
          }

          .buyer-register-right {
            padding: 28px 22px;
          }

          .buyer-form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .buyer-register-left h1 {
            font-size: 27px;
          }
        }

      `}</style>

      <div className="buyer-register-page">

        <div className="buyer-register-container">

          {/* =========================================
              LEFT
          ========================================= */}

          <div className="buyer-register-left">

            <div className="buyer-logo">
              🏠
            </div>

            <h1>
              Blockchain
              <br />
              Land Registry
            </h1>

            <p>
              Create your Buyer account to securely
              access verified properties and purchase
              land through the blockchain-based
              land registry.
            </p>

            <div className="buyer-feature">
              <span className="buyer-feature-check">
                ✓
              </span>
              Secure Buyer Registration
            </div>

            <div className="buyer-feature">
              <span className="buyer-feature-check">
                ✓
              </span>
              Admin Verification
            </div>

            <div className="buyer-feature">
              <span className="buyer-feature-check">
                ✓
              </span>
              Verified Property Access
            </div>

            <div className="buyer-feature">
              <span className="buyer-feature-check">
                ✓
              </span>
              Secure Purchase Requests
            </div>

            <div className="buyer-feature">
              <span className="buyer-feature-check">
                ✓
              </span>
              Blockchain Ownership Records
            </div>

          </div>


          {/* =========================================
              RIGHT
          ========================================= */}

          <div className="buyer-register-right">

            <h2>
              Create Buyer Account
            </h2>

            <div className="buyer-register-subtitle">
              Register your details to access the Buyer Module
            </div>

            <form
              className="buyer-register-form"
              onSubmit={handleSubmit}
            >

              <div className="buyer-form-row">

                <div className="buyer-form-group">
                  <label>
                    Full Name
                    <span className="buyer-required">
                      *
                    </span>
                  </label>

                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />
                </div>


                <div className="buyer-form-group">
                  <label>
                    Email Address
                    <span className="buyer-required">
                      *
                    </span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                  />
                </div>

              </div>


              <div className="buyer-form-row">

                <div className="buyer-form-group">
                  <label>
                    Mobile Number
                    <span className="buyer-required">
                      *
                    </span>
                  </label>

                  <input
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                  />

                  <div className="buyer-input-hint">
                    Enter exactly 10 digits.
                  </div>
                </div>


                <div className="buyer-form-group">
                  <label>
                    Wallet Address
                    <span style={{
                      color: "#7a8794",
                      fontWeight: 500
                    }}>
                      {" "}Optional
                    </span>
                  </label>

                  <input
                    name="wallet_address"
                    value={formData.wallet_address}
                    onChange={handleChange}
                    placeholder="Connect MetaMask later from Buyer Dashboard"
                  />

                  <div className="buyer-input-hint">
                    MetaMask can be connected after login.
                  </div>
                </div>

              </div>


              <div className="buyer-form-group">

                <label>
                  Residential Address
                  <span className="buyer-required">
                    *
                  </span>
                </label>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your residential address"
                />

              </div>


              <div className="buyer-form-row">

                <div className="buyer-form-group">

                  <label>
                    Password
                    <span className="buyer-required">
                      *
                    </span>
                  </label>

                  <div className="buyer-password-wrap">

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create password"
                    />

                    <button
                      type="button"
                      className="buyer-show-password"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                </div>


                <div className="buyer-form-group">

                  <label>
                    Confirm Password
                    <span className="buyer-required">
                      *
                    </span>
                  </label>

                  <div className="buyer-password-wrap">

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                    />

                    <button
                      type="button"
                      className="buyer-show-password"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                </div>

              </div>


              <div className="buyer-verification-box">
                🔐 <strong>Buyer Verification</strong>
                <br />
                After registration, your buyer account
                will remain <strong>PENDING</strong>.
                The authorized administrator must verify
                your details before you can access the
                Buyer Module.
              </div>


              {error && (
                <div className="buyer-message error">
                  {error}
                </div>
              )}

              {message && (
                <div className="buyer-message success">
                  {message}
                </div>
              )}


              <button
                type="submit"
                className="buyer-register-button"
                disabled={loading}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Buyer Account"}
              </button>

            </form>


            <div className="buyer-login-link">
              Already have a buyer account?

              <button
                onClick={() =>
                  navigate("/buyer/login")
                }
              >
                {" "}Login
              </button>
            </div>

          </div>

        </div>

      </div>
    </>
  );
};

export default BuyerRegister;