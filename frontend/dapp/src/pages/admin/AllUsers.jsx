import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("adminToken") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error("Admin authentication token not found.");
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load users."
        );
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error("All users error:", err);
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        String(user.name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(user.email || "")
          .toLowerCase()
          .includes(searchText) ||
        String(user.mobile || "")
          .toLowerCase()
          .includes(searchText) ||
        String(user.wallet_address || "")
          .toLowerCase()
          .includes(searchText);

      const role = String(user.role || "").toUpperCase();

      const matchesRole =
        roleFilter === "ALL" || role === roleFilter;

      const status = String(
        user.verification_status || "PENDING"
      ).toUpperCase();

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const statistics = useMemo(() => {
    return {
      total: users.length,

      sellers: users.filter(
        (u) =>
          String(u.role || "").toUpperCase() === "SELLER"
      ).length,

      buyers: users.filter(
        (u) =>
          String(u.role || "").toUpperCase() === "BUYER"
      ).length,

      pending: users.filter(
        (u) =>
          String(
            u.verification_status || "PENDING"
          ).toUpperCase() === "PENDING"
      ).length,

      verified: users.filter(
        (u) =>
          String(
            u.verification_status || ""
          ).toUpperCase() === "VERIFIED"
      ).length,

      rejected: users.filter(
        (u) =>
          String(
            u.verification_status || ""
          ).toUpperCase() === "REJECTED"
      ).length,
    };
  }, [users]);

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const shortenWallet = (wallet) => {
    if (!wallet) return "Not connected";

    if (wallet.length <= 18) {
      return wallet;
    }

    return `${wallet.slice(0, 8)}...${wallet.slice(-6)}`;
  };

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const getRoleClass = (role) => {
    const normalized = String(role || "").toUpperCase();

    if (normalized === "SELLER") {
      return "all-users-role seller";
    }

    if (normalized === "BUYER") {
      return "all-users-role buyer";
    }

    return "all-users-role";
  };

  const getStatusClass = (status) => {
    const normalized = String(
      status || "PENDING"
    ).toUpperCase();

    if (normalized === "VERIFIED") {
      return "all-users-status verified";
    }

    if (normalized === "REJECTED") {
      return "all-users-status rejected";
    }

    return "all-users-status pending";
  };

  return (
    <div className="all-users-page">

      <style>{`
        .all-users-page {
          width: 100%;
        }

        /* ==========================================
           HEADER
        ========================================== */

        .all-users-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .all-users-title h1 {
          margin: 0;
          color: #172033;
          font-size: 28px;
          font-weight: 800;
        }

        .all-users-title p {
          margin: 7px 0 0;
          color: #697386;
          font-size: 14px;
        }

        .all-users-refresh {
          border: 1px solid #dbe5df;
          background: #ffffff;
          color: #087c42;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 700;
        }

        .all-users-refresh:hover {
          background: #f1f8f4;
        }

        /* ==========================================
           STATISTICS
        ========================================== */

        .all-users-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .all-users-stat {
          background: #ffffff;
          border: 1px solid #e6ebef;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 4px 14px rgba(15, 23, 42, .04);
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .all-users-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 11px;
          background: #e8f7ef;
          color: #159447;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex: none;
        }

        .all-users-stat:nth-child(2) .all-users-stat-icon {
          background: #eaf4ff;
          color: #2374c6;
        }

        .all-users-stat:nth-child(3) .all-users-stat-icon {
          background: #fff6df;
          color: #bd7b00;
        }

        .all-users-stat:nth-child(4) .all-users-stat-icon {
          background: #f1ebff;
          color: #7652c7;
        }

        .all-users-stat-label {
          font-size: 12px;
          color: #697386;
          margin-bottom: 3px;
        }

        .all-users-stat-value {
          font-size: 23px;
          color: #172033;
          font-weight: 800;
        }

        /* ==========================================
           FILTER CARD
        ========================================== */

        .all-users-filter-card {
          background: #ffffff;
          border: 1px solid #e6ebef;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 18px;
          box-shadow: 0 4px 14px rgba(15, 23, 42, .04);
        }

        .all-users-filters {
          display: grid;
          grid-template-columns: 1fr 190px 190px;
          gap: 12px;
        }

        .all-users-search {
          position: relative;
        }

        .all-users-search span {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #8792a2;
          font-size: 17px;
        }

        .all-users-input,
        .all-users-select {
          width: 100%;
          height: 43px;
          border: 1px solid #dfe5ea;
          border-radius: 8px;
          background: #fff;
          color: #273142;
          padding: 0 13px;
          outline: none;
          font-size: 13px;
        }

        .all-users-search .all-users-input {
          padding-left: 39px;
        }

        .all-users-input:focus,
        .all-users-select:focus {
          border-color: #31a65b;
          box-shadow: 0 0 0 3px rgba(49,166,91,.08);
        }

        /* ==========================================
           TABLE
        ========================================== */

        .all-users-table-card {
          background: #ffffff;
          border: 1px solid #e6ebef;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(15, 23, 42, .04);
        }

        .all-users-table-top {
          min-height: 62px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
          border-bottom: 1px solid #edf0f3;
        }

        .all-users-table-top strong {
          font-size: 15px;
          color: #172033;
        }

        .all-users-table-count {
          color: #697386;
          font-size: 12px;
        }

        .all-users-table-wrapper {
          overflow-x: auto;
        }

        .all-users-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        .all-users-table th {
          text-align: left;
          background: #f8faf9;
          color: #667085;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .5px;
          padding: 13px 16px;
          border-bottom: 1px solid #e8edf0;
          white-space: nowrap;
        }

        .all-users-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #edf0f3;
          color: #344054;
          font-size: 13px;
          vertical-align: middle;
        }

        .all-users-table tbody tr:hover {
          background: #fbfdfc;
        }

        .all-users-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .all-users-user {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 180px;
        }

        .all-users-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            #35c978,
            #16a45d
          );
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          flex: none;
        }

        .all-users-user-info {
          min-width: 0;
        }

        .all-users-user-info strong {
          display: block;
          color: #172033;
          font-size: 13px;
          margin-bottom: 2px;
        }

        .all-users-user-info span {
          display: block;
          color: #8993a4;
          font-size: 11px;
        }

        .all-users-role,
        .all-users-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          padding: 5px 10px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .3px;
        }

        .all-users-role {
          background: #f0f2f5;
          color: #5b6575;
        }

        .all-users-role.seller {
          background: #e8f7ef;
          color: #087c42;
        }

        .all-users-role.buyer {
          background: #eaf4ff;
          color: #236db4;
        }

        .all-users-status {
          position: relative;
          padding-left: 17px;
        }

        .all-users-status::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          position: absolute;
          left: 7px;
        }

        .all-users-status.verified {
          background: #e8f7ef;
          color: #087c42;
        }

        .all-users-status.verified::before {
          background: #159447;
        }

        .all-users-status.pending {
          background: #fff5dd;
          color: #a86e00;
        }

        .all-users-status.pending::before {
          background: #d89500;
        }

        .all-users-status.rejected {
          background: #fff0ef;
          color: #b42318;
        }

        .all-users-status.rejected::before {
          background: #d92d20;
        }

        .all-users-wallet {
          font-family: Consolas, monospace;
          font-size: 11px;
          color: #667085;
        }

        .all-users-view {
          border: 1px solid #d8e5dd;
          background: #f7fbf8;
          color: #087c42;
          border-radius: 7px;
          padding: 7px 11px;
          font-size: 11px;
          font-weight: 800;
        }

        .all-users-view:hover {
          background: #e8f7ef;
        }

        /* ==========================================
           EMPTY / LOADING / ERROR
        ========================================== */

        .all-users-message {
          padding: 55px 20px;
          text-align: center;
          color: #697386;
        }

        .all-users-message-icon {
          font-size: 36px;
          margin-bottom: 10px;
        }

        .all-users-error {
          background: #fff4f2;
          border: 1px solid #f2c9c4;
          color: #b42318;
          border-radius: 9px;
          padding: 12px 14px;
          margin-bottom: 18px;
          font-size: 13px;
        }

        .all-users-retry {
          margin-top: 12px;
          border: 0;
          background: #159447;
          color: #fff;
          border-radius: 7px;
          padding: 9px 15px;
          font-size: 12px;
          font-weight: 700;
        }

        /* ==========================================
           MODAL
        ========================================== */

        .all-users-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, .45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 100;
        }

        .all-users-modal {
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 25px 70px rgba(15,23,42,.22);
        }

        .all-users-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #edf0f3;
        }

        .all-users-modal-header h2 {
          margin: 0;
          font-size: 18px;
          color: #172033;
        }

        .all-users-modal-close {
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 7px;
          background: #f5f7f9;
          color: #667085;
          font-size: 18px;
        }

        .all-users-modal-body {
          padding: 20px;
        }

        .all-users-detail-profile {
          display: flex;
          align-items: center;
          gap: 13px;
          padding-bottom: 18px;
          border-bottom: 1px solid #edf0f3;
          margin-bottom: 18px;
        }

        .all-users-detail-avatar {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            #35c978,
            #16a45d
          );
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 800;
        }

        .all-users-detail-profile h3 {
          margin: 0 0 4px;
          color: #172033;
          font-size: 17px;
        }

        .all-users-detail-profile p {
          margin: 0;
          color: #697386;
          font-size: 12px;
        }

        .all-users-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .all-users-detail-item {
          background: #f8faf9;
          border: 1px solid #edf0f2;
          border-radius: 8px;
          padding: 11px;
        }

        .all-users-detail-item.full {
          grid-column: 1 / -1;
        }

        .all-users-detail-label {
          display: block;
          color: #8993a4;
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: .4px;
          margin-bottom: 5px;
        }

        .all-users-detail-value {
          color: #344054;
          font-size: 12px;
          word-break: break-word;
        }

        /* ==========================================
           RESPONSIVE
        ========================================== */

        @media(max-width: 1050px) {
          .all-users-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .all-users-filters {
            grid-template-columns: 1fr 1fr;
          }

          .all-users-search {
            grid-column: 1 / -1;
          }
        }

        @media(max-width: 650px) {
          .all-users-header {
            flex-direction: column;
          }

          .all-users-stats {
            grid-template-columns: 1fr;
          }

          .all-users-filters {
            grid-template-columns: 1fr;
          }

          .all-users-search {
            grid-column: auto;
          }

          .all-users-details {
            grid-template-columns: 1fr;
          }

          .all-users-detail-item.full {
            grid-column: auto;
          }
        }
      `}</style>

      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div className="all-users-header">

        <div className="all-users-title">
          <h1>All Users</h1>

          <p>
            View and monitor all registered sellers and buyers
            in the land registry system.
          </p>
        </div>

        <button
          className="all-users-refresh"
          onClick={fetchUsers}
          disabled={loading}
        >
          ↻ {loading ? "Loading..." : "Refresh"}
        </button>

      </div>

      {/* ==========================================
          ERROR
      ========================================== */}

      {error && (
        <div className="all-users-error">

          <strong>
            Unable to load users
          </strong>

          <div style={{ marginTop: "4px" }}>
            {error}
          </div>

          <button
            className="all-users-retry"
            onClick={fetchUsers}
          >
            Try Again
          </button>

        </div>
      )}

      {/* ==========================================
          STATISTICS
      ========================================== */}

      <div className="all-users-stats">

        <div className="all-users-stat">

          <div className="all-users-stat-icon">
            ♙
          </div>

          <div>
            <div className="all-users-stat-label">
              Total Users
            </div>

            <div className="all-users-stat-value">
              {statistics.total}
            </div>
          </div>

        </div>

        <div className="all-users-stat">

          <div className="all-users-stat-icon">
            ◉
          </div>

          <div>
            <div className="all-users-stat-label">
              Sellers
            </div>

            <div className="all-users-stat-value">
              {statistics.sellers}
            </div>
          </div>

        </div>

        <div className="all-users-stat">

          <div className="all-users-stat-icon">
            ♙
          </div>

          <div>
            <div className="all-users-stat-label">
              Buyers
            </div>

            <div className="all-users-stat-value">
              {statistics.buyers}
            </div>
          </div>

        </div>

        <div className="all-users-stat">

          <div className="all-users-stat-icon">
            ✓
          </div>

          <div>
            <div className="all-users-stat-label">
              Verified
            </div>

            <div className="all-users-stat-value">
              {statistics.verified}
            </div>
          </div>

        </div>

      </div>

      {/* ==========================================
          FILTERS
      ========================================== */}

      <div className="all-users-filter-card">

        <div className="all-users-filters">

          <div className="all-users-search">

            <span>⌕</span>

            <input
              className="all-users-input"
              type="text"
              placeholder="Search by name, email, mobile or wallet..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <select
            className="all-users-select"
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value)
            }
          >
            <option value="ALL">
              All Roles
            </option>

            <option value="SELLER">
              Sellers
            </option>

            <option value="BUYER">
              Buyers
            </option>
          </select>

          <select
            className="all-users-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="ALL">
              All Status
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="VERIFIED">
              Verified
            </option>

            <option value="REJECTED">
              Rejected
            </option>
          </select>

        </div>

      </div>

      {/* ==========================================
          TABLE
      ========================================== */}

      <div className="all-users-table-card">

        <div className="all-users-table-top">

          <strong>
            Registered Users
          </strong>

          <span className="all-users-table-count">
            Showing {filteredUsers.length} of {users.length}
          </span>

        </div>

        {loading ? (

          <div className="all-users-message">

            <div className="all-users-message-icon">
              ⟳
            </div>

            Loading users...

          </div>

        ) : filteredUsers.length === 0 ? (

          <div className="all-users-message">

            <div className="all-users-message-icon">
              ♙
            </div>

            <strong>
              No users found
            </strong>

            <div style={{ marginTop: "5px" }}>
              Try changing your search or filters.
            </div>

          </div>

        ) : (

          <div className="all-users-table-wrapper">

            <table className="all-users-table">

              <thead>
                <tr>

                  <th>User</th>

                  <th>Role</th>

                  <th>Mobile</th>

                  <th>Wallet</th>

                  <th>Status</th>

                  <th>Registered</th>

                  <th>Action</th>

                </tr>
              </thead>

              <tbody>

                {filteredUsers.map((user) => {

                  const role = String(
                    user.role || ""
                  ).toUpperCase();

                  const status = String(
                    user.verification_status ||
                    "PENDING"
                  ).toUpperCase();

                  return (
                    <tr key={user.id}>

                      <td>

                        <div className="all-users-user">

                          <div className="all-users-avatar">
                            {getInitials(user.name)}
                          </div>

                          <div className="all-users-user-info">

                            <strong>
                              {user.name || "Unnamed User"}
                            </strong>

                            <span>
                              {user.email || "No email"}
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>
                        <span className={getRoleClass(role)}>
                          {role || "USER"}
                        </span>
                      </td>

                      <td>
                        {user.mobile || "—"}
                      </td>

                      <td>
                        <span className="all-users-wallet">
                          {shortenWallet(
                            user.wallet_address
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={getStatusClass(status)}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        {formatDate(user.created_at)}
                      </td>

                      <td>

                        <button
                          className="all-users-view"
                          onClick={() =>
                            setSelectedUser(user)
                          }
                        >
                          View
                        </button>

                      </td>

                    </tr>
                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ==========================================
          USER DETAILS MODAL
      ========================================== */}

      {selectedUser && (

        <div
          className="all-users-overlay"
          onClick={() =>
            setSelectedUser(null)
          }
        >

          <div
            className="all-users-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="all-users-modal-header">

              <h2>
                User Details
              </h2>

              <button
                className="all-users-modal-close"
                onClick={() =>
                  setSelectedUser(null)
                }
              >
                ×
              </button>

            </div>

            <div className="all-users-modal-body">

              <div className="all-users-detail-profile">

                <div className="all-users-detail-avatar">
                  {getInitials(selectedUser.name)}
                </div>

                <div>

                  <h3>
                    {selectedUser.name || "Unnamed User"}
                  </h3>

                  <p>
                    {selectedUser.email || "No email"}
                  </p>

                </div>

              </div>

              <div className="all-users-details">

                <div className="all-users-detail-item">

                  <span className="all-users-detail-label">
                    User ID
                  </span>

                  <div className="all-users-detail-value">
                    {selectedUser.id ?? "—"}
                  </div>

                </div>

                <div className="all-users-detail-item">

                  <span className="all-users-detail-label">
                    Role
                  </span>

                  <div className="all-users-detail-value">
                    {selectedUser.role || "—"}
                  </div>

                </div>

                <div className="all-users-detail-item">

                  <span className="all-users-detail-label">
                    Mobile
                  </span>

                  <div className="all-users-detail-value">
                    {selectedUser.mobile || "—"}
                  </div>

                </div>

                <div className="all-users-detail-item">

                  <span className="all-users-detail-label">
                    Verification
                  </span>

                  <div className="all-users-detail-value">
                    {selectedUser.verification_status ||
                      "PENDING"}
                  </div>

                </div>

                <div className="all-users-detail-item full">

                  <span className="all-users-detail-label">
                    Wallet Address
                  </span>

                  <div className="all-users-detail-value">
                    {selectedUser.wallet_address ||
                      "Wallet not connected"}
                  </div>

                </div>

                <div className="all-users-detail-item">

                  <span className="all-users-detail-label">
                    Registered On
                  </span>

                  <div className="all-users-detail-value">
                    {formatDate(selectedUser.created_at)}
                  </div>

                </div>

                <div className="all-users-detail-item">

                  <span className="all-users-detail-label">
                    Last Updated
                  </span>

                  <div className="all-users-detail-value">
                    {formatDate(selectedUser.updated_at)}
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default AllUsers;