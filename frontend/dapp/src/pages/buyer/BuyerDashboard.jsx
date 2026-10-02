import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

function BuyerDashboard() {
  const navigate = useNavigate();

  const [buyer, setBuyer] = useState(null);

  const [buyerWallet, setBuyerWallet] = useState(() => {
    try {
      const savedWallet = localStorage.getItem("buyerWallet");

      if (savedWallet) {
        return JSON.parse(savedWallet);
      }

      return null;
    } catch (error) {
      console.error("Buyer wallet loading error:", error);
      return null;
    }
  });

  const [stats, setStats] = useState({
    availableProperties: 0,
    myRequests: 0,
    approvedRequests: 0,
    myProperties: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBuyerData();

    // Also detect the currently connected MetaMask account directly.
    // This keeps the dashboard accurate even if buyerWallet was not
    // written to localStorage by the previous screen.
    const detectConnectedWallet = async () => {
      try {
        if (!window.ethereum) return;

        const accounts = await window.ethereum.request({
          method: "eth_accounts"
        });

        if (!accounts?.length) return;

        const chainId = await window.ethereum.request({
          method: "eth_chainId"
        });

        const networkMap = {
          "0x539": "Ganache Local",
          "0x169": "Ganache Local",
          "0xaa36a7": "Sepolia Testnet",
          "0x1": "Ethereum Mainnet"
        };

        const wallet = {
          address: accounts[0],
          network:
            networkMap[String(chainId).toLowerCase()] ||
            "Ganache Local"
        };

        localStorage.setItem(
          "buyerWallet",
          JSON.stringify(wallet)
        );

        setBuyerWallet(wallet);
      } catch (error) {
        console.log(
          "Buyer wallet detection error:",
          error
        );
      }
    };

    detectConnectedWallet();

    const handleWalletUpdate = () => {
      try {
        const savedWallet =
          localStorage.getItem("buyerWallet");

        if (savedWallet) {
          setBuyerWallet(JSON.parse(savedWallet));
        } else {
          setBuyerWallet(null);
        }
      } catch (error) {
        setBuyerWallet(null);
      }
    };

    window.addEventListener(
      "buyerWalletUpdated",
      handleWalletUpdate
    );

    return () => {
      window.removeEventListener(
        "buyerWalletUpdated",
        handleWalletUpdate
      );
    };
  }, []);

  const loadBuyerData = async () => {
    try {
      const storedBuyer =
        localStorage.getItem("buyerUser");

      let storedBuyerData = {};

      if (storedBuyer) {
        try {
          storedBuyerData = JSON.parse(storedBuyer);
          setBuyer(storedBuyerData);
        } catch (error) {
          storedBuyerData = {};
        }
      }

      const token =
        localStorage.getItem("buyerToken");

      if (!token) {
        navigate("/buyer/login");
        return;
      }

      // ==========================================
      // LOAD BUYER WALLET
      // ==========================================
      try {
        const savedWallet =
          localStorage.getItem("buyerWallet");

        if (savedWallet) {
          setBuyerWallet(JSON.parse(savedWallet));
        }
      } catch (error) {
        setBuyerWallet(null);
      }

      // ==========================================
      // LOAD REAL AVAILABLE PROPERTIES
      // ==========================================
      let availableProperties = 0;

      try {
        const response = await fetch(
          `${API_BASE_URL}/buyer/properties`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("buyerToken");
          localStorage.removeItem("buyerUser");
          navigate("/buyer/login", {
            replace: true,
          });
          return;
        }

        if (response.ok && data.success) {
          availableProperties =
            Number(data.count) ||
            (Array.isArray(data.properties)
              ? data.properties.length
              : 0);
        }
      } catch (error) {
        console.log(
          "Available properties API error."
        );
      }

      // ==========================================
      // LOAD REAL BUYER REQUESTS
      // ==========================================
      let myRequests = 0;
      let approvedRequests = 0;

      try {
        const response = await fetch(
          `${API_BASE_URL}/buyer/requests`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("buyerToken");
          localStorage.removeItem("buyerUser");
          navigate("/buyer/login", {
            replace: true,
          });
          return;
        }

        if (response.ok && data.success) {
          const requests = Array.isArray(
            data.requests
          )
            ? data.requests
            : [];

          myRequests =
            Number(data.count) || requests.length;

          approvedRequests = requests.filter(
            (request) =>
              String(
                request.request_status || ""
              ).toUpperCase() === "APPROVED"
          ).length;
        }
      } catch (error) {
        console.log(
          "Buyer requests API error."
        );
      }

      // ==========================================
      // LOAD REAL BUYER PROPERTIES
      // ==========================================
      let myProperties = 0;

      try {
        const response = await fetch(
          `${API_BASE_URL}/buyer/my-properties`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("buyerToken");
          localStorage.removeItem("buyerUser");
          navigate("/buyer/login", {
            replace: true,
          });
          return;
        }

        if (response.ok && data.success) {
          myProperties =
            Number(data.count) ||
            (Array.isArray(data.properties)
              ? data.properties.length
              : 0);
        }
      } catch (error) {
        console.log(
          "Buyer properties API error."
        );
      }

      // ==========================================
      // UPDATE DASHBOARD
      // ==========================================
      setStats({
        availableProperties,
        myRequests,
        approvedRequests,
        myProperties,
      });
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const getFirstName = () => {
    if (!buyer?.name) return "Buyer";

    return buyer.name.split(" ")[0];
  };

  const isVerified =
    buyer?.verification_status === "VERIFIED";

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f8f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          color: "#166534",
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f8f6",
        padding: "28px",
      }}
    >
      {/* ================= HEADER ================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: "700",
              color: "#172b1f",
            }}
          >
            Welcome, {getFirstName()} 👋
          </h1>

          <p
            style={{
              marginTop: "7px",
              marginBottom: 0,
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Manage your land purchases and requests
            from your dashboard.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#ffffff",
            padding: "10px 16px",
            borderRadius: "12px",
            border: "1px solid #e2e8e4",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: isVerified
                ? "#22c55e"
                : "#f59e0b",
            }}
          />

          <span
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: isVerified
                ? "#166534"
                : "#92400e",
            }}
          >
            {isVerified
              ? "Verified Buyer"
              : "Verification Pending"}
          </span>
        </div>
      </div>

      {/* ================= STATISTICS ================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "18px",
          marginBottom: "24px",
        }}
      >
        <StatCard
          title="Available Properties"
          value={stats.availableProperties}
          icon="🏡"
          iconBackground="#dcfce7"
          iconColor="#166534"
        />

        <StatCard
          title="My Requests"
          value={stats.myRequests}
          icon="📋"
          iconBackground="#dbeafe"
          iconColor="#1d4ed8"
        />

        <StatCard
          title="Approved Requests"
          value={stats.approvedRequests}
          icon="✓"
          iconBackground="#fef3c7"
          iconColor="#92400e"
        />

        <StatCard
          title="My Properties"
          value={stats.myProperties}
          icon="🏠"
          iconBackground="#ede9fe"
          iconColor="#6d28d9"
        />
      </div>

      {/* ================= MAIN CONTENT ================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: "22px",
          marginBottom: "24px",
        }}
      >
        {/* ================= LINE GRAPH ================= */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #e5ebe7",
            boxShadow:
              "0 2px 8px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "22px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  color: "#172b1f",
                }}
              >
                Purchase Request Activity
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                Your purchase request activity
              </p>
            </div>

            <span
              style={{
                fontSize: "12px",
                color: "#64748b",
                background: "#f1f5f3",
                padding: "7px 11px",
                borderRadius: "8px",
              }}
            >
              Last 6 months
            </span>
          </div>

          <BuyerLineChart />
        </div>

        {/* ================= QUICK ACTIONS ================= */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #e5ebe7",
            boxShadow:
              "0 2px 8px rgba(15, 23, 42, 0.04)",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              color: "#172b1f",
              marginBottom: "18px",
            }}
          >
            Quick Actions
          </h2>

          <ActionButton
            icon="🔎"
            title="Browse Properties"
            description="Find verified lands"
            onClick={() =>
              navigate("/buyer/properties")
            }
          />

          <ActionButton
            icon="📋"
            title="My Requests"
            description="Track purchase requests"
            onClick={() =>
              navigate("/buyer/requests")
            }
          />

          <ActionButton
            icon="🏠"
            title="My Properties"
            description="View owned properties"
            onClick={() =>
              navigate("/buyer/my-properties")
            }
          />

          <ActionButton
            icon="👤"
            title="My Profile"
            description="Manage your profile"
            onClick={() =>
              navigate("/buyer/profile")
            }
          />
        </div>
      </div>

      {/* ================= BOTTOM SECTION ================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.5fr) minmax(280px, 1fr)",
          gap: "22px",
        }}
      >
        {/* ================= RECENT REQUESTS ================= */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #e5ebe7",
            boxShadow:
              "0 2px 8px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  color: "#172b1f",
                }}
              >
                Recent Requests
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                Your latest property purchase requests
              </p>
            </div>

            <button
              onClick={() =>
                navigate("/buyer/requests")
              }
              style={{
                border: "none",
                background: "transparent",
                color: "#15803d",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              View All →
            </button>
          </div>

          {stats.myRequests === 0 ? (
            <div
              style={{
                padding: "38px 20px",
                textAlign: "center",
                border: "1px dashed #d7e1da",
                borderRadius: "12px",
                background: "#fafcfb",
              }}
            >
              <div
                style={{
                  fontSize: "38px",
                  marginBottom: "10px",
                }}
              >
                📋
              </div>

              <h3
                style={{
                  margin: 0,
                  color: "#334155",
                  fontSize: "15px",
                }}
              >
                No purchase requests yet
              </h3>

              <p
                style={{
                  margin: "7px 0 18px",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Browse verified properties and
                send your first purchase request.
              </p>

              <button
                onClick={() =>
                  navigate("/buyer/properties")
                }
                style={{
                  border: "none",
                  background:
                    "linear-gradient(135deg, #15803d, #166534)",
                  color: "#ffffff",
                  padding: "10px 18px",
                  borderRadius: "9px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Browse Properties
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: "20px",
                background: "#f8faf9",
                borderRadius: "12px",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              You have{" "}
              <strong
                style={{
                  color: "#166534",
                }}
              >
                {stats.myRequests}
              </strong>{" "}
              purchase request
              {stats.myRequests !== 1
                ? "s"
                : ""}{" "}
              recorded.
            </div>
          )}
        </div>

        {/* ================= WALLET ================= */}

        <div
          style={{
            background:
              "linear-gradient(135deg, #14532d, #166534)",
            borderRadius: "16px",
            padding: "24px",
            color: "#ffffff",
            boxShadow:
              "0 4px 14px rgba(22, 101, 52, 0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background:
                  "rgba(255,255,255,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              🦊
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                }}
              >
                {buyerWallet?.address ? "Wallet Connected" : "Wallet"}
              </h2>

              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12px",
                  color: "#bbf7d0",
                }}
              >
                Blockchain account
              </p>
            </div>
          </div>

          <div
            style={{
              background:
                "rgba(255,255,255,0.1)",
              padding: "14px",
              borderRadius: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#bbf7d0",
                marginBottom: "6px",
              }}
            >
              WALLET ADDRESS
            </div>

            <div
              style={{
                fontSize: "12px",
                wordBreak: "break-all",
              }}
            >
              {buyerWallet?.address
                ? buyerWallet.address
                : "Wallet not connected"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "#dcfce7",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: buyerWallet?.address
                  ? "#4ade80"
                  : "#f59e0b",
              }}
            />

            {buyerWallet?.address
              ? buyerWallet.network ||
                "Ganache Local"
              : "Wallet not connected"}
          </div>
        </div>
      </div>

      {/* ================= SECURITY INFORMATION ================= */}

      <div
        style={{
          marginTop: "22px",
          background: "#ffffff",
          border: "1px solid #e5ebe7",
          borderRadius: "14px",
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
          }}
        >
          🔐
        </div>

        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#172b1f",
            }}
          >
            Secure Land Registry
          </h3>

          <p
            style={{
              margin: "4px 0 0",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            Verified properties and transactions
            are managed through the Land Registry
            system.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  icon,
  iconBackground,
  iconColor,
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5ebe7",
        borderRadius: "14px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow:
          "0 2px 8px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          {title}
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            fontSize: "27px",
            color: "#172b1f",
          }}
        >
          {value}
        </h2>
      </div>

      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: iconBackground,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "21px",
          fontWeight: "700",
        }}
      >
        {icon}
      </div>
    </div>
  );
}

/* =====================================================
   QUICK ACTION BUTTON
===================================================== */

function ActionButton({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
        marginBottom: "10px",
        background: "#f8faf9",
        border: "1px solid #e5ebe7",
        borderRadius: "10px",
        cursor: "pointer",
        textAlign: "left",
        transition: "0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background =
          "#f0fdf4";

        e.currentTarget.style.borderColor =
          "#bbf7d0";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          "#f8faf9";

        e.currentTarget.style.borderColor =
          "#e5ebe7";
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "9px",
          background: "#dcfce7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "17px",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "#1f2937",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "11px",
            color: "#64748b",
            marginTop: "3px",
          }}
        >
          {description}
        </div>
      </div>
    </button>
  );
}

/* =====================================================
   BUYER LINE CHART
===================================================== */

function BuyerLineChart() {
  const values = [0, 0, 0, 0, 0, 0];

  const width = 700;
  const height = 270;

  const paddingLeft = 48;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 38;

  const chartWidth =
    width - paddingLeft - paddingRight;

  const chartHeight =
    height - paddingTop - paddingBottom;

  const maxValue = Math.max(
    5,
    ...values
  );

  const points = values.map((value, index) => {
    const x =
      paddingLeft +
      (index / (values.length - 1)) *
        chartWidth;

    const y =
      paddingTop +
      chartHeight -
      (value / maxValue) * chartHeight;

    return `${x},${y}`;
  });

  const months = [
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
  ];

  const yLabels = [5, 4, 3, 2, 1, 0];

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="270"
        preserveAspectRatio="none"
      >
        {yLabels.map((value) => {
          const y =
            paddingTop +
            chartHeight -
            (value / maxValue) *
              chartHeight;

          return (
            <g key={value}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#e5ebe7"
                strokeWidth="1"
              />

              <text
                x="34"
                y={y + 4}
                textAnchor="middle"
                fontSize="11"
                fill="#94a3b8"
              >
                {value}
              </text>
            </g>
          );
        })}

        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="#16a34a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {values.map((value, index) => {
          const x =
            paddingLeft +
            (index /
              (values.length - 1)) *
              chartWidth;

          const y =
            paddingTop +
            chartHeight -
            (value / maxValue) *
              chartHeight;

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="5"
              fill="#ffffff"
              stroke="#16a34a"
              strokeWidth="3"
            />
          );
        })}

        {months.map((month, index) => {
          const x =
            paddingLeft +
            (index /
              (months.length - 1)) *
              chartWidth;

          return (
            <text
              key={month}
              x={x}
              y={height - 12}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {month}
            </text>
          );
        })}
      </svg>

      <div
        style={{
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "11px",
          marginTop: "-4px",
        }}
      >
        No purchase activity recorded yet
      </div>
    </div>
  );
}

export default BuyerDashboard;