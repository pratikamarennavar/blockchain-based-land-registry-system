import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

const Analytics = () => {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [lands, setLands] = useState([]);
  const [buyerRequests, setBuyerRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // ADMIN HEADERS
  // ============================================================

  const getAdminHeaders = () => {
    const adminToken =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(adminToken
        ? {
            Authorization: `Bearer ${adminToken}`,
          }
        : {}),
    };
  };

  // ============================================================
  // FETCH ANALYTICS DATA
  // ============================================================

  const fetchAnalytics = async (showLoader = true) => {
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
        fetch(
          `${API_BASE_URL}/admin/dashboard`,
          {
            method: "GET",
            headers,
          }
        ),

        fetch(
          `${API_BASE_URL}/admin/users`,
          {
            method: "GET",
            headers,
          }
        ),

        fetch(
          `${API_BASE_URL}/admin/lands`,
          {
            method: "GET",
            headers,
          }
        ),

        fetch(
          `${API_BASE_URL}/admin/buyer-requests`,
          {
            method: "GET",
            headers,
          }
        ),
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

      // Dashboard
      if (
        dashboardResponse.ok &&
        dashboardData.success
      ) {
        setDashboard(
          dashboardData.dashboard ||
            dashboardData.data ||
            dashboardData
        );
      }

      // Users
      if (
        usersResponse.ok &&
        usersData.success
      ) {
        setUsers(
          Array.isArray(usersData.users)
            ? usersData.users
            : []
        );
      }

      // Lands
      if (
        landsResponse.ok &&
        landsData.success
      ) {
        setLands(
          Array.isArray(landsData.lands)
            ? landsData.lands
            : []
        );
      }

      // Buyer requests
      if (
        requestsResponse.ok &&
        requestsData.success
      ) {
        setBuyerRequests(
          Array.isArray(
            requestsData.requests
          )
            ? requestsData.requests
            : []
        );
      }

      if (
        !dashboardResponse.ok &&
        !usersResponse.ok &&
        !landsResponse.ok &&
        !requestsResponse.ok
      ) {
        throw new Error(
          "Unable to load analytics data"
        );
      }
    } catch (err) {
      console.error(
        "Analytics loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load analytics data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchAnalytics(true);
  }, []);

  // ============================================================
  // NORMALIZE USER ROLE
  // ============================================================

  const getUserRole = (user) => {
    const role =
      user.role ||
      user.user_role ||
      user.userRole ||
      user.type ||
      "";

    return String(role).toUpperCase();
  };

  // ============================================================
  // USER ANALYTICS
  // ============================================================

  const userAnalytics = useMemo(() => {
    let sellers = 0;
    let buyers = 0;
    let admins = 0;
    let verified = 0;
    let pending = 0;
    let rejected = 0;

    users.forEach((user) => {
      const role = getUserRole(user);

      if (role === "SELLER") {
        sellers++;
      } else if (role === "BUYER") {
        buyers++;
      } else if (role === "ADMIN") {
        admins++;
      }

      const status = String(
        user.verification_status ||
          user.verificationStatus ||
          user.status ||
          ""
      ).toUpperCase();

      if (
        status === "VERIFIED" ||
        status === "APPROVED"
      ) {
        verified++;
      } else if (
        status === "REJECTED"
      ) {
        rejected++;
      } else {
        pending++;
      }
    });

    return {
      total: users.length,
      sellers,
      buyers,
      admins,
      verified,
      pending,
      rejected,
    };
  }, [users]);

  // ============================================================
  // LAND ANALYTICS
  // ============================================================

  const landAnalytics = useMemo(() => {
    let verified = 0;
    let pending = 0;
    let rejected = 0;

    let blockchainRecords = 0;

    lands.forEach((land) => {
      const status = String(
        land.verification_status ||
          land.verificationStatus ||
          ""
      ).toUpperCase();

      if (status === "VERIFIED") {
        verified++;
      } else if (
        status === "REJECTED"
      ) {
        rejected++;
      } else {
        pending++;
      }

      if (
        land.blockchain_land_id ||
        land.blockchain_tx_hash ||
        land.blockchain_block_number
      ) {
        blockchainRecords++;
      }
    });

    const total = lands.length;

    const verificationRate =
      total > 0
        ? Math.round(
            (verified / total) * 100
          )
        : 0;

    return {
      total,
      verified,
      pending,
      rejected,
      blockchainRecords,
      verificationRate,
    };
  }, [lands]);

  // ============================================================
  // BUYER REQUEST ANALYTICS
  // ============================================================

  const requestAnalytics = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let cancelled = 0;

    buyerRequests.forEach((request) => {
      const status = String(
        request.request_status ||
          request.status ||
          ""
      ).toUpperCase();

      if (status === "PENDING") {
        pending++;
      } else if (
        status === "APPROVED"
      ) {
        approved++;
      } else if (
        status === "REJECTED"
      ) {
        rejected++;
      } else if (
        status === "CANCELLED"
      ) {
        cancelled++;
      }
    });

    const total =
      buyerRequests.length;

    return {
      total,
      pending,
      approved,
      rejected,
      cancelled,
    };
  }, [buyerRequests]);

  // ============================================================
  // BLOCKCHAIN ANALYTICS
  // ============================================================

  const blockchainAnalytics = useMemo(() => {
    let complete = 0;
    let partial = 0;

    const networks = {};

    lands.forEach((land) => {
      const hasLandId =
        !!land.blockchain_land_id;

      const hasTxHash =
        !!land.blockchain_tx_hash;

      const hasBlock =
        !!land.blockchain_block_number;

      if (
        hasLandId &&
        hasTxHash &&
        hasBlock
      ) {
        complete++;
      } else if (
        hasLandId ||
        hasTxHash ||
        hasBlock
      ) {
        partial++;
      }

      if (
        land.blockchain_network
      ) {
        const network =
          String(
            land.blockchain_network
          );

        networks[network] =
          (networks[network] || 0) +
          1;
      }
    });

    return {
      complete,
      partial,
      total:
        complete + partial,
      networks,
    };
  }, [lands]);

  // ============================================================
  // TOP LAND LOCATIONS
  // ============================================================

  const locationAnalytics = useMemo(() => {
    const locations = {};

    lands.forEach((land) => {
      const location =
        [
          land.district,
          land.state,
        ]
          .filter(Boolean)
          .join(", ") ||
        "Unknown";

      locations[location] =
        (locations[location] || 0) +
        1;
    });

    return Object.entries(
      locations
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [lands]);

  // ============================================================
  // OVERALL HEALTH
  // ============================================================

  const overallAnalytics = useMemo(() => {
    const totalUsers =
      userAnalytics.total;

    const totalLands =
      landAnalytics.total;

    const verifiedUsers =
      userAnalytics.verified;

    const verifiedLands =
      landAnalytics.verified;

    const userVerificationRate =
      totalUsers > 0
        ? Math.round(
            (verifiedUsers /
              totalUsers) *
              100
          )
        : 0;

    const blockchainCoverage =
      totalLands > 0
        ? Math.round(
            (blockchainAnalytics.total /
              totalLands) *
              100
          )
        : 0;

    return {
      userVerificationRate,
      landVerificationRate:
        landAnalytics.verificationRate,
      blockchainCoverage,
    };
  }, [
    userAnalytics,
    landAnalytics,
    blockchainAnalytics,
  ]);

  // ============================================================
  // GET DASHBOARD STATISTIC
  // ============================================================

  const getDashboardStatistic = (
    key,
    fallback
  ) => {
    if (!dashboard) {
      return fallback;
    }

    const statistics =
      dashboard.statistics ||
      dashboard.data?.statistics ||
      dashboard;

    return (
      statistics[key] ??
      fallback
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>

          <div style={styles.loadingText}>
            Loading analytics...
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div style={styles.page}>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Analytics
          </h1>

          <p style={styles.subtitle}>
            System statistics and activity analysis
            based on your existing registry data
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            fetchAnalytics(false)
          }
          disabled={refreshing}
          style={{
            ...styles.refreshButton,
            opacity: refreshing ? 0.65 : 1,
            cursor: refreshing
              ? "not-allowed"
              : "pointer",
          }}
        >
          <span style={styles.refreshIcon}>
            ↻
          </span>

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div style={styles.errorBox}>
          <strong>
            Analytics warning:
          </strong>{" "}
          {error}
        </div>
      )}

      {/* ======================================================
          OVERVIEW CARDS
      ====================================================== */}

      <div style={styles.statsGrid}>
        <AnalyticsCard
          label="Total Users"
          value={userAnalytics.total}
          subtext={`${userAnalytics.sellers} sellers • ${userAnalytics.buyers} buyers`}
          icon="👥"
          background="#f0fdf4"
          color="#15803d"
        />

        <AnalyticsCard
          label="Total Lands"
          value={landAnalytics.total}
          subtext={`${landAnalytics.verified} verified`}
          icon="▣"
          background="#eff6ff"
          color="#2563eb"
        />

        <AnalyticsCard
          label="Buyer Requests"
          value={requestAnalytics.total}
          subtext={`${requestAnalytics.pending} pending`}
          icon="↔"
          background="#fff7ed"
          color="#c2410c"
        />

        <AnalyticsCard
          label="Blockchain Records"
          value={blockchainAnalytics.total}
          subtext={`${blockchainAnalytics.complete} complete`}
          icon="⛓"
          background="#ecfdf5"
          color="#047857"
        />
      </div>

      {/* ======================================================
          VERIFICATION RATE
      ====================================================== */}

      <div style={styles.sectionGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                Verification Overview
              </h2>

              <p style={styles.cardSubtitle}>
                Current verification status
              </p>
            </div>
          </div>

          <div style={styles.progressSection}>
            <ProgressRow
              label="User Verification"
              value={
                overallAnalytics.userVerificationRate
              }
            />

            <ProgressRow
              label="Land Verification"
              value={
                overallAnalytics.landVerificationRate
              }
            />

            <ProgressRow
              label="Blockchain Coverage"
              value={
                overallAnalytics.blockchainCoverage
              }
            />
          </div>
        </div>

        {/* REQUEST ANALYTICS */}

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                Buyer Requests
              </h2>

              <p style={styles.cardSubtitle}>
                Purchase request distribution
              </p>
            </div>
          </div>

          <div style={styles.requestRows}>
            <RequestRow
              label="Pending"
              value={requestAnalytics.pending}
              total={requestAnalytics.total}
              background="#fff7ed"
              color="#c2410c"
            />

            <RequestRow
              label="Approved"
              value={requestAnalytics.approved}
              total={requestAnalytics.total}
              background="#eff6ff"
              color="#2563eb"
            />

            <RequestRow
              label="Rejected"
              value={requestAnalytics.rejected}
              total={requestAnalytics.total}
              background="#fef2f2"
              color="#dc2626"
            />

            <RequestRow
              label="Cancelled"
              value={requestAnalytics.cancelled}
              total={requestAnalytics.total}
              background="#f8fafc"
              color="#64748b"
            />
          </div>
        </div>
      </div>

      {/* ======================================================
          USERS + LANDS
      ====================================================== */}

      <div style={styles.sectionGrid}>
        {/* USERS */}

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                User Distribution
              </h2>

              <p style={styles.cardSubtitle}>
                Registered user roles
              </p>
            </div>
          </div>

          <div style={styles.distributionContainer}>
            <DistributionRow
              label="Sellers"
              value={userAnalytics.sellers}
              total={userAnalytics.total}
              color="#15803d"
            />

            <DistributionRow
              label="Buyers"
              value={userAnalytics.buyers}
              total={userAnalytics.total}
              color="#2563eb"
            />

            <DistributionRow
              label="Admins"
              value={userAnalytics.admins}
              total={userAnalytics.total}
              color="#7c3aed"
            />
          </div>

          <div style={styles.summaryBox}>
            <div>
              <span style={styles.summaryLabel}>
                Verified
              </span>

              <strong
                style={{
                  ...styles.summaryValue,
                  color: "#15803d",
                }}
              >
                {userAnalytics.verified}
              </strong>
            </div>

            <div>
              <span style={styles.summaryLabel}>
                Pending
              </span>

              <strong
                style={{
                  ...styles.summaryValue,
                  color: "#c2410c",
                }}
              >
                {userAnalytics.pending}
              </strong>
            </div>

            <div>
              <span style={styles.summaryLabel}>
                Rejected
              </span>

              <strong
                style={{
                  ...styles.summaryValue,
                  color: "#dc2626",
                }}
              >
                {userAnalytics.rejected}
              </strong>
            </div>
          </div>
        </div>

        {/* LANDS */}

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                Land Verification
              </h2>

              <p style={styles.cardSubtitle}>
                Registry land status
              </p>
            </div>
          </div>

          <div style={styles.landStatusGrid}>
            <StatusBox
              label="Total"
              value={landAnalytics.total}
              background="#f8fafc"
              color="#334155"
            />

            <StatusBox
              label="Verified"
              value={landAnalytics.verified}
              background="#ecfdf5"
              color="#047857"
            />

            <StatusBox
              label="Pending"
              value={landAnalytics.pending}
              background="#fff7ed"
              color="#c2410c"
            />

            <StatusBox
              label="Rejected"
              value={landAnalytics.rejected}
              background="#fef2f2"
              color="#dc2626"
            />
          </div>

          <div style={styles.verificationRateBox}>
            <div>
              <span style={styles.rateLabel}>
                Land verification rate
              </span>

              <strong style={styles.rateValue}>
                {landAnalytics.verificationRate}%
              </strong>
            </div>

            <div
              style={styles.rateTrack}
            >
              <div
                style={{
                  ...styles.rateFill,
                  width: `${Math.min(
                    100,
                    landAnalytics.verificationRate
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          BLOCKCHAIN ANALYTICS
      ====================================================== */}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Blockchain Network Analysis
            </h2>

            <p style={styles.cardSubtitle}>
              Blockchain records stored in the land
              registry
            </p>
          </div>
        </div>

        <div style={styles.blockchainAnalytics}>
          <div style={styles.blockchainSummary}>
            <div style={styles.bigBlockchainNumber}>
              {blockchainAnalytics.total}
            </div>

            <div style={styles.blockchainSummaryLabel}>
              Total blockchain records
            </div>
          </div>

          <div style={styles.networkList}>
            {Object.keys(
              blockchainAnalytics.networks
            ).length === 0 ? (
              <div style={styles.noData}>
                No blockchain network data available.
              </div>
            ) : (
              Object.entries(
                blockchainAnalytics.networks
              ).map(
                ([network, count]) => (
                  <div
                    key={network}
                    style={
                      styles.networkRow
                    }
                  >
                    <div>
                      <div
                        style={
                          styles.networkName
                        }
                      >
                        {network}
                      </div>

                      <div
                        style={
                          styles.networkCountText
                        }
                      >
                        {count} record
                        {count !== 1
                          ? "s"
                          : ""}
                      </div>
                    </div>

                    <div
                      style={
                        styles.networkBar
                      }
                    >
                      <div
                        style={{
                          ...styles.networkBarFill,
                          width: `${
                            blockchainAnalytics.total >
                            0
                              ? (count /
                                  blockchainAnalytics.total) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          LOCATION ANALYSIS
      ====================================================== */}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Land Distribution by Location
            </h2>

            <p style={styles.cardSubtitle}>
              Number of registered land records by
              district and state
            </p>
          </div>
        </div>

        {locationAnalytics.length === 0 ? (
          <div style={styles.noData}>
            No location data available.
          </div>
        ) : (
          <div style={styles.locationList}>
            {locationAnalytics.map(
              ([location, count]) => {
                const maxCount =
                  locationAnalytics[0]?.[1] ||
                  1;

                return (
                  <div
                    key={location}
                    style={
                      styles.locationRow
                    }
                  >
                    <div
                      style={
                        styles.locationLabel
                      }
                    >
                      {location}
                    </div>

                    <div
                      style={
                        styles.locationBarTrack
                      }
                    >
                      <div
                        style={{
                          ...styles.locationBarFill,
                          width: `${
                            (count /
                              maxCount) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>

                    <div
                      style={
                        styles.locationCount
                      }
                    >
                      {count}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* ======================================================
          SYSTEM SUMMARY
      ====================================================== */}

      <div style={styles.summaryCard}>
        <div style={styles.summaryCardIcon}>
          ✓
        </div>

        <div>
          <h3 style={styles.summaryCardTitle}>
            System Analytics Summary
          </h3>

          <p style={styles.summaryCardText}>
            The analytics shown above are calculated
            from your existing users, land records,
            buyer requests and blockchain information.
            No sample or hardcoded transaction values
            are used.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ANALYTICS CARD
// ============================================================

const AnalyticsCard = ({
  label,
  value,
  subtext,
  icon,
  background,
  color,
}) => {
  return (
    <div style={styles.analyticsCard}>
      <div
        style={{
          ...styles.analyticsIcon,
          background,
          color,
        }}
      >
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={styles.analyticsLabel}>
          {label}
        </div>

        <div style={styles.analyticsValue}>
          {value}
        </div>

        <div style={styles.analyticsSubtext}>
          {subtext}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PROGRESS ROW
// ============================================================

const ProgressRow = ({
  label,
  value,
}) => {
  return (
    <div style={styles.progressRow}>
      <div style={styles.progressHeader}>
        <span style={styles.progressLabel}>
          {label}
        </span>

        <strong style={styles.progressValue}>
          {value}%
        </strong>
      </div>

      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${Math.min(
              100,
              Math.max(0, value)
            )}%`,
          }}
        ></div>
      </div>
    </div>
  );
};

// ============================================================
// REQUEST ROW
// ============================================================

const RequestRow = ({
  label,
  value,
  total,
  background,
  color,
}) => {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0;

  return (
    <div style={styles.requestRow}>
      <div
        style={{
          ...styles.requestIcon,
          background,
          color,
        }}
      >
        {value}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <div style={styles.requestHeader}>
          <span
            style={styles.requestLabel}
          >
            {label}
          </span>

          <span
            style={styles.requestPercentage}
          >
            {percentage}%
          </span>
        </div>

        <div
          style={styles.requestTrack}
        >
          <div
            style={{
              ...styles.requestFill,
              width: `${percentage}%`,
              background: color,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// DISTRIBUTION ROW
// ============================================================

const DistributionRow = ({
  label,
  value,
  total,
  color,
}) => {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0;

  return (
    <div style={styles.distributionRow}>
      <div style={styles.distributionHeader}>
        <span style={styles.distributionLabel}>
          {label}
        </span>

        <span style={styles.distributionValue}>
          {value}
        </span>
      </div>

      <div
        style={
          styles.distributionTrack
        }
      >
        <div
          style={{
            ...styles.distributionFill,
            width: `${percentage}%`,
            background: color,
          }}
        ></div>
      </div>
    </div>
  );
};

// ============================================================
// STATUS BOX
// ============================================================

const StatusBox = ({
  label,
  value,
  background,
  color,
}) => {
  return (
    <div
      style={{
        ...styles.statusBox,
        background,
      }}
    >
      <div
        style={{
          ...styles.statusBoxValue,
          color,
        }}
      >
        {value}
      </div>

      <div style={styles.statusBoxLabel}>
        {label}
      </div>
    </div>
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
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    borderRadius: "8px",
    padding: "11px 17px",
    background: "#15803d",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    boxShadow:
      "0 2px 6px rgba(21,128,61,0.20)",
  },

  refreshIcon: {
    fontSize: "18px",
    lineHeight: 1,
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

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "16px",
    marginBottom: "22px",
  },

  analyticsCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "19px",
    boxShadow:
      "0 2px 7px rgba(15,23,42,0.04)",
  },

  analyticsIcon: {
    width: "46px",
    height: "46px",
    minWidth: "46px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 700,
  },

  analyticsLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
    fontWeight: 500,
  },

  analyticsValue: {
    fontSize: "25px",
    fontWeight: 700,
    lineHeight: 1.1,
    color: "#1e293b",
  },

  analyticsSubtext: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "4px",
  },

  sectionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
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
    alignItems: "flex-start",
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

  progressSection: {
    padding: "20px",
  },

  progressRow: {
    marginBottom: "20px",
  },

  progressRowLast: {
    marginBottom: 0,
  },

  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },

  progressLabel: {
    color: "#475569",
    fontSize: "13px",
    fontWeight: 600,
  },

  progressValue: {
    color: "#15803d",
    fontSize: "13px",
  },

  progressTrack: {
    height: "9px",
    background: "#ecfdf5",
    borderRadius: "999px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    background: "#15803d",
    borderRadius: "999px",
    transition:
      "width 0.4s ease",
  },

  requestRows: {
    padding: "20px",
  },

  requestRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "17px",
  },

  requestIcon: {
    width: "38px",
    height: "38px",
    minWidth: "38px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "13px",
  },

  requestHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "7px",
  },

  requestLabel: {
    fontSize: "12px",
    color: "#475569",
    fontWeight: 600,
  },

  requestPercentage: {
    fontSize: "11px",
    color: "#94a3b8",
  },

  requestTrack: {
    height: "7px",
    background: "#f1f5f9",
    borderRadius: "999px",
    overflow: "hidden",
  },

  requestFill: {
    height: "100%",
    borderRadius: "999px",
    transition:
      "width 0.4s ease",
  },

  distributionContainer: {
    padding: "20px",
  },

  distributionRow: {
    marginBottom: "17px",
  },

  distributionHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "7px",
  },

  distributionLabel: {
    fontSize: "12px",
    color: "#475569",
    fontWeight: 600,
  },

  distributionValue: {
    fontSize: "12px",
    color: "#334155",
    fontWeight: 700,
  },

  distributionTrack: {
    height: "8px",
    background: "#f1f5f9",
    borderRadius: "999px",
    overflow: "hidden",
  },

  distributionFill: {
    height: "100%",
    borderRadius: "999px",
    transition:
      "width 0.4s ease",
  },

  summaryBox: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    borderTop:
      "1px solid #f1f5f9",
  },

  summaryBoxItem: {
    padding: "15px",
  },

  summaryLabel: {
    display: "block",
    fontSize: "10px",
    color: "#94a3b8",
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: "4px",
  },

  summaryValue: {
    fontSize: "19px",
  },

  landStatusGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    gap: "10px",
    padding: "20px",
  },

  statusBox: {
    borderRadius: "9px",
    padding: "14px 10px",
    textAlign: "center",
  },

  statusBoxValue: {
    fontSize: "22px",
    fontWeight: 700,
    marginBottom: "4px",
  },

  statusBoxLabel: {
    fontSize: "10px",
    color: "#64748b",
    fontWeight: 600,
    textTransform: "uppercase",
  },

  verificationRateBox: {
    margin: "0 20px 20px",
    padding: "15px",
    borderRadius: "9px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  rateLabel: {
    fontSize: "12px",
    color: "#64748b",
  },

  rateValue: {
    float: "right",
    color: "#15803d",
    fontSize: "16px",
  },

  rateTrack: {
    clear: "both",
    marginTop: "10px",
    height: "8px",
    background: "#dcfce7",
    borderRadius: "999px",
    overflow: "hidden",
  },

  rateFill: {
    height: "100%",
    background: "#15803d",
    borderRadius: "999px",
  },

  blockchainAnalytics: {
    display: "grid",
    gridTemplateColumns:
      "180px 1fr",
    gap: "30px",
    padding: "25px",
  },

  blockchainSummary: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    borderRadius: "10px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
  },

  bigBlockchainNumber: {
    fontSize: "38px",
    fontWeight: 700,
    color: "#15803d",
  },

  blockchainSummaryLabel: {
    marginTop: "5px",
    textAlign: "center",
    fontSize: "11px",
    color: "#64748b",
  },

  networkList: {
    display: "flex",
    flexDirection: "column",
    gap: "17px",
    justifyContent: "center",
  },

  networkRow: {
    display: "grid",
    gridTemplateColumns:
      "130px 1fr",
    alignItems: "center",
    gap: "15px",
  },

  networkName: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#334155",
  },

  networkCountText: {
    marginTop: "3px",
    fontSize: "10px",
    color: "#94a3b8",
  },

  networkBar: {
    height: "10px",
    background: "#f1f5f9",
    borderRadius: "999px",
    overflow: "hidden",
  },

  networkBarFill: {
    height: "100%",
    background: "#15803d",
    borderRadius: "999px",
  },

  locationList: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  locationRow: {
    display: "grid",
    gridTemplateColumns:
      "180px 1fr 35px",
    gap: "15px",
    alignItems: "center",
  },

  locationLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#475569",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  locationBarTrack: {
    height: "9px",
    background: "#f1f5f9",
    borderRadius: "999px",
    overflow: "hidden",
  },

  locationBarFill: {
    height: "100%",
    background: "#15803d",
    borderRadius: "999px",
  },

  locationCount: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#334155",
    textAlign: "right",
  },

  summaryCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    padding: "18px",
    marginBottom: "20px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
  },

  summaryCardIcon: {
    width: "38px",
    height: "38px",
    minWidth: "38px",
    borderRadius: "9px",
    background: "#15803d",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  summaryCardTitle: {
    margin: "1px 0 5px",
    color: "#14532d",
    fontSize: "14px",
  },

  summaryCardText: {
    margin: 0,
    color: "#166534",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  noData: {
    padding: "35px 20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
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

export default Analytics;