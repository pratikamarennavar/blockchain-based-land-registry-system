import React, {
  useEffect,
  useState,
  useCallback
} from "react";
import "./BuyerNotifications.css";

const API_BASE_URL = "http://localhost:5000/api";

const POLLING_INTERVAL = 10000;


// ==========================================================
// TIME HELPERS
// ==========================================================

const isToday = (dateValue) => {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};


// ==========================================================
// RELATIVE TIME
// ==========================================================

const getRelativeTime = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  const now = new Date();

  const difference = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  // Future timestamp protection
  if (difference < 0) {
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  if (difference < 10) {
    return "Just now";
  }

  if (difference < 60) {
    return `${difference} sec ago`;
  }

  const minutes = Math.floor(difference / 60);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  // Only reached for today's edge cases
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  });
};


// ==========================================================
// NOTIFICATION TYPE
// ==========================================================

const getNotificationType = (status) => {

  const normalized = String(status || "")
    .toUpperCase();

  if (normalized === "APPROVED") {
    return {
      icon: "✓",
      className: "approved",
      title: "Purchase request approved"
    };
  }

  if (normalized === "REJECTED") {
    return {
      icon: "×",
      className: "rejected",
      title: "Purchase request rejected"
    };
  }

  if (normalized === "CANCELLED") {
    return {
      icon: "!",
      className: "cancelled",
      title: "Purchase request cancelled"
    };
  }

  return {
    icon: "↗",
    className: "pending",
    title: "Purchase request sent"
  };
};


// ==========================================================
// CREATE NOTIFICATIONS FROM REQUESTS
// ==========================================================

const buildNotifications = (
  requests,
  previousRequests
) => {

  const notifications = [];

  requests.forEach((request) => {

    const status = String(
      request.request_status || "PENDING"
    ).toUpperCase();

    const currentUpdatedAt =
      request.updated_at ||
      request.requested_at;

    const previous = previousRequests.find(
      (item) =>
        String(item.request_id) ===
        String(request.request_id)
    );


    // ======================================================
    // NEW REQUEST
    // ======================================================

    if (!previous) {

      if (
        request.requested_at &&
        isToday(request.requested_at)
      ) {

        const type =
          getNotificationType("PENDING");

        notifications.push({

          id:
            `request-${request.request_id}-created`,

          request_id:
            request.request_id,

          land_identifier:
            request.land_identifier ||
            request.land_code ||
            "-",

          title:
            type.title,

          message:
            `Your purchase request for ${
              request.land_identifier ||
              request.land_code ||
              "the property"
            } has been sent successfully.`,

          timestamp:
            request.requested_at,

          type:
            type.className,

          icon:
            type.icon

        });
      }

      return;
    }


    // ======================================================
    // STATUS CHANGED
    // ======================================================

    const previousStatus = String(
      previous.request_status || ""
    ).toUpperCase();

    if (
      previousStatus !== status &&
      currentUpdatedAt &&
      isToday(currentUpdatedAt)
    ) {

      const type =
        getNotificationType(status);

      let message =
        `Your purchase request for ${
          request.land_identifier ||
          request.land_code ||
          "the property"
        } has been updated.`;


      if (status === "APPROVED") {

        message =
          `Your purchase request for ${
            request.land_identifier ||
            request.land_code ||
            "the property"
          } has been approved by the seller.`;

      }


      if (status === "REJECTED") {

        message =
          `Your purchase request for ${
            request.land_identifier ||
            request.land_code ||
            "the property"
          } has been rejected.`;

      }


      if (status === "CANCELLED") {

        message =
          `Your purchase request for ${
            request.land_identifier ||
            request.land_code ||
            "the property"
          } has been cancelled.`;

      }


      notifications.push({

        id:
          `request-${request.request_id}-status-${status}-${currentUpdatedAt}`,

        request_id:
          request.request_id,

        land_identifier:
          request.land_identifier ||
          request.land_code ||
          "-",

        title:
          type.title,

        message,

        timestamp:
          currentUpdatedAt,

        type:
          type.className,

        icon:
          type.icon

      });
    }

  });

  return notifications;
};


// ==========================================================
// MAIN COMPONENT
// ==========================================================

function BuyerNotifications() {

  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [lastChecked, setLastChecked] =
    useState(new Date());

  const [previousRequests, setPreviousRequests] =
    useState(() => {

      try {

        const stored =
          localStorage.getItem(
            "buyerNotificationRequests"
          );

        return stored
          ? JSON.parse(stored)
          : [];

      } catch (error) {

        return [];

      }

    });


  // ========================================================
  // LOAD REQUESTS
  // ========================================================

  const loadNotifications = useCallback(
    async (isInitial = false) => {

      try {

        const token =
          localStorage.getItem("buyerToken") ||
          localStorage.getItem("token");


        if (!token) {

          setError(
            "Buyer session expired. Please login again."
          );

          setLoading(false);

          return;
        }


        const response =
          await fetch(
            `${API_BASE_URL}/buyer/requests`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "application/json"
              }
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to load notifications"
          );

        }


        const requests =
          Array.isArray(data.requests)
            ? data.requests
            : [];


        // ====================================================
        // BUILD NEW NOTIFICATIONS
        // ====================================================

        const newNotifications =
          buildNotifications(
            requests,
            previousRequests
          );


        // ====================================================
        // ONLY TODAY
        // ====================================================

        const todayNotifications =
          newNotifications.filter(
            (notification) =>
              isToday(
                notification.timestamp
              )
          );


        // ====================================================
        // KEEP EXISTING TODAY NOTIFICATIONS
        // ====================================================

        setNotifications(
          (currentNotifications) => {

            const combined = [
              ...todayNotifications,
              ...currentNotifications
            ];


            // Remove duplicates

            const unique =
              combined.filter(
                (notification, index, array) =>
                  array.findIndex(
                    (item) =>
                      item.id ===
                      notification.id
                  ) === index
              );


            // Remove yesterday / older

            const todayOnly =
              unique.filter(
                (notification) =>
                  isToday(
                    notification.timestamp
                  )
              );


            // Newest first

            todayOnly.sort(
              (a, b) =>
                new Date(b.timestamp) -
                new Date(a.timestamp)
            );


            return todayOnly;

          }
        );


        // ====================================================
        // SAVE CURRENT REQUEST STATE
        // ====================================================

        localStorage.setItem(
          "buyerNotificationRequests",
          JSON.stringify(requests)
        );


        setPreviousRequests(
          requests
        );


        setLastChecked(
          new Date()
        );


        setError("");

      } catch (err) {

        console.error(
          "Notification error:",
          err
        );

        setError(
          err.message ||
          "Unable to load notifications"
        );

      } finally {

        if (isInitial) {
          setLoading(false);
        }

      }

    },
    [previousRequests]
  );


  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {

    loadNotifications(true);

  }, [loadNotifications]);


  // ========================================================
  // REAL-TIME POLLING
  // ========================================================

  useEffect(() => {

    const interval =
      setInterval(() => {

        loadNotifications(false);

      }, POLLING_INTERVAL);


    return () => {

      clearInterval(interval);

    };

  }, [loadNotifications]);


  // ========================================================
  // REMOVE OLD NOTIFICATIONS
  // ========================================================

  useEffect(() => {

    const cleanup =
      setInterval(() => {

        setNotifications(
          (current) =>
            current.filter(
              (notification) =>
                isToday(
                  notification.timestamp
                )
            )
        );

      }, 60000);


    return () => {

      clearInterval(cleanup);

    };

  }, []);


  // ========================================================
  // CLEAR TODAY'S NOTIFICATIONS
  // ========================================================

  const clearNotifications = () => {

    setNotifications([]);

  };


  // ========================================================
  // OPEN PROPERTY
  // ========================================================

  const openProperty = (landIdentifier) => {

    if (!landIdentifier || landIdentifier === "-") {
      return;
    }

    window.location.href =
      `/buyer/properties/${encodeURIComponent(
        landIdentifier
      )}`;

  };


  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {

    return (

      <div className="notifications-page">

        <div className="notification-loading">

          <div className="loading-circle">
            ♧
          </div>

          <h2>
            Loading notifications...
          </h2>

          <p>
            Checking your latest buyer activity.
          </p>

        </div>

        <style>{notificationStyles}</style>

      </div>

    );

  }


  // ========================================================
  // UI
  // ========================================================

  return (

    <div className="notifications-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="notifications-header">

        <div>

          <div className="page-label">
            Buyer Notifications
          </div>

          <h1>
            Notifications
          </h1>

          <p>
            Your latest buyer activity from today
          </p>

        </div>


        <div className="header-actions">

          <div className="live-indicator">

            <span className="live-dot"></span>

            Live

          </div>


          {notifications.length > 0 && (

            <button
              className="clear-button"
              onClick={clearNotifications}
            >
              Clear Today
            </button>

          )}

        </div>

      </div>


      {/* ==================================================
          REAL-TIME INFO
      ================================================== */}

      <div className="live-info">

        <div className="live-icon">
          ⚡
        </div>

        <div>

          <strong>
            Real-time notifications
          </strong>

          <p>
            Checking for new activity automatically every 10 seconds.
          </p>

        </div>

        <span className="checked-time">

          Last checked{" "}
          {getRelativeTime(lastChecked)}

        </span>

      </div>


      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (

        <div className="error-box">

          ⚠ {error}

        </div>

      )}


      {/* ==================================================
          NOTIFICATIONS
      ================================================== */}

      {notifications.length === 0 ? (

        <div className="empty-notifications">

          <div className="empty-icon">
            ✓
          </div>

          <h2>
            No new notifications
          </h2>

          <p>
            You don't have any buyer activity from today.
          </p>

          <span>
            Notifications from previous days are automatically hidden.
          </span>

        </div>

      ) : (

        <div className="notification-list">

          {notifications.map(
            (notification) => (

              <div
                className="notification-card"
                key={notification.id}

                onClick={() =>
                  openProperty(
                    notification.land_identifier
                  )
                }

                role="button"
                tabIndex={0}

                onKeyDown={(event) => {

                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {

                    openProperty(
                      notification.land_identifier
                    );

                  }

                }}
              >

                <div
                  className={
                    `notification-icon ${notification.type}`
                  }
                >
                  {notification.icon}
                </div>


                <div className="notification-content">

                  <div className="notification-top">

                    <h3>
                      {notification.title}
                    </h3>

                    <span className="notification-time">

                      {getRelativeTime(
                        notification.timestamp
                      )}

                    </span>

                  </div>


                  <p>
                    {notification.message}
                  </p>


                  <div className="notification-meta">

                    <span>
                      Land ID:
                    </span>

                    <strong>
                      {notification.land_identifier}
                    </strong>

                    <span className="click-hint">
                      Click to view →
                    </span>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>

  );

}


// ==========================================================
// COMPLETE CSS
// ==========================================================

const notificationStyles = `

  * {
    box-sizing: border-box;
  }


  .notifications-page {
    min-height: 100vh;
    background: #f4f8f6;
    padding: 30px;
    color: #1f2937;
  }


  /* ========================================================
     HEADER
  ======================================================== */

  .notifications-header {
    max-width: 1100px;
    margin: 0 auto 25px;

    display: flex;
    justify-content: space-between;
    align-items: flex-end;

    gap: 20px;
  }


  .page-label {
    color: #08734f;

    font-size: 14px;
    font-weight: 700;

    margin-bottom: 8px;
  }


  .notifications-header h1 {
    margin: 0;

    color: #075e45;

    font-size: 30px;
  }


  .notifications-header p {
    color: #6b7280;

    margin: 8px 0 0;
  }


  /* ========================================================
     HEADER ACTIONS
  ======================================================== */

  .header-actions {
    display: flex;
    align-items: center;

    gap: 15px;
  }


  .live-indicator {
    display: flex;
    align-items: center;

    gap: 7px;

    color: #08734f;

    font-weight: 700;

    font-size: 13px;
  }


  .live-dot {
    width: 9px;
    height: 9px;

    border-radius: 50%;

    background: #16a34a;

    box-shadow:
      0 0 0 5px #dcfce7;

    animation: pulse 1.5s infinite;
  }


  @keyframes pulse {

    0% {
      box-shadow:
        0 0 0 0 rgba(22,163,74,.4);
    }

    70% {
      box-shadow:
        0 0 0 7px rgba(22,163,74,0);
    }

    100% {
      box-shadow:
        0 0 0 0 rgba(22,163,74,0);
    }

  }


  .clear-button {
    border: 1px solid #d1d5db;

    background: white;

    color: #075e45;

    border-radius: 8px;

    padding: 9px 14px;

    cursor: pointer;

    font-weight: 700;
  }


  .clear-button:hover {
    background: #ecfdf5;
  }


  /* ========================================================
     REAL-TIME INFO
  ======================================================== */

  .live-info {
    max-width: 1100px;

    margin: 0 auto 20px;

    background: #ecfdf5;

    border: 1px solid #bbf7d0;

    border-radius: 14px;

    padding: 15px 18px;

    display: flex;

    align-items: center;

    gap: 14px;
  }


  .live-icon {
    width: 40px;
    height: 40px;

    border-radius: 10px;

    background: #d1fae5;

    color: #08734f;

    display: flex;

    align-items: center;
    justify-content: center;

    font-size: 20px;
  }


  .live-info strong {
    color: #065f46;
  }


  .live-info p {
    margin: 3px 0 0;

    color: #4b5563;

    font-size: 13px;
  }


  .checked-time {
    margin-left: auto;

    color: #6b7280;

    font-size: 12px;

    white-space: nowrap;
  }


  /* ========================================================
     ERROR
  ======================================================== */

  .error-box {
    max-width: 1100px;

    margin: 0 auto 20px;

    padding: 13px 16px;

    background: #fef2f2;

    color: #991b1b;

    border: 1px solid #fecaca;

    border-radius: 10px;
  }


  /* ========================================================
     NOTIFICATION LIST
  ======================================================== */

  .notification-list {
    max-width: 1100px;

    margin: auto;

    display: flex;

    flex-direction: column;

    gap: 13px;
  }


  /* ========================================================
     NOTIFICATION CARD
  ======================================================== */

  .notification-card {

    background: white;

    border-radius: 15px;

    padding: 20px;

    display: flex;

    gap: 17px;

    border: 1px solid #e5ebe8;

    box-shadow:
      0 5px 18px rgba(0,0,0,.05);

    cursor: pointer;

    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }


  .notification-card:hover {

    transform: translateY(-2px);

    border-color: #86efac;

    box-shadow:
      0 8px 22px rgba(7, 94, 69, 0.10);
  }


  .notification-card:focus {

    outline: 2px solid #22c55e;

    outline-offset: 2px;
  }


  .notification-icon {

    width: 45px;
    height: 45px;

    min-width: 45px;

    border-radius: 50%;

    display: flex;

    align-items: center;
    justify-content: center;

    font-size: 21px;

    font-weight: 800;
  }


  .notification-icon.pending {
    background: #dbeafe;
    color: #1d4ed8;
  }


  .notification-icon.approved {
    background: #dcfce7;
    color: #15803d;
  }


  .notification-icon.rejected {
    background: #fee2e2;
    color: #dc2626;
  }


  .notification-icon.cancelled {
    background: #fef3c7;
    color: #b45309;
  }


  /* ========================================================
     CONTENT
  ======================================================== */

  .notification-content {
    flex: 1;

    min-width: 0;
  }


  .notification-top {

    display: flex;

    justify-content: space-between;

    align-items: flex-start;

    gap: 15px;
  }


  .notification-top h3 {

    margin: 0;

    color: #075e45;

    font-size: 16px;
  }


  .notification-time {

    color: #6b7280;

    font-size: 12px;

    white-space: nowrap;
  }


  .notification-content p {

    margin: 8px 0 12px;

    color: #4b5563;

    line-height: 1.5;
  }


  /* ========================================================
     META
  ======================================================== */

  .notification-meta {

    display: flex;

    align-items: center;

    gap: 6px;

    font-size: 12px;

    color: #6b7280;
  }


  .notification-meta strong {
    color: #075e45;
  }


  .click-hint {

    margin-left: auto;

    color: #16a34a;

    font-weight: 700;
  }


  /* ========================================================
     EMPTY
  ======================================================== */

  .empty-notifications {

    max-width: 700px;

    margin: 70px auto;

    background: white;

    border-radius: 18px;

    padding: 50px;

    text-align: center;

    box-shadow:
      0 7px 25px rgba(0,0,0,.06);
  }


  .empty-icon {

    width: 70px;
    height: 70px;

    margin: auto;

    border-radius: 50%;

    background: #dcfce7;

    color: #15803d;

    display: flex;

    align-items: center;
    justify-content: center;

    font-size: 30px;

    font-weight: 800;
  }


  .empty-notifications h2 {

    margin: 20px 0 8px;

    color: #075e45;
  }


  .empty-notifications p {

    margin: 0;

    color: #6b7280;
  }


  .empty-notifications span {

    display: block;

    margin-top: 10px;

    color: #9ca3af;

    font-size: 12px;
  }


  /* ========================================================
     LOADING
  ======================================================== */

  .notification-loading {

    max-width: 700px;

    margin: 100px auto;

    background: white;

    padding: 50px;

    text-align: center;

    border-radius: 18px;

    box-shadow:
      0 7px 25px rgba(0,0,0,.06);
  }


  .loading-circle {

    width: 65px;
    height: 65px;

    margin: auto;

    border-radius: 50%;

    background: #e8f5ef;

    color: #08734f;

    display: flex;

    align-items: center;
    justify-content: center;

    font-size: 28px;
  }


  .notification-loading h2 {

    color: #075e45;

    margin: 20px 0 8px;
  }


  .notification-loading p {

    color: #6b7280;
  }


  /* ========================================================
     RESPONSIVE
  ======================================================== */

  @media(max-width: 700px) {

    .notifications-page {
      padding: 15px;
    }


    .notifications-header {

      align-items: flex-start;

      flex-direction: column;
    }


    .live-info {

      align-items: flex-start;

      flex-wrap: wrap;
    }


    .checked-time {

      width: 100%;

      margin-left: 54px;
    }


    .notification-top {

      flex-direction: column;

      gap: 5px;
    }


    .click-hint {

      display: none;
    }

  }

`;


export default BuyerNotifications;