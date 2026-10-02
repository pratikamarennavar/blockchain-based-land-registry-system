import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/auth";

const SellerRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    government_id: "",
    address: "",
    wallet_address: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ================================
  // PASSWORD CHECKS
  // ================================

  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/' ;]/.test(
      formData.password
    ),
  };

  const passwordValid =
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.number &&
    passwordChecks.special;

  // ================================
  // INPUT
  // ================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Mobile: numbers only
    if (name === "mobile") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);

      setFormData((prev) => ({
        ...prev,
        mobile: cleaned,
      }));

      setError("");
      setSuccess("");
      return;
    }

    // Aadhaar: exactly 12 digits maximum
    if (name === "government_id") {
      const cleaned = value.replace(/\D/g, "").slice(0, 12);

      setFormData((prev) => ({
        ...prev,
        government_id: cleaned,
      }));

      setError("");
      setSuccess("");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      setShowRequirements(value.length > 0);
    }

    setError("");
    setSuccess("");
  };

  // ================================
  // SUBMIT
  // ================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Required fields
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.mobile.trim() ||
      !formData.government_id.trim() ||
      !formData.address.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    // Name
    if (formData.name.trim().length < 3) {
      setError("Please enter a valid full name.");
      return;
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    // Mobile
    if (!/^[6-9][0-9]{9}$/.test(formData.mobile)) {
      setError("Mobile number must contain exactly 10 digits.");
      return;
    }

    // Aadhaar
    if (!/^[0-9]{12}$/.test(formData.government_id)) {
      setError("Aadhaar number must contain exactly 12 digits.");
      return;
    }

    // Password
    if (!passwordValid) {
      setError(
        "Password must contain 8 characters, uppercase, lowercase, number and special character."
      );
      setShowRequirements(true);
      return;
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/seller/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          mobile: formData.mobile,
          government_id: formData.government_id,
          address: formData.address.trim(),
          wallet_address: formData.wallet_address.trim() || null,
          password: formData.password,
        }),
      });

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error("Backend response:", text);

        throw new Error(
          `Registration failed. Server returned ${response.status}.`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Seller registration failed."
        );
      }

      setSuccess(
        data.message ||
          "Seller registration successful. Your account is pending verification."
      );

      setFormData({
        name: "",
        email: "",
        mobile: "",
        government_id: "",
        address: "",
        wallet_address: "",
        password: "",
        confirmPassword: "",
      });

      setShowRequirements(false);

      setTimeout(() => {
        navigate("/seller/login");
      }, 2000);
    } catch (err) {
      console.error("Seller registration error:", err);

      setError(
        err.message ||
          "Cannot connect to backend. Make sure the backend is running."
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

        .seller-register-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 30px;
          background:
            linear-gradient(
              135deg,
              #e8f7ef,
              #f8fbf9,
              #e2f5eb
            );
        }

        .register-card {
          width: 100%;
          max-width: 1050px;
          min-height: 700px;
          display: grid;
          grid-template-columns: 42% 58%;
          background: white;
          border-radius: 22px;
          overflow: hidden;
          box-shadow:
            0 20px 60px rgba(0, 80, 55, 0.12);
        }

        /* LEFT */

        .register-left {
          background:
            linear-gradient(
              160deg,
              #005247,
              #006b59,
              #008f5c
            );
          color: white;
          padding: 60px 50px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .register-logo {
          width: 76px;
          height: 76px;
          border-radius: 20px;
          background:
            rgba(255,255,255,0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          margin-bottom: 28px;
        }

        .register-left h1 {
          margin: 0 0 20px;
          font-size: 34px;
          line-height: 1.2;
        }

        .register-left p {
          margin: 0;
          color: #d9f8e9;
          font-size: 15px;
          line-height: 1.8;
        }

        .feature-list {
          margin-top: 35px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          font-size: 14px;
          font-weight: 600;
        }

        .feature-icon {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background: rgba(255,255,255,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* RIGHT */

        .register-right {
          padding: 45px 50px;
          overflow-y: auto;
          max-height: 850px;
        }

        .register-right h2 {
          margin: 0 0 7px;
          color: #12251e;
          font-size: 30px;
        }

        .register-subtitle {
          margin: 0 0 28px;
          color: #74817b;
          font-size: 14px;
        }

        .message {
          padding: 12px 14px;
          border-radius: 8px;
          margin-bottom: 18px;
          font-size: 13px;
        }

        .error-message {
          background: #fff1f1;
          border: 1px solid #ffcaca;
          color: #c62828;
        }

        .success-message {
          background: #effaf3;
          border: 1px solid #b9e8ca;
          color: #187044;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 16px;
        }

        .field {
          margin-bottom: 18px;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field label {
          display: block;
          color: #263a32;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 7px;
        }

        .required {
          color: #dc2626;
          margin-left: 3px;
        }

        .optional {
          color: #7b8782;
          font-size: 10px;
          margin-left: 5px;
          font-weight: 500;
        }

        .field input,
        .field textarea {
          width: 100%;
          border: 1px solid #d3e0d9;
          border-radius: 9px;
          padding: 13px;
          background: #fbfdfc;
          outline: none;
          font-size: 13px;
          color: #18271f;
          font-family: inherit;
        }

        .field input {
          height: 45px;
        }

        .field textarea {
          resize: vertical;
          min-height: 70px;
        }

        .field input:focus,
        .field textarea:focus {
          border-color: #16a34a;
          box-shadow:
            0 0 0 3px rgba(22,163,74,0.09);
          background: white;
        }

        .field small {
          display: block;
          margin-top: 5px;
          font-size: 10px;
          color: #718078;
        }

        .password-box {
          display: flex;
          border: 1px solid #d3e0d9;
          border-radius: 9px;
          overflow: hidden;
          background: #fbfdfc;
        }

        .password-box input {
          border: none;
          border-radius: 0;
          flex: 1;
          background: transparent;
        }

        .password-box input:focus {
          box-shadow: none;
        }

        .show-button {
          border: none;
          border-left: 1px solid #dce6e0;
          background: #f4f8f5;
          color: #087a41;
          padding: 0 14px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
        }

        /* PASSWORD REQUIREMENTS */

        .password-requirements {
          margin-top: -8px;
          margin-bottom: 18px;
          padding: 12px 14px;
          border: 1px solid #dce6e0;
          background: #f7faf8;
          border-radius: 8px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px 15px;
          font-size: 11px;
        }

        .requirement.valid {
          color: #16803d;
        }

        .requirement.invalid {
          color: #77847d;
        }

        .match {
          margin-top: -10px;
          margin-bottom: 15px;
          font-size: 11px;
          font-weight: 600;
        }

        .match.valid {
          color: #16803d;
        }

        .match.invalid {
          color: #dc2626;
        }

        /* VERIFICATION */

        .verification-box {
          margin-top: 4px;
          padding: 13px;
          border-radius: 8px;
          background: #effaf3;
          border: 1px solid #bde7cc;
          color: #32684b;
          font-size: 11px;
          line-height: 1.6;
        }

        .verification-title {
          font-weight: 700;
          margin-bottom: 4px;
          color: #176c3d;
        }

        /* BUTTON */

        .register-button {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 9px;
          background:
            linear-gradient(
              90deg,
              #087a41,
              #16a34a
            );
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 18px;
        }

        .register-button:hover {
          background:
            linear-gradient(
              90deg,
              #056534,
              #118a3f
            );
        }

        .register-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-link {
          text-align: center;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #e5ebe7;
          color: #738078;
          font-size: 13px;
        }

        .login-link a {
          color: #087a41;
          font-weight: 700;
          text-decoration: none;
          margin-left: 5px;
        }

        @media (max-width: 800px) {

          .register-card {
            grid-template-columns: 1fr;
          }

          .register-left {
            padding: 35px;
          }

          .register-right {
            padding: 35px 25px;
          }
        }

        @media (max-width: 550px) {

          .form-grid {
            grid-template-columns: 1fr;
          }

          .field.full {
            grid-column: auto;
          }

          .password-requirements {
            grid-template-columns: 1fr;
          }

          .seller-register-page {
            padding: 10px;
          }
        }

      `}</style>

      <div className="seller-register-page">

        <div className="register-card">

          {/* LEFT */}

          <div className="register-left">

            <div className="register-logo">
              🏠
            </div>

            <h1>
              Blockchain
              <br />
              Land Registry
            </h1>

            <p>
              Create your Seller account to securely
              register and manage land properties
              through the blockchain-based land registry.
            </p>

            <div className="feature-list">

              <div className="feature">
                <span className="feature-icon">✓</span>
                Secure Seller Registration
              </div>

              <div className="feature">
                <span className="feature-icon">✓</span>
                Government ID Verification
              </div>

              <div className="feature">
                <span className="feature-icon">✓</span>
                Secure Land Records
              </div>

              <div className="feature">
                <span className="feature-icon">✓</span>
                Blockchain Transactions
              </div>

              <div className="feature">
                <span className="feature-icon">✓</span>
                MetaMask Wallet Support
              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div className="register-right">

            <h2>
              Create Seller Account
            </h2>

            <p className="register-subtitle">
              Register your details to access the Seller Module
            </p>

            {error && (
              <div className="message error-message">
                ⚠ {error}
              </div>
            )}

            {success && (
              <div className="message success-message">
                ✓ {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="form-grid">

                {/* NAME */}

                <div className="field">

                  <label>
                    Full Name
                    <span className="required">*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    disabled={loading}
                  />

                </div>

                {/* EMAIL */}

                <div className="field">

                  <label>
                    Email Address
                    <span className="required">*</span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    disabled={loading}
                  />

                </div>

                {/* MOBILE */}

                <div className="field">

                  <label>
                    Mobile Number
                    <span className="required">*</span>
                  </label>

                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    disabled={loading}
                  />

                  <small>
                    Enter exactly 10 digits.
                  </small>

                </div>

                {/* AADHAAR */}

                <div className="field">

                  <label>
                    Aadhaar Number
                    <span className="required">*</span>
                  </label>

                  <input
                    type="text"
                    name="government_id"
                    value={formData.government_id}
                    onChange={handleChange}
                    placeholder="Enter 12-digit Aadhaar"
                    maxLength={12}
                    inputMode="numeric"
                    disabled={loading}
                  />

                  <small>
                    Enter exactly 12 digits.
                  </small>

                </div>

                {/* ADDRESS */}

                <div className="field full">

                  <label>
                    Residential Address
                    <span className="required">*</span>
                  </label>

                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your residential address"
                    disabled={loading}
                  />

                </div>

                {/* WALLET */}

                <div className="field full">

                  <label>
                    Wallet Address
                    <span className="optional">
                      Optional
                    </span>
                  </label>

                  <input
                    type="text"
                    name="wallet_address"
                    value={formData.wallet_address}
                    onChange={handleChange}
                    placeholder="Connect MetaMask later from Seller Dashboard"
                    disabled={loading}
                  />

                  <small>
                    MetaMask can be connected after login.
                  </small>

                </div>

                {/* PASSWORD */}

                <div className="field">

                  <label>
                    Password
                    <span className="required">*</span>
                  </label>

                  <div className="password-box">

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
                      disabled={loading}
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className="show-button"
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

                {/* CONFIRM */}

                <div className="field">

                  <label>
                    Confirm Password
                    <span className="required">*</span>
                  </label>

                  <div className="password-box">

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      name="confirmPassword"
                      value={
                        formData.confirmPassword
                      }
                      onChange={handleChange}
                      placeholder="Confirm password"
                      disabled={loading}
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className="show-button"
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

              {/* SHOW ONLY AFTER PASSWORD ENTRY */}

              {showRequirements && (
                <div className="password-requirements">

                  <div
                    className={
                      `requirement ${
                        passwordChecks.length
                          ? "valid"
                          : "invalid"
                      }`
                    }
                  >
                    {passwordChecks.length ? "✓" : "○"}
                    {" "}8+ characters
                  </div>

                  <div
                    className={
                      `requirement ${
                        passwordChecks.uppercase
                          ? "valid"
                          : "invalid"
                      }`
                    }
                  >
                    {passwordChecks.uppercase ? "✓" : "○"}
                    {" "}Uppercase letter
                  </div>

                  <div
                    className={
                      `requirement ${
                        passwordChecks.lowercase
                          ? "valid"
                          : "invalid"
                      }`
                    }
                  >
                    {passwordChecks.lowercase ? "✓" : "○"}
                    {" "}Lowercase letter
                  </div>

                  <div
                    className={
                      `requirement ${
                        passwordChecks.number
                          ? "valid"
                          : "invalid"
                      }`
                    }
                  >
                    {passwordChecks.number ? "✓" : "○"}
                    {" "}Number
                  </div>

                  <div
                    className={
                      `requirement ${
                        passwordChecks.special
                          ? "valid"
                          : "invalid"
                      }`
                    }
                  >
                    {passwordChecks.special ? "✓" : "○"}
                    {" "}Special character
                  </div>

                  <div
                    className={
                      `requirement ${
                        formData.confirmPassword &&
                        formData.password ===
                          formData.confirmPassword
                          ? "valid"
                          : "invalid"
                      }`
                    }
                  >
                    {formData.confirmPassword &&
                    formData.password ===
                      formData.confirmPassword
                      ? "✓"
                      : "○"}
                    {" "}Passwords match
                  </div>

                </div>
              )}

              {/* VERIFICATION */}

              <div className="verification-box">

                <div className="verification-title">
                  🔐 Seller Verification
                </div>

                After registration, your seller account
                will remain <b>Pending</b>. The authorized
                administrator must verify your submitted
                details before you can log in.

              </div>

              {/* REGISTER */}

              <button
                type="submit"
                className="register-button"
                disabled={loading}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Seller Account"}
              </button>

            </form>

            {/* LOGIN */}

            <div className="login-link">

              Already have a seller account?

              <Link to="/seller/login">
                Login
              </Link>

            </div>

          </div>

        </div>

      </div>
    </>
  );
};

export default SellerRegister;