import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

const BuyerLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // ============================================================
  // REAL NOTIFICATION COUNT
  // ============================================================

  const [notificationCount, setNotificationCount] = useState(0);

  const navigate = useNavigate();

  // ============================================================
  // BUYER INFORMATION
  // ============================================================

  const buyerName =
    localStorage.getItem("buyerName") ||
    (() => {
      try {
        const buyer = JSON.parse(
          localStorage.getItem("buyerUser") || "null"
        );

        return buyer?.name || "Buyer";
      } catch {
        return "Buyer";
      }
    })();

  const buyerEmail =
    localStorage.getItem("buyerEmail") ||
    (() => {
      try {
        const buyer = JSON.parse(
          localStorage.getItem("buyerUser") || "null"
        );

        return buyer?.email || "Buyer";
      } catch {
        return "Buyer";
      }
    })();

  // ============================================================
  // INITIALS
  // ============================================================

  const getInitials = (name) => {
    if (!name) return "BU";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // ============================================================
  // FETCH REAL NOTIFICATION COUNT
  // ============================================================

  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem("buyerToken");

      if (!token) {
        setNotificationCount(0);
        return;
      }

      /*
       * Primary endpoint:
       * GET /api/buyer/notifications/unread-count
       *
       * Expected response:
       * {
       *   success: true,
       *   unreadCount: 3
       * }
       */

      const response = await fetch(
        `${API_BASE_URL}/buyer/notifications/unread-count`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        const count =
          data.unreadCount ??
          data.unread_count ??
          data.count ??
          0;

        setNotificationCount(Number(count) || 0);
        return;
      }

      /*
       * Fallback:
       * If the backend returns the complete notification list,
       * calculate unread notifications from that list.
       */

      const notificationResponse = await fetch(
        `${API_BASE_URL}/buyer/notifications`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!notificationResponse.ok) {
        return;
      }

      const notificationData =
        await notificationResponse.json();

      const notifications =
        notificationData.notifications || [];

      const unread = notifications.filter(
        (notification) =>
          notification.is_read === false ||
          notification.is_read === 0 ||
          notification.read === false ||
          notification.status === "UNREAD"
      ).length;

      setNotificationCount(unread);
    } catch (error) {
      console.error(
        "Notification count error:",
        error
      );
    }
  };

  // ============================================================
  // REAL-TIME / AUTO REFRESH NOTIFICATIONS
  // ============================================================

  useEffect(() => {
    fetchNotificationCount();

    /*
     * Refresh notification count every 15 seconds.
     * This keeps the badge updated without refreshing the page.
     */

    const interval = setInterval(() => {
      fetchNotificationCount();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("buyerToken");
    localStorage.removeItem("buyerName");
    localStorage.removeItem("buyerEmail");
    localStorage.removeItem("buyerWallet");
    localStorage.removeItem("buyerUser");
    localStorage.removeItem("buyerWalletNetwork");
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");

    navigate("/buyer/login");
  };

  // ============================================================
  // NAV CLASS
  // ============================================================

  const navClass = ({ isActive }) =>
    `buyer-nav-item ${isActive ? "active" : ""}`;

  // ============================================================
  // RENDER
  // ============================================================

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

          background: #f5f8fc;
          color: #13264a;
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

        .buyer-app {
          min-height: 100vh;
          background: #f5f8fc;
        }

        /* =====================================================
           SIDEBAR
        ===================================================== */

        .buyer-sidebar {
          position: fixed;

          left: 0;
          top: 0;
          bottom: 0;

          width: 266px;

          background:
            linear-gradient(
              180deg,
              #004d3c 0%,
              #005c49 48%,
              #003d31 100%
            );

          color: #fff;

          z-index: 30;

          overflow-y: auto;

          transition: .25s;
        }

        .buyer-sidebar.collapsed {
          width: 78px;
        }

        /* =====================================================
           BRAND
        ===================================================== */

        .buyer-brand {
          height: 80px;

          background: #fff;
          color: #0a4c3d;

          display: flex;
          align-items: center;

          gap: 12px;

          padding: 0 19px;

          border-bottom: 1px solid #dce8e4;
        }

        .buyer-brand-logo {
          width: 45px;
          height: 45px;

          border-radius: 10px;

          background: #e9f8f0;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 25px;

          flex: none;
        }

        .buyer-brand-text {
          min-width: 0;
        }

        .buyer-brand-title {
          font-size: 19px;
          font-weight: 800;
          line-height: 1.1;
        }

        .buyer-brand-subtitle {
          margin-top: 4px;
          font-size: 10px;
          color: #64748b;
        }

        /* =====================================================
           BUYER PROFILE
        ===================================================== */

        .buyer-sidebar-profile {
          width: calc(100% - 24px);

          margin: 18px 12px 16px;

          border: 0;

          background: transparent;

          color: #fff;

          padding: 8px;

          display: flex;
          align-items: center;

          gap: 11px;

          text-align: left;

          border-radius: 10px;

          transition: .2s;
        }

        .buyer-sidebar-profile:hover {
          background: rgba(255,255,255,.08);
        }

        .buyer-sidebar-avatar {
          width: 47px;
          height: 47px;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              #27b86a,
              #079557
            );

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 15px;
          font-weight: 800;

          flex: none;
        }

        .buyer-sidebar-info {
          min-width: 0;
          flex: 1;

          display: flex;
          flex-direction: column;

          gap: 3px;
        }

        .buyer-sidebar-info strong {
          font-size: 14px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .buyer-sidebar-info span {
          font-size: 12px;
          color: #c1e8d8;
        }

        .buyer-profile-arrow {
          font-size: 19px;
          color: #c4e9db;
        }

        /* =====================================================
           NAVIGATION
        ===================================================== */

        .buyer-nav {
          padding: 0 12px 25px;
        }

        .buyer-nav-group {
          margin-bottom: 7px;
        }

        .buyer-nav-item {
          width: 100%;

          min-height: 48px;

          border: 0;

          background: transparent;

          color: #e1f4ed;

          display: flex;
          align-items: center;

          gap: 14px;

          padding: 0 16px;

          border-radius: 8px;

          margin-bottom: 3px;

          text-align: left;

          text-decoration: none;

          transition: .2s;
        }

        .buyer-nav-item:hover {
          background: rgba(255,255,255,.08);
        }

        .buyer-nav-item.active {
          background:
            linear-gradient(
              90deg,
              #21ae58,
              #35bf60
            );

          color: #fff;

          box-shadow:
            0 6px 15px rgba(0,0,0,.14);
        }

        .buyer-nav-icon {
          width: 24px;

          text-align: center;

          font-size: 21px;

          flex: none;
        }

        .buyer-nav-text {
          flex: 1;

          font-size: 14px;

          font-weight: 600;
        }

        /* =====================================================
           NOTIFICATION NAV BADGE
        ===================================================== */

        .buyer-nav-badge {
          min-width: 20px;
          height: 20px;

          padding: 0 6px;

          border-radius: 10px;

          background: #ef4444;

          color: #fff;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 10px;
          font-weight: 800;

          margin-left: auto;
        }

        /* =====================================================
           SECURITY CARD
        ===================================================== */

        .buyer-security-card {
          margin: 65px 7px 20px;

          min-height: 285px;

          border:
            1px solid
            rgba(55,213,135,.45);

          border-radius: 9px;

          background:
            linear-gradient(
              180deg,
              rgba(0,91,70,.65),
              rgba(0,54,43,.9)
            );

          padding: 22px 16px;

          display: flex;
          flex-direction: column;

          justify-content: flex-start;
        }

        .buyer-security-icon {
          width: 38px;
          height: 38px;

          border-radius: 8px;

          background: #fff;

          color: #079455;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 20px;

          margin-bottom: 14px;
        }

        .buyer-security-card strong {
          font-size: 14px;
          margin-bottom: 8px;
        }

        .buyer-security-card p {
          margin: 0;

          font-size: 13px;

          line-height: 1.55;

          color: #aee0ce;
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .buyer-main {
          margin-left: 266px;

          width: calc(100% - 266px);

          min-height: 100vh;

          transition: .25s;
        }

        .buyer-main.expanded {
          margin-left: 78px;

          width: calc(100% - 78px);
        }

        /* =====================================================
           TOPBAR
        ===================================================== */

        .buyer-topbar {
          height: 66px;

          background: #fff;

          border-bottom: 1px solid #e4eaf1;

          display: flex;
          align-items: center;

          padding: 0 24px;

          position: sticky;

          top: 0;

          z-index: 20;
        }

        .buyer-menu-button {
          width: 39px;
          height: 39px;

          border: 0;

          border-radius: 8px;

          background: #f4f7fa;

          color: #203b62;

          font-size: 20px;
        }

        .buyer-menu-button:hover {
          background: #edf4ef;

          color: #008a4d;
        }

        .buyer-topbar-spacer {
          flex: 1;
        }

        /* =====================================================
           NOTIFICATION BUTTON
        ===================================================== */

        .buyer-notification-button {
          width: 42px;
          height: 42px;

          border: 0;

          background: transparent;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-right: 10px;

          position: relative;

          font-size: 21px;

          color: #203b62;
        }

        .buyer-notification-button:hover {
          background: #f3f8f5;

          color: #008a4d;
        }

        .buyer-notification-badge {
          position: absolute;

          top: 2px;
          right: 1px;

          min-width: 18px;
          height: 18px;

          padding: 0 5px;

          border-radius: 10px;

          background: #ef4444;

          color: #fff;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 9px;

          font-weight: 800;

          border: 2px solid #fff;
        }

        /* =====================================================
           TOP PROFILE
        ===================================================== */

        .buyer-profile-wrap {
          position: relative;
        }

        .buyer-top-profile {
          border: 0;

          background: transparent;

          display: flex;
          align-items: center;

          gap: 10px;

          padding: 5px 4px;

          border-radius: 8px;
        }

        .buyer-top-profile:hover {
          background: #f7faf8;
        }

        .buyer-top-avatar {
          width: 39px;
          height: 39px;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              #29b76b,
              #079354
            );

          color: #fff;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 13px;

          font-weight: 800;
        }

        .buyer-top-profile-text {
          min-width: 120px;

          display: flex;
          flex-direction: column;

          text-align: left;
        }

        .buyer-top-profile-text strong {
          font-size: 13px;
          color: #102446;
        }

        .buyer-top-profile-text span {
          font-size: 10px;
          color: #6c7890;
          margin-top: 2px;
        }

        .buyer-profile-chevron {
          font-size: 17px;

          color: #203b62;

          transition: .2s;
        }

        .buyer-profile-chevron.up {
          transform: rotate(180deg);
        }

        /* =====================================================
           DROPDOWN
        ===================================================== */

        .buyer-profile-dropdown {
          position: absolute;

          right: 0;

          top: 53px;

          width: 210px;

          background: #fff;

          border: 1px solid #e1e7ed;

          border-radius: 10px;

          box-shadow:
            0 15px 35px
            rgba(15,23,42,.13);

          padding: 7px;

          z-index: 50;
        }

        .buyer-profile-dropdown button {
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

        .buyer-profile-dropdown button:hover {
          background: #f3f8f5;
        }

        .buyer-profile-dropdown .logout-option {
          color: #b42318;
        }

        .buyer-dropdown-divider {
          height: 1px;

          background: #edf0f3;

          margin: 5px 0;
        }

        /* =====================================================
           CONTENT
        ===================================================== */

        .buyer-content {
          padding: 25px 20px 45px;

          max-width: 1280px;

          margin: 0 auto;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1100px) {

          .buyer-sidebar {
            width: 78px;
          }

          .buyer-main {
            margin-left: 78px;

            width: calc(100% - 78px);
          }

          .buyer-brand {
            justify-content: center;

            padding: 0;
          }

          .buyer-brand-text,
          .buyer-sidebar-info,
          .buyer-profile-arrow,
          .buyer-nav-text,
          .buyer-security-card {
            display: none;
          }

          .buyer-sidebar-profile {
            justify-content: center;

            padding: 8px;
          }

          .buyer-nav-item {
            justify-content: center;

            padding: 0;
          }

          .buyer-main.expanded {
            margin-left: 78px;

            width: calc(100% - 78px);
          }

          .buyer-nav-badge {
            position: absolute;
            margin-left: 25px;
            margin-top: -25px;
          }
        }

        @media (max-width: 800px) {

          .buyer-content {
            padding: 18px 15px;
          }

          .buyer-topbar {
            padding: 0 12px;
          }

          .buyer-top-profile-text {
            display: none;
          }
        }

        @media (max-width: 550px) {

          .buyer-topbar {
            height: 62px;
          }

          .buyer-top-avatar {
            width: 36px;
            height: 36px;
          }

          .buyer-content {
            padding: 15px 10px;
          }

          .buyer-notification-button {
            margin-right: 4px;
          }
        }

      `}</style>

      <div className="buyer-app">

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <aside
          className={`buyer-sidebar ${
            collapsed ? "collapsed" : ""
          }`}
        >

          {/* BRAND */}

          <div className="buyer-brand">

            <div className="buyer-brand-logo">
              🏠
            </div>

            {!collapsed && (
              <div className="buyer-brand-text">

                <div className="buyer-brand-title">
                  Land Registry
                </div>

                <div className="buyer-brand-subtitle">
                  Secure Blockchain Registry
                </div>

              </div>
            )}

          </div>

          {/* BUYER PROFILE */}

          <button
            className="buyer-sidebar-profile"
            onClick={() =>
              setProfileOpen(!profileOpen)
            }
          >

            <div className="buyer-sidebar-avatar">
              {getInitials(buyerName)}
            </div>

            {!collapsed && (
              <div className="buyer-sidebar-info">

                <strong>
                  {buyerName}
                </strong>

                <span>
                  Buyer
                </span>

              </div>
            )}

            {!collapsed && (
              <div className="buyer-profile-arrow">
                ⌄
              </div>
            )}

          </button>

          {/* =================================================
              NAVIGATION
          ================================================= */}

          <nav className="buyer-nav">

            {/* DASHBOARD */}

            <div className="buyer-nav-group">

              <NavLink
                to="/buyer/dashboard"
                className={navClass}
              >

                <span className="buyer-nav-icon">
                  ⌂
                </span>

                {!collapsed && (
                  <span className="buyer-nav-text">
                    Buyer Dashboard
                  </span>
                )}

              </NavLink>

            </div>

            {/* =================================================
                PROPERTIES
            ================================================= */}

            <div className="buyer-nav-group">

              {/* ALL SELLER PROPERTIES */}

              <NavLink
                to="/buyer/properties"
                className={navClass}
              >

                <span className="buyer-nav-icon">
                  🏘
                </span>

                {!collapsed && (
                  <span className="buyer-nav-text">
                    Browse Properties
                  </span>
                )}

              </NavLink>

              {/* BUYER REQUESTS */}

              <NavLink
                to="/buyer/requests"
                className={navClass}
              >

                <span className="buyer-nav-icon">
                  ▣
                </span>

                {!collapsed && (
                  <span className="buyer-nav-text">
                    My Requests
                  </span>
                )}

              </NavLink>

              {/* APPROVED / OWNED PROPERTIES */}

              <NavLink
                to="/buyer/my-properties"
                className={navClass}
              >

                <span className="buyer-nav-icon">
                  🏠
                </span>

                {!collapsed && (
                  <span className="buyer-nav-text">
                    My Properties
                  </span>
                )}

              </NavLink>

            </div>

            {/* =================================================
                BLOCKCHAIN
            ================================================= */}

            <div className="buyer-nav-group">

              <NavLink
                to="/buyer/wallet"
                className={navClass}
              >

                <span className="buyer-nav-icon">
                  🦊
                </span>

                {!collapsed && (
                  <span className="buyer-nav-text">
                    Wallet
                  </span>
                )}

              </NavLink>

            </div>

            {/* =================================================
                ACCOUNT
            ================================================= */}

            <div className="buyer-nav-group">

              <NavLink
                to="/buyer/profile"
                className={navClass}
              >

                <span className="buyer-nav-icon">
                  ♙
                </span>

                {!collapsed && (
                  <span className="buyer-nav-text">
                    My Profile
                  </span>
                )}

              </NavLink>

              {/* NOTIFICATIONS */}

              <NavLink
                to="/buyer/notifications"
                className={navClass}
              >

                <span className="buyer-nav-icon">
                  🔔
                </span>

                {!collapsed && (
                  <span className="buyer-nav-text">
                    Notifications
                  </span>
                )}

                {!collapsed && notificationCount > 0 && (
                  <span className="buyer-nav-badge">
                    {notificationCount > 99
                      ? "99+"
                      : notificationCount}
                  </span>
                )}

              </NavLink>

              <NavLink
                to="/buyer/settings"
                className={navClass}
              >

                <span className="buyer-nav-icon">
                  ⚙
                </span>

                {!collapsed && (
                  <span className="buyer-nav-text">
                    Settings
                  </span>
                )}

              </NavLink>

              {/* LOGOUT */}

              <button
                className="buyer-nav-item"
                onClick={handleLogout}
              >

                <span className="buyer-nav-icon">
                  ⇥
                </span>

                {!collapsed && (
                  <span className="buyer-nav-text">
                    Logout
                  </span>
                )}

              </button>

            </div>

            {/* SECURITY */}

            {!collapsed && (
              <div className="buyer-security-card">

                <div className="buyer-security-icon">
                  🛡
                </div>

                <strong>
                  Secure Transactions
                </strong>

                <p>
                  Your data and transactions
                  are protected with
                  blockchain technology.
                </p>

              </div>
            )}

          </nav>

        </aside>

        {/* ===================================================
            MAIN
        =================================================== */}

        <main
          className={`buyer-main ${
            collapsed ? "expanded" : ""
          }`}
        >

          {/* =================================================
              TOPBAR
          ================================================= */}

          <header className="buyer-topbar">

            {/* MENU */}

            <button
              className="buyer-menu-button"
              onClick={() =>
                setCollapsed(!collapsed)
              }
              title="Toggle sidebar"
            >
              ☰
            </button>

            <div className="buyer-topbar-spacer"></div>

            {/* =================================================
                NOTIFICATION
            ================================================= */}

            <button
              className="buyer-notification-button"
              onClick={() =>
                navigate("/buyer/notifications")
              }
              title="Notifications"
            >

              🔔

              {notificationCount > 0 && (
                <span className="buyer-notification-badge">
                  {notificationCount > 99
                    ? "99+"
                    : notificationCount}
                </span>
              )}

            </button>

            {/* =================================================
                PROFILE
            ================================================= */}

            <div className="buyer-profile-wrap">

              <button
                className="buyer-top-profile"
                onClick={() =>
                  setProfileOpen(!profileOpen)
                }
              >

                <div className="buyer-top-avatar">
                  {getInitials(buyerName)}
                </div>

                <div className="buyer-top-profile-text">

                  <strong>
                    {buyerName}
                  </strong>

                  <span>
                    Buyer
                  </span>

                </div>

                <span
                  className={`buyer-profile-chevron ${
                    profileOpen ? "up" : ""
                  }`}
                >
                  ⌄
                </span>

              </button>

              {/* =================================================
                  DROPDOWN
              ================================================= */}

              {profileOpen && (
                <div className="buyer-profile-dropdown">

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/buyer/profile");
                    }}
                  >
                    👤
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/buyer/notifications");
                    }}
                  >
                    🔔
                    Notifications
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/buyer/settings");
                    }}
                  >
                    ⚙
                    Settings
                  </button>

                  <div className="buyer-dropdown-divider"></div>

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

          <div className="buyer-content">

            <Outlet />

          </div>

        </main>

      </div>
    </>
  );
};

export default BuyerLayout;