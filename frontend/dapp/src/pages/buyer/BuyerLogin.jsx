import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BuyerLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError(
        "Email and password are required."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/buyer/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
          "Buyer login failed."
        );

        return;
      }

      /*
       * IMPORTANT:
       * Backend returns data.buyer,
       * not data.user.
       */

      if (data.token) {
        localStorage.setItem(
          "buyerToken",
          data.token
        );

        localStorage.setItem(
          "token",
          data.token
        );
      }

      if (data.buyer) {

        localStorage.setItem(
          "buyerUser",
          JSON.stringify(data.buyer)
        );

        if (
          data.buyer.wallet_address
        ) {
          localStorage.setItem(
            "buyerWallet",
            data.buyer.wallet_address
          );
        }

        localStorage.setItem(
          "userRole",
          "BUYER"
        );

        localStorage.setItem(
          "buyerName",
          data.buyer.name || ""
        );

        localStorage.setItem(
          "buyerEmail",
          data.buyer.email || ""
        );
      }

      navigate("/buyer/dashboard");

    } catch (err) {

      console.error(
        "Buyer login error:",
        err
      );

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

        .buyer-login-page {
          min-height: 100vh;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 32px;
        }

        .buyer-login-container {
          width: 100%;

          max-width: 900px;

          min-height: 580px;

          background: #fff;

          border-radius: 20px;

          overflow: hidden;

          box-shadow:
            0 20px 55px
            rgba(0,70,50,.12);

          display: grid;

          grid-template-columns:
            46% 54%;
        }

        /* =========================================
           LEFT
        ========================================= */

        .buyer-login-left {
          background:
            linear-gradient(
              180deg,
              #005447 0%,
              #00765d 48%,
              #008d61 100%
            );

          color: #fff;

          padding: 50px;

          display: flex;

          flex-direction: column;

          justify-content: center;
        }

        .buyer-login-logo {
          width: 75px;

          height: 75px;

          border-radius: 18px;

          background:
            rgba(255,255,255,.16);

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 39px;

          margin-bottom: 25px;
        }

        .buyer-login-left h1 {
          margin: 0;

          font-size: 32px;

          line-height: 1.12;

          font-weight: 800;
        }

        .buyer-login-left p {
          margin-top: 20px;

          font-size: 13px;

          line-height: 1.7;

          color: #e4fff5;
        }

        .buyer-login-feature {
          margin-top: 13px;

          font-size: 11px;

          font-weight: 600;

          display: flex;

          align-items: center;

          gap: 9px;
        }

        .buyer-login-check {
          width: 19px;

          height: 19px;

          border-radius: 50%;

          background:
            rgba(255,255,255,.18);

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 10px;
        }

        /* =========================================
           RIGHT
        ========================================= */

        .buyer-login-right {
          padding: 65px 55px;

          display: flex;

          flex-direction: column;

          justify-content: center;
        }

        .buyer-login-right h2 {
          margin: 0;

          font-size: 30px;

          color: #071f18;
        }

        .buyer-login-subtitle {
          margin-top: 8px;

          color: #6b7280;

          font-size: 13px;
        }

        .buyer-login-form {
          margin-top: 34px;
        }

        .buyer-login-group {
          margin-bottom: 20px;
        }

        .buyer-login-group label {
          display: block;

          margin-bottom: 8px;

          font-size: 12px;

          font-weight: 700;

          color: #172033;
        }

        .buyer-login-group input {
          width: 100%;

          height: 46px;

          padding: 0 13px;

          border:
            1px solid #cfded8;

          border-radius: 8px;

          background: #fbfdfc;

          outline: none;

          font-size: 13px;

          color: #172033;
        }

        .buyer-login-group input:focus {
          border-color: #159447;

          box-shadow:
            0 0 0 3px
            rgba(21,148,71,.08);
        }

        /* =========================================
           PASSWORD
        ========================================= */

        .buyer-login-password {
          display: flex;

          border:
            1px solid #cfded8;

          border-radius: 8px;

          overflow: hidden;

          background: #fbfdfc;
        }

        .buyer-login-password input {
          border: 0;

          border-radius: 0;

          flex: 1;
        }

        .buyer-login-password input:focus {
          box-shadow: none;
        }

        .buyer-show-btn {
          width: 62px;

          border: 0;

          border-left:
            1px solid #dbe5e1;

          background: #f7faf8;

          color: #087c42;

          font-size: 11px;

          font-weight: 700;
        }

        /* =========================================
           BUTTON
        ========================================= */

        .buyer-login-button {
          width: 100%;

          height: 45px;

          border: 0;

          border-radius: 8px;

          background:
            linear-gradient(
              90deg,
              #07863e,
              #16a34a
            );

          color: #fff;

          font-size: 13px;

          font-weight: 800;

          transition: .2s;
        }

        .buyer-login-button:hover {
          transform: translateY(-1px);

          box-shadow:
            0 7px 17px
            rgba(22,163,74,.20);
        }

        .buyer-login-button:disabled {
          opacity: .65;

          cursor: not-allowed;

          transform: none;
        }

        /* =========================================
           ERROR
        ========================================= */

        .buyer-login-error {
          margin-bottom: 15px;

          padding: 11px;

          border-radius: 7px;

          background: #fff1f2;

          border:
            1px solid #fecdd3;

          color: #be123c;

          font-size: 11px;
        }

        /* =========================================
           INFO
        ========================================= */

        .buyer-login-info {
          margin-top: 25px;

          padding: 13px;

          border-radius: 8px;

          background: #f0faf5;

          border:
            1px solid #c8ead7;

          color: #315c4b;

          font-size: 10px;

          line-height: 1.5;
        }

        .buyer-create-account {
          margin-top: 28px;

          text-align: center;

          font-size: 12px;

          color: #6b7280;
        }

        .buyer-create-account button {
          border: 0;

          background: transparent;

          color: #008b45;

          font-weight: 700;

          cursor: pointer;

          font-size: 12px;
        }

        @media(max-width: 750px) {

          .buyer-login-container {
            grid-template-columns: 1fr;
          }

          .buyer-login-left {
            padding: 35px;
          }

          .buyer-login-right {
            padding: 40px 30px;
          }
        }

        @media(max-width: 500px) {

          .buyer-login-page {
            padding: 15px;
          }

          .buyer-login-right {
            padding: 35px 22px;
          }

          .buyer-login-left h1 {
            font-size: 27px;
          }
        }

      `}</style>

      <div className="buyer-login-page">

        <div className="buyer-login-container">

          {/* =====================================
              LEFT
          ===================================== */}

          <div className="buyer-login-left">

            <div className="buyer-login-logo">
              🏠
            </div>

            <h1>
              Blockchain
              <br />
              Land Registry
            </h1>

            <p>
              Securely access your Buyer Module
              to browse verified properties, submit
              purchase requests and track blockchain
              land transactions.
            </p>

            <div className="buyer-login-feature">
              <span className="buyer-login-check">
                ✓
              </span>
              Verified Property Access
            </div>

            <div className="buyer-login-feature">
              <span className="buyer-login-check">
                ✓
              </span>
              Secure Purchase Requests
            </div>

            <div className="buyer-login-feature">
              <span className="buyer-login-check">
                ✓
              </span>
              Blockchain Transactions
            </div>

            <div className="buyer-login-feature">
              <span className="buyer-login-check">
                ✓
              </span>
              MetaMask Wallet Support
            </div>

          </div>


          {/* =====================================
              RIGHT
          ===================================== */}

          <div className="buyer-login-right">

            <h2>
              Buyer Login
            </h2>

            <div className="buyer-login-subtitle">
              Sign in to your buyer account
            </div>


            <form
              className="buyer-login-form"
              onSubmit={handleSubmit}
            >

              <div className="buyer-login-group">

                <label>
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                />

              </div>


              <div className="buyer-login-group">

                <label>
                  Password
                </label>

                <div className="buyer-login-password">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    className="buyer-show-btn"
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


              {error && (
                <div className="buyer-login-error">
                  {error}
                </div>
              )}


              <button
                type="submit"
                className="buyer-login-button"
                disabled={loading}
              >
                {loading
                  ? "Signing In..."
                  : "Sign In"}
              </button>


              <div className="buyer-login-info">
                🔐 Your buyer account must be verified
                by the administrator before you can
                access the Buyer Module.
              </div>

            </form>


            <div className="buyer-create-account">

              Don't have a buyer account?

              <button
                onClick={() =>
                  navigate("/buyer/register")
                }
              >
                {" "}Create Account
              </button>

            </div>

          </div>

        </div>

      </div>
    </>
  );
};

export default BuyerLogin;