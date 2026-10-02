import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navigate = useNavigate();

  const adminName =
    localStorage.getItem("adminName") ||
    localStorage.getItem("userName") ||
    "Pratika Marennavar";

  const adminEmail =
    localStorage.getItem("adminEmail") ||
    "Admin";

  const getInitials = (name) => {
    if (!name) return "AD";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("admin");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");

    navigate("/admin/login");
  };

  const navClass = ({ isActive }) =>
    `admin-nav-item ${isActive ? "active" : ""}`;

  return (
    <>
      <style>{`
        /* =====================================================
           ADMIN MODULE
           SAME DESIGN SYSTEM AS SELLER MODULE
        ===================================================== */

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
          background: #f5f7fb;
          color: #172033;
        }

        button,
        input,
        textarea,
        select {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        button:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        /* =====================================================
           APP
        ===================================================== */

        .admin-app {
          min-height: 100vh;
          background: #f5f7fb;
        }

        /* =====================================================
           SIDEBAR
        ===================================================== */

        .admin-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 282px;

          background:
            linear-gradient(
              180deg,
              #004434 0%,
              #005b48 54%,
              #003c30 100%
            );

          color: #fff;
          z-index: 30;
          overflow-y: auto;

          transition: .25s;
        }

        .admin-sidebar.collapsed {
          width: 78px;
        }

        /* =====================================================
           BRAND
        ===================================================== */

        .admin-brand {
          height: 78px;
          background: #fff;
          color: #064e3b;

          display: flex;
          align-items: center;
          gap: 12px;

          padding: 0 24px;
        }

        .admin-brand-logo {
          width: 42px;
          height: 42px;
          border-radius: 10px;

          background: #e7f7ee;
          color: #159447;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 24px;
          font-weight: 800;

          flex: none;
        }

        .admin-brand-title {
          font-size: 19px;
          font-weight: 800;
          line-height: 1.05;
        }

        .admin-brand-subtitle {
          font-size: 9px;
          color: #687386;
          margin-top: 5px;
        }

        /* =====================================================
           MODULE LABEL
        ===================================================== */

        .admin-module-label {
          padding: 20px 25px 10px;

          font-size: 13px;
          font-weight: 800;

          letter-spacing: 1px;

          color: #e7fff5;
        }

        /* =====================================================
           ADMIN PROFILE
        ===================================================== */

        .admin-sidebar-profile {
          width: calc(100% - 30px);

          margin: 0 15px 15px;

          padding: 10px;

          border: 1px solid rgba(255,255,255,.12);

          background: rgba(255,255,255,.07);

          border-radius: 10px;

          display: flex;
          align-items: center;

          gap: 10px;

          color: #fff;

          text-align: left;

          transition: .2s;
        }

        .admin-sidebar-profile:hover {
          background: rgba(255,255,255,.14);
        }

        .admin-sidebar-avatar {
          width: 40px;
          height: 40px;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              #35c978,
              #16a45d
            );

          display: flex;
          align-items: center;
          justify-content: center;

          font-weight: 800;

          flex: none;
        }

        .admin-sidebar-info {
          min-width: 0;
          flex: 1;

          display: flex;
          flex-direction: column;

          gap: 3px;
        }

        .admin-sidebar-info strong {
          font-size: 12px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-sidebar-info span {
          font-size: 9px;
          color: #bcebd7;
        }

        .admin-profile-arrow {
          font-size: 20px;
          color: #bcebd7;
        }

        /* =====================================================
           NAVIGATION
        ===================================================== */

        .admin-nav {
          padding: 0 12px 24px;
        }

        .admin-nav-group {
          margin-bottom: 12px;
        }

        .admin-nav-title {
          padding: 8px 14px;

          color: #82b9a9;

          font-size: 10px;
          font-weight: 800;

          letter-spacing: 1.2px;
        }

        .admin-nav-item {
          width: 100%;
          height: 47px;

          border: 0;
          background: transparent;

          color: #e2f5ef;

          display: flex;
          align-items: center;

          gap: 13px;

          padding: 0 14px;

          border-radius: 7px;

          margin-bottom: 4px;

          text-align: left;

          text-decoration: none;

          transition: .2s;
        }

        .admin-nav-item:hover {
          background: rgba(255,255,255,.08);
        }

        .admin-nav-item.active {
          background:
            linear-gradient(
              90deg,
              #25a84c,
              #3dbd59
            );

          color: #fff;

          box-shadow:
            0 7px 17px rgba(0,0,0,.13);
        }

        .admin-nav-icon {
          width: 23px;

          text-align: center;

          font-size: 18px;

          flex: none;
        }

        .admin-nav-text {
          font-size: 14px;
          font-weight: 600;

          flex: 1;
        }

        .admin-nav-badge {
          min-width: 22px;
          height: 22px;

          border-radius: 50%;

          background: #35b957;
          color: #fff;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 10px;
          font-weight: 800;
        }

        /* =====================================================
           SECURITY CARD
        ===================================================== */

        .admin-security {
          margin: 16px 15px 24px;

          min-height: 180px;

          border-radius: 12px;

          background:
            linear-gradient(
              180deg,
              rgba(21,151,89,.42),
              rgba(0,68,52,.9)
            );

          border:
            1px solid
            rgba(255,255,255,.08);

          display: flex;

          flex-direction: column;

          align-items: center;
          justify-content: center;

          text-align: center;

          padding: 15px;
        }

        .admin-security-icon {
          font-size: 56px;
          margin-bottom: 12px;
        }

        .admin-security strong {
          font-size: 14px;
        }

        .admin-security span {
          font-size: 12px;

          color: #bcebd7;

          margin-top: 5px;
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .admin-main {
          margin-left: 282px;

          width: calc(100% - 282px);

          min-height: 100vh;

          transition: .25s;
        }

        .admin-main.expanded {
          margin-left: 78px;

          width: calc(100% - 78px);
        }

        /* =====================================================
           TOPBAR
        ===================================================== */

        .admin-topbar {
          height: 70px;

          background: #fff;

          border-bottom:
            1px solid #e5eaf0;

          display: flex;
          align-items: center;

          padding: 0 25px;

          position: sticky;

          top: 0;

          z-index: 20;
        }

        .admin-menu-button {
          width: 38px;
          height: 38px;

          border: 0;

          background: #f6f8fa;

          border-radius: 8px;

          color: #536173;

          font-size: 19px;
        }

        .admin-menu-button:hover {
          background: #edf3ef;
          color: #087c42;
        }

        .admin-topbar-spacer {
          flex: 1;
        }

        /* =====================================================
           NOTIFICATION
        ===================================================== */

        .admin-notification {
          width: 42px;
          height: 42px;

          border: 0;

          background: transparent;

          position: relative;

          font-size: 21px;

          color: #182334;
        }

        .admin-notification:hover {
          background: #f7f9fa;
          border-radius: 8px;
        }

        .admin-notification span {
          position: absolute;

          top: 0;
          right: 0;

          min-width: 18px;
          height: 18px;

          border-radius: 50%;

          background: #159447;

          color: #fff;

          font-size: 9px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-top-divider {
          width: 1px;
          height: 34px;

          background: #e5e7eb;

          margin: 0 16px;
        }

        /* =====================================================
           TOP PROFILE
        ===================================================== */

        .admin-profile-wrap {
          position: relative;
        }

        .admin-top-profile {
          border: 0;

          background: transparent;

          display: flex;
          align-items: center;

          gap: 10px;

          padding: 6px 4px;

          border-radius: 8px;
        }

        .admin-top-profile:hover {
          background: #f7f9fa;
        }

        .admin-top-avatar {
          width: 40px;
          height: 40px;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              #35c978,
              #16a45d
            );

          color: #fff;

          display: flex;
          align-items: center;
          justify-content: center;

          font-weight: 800;
        }

        .admin-top-profile-text {
          display: flex;
          flex-direction: column;

          min-width: 120px;

          text-align: left;
        }

        .admin-top-profile-text strong {
          font-size: 14px;
        }

        .admin-top-profile-text span {
          font-size: 11px;

          color: #697386;

          margin-top: 2px;
        }

        .admin-profile-chevron {
          font-size: 18px;

          transition: .2s;
        }

        .admin-profile-chevron.up {
          transform: rotate(180deg);
        }

        /* =====================================================
           DROPDOWN
        ===================================================== */

        .admin-profile-dropdown {
          position: absolute;

          right: 0;
          top: 55px;

          width: 205px;

          background: #fff;

          border:
            1px solid #e1e7ed;

          border-radius: 10px;

          box-shadow:
            0 15px 35px
            rgba(15,23,42,.13);

          padding: 7px;

          z-index: 50;
        }

        .admin-profile-dropdown button {
          width: 100%;

          border: 0;

          background: #fff;

          padding: 10px 11px;

          border-radius: 7px;

          text-align: left;

          color: #344054;

          display: flex;

          gap: 10px;

          align-items: center;

          font-size: 13px;
        }

        .admin-profile-dropdown button:hover {
          background: #f4f8f5;
        }

        .admin-profile-dropdown .logout-option {
          color: #b42318;
        }

        .admin-dropdown-divider {
          height: 1px;

          background: #edf0f3;

          margin: 5px 0;
        }

        /* =====================================================
           CONTENT
        ===================================================== */

        .admin-content {
          padding: 24px 30px 45px;

          max-width: 1600px;

          margin: auto;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media(max-width: 1200px) {

          .admin-main {
            margin-left: 78px;

            width: calc(100% - 78px);
          }

          .admin-sidebar {
            width: 78px;
          }

          .admin-brand {
            padding: 0 18px;
            justify-content: center;
          }

          .admin-brand-title,
          .admin-brand-subtitle,
          .admin-module-label,
          .admin-sidebar-info,
          .admin-profile-arrow,
          .admin-nav-title,
          .admin-nav-text,
          .admin-nav-badge,
          .admin-security {
            display: none;
          }

          .admin-sidebar-profile {
            justify-content: center;
            padding: 10px;
          }

          .admin-nav-item {
            justify-content: center;
            padding: 0;
          }

          .admin-nav-icon {
            margin: 0;
          }

          .admin-main.expanded {
            margin-left: 78px;
            width: calc(100% - 78px);
          }
        }

        @media(max-width: 850px) {

          .admin-sidebar {
            width: 78px;
          }

          .admin-main,
          .admin-main.expanded {
            margin-left: 78px;

            width: calc(100% - 78px);
          }

          .admin-content {
            padding: 18px;
          }

          .admin-topbar {
            padding: 0 12px;
          }

          .admin-top-profile-text {
            display: none;
          }

          .admin-top-divider {
            margin: 0 6px;
          }
        }

        @media(max-width: 560px) {

          .admin-content {
            padding: 15px;
          }

          .admin-topbar {
            height: 64px;
          }

          .admin-top-avatar {
            width: 36px;
            height: 36px;
          }

          .admin-notification {
            width: 38px;
          }
        }

      `}</style>


      <div className="admin-app">

        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <aside
          className={`admin-sidebar ${
            collapsed ? "collapsed" : ""
          }`}
        >

          {/* BRAND */}

          <div className="admin-brand">

            <div className="admin-brand-logo">
              ⛨
            </div>

            {!collapsed && (
              <div>

                <div className="admin-brand-title">
                  Land Registry
                </div>

                <div className="admin-brand-subtitle">
                  Secure Blockchain Registry
                </div>

              </div>
            )}

          </div>


          {/* MODULE */}

          {!collapsed && (
            <div className="admin-module-label">
              ADMIN MODULE
            </div>
          )}


          {/* PROFILE */}

          <button
            className="admin-sidebar-profile"
            onClick={() =>
              setProfileOpen(!profileOpen)
            }
          >

            <div className="admin-sidebar-avatar">
              {getInitials(adminName)}
            </div>

            {!collapsed && (
              <div className="admin-sidebar-info">

                <strong>
                  {adminName}
                </strong>

                <span>
                  Admin
                </span>

              </div>
            )}

            {!collapsed && (
              <div className="admin-profile-arrow">
                ›
              </div>
            )}

          </button>


          {/* =================================================
              NAVIGATION
          ================================================= */}

          <nav className="admin-nav">


            {/* MAIN */}

            <div className="admin-nav-group">

              {!collapsed && (
                <div className="admin-nav-title">
                  MAIN
                </div>
              )}

              <NavLink
                to="/admin/dashboard"
                className={navClass}
              >

                <span className="admin-nav-icon">
                  ⌂
                </span>

                {!collapsed && (
                  <span className="admin-nav-text">
                    Dashboard
                  </span>
                )}

              </NavLink>

            </div>


            {/* USER MANAGEMENT */}

            <div className="admin-nav-group">

              {!collapsed && (
                <div className="admin-nav-title">
                  USER MANAGEMENT
                </div>
              )}

              <NavLink
                to="/admin/users"
                className={navClass}
              >

                <span className="admin-nav-icon">
                  ♙
                </span>

                {!collapsed && (
                  <span className="admin-nav-text">
                    All Users
                  </span>
                )}

              </NavLink>


              <NavLink
                to="/admin/seller-verification"
                className={navClass}
              >

                <span className="admin-nav-icon">
                  ✓
                </span>

                {!collapsed && (
                  <span className="admin-nav-text">
                    Verify Sellers
                  </span>
                )}

              </NavLink>


              <NavLink
                to="/admin/buyer-verification"
                className={navClass}
              >

                <span className="admin-nav-icon">
                  ♙
                </span>

                {!collapsed && (
                  <span className="admin-nav-text">
                    Verify Buyers
                  </span>
                )}

              </NavLink>

            </div>


            {/* PROPERTIES */}

            <div className="admin-nav-group">

              {!collapsed && (
                <div className="admin-nav-title">
                  PROPERTIES
                </div>
              )}

              <NavLink
                to="/admin/land-verification"
                className={navClass}
              >

                <span className="admin-nav-icon">
                  ◇
                </span>

                {!collapsed && (
                  <span className="admin-nav-text">
                    Verify Lands
                  </span>
                )}

              </NavLink>


              <NavLink
                to="/admin/properties"
                className={navClass}
              >

                <span className="admin-nav-icon">
                  ▤
                </span>

                {!collapsed && (
                  <span className="admin-nav-text">
                    All Properties
                  </span>
                )}

              </NavLink>

            </div>


            {/* TRANSACTIONS */}

            <div className="admin-nav-group">

              {!collapsed && (
                <div className="admin-nav-title">
                  TRANSACTIONS
                </div>
              )}

              <NavLink
                to="/admin/buyer-requests"
                className={navClass}
              >

                <span className="admin-nav-icon">
                  ⇄
                </span>

                {!collapsed && (
                  <span className="admin-nav-text">
                    Buyer Requests
                  </span>
                )}

              </NavLink>


              <NavLink
                to="/admin/transactions"
                className={navClass}
              >

                <span className="admin-nav-icon">
                  ▣
                </span>

                {!collapsed && (
                  <span className="admin-nav-text">
                    Transactions
                  </span>
                )}

              </NavLink>

            </div>


            {/* BLOCKCHAIN */}

<div className="admin-nav-group">

  {!collapsed && (
    <div className="admin-nav-title">
      BLOCKCHAIN
    </div>
  )}

  <NavLink
    to="/admin/wallet"
    className={navClass}
  >
    <span className="admin-nav-icon">
      🦊
    </span>

    {!collapsed && (
      <span className="admin-nav-text">
        Wallet
      </span>
    )}
  </NavLink>

  <NavLink
    to="/admin/blockchain"
    className={navClass}
  >
    <span className="admin-nav-icon">
      ⬡
    </span>

    {!collapsed && (
      <span className="admin-nav-text">
        Blockchain Records
      </span>
    )}
  </NavLink>

</div>


            {/* REPORTS */}

            <div className="admin-nav-group">

              {!collapsed && (
                <div className="admin-nav-title">
                  REPORTS
                </div>
              )}

              <NavLink
                to="/admin/analytics"
                className={navClass}
              >

                <span className="admin-nav-icon">
                  ▥
                </span>

                {!collapsed && (
                  <span className="admin-nav-text">
                    Analytics
                  </span>
                )}

              </NavLink>

            </div>


            {/* SYSTEM */}

            <div className="admin-nav-group">

              {!collapsed && (
                <div className="admin-nav-title">
                  SYSTEM
                </div>
              )}

              <NavLink
                to="/admin/notifications"
                className={navClass}
              >

                <span className="admin-nav-icon">
                  🔔
                </span>

                {!collapsed && (
                  <span className="admin-nav-text">
                    Notifications
                  </span>
                )}

                {!collapsed && (
                  <span className="admin-nav-badge">
                    2
                  </span>
                )}

              </NavLink>


              <NavLink
                to="/admin/settings"
                className={navClass}
              >

                <span className="admin-nav-icon">
                  ⚙
                </span>

                {!collapsed && (
                  <span className="admin-nav-text">
                    Settings
                  </span>
                )}

              </NavLink>


              <button
                className="admin-nav-item"
                onClick={handleLogout}
              >

                <span className="admin-nav-icon">
                  ⇥
                </span>

                {!collapsed && (
                  <span className="admin-nav-text">
                    Logout
                  </span>
                )}

              </button>

            </div>


            {/* SECURITY */}

            {!collapsed && (
              <div className="admin-security">

                <div className="admin-security-icon">
                  🔐
                </div>

                <strong>
                  Secure Administration
                </strong>

                <span>
                  Protected land registry
                  management
                </span>

              </div>
            )}

          </nav>

        </aside>


        {/* =====================================================
            MAIN
        ===================================================== */}

        <main
          className={`admin-main ${
            collapsed ? "expanded" : ""
          }`}
        >


          {/* TOP BAR */}

          <header className="admin-topbar">

            <button
              className="admin-menu-button"
              onClick={() =>
                setCollapsed(!collapsed)
              }
              title="Toggle sidebar"
            >
              ☰
            </button>


            <div className="admin-topbar-spacer"></div>


            {/* NOTIFICATION */}

            <button
              className="admin-notification"
              onClick={() =>
                navigate("/admin/notifications")
              }
              title="Notifications"
            >

              🔔

              <span>
                2
              </span>

            </button>


            <div className="admin-top-divider"></div>


            {/* PROFILE */}

            <div className="admin-profile-wrap">

              <button
                className="admin-top-profile"
                onClick={() =>
                  setProfileOpen(!profileOpen)
                }
              >

                <div className="admin-top-avatar">
                  {getInitials(adminName)}
                </div>


                <div className="admin-top-profile-text">

                  <strong>
                    {adminName}
                  </strong>

                  <span>
                    Administrator
                  </span>

                </div>


                <span
                  className={`admin-profile-chevron ${
                    profileOpen ? "up" : ""
                  }`}
                >
                  ⌄
                </span>

              </button>


              {/* DROPDOWN */}

              {profileOpen && (
                <div className="admin-profile-dropdown">

                  <button
                    onClick={() =>
                      navigate("/admin/profile")
                    }
                  >
                    👤
                    My Profile
                  </button>

                  <button
                    onClick={() =>
                      navigate("/admin/settings")
                    }
                  >
                    ⚙
                    Settings
                  </button>

                  <div className="admin-dropdown-divider"></div>

                  <button
                    className="logout-option"
                    onClick={handleLogout}
                  >
                    ⇥
                    Logout
                  </button>

                </div>
              )}

            </div>

          </header>


          {/* =================================================
              PAGE CONTENT
          ================================================= */}

          <div className="admin-content">
            <Outlet />
          </div>

        </main>

      </div>
    </>
  );
};

export default AdminLayout;