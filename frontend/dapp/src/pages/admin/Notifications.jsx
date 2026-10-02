import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");

  const getAdminHeaders = () => {
    const token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  const fetchNotifications = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const headers = getAdminHeaders();

      const [
        dashboardResponse,
        usersResponse,
        landsResponse,
        requestsResponse,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/dashboard`, {
          headers,
        }),
        fetch(`${API_BASE_URL}/admin/users`, {
          headers,
        }),
        fetch(`${API_BASE_URL}/admin/lands`, {
          headers,
        }),
        fetch(`${API_BASE_URL}/admin/buyer-requests`, {
          headers,
        }),
      ]);

      const [
        dashboardData,
        usersData,
        landsData,
        requestsData,
      ] = await Promise.all([
        dashboardResponse.json(),
        usersResponse.json(),
        landsResponse.json(),
        requestsResponse.json(),
      ]);

      const generatedNotifications = [];

      // =====================================================
      // DASHBOARD
      // =====================================================

      const dashboard =
        dashboardData.dashboard ||
        dashboardData.data ||
        dashboardData;

      const statistics =
        dashboard?.statistics ||
        dashboard?.data?.statistics ||
        dashboard ||
        {};

      const pendingLands =
        Number(
          statistics.pending_lands ??
            statistics.pendingLands ??
            0
        );

      if (pendingLands > 0) {
        generatedNotifications.push({
          id: "pending-lands",
          type: "LAND",
          title: "Land verification pending",
          message: `${pendingLands} land ${
            pendingLands === 1 ? "record requires" : "records require"
          } admin verification.`,
          time: "Current",
          priority: "HIGH",
          icon: "▣",
          color: "#c2410c",
          background: "#fff7ed",
        });
      }

      // =====================================================
      // USERS
      // =====================================================

      const users =
        usersData.success &&
        Array.isArray(usersData.users)
          ? usersData.users
          : [];

      let pendingUsers = 0;

      users.forEach((user) => {
        const status = String(
          user.verification_status ||
            user.verificationStatus ||
            user.status ||
            ""
        ).toUpperCase();

        if (
          status !== "VERIFIED" &&
          status !== "APPROVED" &&
          status !== "REJECTED"
        ) {
          pendingUsers++;
        }
      });

      if (pendingUsers > 0) {
        generatedNotifications.push({
          id: "pending-users",
          type: "USER",
          title: "User verification pending",
          message: `${pendingUsers} user ${
            pendingUsers === 1 ? "record needs" : "records need"
          } verification.`,
          time: "Current",
          priority: "MEDIUM",
          icon: "👤",
          color: "#2563eb",
          background: "#eff6ff",
        });
      }

      // =====================================================
      // LANDS
      // =====================================================

      const lands =
        landsData.success &&
        Array.isArray(landsData.lands)
          ? landsData.lands
          : [];

      let rejectedLands = 0;
      let blockchainRecords = 0;

      lands.forEach((land) => {
        const status = String(
          land.verification_status ||
            land.verificationStatus ||
            ""
        ).toUpperCase();

        if (status === "REJECTED") {
          rejectedLands++;
        }

        if (
          land.blockchain_land_id ||
          land.blockchain_tx_hash ||
          land.blockchain_block_number
        ) {
          blockchainRecords++;
        }
      });

      if (rejectedLands > 0) {
        generatedNotifications.push({
          id: "rejected-lands",
          type: "LAND",
          title: "Land verification rejected",
          message: `${rejectedLands} land ${
            rejectedLands === 1 ? "record has" : "records have"
          } been rejected.`,
          time: "Current",
          priority: "MEDIUM",
          icon: "!",
          color: "#dc2626",
          background: "#fef2f2",
        });
      }

      if (blockchainRecords > 0) {
        generatedNotifications.push({
          id: "blockchain-records",
          type: "BLOCKCHAIN",
          title: "Blockchain records available",
          message: `${blockchainRecords} land ${
            blockchainRecords === 1 ? "record contains" : "records contain"
          } blockchain information.`,
          time: "Current",
          priority: "LOW",
          icon: "⛓",
          color: "#047857",
          background: "#ecfdf5",
        });
      }

      // =====================================================
      // BUYER REQUESTS
      // =====================================================

      const requests =
        requestsData.success &&
        Array.isArray(requestsData.requests)
          ? requestsData.requests
          : [];

      let pendingRequests = 0;
      let approvedRequests = 0;
      let rejectedRequests = 0;

      requests.forEach((request) => {
        const status = String(
          request.request_status ||
            request.status ||
            ""
        ).toUpperCase();

        if (status === "PENDING") {
          pendingRequests++;
        }

        if (status === "APPROVED") {
          approvedRequests++;
        }

        if (status === "REJECTED") {
          rejectedRequests++;
        }
      });

      if (pendingRequests > 0) {
        generatedNotifications.push({
          id: "buyer-requests",
          type: "REQUEST",
          title: "New buyer requests",
          message: `${pendingRequests} buyer ${
            pendingRequests === 1 ? "request is" : "requests are"
          } waiting for review.`,
          time: "Current",
          priority: "HIGH",
          icon: "↔",
          color: "#c2410c",
          background: "#fff7ed",
        });
      }

      if (approvedRequests > 0) {
        generatedNotifications.push({
          id: "approved-requests",
          type: "REQUEST",
          title: "Buyer requests approved",
          message: `${approvedRequests} buyer ${
            approvedRequests === 1 ? "request has" : "requests have"
          } been approved.`,
          time: "Current",
          priority: "LOW",
          icon: "✓",
          color: "#15803d",
          background: "#f0fdf4",
        });
      }

      if (rejectedRequests > 0) {
        generatedNotifications.push({
          id: "rejected-requests",
          type: "REQUEST",
          title: "Buyer requests rejected",
          message: `${rejectedRequests} buyer ${
            rejectedRequests === 1 ? "request has" : "requests have"
          } been rejected.`,
          time: "Current",
          priority: "MEDIUM",
          icon: "!",
          color: "#dc2626",
          background: "#fef2f2",
        });
      }

      // =====================================================
      // NO NOTIFICATIONS
      // =====================================================

      if (generatedNotifications.length === 0) {
        generatedNotifications.push({
          id: "system-normal",
          type: "SYSTEM",
          title: "System is up to date",
          message:
            "There are currently no pending verification or buyer request notifications.",
          time: "Current",
          priority: "LOW",
          icon: "✓",
          color: "#15803d",
          background: "#f0fdf4",
        });
      }

      setNotifications(generatedNotifications);
    } catch (err) {
      console.error(
        "Notification loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === "ALL") {
      return notifications;
    }

    return notifications.filter(
      (notification) =>
        notification.type === filter
    );
  }, [notifications, filter]);

  const counts = useMemo(() => {
    return {
      all: notifications.length,
      land: notifications.filter(
        (item) => item.type === "LAND"
      ).length,
      user: notifications.filter(
        (item) => item.type === "USER"
      ).length,
      request: notifications.filter(
        (item) => item.type === "REQUEST"
      ).length,
      blockchain: notifications.filter(
        (item) => item.type === "BLOCKCHAIN"
      ).length,
    };
  }, [notifications]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <div style={styles.loadingText}>
            Loading notifications...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Notifications
          </h1>

          <p style={styles.subtitle}>
            System alerts, verification updates and
            buyer request activity
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            fetchNotifications(false)
          }
          disabled={refreshing}
          style={{
            ...styles.refreshButton,
            opacity: refreshing ? 0.65 : 1,
          }}
        >
          ↻{" "}
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div style={styles.errorBox}>
          <strong>Warning:</strong> {error}
        </div>
      )}

      {/* SUMMARY */}

      <div style={styles.summaryGrid}>
        <SummaryCard
          title="All"
          value={counts.all}
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
          color="#15803d"
          background="#f0fdf4"
        />

        <SummaryCard
          title="Land"
          value={counts.land}
          active={filter === "LAND"}
          onClick={() => setFilter("LAND")}
          color="#c2410c"
          background="#fff7ed"
        />

        <SummaryCard
          title="Users"
          value={counts.user}
          active={filter === "USER"}
          onClick={() => setFilter("USER")}
          color="#2563eb"
          background="#eff6ff"
        />

        <SummaryCard
          title="Requests"
          value={counts.request}
          active={filter === "REQUEST"}
          onClick={() => setFilter("REQUEST")}
          color="#7c3aed"
          background="#f5f3ff"
        />

        <SummaryCard
          title="Blockchain"
          value={counts.blockchain}
          active={filter === "BLOCKCHAIN"}
          onClick={() =>
            setFilter("BLOCKCHAIN")
          }
          color="#047857"
          background="#ecfdf5"
        />
      </div>

      {/* NOTIFICATION LIST */}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Recent Notifications
            </h2>

            <p style={styles.cardSubtitle}>
              Generated from current registry data
            </p>
          </div>

          <div style={styles.liveBadge}>
            <span style={styles.liveDot}></span>
            LIVE DATA
          </div>
        </div>

        <div style={styles.notificationList}>
          {filteredNotifications.length === 0 ? (
            <div style={styles.emptyState}>
              No notifications found for this filter.
            </div>
          ) : (
            filteredNotifications.map(
              (notification) => (
                <div
                  key={notification.id}
                  style={styles.notification}
                >
                  <div
                    style={{
                      ...styles.notificationIcon,
                      background:
                        notification.background,
                      color:
                        notification.color,
                    }}
                  >
                    {notification.icon}
                  </div>

                  <div style={styles.notificationContent}>
                    <div style={styles.notificationTop}>
                      <h3
                        style={
                          styles.notificationTitle
                        }
                      >
                        {notification.title}
                      </h3>

                      <span
                        style={{
                          ...styles.priorityBadge,
                          color:
                            notification.color,
                          background:
                            notification.background,
                        }}
                      >
                        {notification.priority}
                      </span>
                    </div>

                    <p
                      style={
                        styles.notificationMessage
                      }
                    >
                      {notification.message}
                    </p>

                    <div
                      style={
                        styles.notificationTime
                      }
                    >
                      {notification.time}
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>

      {/* INFORMATION */}

      <div style={styles.infoBox}>
        <div style={styles.infoIcon}>i</div>

        <div>
          <h3 style={styles.infoTitle}>
            About Admin Notifications
          </h3>

          <p style={styles.infoText}>
            Notifications are generated from the
            existing users, land records, buyer
            requests and blockchain information.
            No separate notification database is
            required for this module.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SUMMARY CARD
// ============================================================

const SummaryCard = ({
  title,
  value,
  active,
  onClick,
  color,
  background,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.summaryCard,
        background,
        border: active
          ? `2px solid ${color}`
          : "1px solid #e2e8f0",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          ...styles.summaryValue,
          color,
        }}
      >
        {value}
      </div>

      <div style={styles.summaryTitle}>
        {title}
      </div>
    </button>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = {
  page: {
    minHeight: "100%",
    padding: "28px",
    background: "#f8fafc",
    color: "#1f2937",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#14532d",
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },

  refreshButton: {
    border: "none",
    borderRadius: "8px",
    padding: "11px 17px",
    background: "#15803d",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },

  errorBox: {
    padding: "14px 17px",
    marginBottom: "20px",
    borderRadius: "9px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: "14px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(145px, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },

  summaryCard: {
    borderRadius: "11px",
    padding: "17px",
    textAlign: "left",
    transition: "all 0.2s ease",
  },

  summaryValue: {
    fontSize: "25px",
    fontWeight: 700,
    marginBottom: "5px",
  },

  summaryTitle: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: 600,
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow:
      "0 2px 8px rgba(15,23,42,0.04)",
    overflow: "hidden",
    marginBottom: "20px",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "19px 20px",
    borderBottom:
      "1px solid #f1f5f9",
  },

  cardTitle: {
    margin: 0,
    fontSize: "16px",
    color: "#1e293b",
    fontWeight: 700,
  },

  cardSubtitle: {
    margin: "5px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
  },

  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 9px",
    borderRadius: "999px",
    background: "#f0fdf4",
    color: "#15803d",
    fontSize: "9px",
    fontWeight: 700,
  },

  liveDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#22c55e",
  },

  notificationList: {
    padding: "4px 20px",
  },

  notification: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    padding: "18px 0",
    borderBottom:
      "1px solid #f1f5f9",
  },

  notificationIcon: {
    width: "43px",
    height: "43px",
    minWidth: "43px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    fontWeight: 700,
  },

  notificationContent: {
    flex: 1,
    minWidth: 0,
  },

  notificationTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },

  notificationTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700,
    color: "#1e293b",
  },

  priorityBadge: {
    padding: "4px 7px",
    borderRadius: "5px",
    fontSize: "8px",
    fontWeight: 700,
  },

  notificationMessage: {
    margin: "6px 0",
    fontSize: "12px",
    lineHeight: 1.5,
    color: "#64748b",
  },

  notificationTime: {
    fontSize: "10px",
    color: "#94a3b8",
  },

  emptyState: {
    padding: "45px 20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
  },

  infoBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
    padding: "18px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "11px",
  },

  infoIcon: {
    width: "32px",
    height: "32px",
    minWidth: "32px",
    borderRadius: "50%",
    background: "#15803d",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  infoTitle: {
    margin: "1px 0 5px",
    color: "#14532d",
    fontSize: "13px",
  },

  infoText: {
    margin: 0,
    color: "#166534",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  loadingContainer: {
    minHeight: "400px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "15px",
  },

  spinner: {
    width: "34px",
    height: "34px",
    border: "4px solid #dcfce7",
    borderTop: "4px solid #15803d",
    borderRadius: "50%",
    animation:
      "spin 1s linear infinite",
  },

  loadingText: {
    color: "#64748b",
    fontSize: "14px",
  },
};

export default Notifications;