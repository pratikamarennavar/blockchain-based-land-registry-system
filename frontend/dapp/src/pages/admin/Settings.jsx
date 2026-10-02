import React, { useEffect, useState } from "react";

const Settings = () => {
  const [adminName, setAdminName] = useState("System Administrator");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminWallet, setAdminWallet] = useState("");

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [autoRefresh, setAutoRefresh] =
    useState(true);

  const [refreshInterval, setRefreshInterval] =
    useState("30");

  const [theme, setTheme] =
    useState("light");

  const [message, setMessage] =
    useState("");

  // ============================================================
  // LOAD SAVED SETTINGS
  // ============================================================

  useEffect(() => {
    const savedNotifications =
      localStorage.getItem(
        "adminNotificationsEnabled"
      );

    const savedAutoRefresh =
      localStorage.getItem(
        "adminAutoRefresh"
      );

    const savedRefreshInterval =
      localStorage.getItem(
        "adminRefreshInterval"
      );

    const savedTheme =
      localStorage.getItem(
        "adminTheme"
      );

    if (
      savedNotifications !== null
    ) {
      setNotificationsEnabled(
        savedNotifications === "true"
      );
    }

    if (
      savedAutoRefresh !== null
    ) {
      setAutoRefresh(
        savedAutoRefresh === "true"
      );
    }

    if (savedRefreshInterval) {
      setRefreshInterval(
        savedRefreshInterval
      );
    }

    if (savedTheme) {
      setTheme(savedTheme);
    }

    loadAdminProfile();
  }, []);

  // ============================================================
  // LOAD ADMIN PROFILE
  // ============================================================

  const loadAdminProfile = async () => {
    try {
      const token =
        localStorage.getItem(
          "adminToken"
        ) ||
        localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/admin/profile",
        {
          method: "GET",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data =
        await response.json();

      if (!data.success) {
        return;
      }

      const profile =
        data.admin ||
        data.profile ||
        data.data ||
        {};

      if (
        profile.name ||
        profile.username
      ) {
        setAdminName(
          profile.name ||
            profile.username
        );
      }

      if (profile.email) {
        setAdminEmail(
          profile.email
        );
      }

      if (
        profile.wallet_address ||
        profile.walletAddress
      ) {
        setAdminWallet(
          profile.wallet_address ||
            profile.walletAddress
        );
      }
    } catch (error) {
      console.log(
        "Admin profile could not be loaded:",
        error
      );
    }
  };

  // ============================================================
  // SAVE SETTINGS
  // ============================================================

  const saveSettings = () => {
    localStorage.setItem(
      "adminNotificationsEnabled",
      String(notificationsEnabled)
    );

    localStorage.setItem(
      "adminAutoRefresh",
      String(autoRefresh)
    );

    localStorage.setItem(
      "adminRefreshInterval",
      refreshInterval
    );

    localStorage.setItem(
      "adminTheme",
      theme
    );

    setMessage(
      "Settings saved successfully."
    );

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  // ============================================================
  // RESET SETTINGS
  // ============================================================

  const resetSettings = () => {
    setNotificationsEnabled(true);
    setAutoRefresh(true);
    setRefreshInterval("30");
    setTheme("light");

    localStorage.setItem(
      "adminNotificationsEnabled",
      "true"
    );

    localStorage.setItem(
      "adminAutoRefresh",
      "true"
    );

    localStorage.setItem(
      "adminRefreshInterval",
      "30"
    );

    localStorage.setItem(
      "adminTheme",
      "light"
    );

    setMessage(
      "Settings restored to default."
    );

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "adminToken"
    );

    localStorage.removeItem(
      "adminUser"
    );

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "userRole"
    );

    window.location.href =
      "/admin/login";
  };

  return (
    <div style={styles.page}>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Settings
          </h1>

          <p style={styles.subtitle}>
            Manage administrator preferences and
            system settings
          </p>
        </div>

        <button
          type="button"
          onClick={saveSettings}
          style={styles.saveButton}
        >
          ✓ Save Changes
        </button>
      </div>

      {/* SUCCESS MESSAGE */}

      {message && (
        <div style={styles.successBox}>
          <span>✓</span>
          {message}
        </div>
      )}

      {/* ======================================================
          ADMIN PROFILE
      ====================================================== */}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Administrator Profile
            </h2>

            <p style={styles.cardSubtitle}>
              Current administrator account
            </p>
          </div>
        </div>

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>
              Administrator Name
            </label>

            <input
              type="text"
              value={adminName}
              onChange={(e) =>
                setAdminName(
                  e.target.value
                )
              }
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Email
            </label>

            <input
              type="email"
              value={adminEmail}
              onChange={(e) =>
                setAdminEmail(
                  e.target.value
                )
              }
              placeholder="Administrator email"
              style={styles.input}
            />
          </div>

          <div
            style={{
              ...styles.field,
              gridColumn: "1 / -1",
            }}
          >
            <label style={styles.label}>
              Blockchain Admin Wallet
            </label>

            <input
              type="text"
              value={adminWallet}
              readOnly
              placeholder="Blockchain wallet address"
              style={{
                ...styles.input,
                background: "#f8fafc",
                color: "#64748b",
              }}
            />

            <span style={styles.fieldHint}>
              This is displayed for reference and
              is not changed from this page.
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          NOTIFICATION SETTINGS
      ====================================================== */}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Notification Preferences
            </h2>

            <p style={styles.cardSubtitle}>
              Control administrator notification
              behaviour
            </p>
          </div>
        </div>

        <div style={styles.settingsList}>
          <SettingRow
            title="Enable Notifications"
            description="Allow the admin module to display system notifications and alerts."
            enabled={notificationsEnabled}
            onChange={() =>
              setNotificationsEnabled(
                !notificationsEnabled
              )
            }
          />

          <SettingRow
            title="Automatic Data Refresh"
            description="Automatically refresh dashboard-related information when enabled."
            enabled={autoRefresh}
            onChange={() =>
              setAutoRefresh(
                !autoRefresh
              )
            }
          />
        </div>
      </div>

      {/* ======================================================
          REFRESH SETTINGS
      ====================================================== */}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Data Refresh
            </h2>

            <p style={styles.cardSubtitle}>
              Configure the refresh interval used by
              admin pages
            </p>
          </div>
        </div>

        <div style={styles.singleSetting}>
          <div>
            <div style={styles.settingTitle}>
              Refresh Interval
            </div>

            <div style={styles.settingDescription}>
              Choose how frequently pages that support
              automatic refresh should request updated
              data.
            </div>
          </div>

          <select
            value={refreshInterval}
            onChange={(e) =>
              setRefreshInterval(
                e.target.value
              )
            }
            disabled={!autoRefresh}
            style={{
              ...styles.select,
              opacity: autoRefresh
                ? 1
                : 0.55,
            }}
          >
            <option value="15">
              15 seconds
            </option>

            <option value="30">
              30 seconds
            </option>

            <option value="60">
              1 minute
            </option>

            <option value="120">
              2 minutes
            </option>

            <option value="300">
              5 minutes
            </option>
          </select>
        </div>
      </div>

      {/* ======================================================
          APPEARANCE
      ====================================================== */}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Appearance
            </h2>

            <p style={styles.cardSubtitle}>
              Choose the administrator interface theme
            </p>
          </div>
        </div>

        <div style={styles.themeGrid}>
          <ThemeOption
            title="Light"
            description="Use the standard light administrator interface."
            value="light"
            selected={theme === "light"}
            onClick={() =>
              setTheme("light")
            }
          />

          <ThemeOption
            title="System"
            description="Follow the browser or operating system appearance."
            value="system"
            selected={theme === "system"}
            onClick={() =>
              setTheme("system")
            }
          />
        </div>
      </div>

      {/* ======================================================
          SYSTEM INFORMATION
      ====================================================== */}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              System Information
            </h2>

            <p style={styles.cardSubtitle}>
              Current application configuration
            </p>
          </div>
        </div>

        <div style={styles.infoGrid}>
          <InfoItem
            label="Backend"
            value="http://localhost:5000"
          />

          <InfoItem
            label="API Base"
            value="http://localhost:5000/api"
          />

          <InfoItem
            label="Authentication"
            value="Admin JWT"
          />

          <InfoItem
            label="Blockchain"
            value="Connected through project configuration"
          />
        </div>
      </div>

      {/* ======================================================
          ACCOUNT ACTIONS
      ====================================================== */}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Account Actions
            </h2>

            <p style={styles.cardSubtitle}>
              Administrator session controls
            </p>
          </div>
        </div>

        <div style={styles.actionArea}>
          <div>
            <div style={styles.settingTitle}>
              Sign out
            </div>

            <div style={styles.settingDescription}>
              End the current administrator session
              and return to the admin login page.
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ======================================================
          RESET
      ====================================================== */}

      <div style={styles.bottomActions}>
        <button
          type="button"
          onClick={resetSettings}
          style={styles.resetButton}
        >
          Restore Default Settings
        </button>
      </div>
    </div>
  );
};

// ============================================================
// SETTING ROW
// ============================================================

const SettingRow = ({
  title,
  description,
  enabled,
  onChange,
}) => {
  return (
    <div style={styles.settingRow}>
      <div style={{ flex: 1 }}>
        <div style={styles.settingTitle}>
          {title}
        </div>

        <div style={styles.settingDescription}>
          {description}
        </div>
      </div>

      <button
        type="button"
        onClick={onChange}
        aria-label={title}
        style={{
          ...styles.toggle,
          background: enabled
            ? "#15803d"
            : "#cbd5e1",
        }}
      >
        <span
          style={{
            ...styles.toggleCircle,
            transform: enabled
              ? "translateX(20px)"
              : "translateX(0)",
          }}
        ></span>
      </button>
    </div>
  );
};

// ============================================================
// THEME OPTION
// ============================================================

const ThemeOption = ({
  title,
  description,
  value,
  selected,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.themeOption,
        border: selected
          ? "2px solid #15803d"
          : "1px solid #e2e8f0",
        background: selected
          ? "#f0fdf4"
          : "#ffffff",
      }}
    >
      <div
        style={{
          ...styles.radio,
          borderColor: selected
            ? "#15803d"
            : "#cbd5e1",
        }}
      >
        {selected && (
          <span
            style={styles.radioDot}
          ></span>
        )}
      </div>

      <div>
        <div style={styles.themeTitle}>
          {title}
        </div>

        <div style={styles.themeDescription}>
          {description}
        </div>
      </div>
    </button>
  );
};

// ============================================================
// INFO ITEM
// ============================================================

const InfoItem = ({
  label,
  value,
}) => {
  return (
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>
        {label}
      </span>

      <span style={styles.infoValue}>
        {value}
      </span>
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

  saveButton: {
    border: "none",
    borderRadius: "8px",
    padding: "11px 17px",
    background: "#15803d",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },

  successBox: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "13px 16px",
    marginBottom: "20px",
    borderRadius: "9px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: "13px",
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

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "20px",
    padding: "22px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  label: {
    fontSize: "12px",
    color: "#475569",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "11px 12px",
    fontSize: "13px",
    color: "#334155",
    outline: "none",
    background: "#ffffff",
  },

  fieldHint: {
    fontSize: "10px",
    color: "#94a3b8",
  },

  settingsList: {
    padding: "0 20px",
  },

  settingRow: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    padding: "20px 0",
    borderBottom:
      "1px solid #f1f5f9",
  },

  settingTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#334155",
    marginBottom: "5px",
  },

  settingDescription: {
    fontSize: "11px",
    lineHeight: 1.5,
    color: "#94a3b8",
  },

  toggle: {
    width: "44px",
    height: "24px",
    minWidth: "44px",
    border: "none",
    borderRadius: "999px",
    padding: "2px",
    cursor: "pointer",
    transition:
      "background 0.2s ease",
  },

  toggleCircle: {
    display: "block",
    width: "20px",
    height: "20px",
    background: "#ffffff",
    borderRadius: "50%",
    transition:
      "transform 0.2s ease",
    boxShadow:
      "0 1px 3px rgba(0,0,0,0.2)",
  },

  singleSetting: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "22px",
  },

  select: {
    minWidth: "160px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "12px",
    color: "#334155",
    background: "#ffffff",
    outline: "none",
  },

  themeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "15px",
    padding: "22px",
  },

  themeOption: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    textAlign: "left",
    padding: "16px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  radio: {
    width: "18px",
    height: "18px",
    minWidth: "18px",
    border: "2px solid",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "1px",
  },

  radioDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#15803d",
  },

  themeTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#334155",
    marginBottom: "4px",
  },

  themeDescription: {
    fontSize: "11px",
    color: "#94a3b8",
    lineHeight: 1.5,
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "1px",
    background: "#e2e8f0",
  },

  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "17px 20px",
    background: "#ffffff",
  },

  infoLabel: {
    fontSize: "10px",
    color: "#94a3b8",
    fontWeight: 700,
    textTransform: "uppercase",
  },

  infoValue: {
    fontSize: "12px",
    color: "#334155",
    fontWeight: 600,
    wordBreak: "break-word",
  },

  actionArea: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "22px",
  },

  logoutButton: {
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "10px 18px",
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  bottomActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "20px",
  },

  resetButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "10px 16px",
    background: "#ffffff",
    color: "#475569",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default Settings;