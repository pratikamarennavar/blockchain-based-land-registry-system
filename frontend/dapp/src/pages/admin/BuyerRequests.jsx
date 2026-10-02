import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

const API_BASE_URL = "http://localhost:5000/api";

const BuyerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [selectedRequest, setSelectedRequest] =
    useState(null);


  // ==================================================
  // ADMIN HEADERS
  // ==================================================

  const getAdminHeaders = () => {
    const token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // ==================================================
  // FETCH REQUESTS
  // ==================================================

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/buyer-requests`,
        {
          method: "GET",
          headers: getAdminHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load buyer requests"
        );
      }

      setRequests(
        Array.isArray(data.requests)
          ? data.requests
          : []
      );
    } catch (err) {
      console.error(
        "Buyer requests error:",
        err
      );

      setError(
        err.message ||
          "Unable to load buyer requests"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    fetchRequests();
  }, []);

  // ==================================================
  // GENERIC VALUE HELPER
  // ==================================================

  const getValue = (
    request,
    keys,
    fallback = "-"
  ) => {
    for (const key of keys) {
      if (
        request &&
        request[key] !== undefined &&
        request[key] !== null &&
        request[key] !== ""
      ) {
        return request[key];
      }
    }

    return fallback;
  };

  // ==================================================
  // STATUS
  // ==================================================

  const getStatus = (request) => {
    return String(
      getValue(
        request,
        ["request_status", "status"],
        "PENDING"
      )
    ).toUpperCase();
  };

  // ==================================================
  // BUYER
  // ==================================================

  const getBuyerName = (request) =>
    getValue(request, [
      "buyer_name",
      "buyerName",
      "buyer",
      "name",
    ]);

  const getBuyerEmail = (request) =>
    getValue(request, [
      "buyer_email",
      "buyerEmail",
    ]);

  const getBuyerMobile = (request) =>
    getValue(request, [
      "buyer_mobile",
      "buyerMobile",
    ]);

  // ==================================================
  // SELLER
  // ==================================================

  const getSellerName = (request) =>
    getValue(request, [
      "seller_name",
      "sellerName",
    ]);

  // ==================================================
  // LAND
  // ==================================================

  const getLandId = (request) =>
    getValue(request, [
      "land_code",
      "land_id",
      "landId",
      "property_id",
    ]);

  const getSurveyNumber = (request) =>
    getValue(request, [
      "survey_number",
      "surveyNumber",
    ]);

  // ==================================================
  // LOCATION
  // ==================================================

  const getLocation = (request) => {
    if (!request) return "-";

    const parts = [
      request.village,
      request.taluk,
      request.district,
      request.state,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(", ");
    }

    return getValue(request, [
      "location",
      "land_location",
      "full_address",
    ]);
  };

  // ==================================================
  // DATE
  // ==================================================

  const getRequestedAt = (request) => {
    const value = getValue(request, [
      "requested_at",
      "requestedAt",
      "created_at",
    ]);

    if (value === "-") return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==================================================
  // LAST UPDATED
  // ==================================================

  const getUpdatedAt = (request) => {
    const value = getValue(request, [
      "updated_at",
      "updatedAt",
    ]);

    if (value === "-") return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==================================================
  // STATISTICS
  // ==================================================

  const statistics = useMemo(() => {
    return {
      total: requests.length,

      pending: requests.filter(
        (r) => getStatus(r) === "PENDING"
      ).length,

      approved: requests.filter(
        (r) => getStatus(r) === "APPROVED"
      ).length,

      rejected: requests.filter(
        (r) => getStatus(r) === "REJECTED"
      ).length,

      cancelled: requests.filter(
        (r) => getStatus(r) === "CANCELLED"
      ).length,
    };
  }, [requests]);

  // ==================================================
  // FILTERED REQUESTS
  // ==================================================

  const filteredRequests = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return requests.filter((request) => {
      const status = getStatus(request);

      if (
        statusFilter !== "ALL" &&
        status !== statusFilter
      ) {
        return false;
      }

      if (!searchText) {
        return true;
      }

      const searchableText = [
        getBuyerName(request),
        getBuyerEmail(request),
        getBuyerMobile(request),
        getSellerName(request),
        getLandId(request),
        getSurveyNumber(request),
        getLocation(request),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        searchText
      );
    });
  }, [
    requests,
    search,
    statusFilter,
  ]);

  // ==================================================
  // STATUS CLASS
  // ==================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "br-status br-status-approved";

      case "REJECTED":
        return "br-status br-status-rejected";

      case "CANCELLED":
        return "br-status br-status-cancelled";

      default:
        return "br-status br-status-pending";
    }
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="br-page">
      <style>{`

        .br-page {
          width: 100%;
          color: #172033;
        }

        .br-page *,
        .br-page *::before,
        .br-page *::after {
          box-sizing: border-box;
        }

        /* ===============================
           HEADER
        =============================== */

        .br-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }

        .br-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #172033;
        }

        .br-header p {
          margin: 7px 0 0;
          color: #697386;
          font-size: 14px;
        }

        .br-refresh-btn {
          border: 1px solid #dce5df;
          background: #fff;
          color: #087c42;
          border-radius: 8px;
          padding: 10px 15px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
        }

        .br-refresh-btn:hover {
          background: #f3faf6;
        }

        .br-refresh-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        /* ===============================
           STATISTICS
        =============================== */

        .br-stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .br-stat-card {
          background: #fff;
          border: 1px solid #e5eaf0;
          border-radius: 12px;
          padding: 18px;
          min-height: 112px;
          box-shadow: 0 3px 12px rgba(15,23,42,.035);
        }

        .br-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .br-stat-label {
          font-size: 12px;
          color: #697386;
          font-weight: 700;
        }

        .br-stat-icon {
          width: 35px;
          height: 35px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          background: #eaf8f0;
          color: #159447;
        }

        .br-stat-number {
          margin-top: 13px;
          font-size: 25px;
          font-weight: 800;
          color: #172033;
        }

        /* ===============================
           TOOLBAR
        =============================== */

        .br-toolbar {
          background: #fff;
          border: 1px solid #e5eaf0;
          border-radius: 12px;
          padding: 15px;
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .br-search-wrap {
          flex: 1;
          position: relative;
        }

        .br-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #7b8797;
          font-size: 16px;
        }

        .br-search {
          width: 100%;
          height: 42px;
          border: 1px solid #dce3e9;
          border-radius: 8px;
          padding: 0 13px 0 38px;
          outline: none;
          color: #172033;
          background: #fff;
          font-size: 13px;
        }

        .br-search:focus {
          border-color: #31ad5a;
          box-shadow: 0 0 0 3px rgba(49,173,90,.08);
        }

        .br-filter {
          height: 42px;
          min-width: 160px;
          border: 1px solid #dce3e9;
          border-radius: 8px;
          padding: 0 12px;
          background: #fff;
          color: #344054;
          outline: none;
          font-size: 13px;
        }

        .br-filter:focus {
          border-color: #31ad5a;
        }

        /* ===============================
           TABLE
        =============================== */

        .br-table-card {
          background: #fff;
          border: 1px solid #e5eaf0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 3px 12px rgba(15,23,42,.035);
        }

        .br-table-header {
          padding: 17px 20px;
          border-bottom: 1px solid #edf0f3;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .br-table-header h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
        }

        .br-result-count {
          font-size: 12px;
          color: #697386;
        }

        .br-table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .br-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1080px;
        }

        .br-table th {
          background: #f8faf9;
          color: #697386;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .7px;
          font-weight: 800;
          text-align: left;
          padding: 13px 16px;
          border-bottom: 1px solid #e9edf0;
          white-space: nowrap;
        }

        .br-table td {
          padding: 15px 16px;
          border-bottom: 1px solid #edf0f3;
          font-size: 13px;
          vertical-align: middle;
        }

        .br-table tbody tr:hover {
          background: #fbfdfc;
        }

        .br-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .br-buyer {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .br-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #e5f6ed;
          color: #087c42;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 12px;
          flex: none;
        }

        .br-person-name {
          font-weight: 700;
          color: #172033;
          white-space: nowrap;
        }

        .br-person-sub {
          color: #7b8797;
          font-size: 11px;
          margin-top: 3px;
          white-space: nowrap;
        }

        .br-property-id {
          font-weight: 800;
          color: #087c42;
        }

        .br-survey {
          color: #697386;
          font-size: 11px;
          margin-top: 3px;
        }

        .br-location {
          max-width: 190px;
          color: #4d5969;
          line-height: 1.4;
        }

        /* ===============================
           STATUS
        =============================== */

        .br-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 20px;
          padding: 6px 10px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .3px;
          white-space: nowrap;
        }

        .br-status::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .br-status-pending {
          background: #fff7df;
          color: #a86b00;
        }

        .br-status-approved {
          background: #e9f8ef;
          color: #168344;
        }

        .br-status-rejected {
          background: #ffeded;
          color: #b42318;
        }

        .br-status-cancelled {
          background: #f0f2f4;
          color: #667085;
        }

        /* ===============================
           ACTIONS
        =============================== */

        .br-action-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .br-view-btn,
        .br-approve-btn,
        .br-reject-btn {
          border-radius: 7px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .br-view-btn {
          border: 1px solid #d8e7dd;
          background: #f5fbf7;
          color: #087c42;
        }

        .br-view-btn:hover {
          background: #e7f7ee;
        }

        .br-approve-btn {
          border: 1px solid #bce8cc;
          background: #eaf9f0;
          color: #138441;
        }

        .br-approve-btn:hover {
          background: #d9f4e3;
        }

        .br-reject-btn {
          border: 1px solid #f1c8c5;
          background: #fff5f4;
          color: #b42318;
        }

        .br-reject-btn:hover {
          background: #ffe9e7;
        }

        .br-view-btn:disabled,
        .br-approve-btn:disabled,
        .br-reject-btn:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        /* ===============================
           MODAL ACTIONS
        =============================== */

        .br-modal-actions {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #edf0f3;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .br-modal-approve,
        .br-modal-reject {
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .br-modal-approve {
          border: 1px solid #bce8cc;
          background: #eaf9f0;
          color: #138441;
        }

        .br-modal-approve:hover {
          background: #d9f4e3;
        }

        .br-modal-reject {
          border: 1px solid #f1c8c5;
          background: #fff5f4;
          color: #b42318;
        }

        .br-modal-reject:hover {
          background: #ffe9e7;
        }

        .br-modal-approve:disabled,
        .br-modal-reject:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        /* ===============================
           LOADING / EMPTY / ERROR
        =============================== */

        .br-state {
          padding: 65px 25px;
          text-align: center;
        }

        .br-state-icon {
          font-size: 42px;
          margin-bottom: 12px;
        }

        .br-state h3 {
          margin: 0;
          font-size: 16px;
        }

        .br-state p {
          color: #7b8797;
          font-size: 13px;
          margin: 7px 0 0;
        }

        .br-error {
          margin-bottom: 16px;
          padding: 13px 15px;
          border-radius: 8px;
          background: #fff0f0;
          border: 1px solid #ffd5d5;
          color: #b42318;
          font-size: 13px;
        }

        /* ===============================
           MODAL
        =============================== */

        .br-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 100;
        }

        .br-modal {
          width: min(720px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 25px 70px rgba(15,23,42,.2);
        }

        .br-modal-head {
          padding: 19px 22px;
          border-bottom: 1px solid #edf0f3;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .br-modal-head h2 {
          margin: 0;
          font-size: 18px;
        }

        .br-modal-close {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 7px;
          background: #f5f7f9;
          color: #596579;
          font-size: 18px;
          cursor: pointer;
        }

        .br-modal-close:hover {
          background: #edf2ef;
          color: #087c42;
        }

        .br-modal-body {
          padding: 22px;
        }

        .br-detail-section {
          margin-bottom: 22px;
        }

        .br-detail-section:last-child {
          margin-bottom: 0;
        }

        .br-detail-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .8px;
          color: #087c42;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .br-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .br-detail-item {
          border: 1px solid #edf0f3;
          border-radius: 8px;
          padding: 11px 12px;
          background: #fbfcfc;
        }

        .br-detail-label {
          font-size: 10px;
          color: #7b8797;
          margin-bottom: 4px;
        }

        .br-detail-value {
          font-size: 13px;
          color: #172033;
          font-weight: 650;
          word-break: break-word;
        }

        /* ===============================
           RESPONSIVE
        =============================== */

        @media(max-width: 1100px) {
          .br-stats {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media(max-width: 700px) {
          .br-header {
            flex-direction: column;
          }

          .br-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .br-toolbar {
            flex-direction: column;
          }

          .br-filter {
            width: 100%;
          }

          .br-detail-grid {
            grid-template-columns: 1fr;
          }

          .br-modal-actions {
            flex-direction: column;
          }

          .br-modal-approve,
          .br-modal-reject {
            width: 100%;
          }
        }

        @media(max-width: 450px) {
          .br-stats {
            grid-template-columns: 1fr;
          }
        }

        .br-view-only-note {
          margin-top: 18px;
          padding: 13px 15px;
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          color: #166534;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
        }
      `}</style>

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="br-header">
        <div>
          <h1>Buyer Requests</h1>

          <p>
            Monitor and manage property purchase
            requests submitted by buyers.
          </p>
        </div>

        <button
          className="br-refresh-btn"
          onClick={fetchRequests}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="br-error">
          ⚠ {error}
        </div>
      )}

      {/* ==================================================
          STATISTICS
      ================================================== */}

      <div className="br-stats">

        <div className="br-stat-card">
          <div className="br-stat-top">
            <span className="br-stat-label">
              Total Requests
            </span>

            <div className="br-stat-icon">
              ⇄
            </div>
          </div>

          <div className="br-stat-number">
            {statistics.total}
          </div>
        </div>

        <div className="br-stat-card">
          <div className="br-stat-top">
            <span className="br-stat-label">
              Pending
            </span>

            <div className="br-stat-icon">
              ◷
            </div>
          </div>

          <div className="br-stat-number">
            {statistics.pending}
          </div>
        </div>

        <div className="br-stat-card">
          <div className="br-stat-top">
            <span className="br-stat-label">
              Approved
            </span>

            <div className="br-stat-icon">
              ✓
            </div>
          </div>

          <div className="br-stat-number">
            {statistics.approved}
          </div>
        </div>

        <div className="br-stat-card">
          <div className="br-stat-top">
            <span className="br-stat-label">
              Rejected
            </span>

            <div className="br-stat-icon">
              ×
            </div>
          </div>

          <div className="br-stat-number">
            {statistics.rejected}
          </div>
        </div>

        <div className="br-stat-card">
          <div className="br-stat-top">
            <span className="br-stat-label">
              Cancelled
            </span>

            <div className="br-stat-icon">
              −
            </div>
          </div>

          <div className="br-stat-number">
            {statistics.cancelled}
          </div>
        </div>

      </div>

      {/* ==================================================
          FILTERS
      ================================================== */}

      <div className="br-toolbar">

        <div className="br-search-wrap">

          <span className="br-search-icon">
            ⌕
          </span>

          <input
            className="br-search"
            type="text"
            placeholder="Search buyer, seller, land ID, survey number..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <select
          className="br-filter"
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

          <option value="APPROVED">
            Approved
          </option>

          <option value="REJECTED">
            Rejected
          </option>

          <option value="CANCELLED">
            Cancelled
          </option>
        </select>

      </div>

      {/* ==================================================
          TABLE
      ================================================== */}

      <div className="br-table-card">

        <div className="br-table-header">

          <h2>
            Purchase Requests
          </h2>

          <span className="br-result-count">
            Showing {filteredRequests.length} of{" "}
            {requests.length}
          </span>

        </div>

        {loading ? (
          <div className="br-state">

            <div className="br-state-icon">
              ⏳
            </div>

            <h3>
              Loading buyer requests...
            </h3>

            <p>
              Please wait while the records
              are retrieved.
            </p>

          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="br-state">

            <div className="br-state-icon">
              📭
            </div>

            <h3>
              {requests.length === 0
                ? "No buyer requests submitted"
                : "No matching requests"}
            </h3>

            <p>
              {requests.length === 0
                ? "Purchase requests will appear here when buyers submit requests for verified properties."
                : "Try changing the search or status filter."}
            </p>

          </div>
        ) : (
          <div className="br-table-scroll">

            <table className="br-table">

              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Property</th>
                  <th>Seller</th>
                  <th>Location</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredRequests.map(
                  (request, index) => {

                    const status =
                      getStatus(request);

                    const buyerName =
                      getBuyerName(request);

                    const initials =
                      String(buyerName)
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(
                          (word) =>
                            word[0]
                        )
                        .join("")
                        .toUpperCase() ||
                      "BY";

                    const isPending =
                      status === "PENDING";

                    return (
                      <tr
                        key={
                          request.id ||
                          `${getLandId(
                            request
                          )}-${index}`
                        }
                      >

                        {/* BUYER */}

                        <td>
                          <div className="br-buyer">

                            <div className="br-avatar">
                              {initials}
                            </div>

                            <div>

                              <div className="br-person-name">
                                {buyerName}
                              </div>

                              <div className="br-person-sub">
                                {getBuyerEmail(
                                  request
                                )}
                              </div>

                            </div>

                          </div>
                        </td>

                        {/* PROPERTY */}

                        <td>

                          <div className="br-property-id">
                            {getLandId(
                              request
                            )}
                          </div>

                          <div className="br-survey">
                            Survey:{" "}
                            {getSurveyNumber(
                              request
                            )}
                          </div>

                        </td>

                        {/* SELLER */}

                        <td>

                          <div className="br-person-name">
                            {getSellerName(
                              request
                            )}
                          </div>

                          <div className="br-person-sub">
                            Seller
                          </div>

                        </td>

                        {/* LOCATION */}

                        <td>

                          <div className="br-location">
                            {getLocation(
                              request
                            )}
                          </div>

                        </td>

                        {/* DATE */}

                        <td>
                          {getRequestedAt(
                            request
                          )}
                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={getStatusClass(
                              status
                            )}
                          >
                            {status}
                          </span>

                        </td>

                        {/* ACTION — ADMIN IS VIEW ONLY */}

                        <td>
                          <div className="br-action-wrap">
                            <button
                              className="br-view-btn"
                              onClick={() =>
                                setSelectedRequest(request)
                              }
                            >
                              View Details
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ==================================================
          DETAILS MODAL
      ================================================== */}

      {selectedRequest && (
        <div
          className="br-modal-overlay"
          onClick={() =>
            setSelectedRequest(null)
          }
        >

          <div
            className="br-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="br-modal-head">

              <h2>
                Buyer Request Details
              </h2>

              <button
                className="br-modal-close"
                onClick={() =>
                  setSelectedRequest(null)
                }
              >
                ×
              </button>

            </div>

            <div className="br-modal-body">

              {/* REQUEST */}

              <div className="br-detail-section">

                <div className="br-detail-title">
                  Request Information
                </div>

                <div className="br-detail-grid">

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Request ID
                    </div>

                    <div className="br-detail-value">
                      {getValue(
                        selectedRequest,
                        ["id", "request_id"]
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Status
                    </div>

                    <div className="br-detail-value">

                      <span
                        className={getStatusClass(
                          getStatus(
                            selectedRequest
                          )
                        )}
                      >
                        {getStatus(
                          selectedRequest
                        )}
                      </span>

                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Requested At
                    </div>

                    <div className="br-detail-value">
                      {getRequestedAt(
                        selectedRequest
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Last Updated
                    </div>

                    <div className="br-detail-value">
                      {getUpdatedAt(
                        selectedRequest
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* BUYER */}

              <div className="br-detail-section">

                <div className="br-detail-title">
                  Buyer Information
                </div>

                <div className="br-detail-grid">

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Name
                    </div>

                    <div className="br-detail-value">
                      {getBuyerName(
                        selectedRequest
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Email
                    </div>

                    <div className="br-detail-value">
                      {getBuyerEmail(
                        selectedRequest
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Mobile
                    </div>

                    <div className="br-detail-value">
                      {getBuyerMobile(
                        selectedRequest
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Buyer ID
                    </div>

                    <div className="br-detail-value">
                      {getValue(
                        selectedRequest,
                        [
                          "buyer_id",
                          "buyerId",
                        ]
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Buyer Verification
                    </div>

                    <div className="br-detail-value">
                      {getValue(
                        selectedRequest,
                        [
                          "buyer_verification_status",
                        ]
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* PROPERTY */}

              <div className="br-detail-section">

                <div className="br-detail-title">
                  Property Information
                </div>

                <div className="br-detail-grid">

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Land ID
                    </div>

                    <div className="br-detail-value">
                      {getLandId(
                        selectedRequest
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Survey Number
                    </div>

                    <div className="br-detail-value">
                      {getSurveyNumber(
                        selectedRequest
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Location
                    </div>

                    <div className="br-detail-value">
                      {getLocation(
                        selectedRequest
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Area
                    </div>

                    <div className="br-detail-value">
                      {getValue(
                        selectedRequest,
                        ["area"]
                      )}{" "}
                      {getValue(
                        selectedRequest,
                        ["area_unit"],
                        ""
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Property Type
                    </div>

                    <div className="br-detail-value">
                      {getValue(
                        selectedRequest,
                        ["land_type"]
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Usage
                    </div>

                    <div className="br-detail-value">
                      {getValue(
                        selectedRequest,
                        ["usage_type"]
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Expected Amount
                    </div>

                    <div className="br-detail-value">
                      {getValue(
                        selectedRequest,
                        [
                          "sale_amount",
                          "expected_sale_amount",
                        ]
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Land Verification
                    </div>

                    <div className="br-detail-value">
                      {getValue(
                        selectedRequest,
                        [
                          "land_verification_status",
                        ]
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* SELLER */}

              <div className="br-detail-section">

                <div className="br-detail-title">
                  Seller Information
                </div>

                <div className="br-detail-grid">

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Seller Name
                    </div>

                    <div className="br-detail-value">
                      {getSellerName(
                        selectedRequest
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Seller Email
                    </div>

                    <div className="br-detail-value">
                      {getValue(
                        selectedRequest,
                        ["seller_email"]
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Seller Mobile
                    </div>

                    <div className="br-detail-value">
                      {getValue(
                        selectedRequest,
                        ["seller_mobile"]
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Seller ID
                    </div>

                    <div className="br-detail-value">
                      {getValue(
                        selectedRequest,
                        ["seller_id"]
                      )}
                    </div>
                  </div>

                  <div className="br-detail-item">
                    <div className="br-detail-label">
                      Seller Verification
                    </div>

                    <div className="br-detail-value">
                      {getValue(
                        selectedRequest,
                        [
                          "seller_verification_status",
                        ]
                      )}
                    </div>
                  </div>

                </div>

              </div>

              <div className="br-view-only-note">
                <strong>Admin is view-only.</strong>
                Seller accepts or rejects the purchase request. The Seller
                performs the blockchain sale through MetaMask and approveSale().
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default BuyerRequests;