import React, {
  useEffect,
  useState
} from "react";

function BuyerSettings() {

  const [settings, setSettings] = useState({
    emailNotifications: true,
    requestNotifications: true,
    browserNotifications: false,
    autoRefresh: true
  });

  const [saved, setSaved] =
    useState(false);


  // ========================================================
  // LOAD SETTINGS
  // ========================================================

  useEffect(() => {

    try {

      const stored =
        localStorage.getItem(
          "buyerSettings"
        );

      if (stored) {

        setSettings(
          JSON.parse(stored)
        );

      }

    } catch (error) {

      console.error(
        "Settings loading error:",
        error
      );

    }

  }, []);


  // ========================================================
  // CHANGE SETTING
  // ========================================================

  const handleChange = (key) => {

    setSettings(
      (previous) => ({
        ...previous,
        [key]: !previous[key]
      })
    );

    setSaved(false);

  };


  // ========================================================
  // SAVE SETTINGS
  // ========================================================

  const saveSettings = () => {

    localStorage.setItem(
      "buyerSettings",
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);

  };


  // ========================================================
  // RESET SETTINGS
  // ========================================================

  const resetSettings = () => {

    const defaultSettings = {
      emailNotifications: true,
      requestNotifications: true,
      browserNotifications: false,
      autoRefresh: true
    };

    setSettings(
      defaultSettings
    );

    localStorage.setItem(
      "buyerSettings",
      JSON.stringify(
        defaultSettings
      )
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);

  };


  return (

    <div className="settings-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="settings-header">

        <div>

          <div className="page-label">
            Buyer Settings
          </div>

          <h1>
            Settings
          </h1>

          <p>
            Manage your notification and account preferences
          </p>

        </div>

      </div>


      {/* ==================================================
          SETTINGS CARD
      ================================================== */}

      <div className="settings-card">

        {/* ==================================================
            NOTIFICATION SETTINGS
        ================================================== */}

        <div className="settings-section">

          <div className="section-title">

            <span>
              ♧
            </span>

            Notification Preferences

          </div>


          {/* Email Notifications */}

          <div className="setting-row">

            <div className="setting-info">

              <div className="setting-icon">
                ✉
              </div>

              <div>

                <strong>
                  Email Notifications
                </strong>

                <p>
                  Receive important buyer updates by email.
                </p>

              </div>

            </div>


            <button
              className={
                `toggle ${
                  settings.emailNotifications
                    ? "active"
                    : ""
                }`
              }
              onClick={() =>
                handleChange(
                  "emailNotifications"
                )
              }
            >

              <span />

            </button>

          </div>


          {/* Purchase Request Notifications */}

          <div className="setting-row">

            <div className="setting-info">

              <div className="setting-icon">
                ✓
              </div>

              <div>

                <strong>
                  Purchase Request Notifications
                </strong>

                <p>
                  Notify me when my property request status changes.
                </p>

              </div>

            </div>


            <button
              className={
                `toggle ${
                  settings.requestNotifications
                    ? "active"
                    : ""
                }`
              }
              onClick={() =>
                handleChange(
                  "requestNotifications"
                )
              }
            >

              <span />

            </button>

          </div>


          {/* Browser Notifications */}

          <div className="setting-row">

            <div className="setting-info">

              <div className="setting-icon">
                🔔
              </div>

              <div>

                <strong>
                  Browser Notifications
                </strong>

                <p>
                  Allow browser notifications for new activity.
                </p>

              </div>

            </div>


            <button
              className={
                `toggle ${
                  settings.browserNotifications
                    ? "active"
                    : ""
                }`
              }
              onClick={() =>
                handleChange(
                  "browserNotifications"
                )
              }
            >

              <span />

            </button>

          </div>

        </div>


        {/* ==================================================
            APPLICATION SETTINGS
        ================================================== */}

        <div className="settings-section">

          <div className="section-title">

            <span>
              ⚙
            </span>

            Application Preferences

          </div>


          {/* Auto Refresh */}

          <div className="setting-row">

            <div className="setting-info">

              <div className="setting-icon">
                ↻
              </div>

              <div>

                <strong>
                  Automatic Refresh
                </strong>

                <p>
                  Automatically check for new buyer activity.
                </p>

              </div>

            </div>


            <button
              className={
                `toggle ${
                  settings.autoRefresh
                    ? "active"
                    : ""
                }`
              }
              onClick={() =>
                handleChange(
                  "autoRefresh"
                )
              }
            >

              <span />

            </button>

          </div>

        </div>


        {/* ==================================================
            SECURITY
        ================================================== */}

        <div className="settings-section">

          <div className="section-title">

            <span>
              🛡
            </span>

            Security

          </div>


          <div className="security-box">

            <div>

              <strong>
                Account Security
              </strong>

              <p>
                Your authentication token is stored locally
                and used to access protected buyer services.
              </p>

            </div>

            <span className="secure-badge">
              Secure
            </span>

          </div>

        </div>


        {/* ==================================================
            SAVE
        ================================================== */}

        <div className="settings-actions">

          <button
            className="reset-button"
            onClick={resetSettings}
          >
            Reset
          </button>


          <button
            className="save-button"
            onClick={saveSettings}
          >
            Save Settings
          </button>

        </div>


        {saved && (

          <div className="saved-message">

            ✓ Settings saved successfully

          </div>

        )}

      </div>


      <style>{`

        * {
          box-sizing: border-box;
        }

        .settings-page {
          min-height: 100vh;
          background: #f4f8f6;
          padding: 30px;
          color: #1f2937;
        }

        .settings-header {
          max-width: 1000px;
          margin: 0 auto 25px;
        }

        .page-label {
          color: #08734f;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .settings-header h1 {
          margin: 0;
          color: #075e45;
          font-size: 30px;
        }

        .settings-header p {
          color: #6b7280;
          margin-top: 8px;
        }

        .settings-card {
          max-width: 1000px;
          margin: auto;
          background: white;
          border-radius: 18px;
          box-shadow: 0 8px 30px rgba(0,0,0,.07);
          overflow: hidden;
        }

        .settings-section {
          padding: 30px;
          border-bottom: 1px solid #e5e7eb;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #075e45;
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 20px;
        }

        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 18px 0;
          border-bottom: 1px solid #edf1ef;
        }

        .setting-row:last-child {
          border-bottom: none;
        }

        .setting-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .setting-icon {
          width: 45px;
          height: 45px;
          min-width: 45px;
          border-radius: 12px;
          background: #e8f5ef;
          color: #08734f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .setting-info strong {
          display: block;
          color: #1f2937;
          font-size: 15px;
        }

        .setting-info p {
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 13px;
        }

        .toggle {
          width: 48px;
          height: 26px;
          border: none;
          border-radius: 20px;
          background: #d1d5db;
          padding: 3px;
          cursor: pointer;
          transition: .2s;
        }

        .toggle span {
          display: block;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: .2s;
          box-shadow: 0 1px 3px rgba(0,0,0,.2);
        }

        .toggle.active {
          background: #08734f;
        }

        .toggle.active span {
          transform: translateX(22px);
        }

        .security-box {
          background: #f8faf9;
          border: 1px solid #e5ebe8;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .security-box strong {
          color: #075e45;
        }

        .security-box p {
          margin: 6px 0 0;
          color: #6b7280;
          line-height: 1.5;
          font-size: 13px;
        }

        .secure-badge {
          background: #dcfce7;
          color: #15803d;
          padding: 7px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .settings-actions {
          padding: 25px 30px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .reset-button {
          padding: 11px 20px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          cursor: pointer;
          font-weight: 700;
        }

        .save-button {
          padding: 11px 22px;
          border-radius: 8px;
          border: none;
          background: #08734f;
          color: white;
          cursor: pointer;
          font-weight: 700;
        }

        .save-button:hover {
          background: #075e45;
        }

        .saved-message {
          margin: 0 30px 25px;
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          padding: 12px 15px;
          font-weight: 600;
        }

        @media(max-width: 650px) {

          .settings-page {
            padding: 15px;
          }

          .settings-section {
            padding: 22px;
          }

          .setting-row {
            align-items: flex-start;
          }

          .setting-info {
            align-items: flex-start;
          }

          .settings-actions {
            padding: 20px;
          }

        }

      `}</style>

    </div>

  );
}

export default BuyerSettings;