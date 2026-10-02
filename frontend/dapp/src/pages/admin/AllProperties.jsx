import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

function AllProperties() {
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedLand, setSelectedLand] = useState(null);

  // =====================================================
  // FETCH ALL PROPERTIES
  // =====================================================

  const fetchProperties = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error("Admin session expired. Please login again.");
      }

      const response = await fetch(`${API_BASE_URL}/admin/lands`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch properties");
      }

      setLands(Array.isArray(data.lands) ? data.lands : []);
    } catch (err) {
      console.error("All properties error:", err);
      setError(err.message || "Failed to load properties");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // =====================================================
  // HELPERS
  // =====================================================

  const getStatus = (land) => {
    const status =
      land.verification_status ||
      land.status ||
      (land.verified === 1 || land.verified === true
        ? "VERIFIED"
        : "PENDING");

    return String(status).toUpperCase();
  };

  // =====================================================
  // OWNER NAME
  // =====================================================

  const getOwnerName = (land) => {
    return (
      land.primary_owner_name ||
      land.owner_name ||
      land.owner ||
      land.primary_owner?.name ||
      land.seller_name ||
      "—"
    );
  };

  // =====================================================
  // OWNER MOBILE
  // =====================================================

  const getOwnerMobile = (land) => {
    return (
      land.primary_owner_mobile ||
      land.owner_mobile ||
      land.mobile ||
      land.primary_owner?.mobile ||
      land.seller_mobile ||
      "—"
    );
  };

  // =====================================================
  // USAGE
  // =====================================================

  const getUsage = (land) => {
    return (
      land.usage ||
      land.usage_type ||
      land.land_usage ||
      land.purpose ||
      land.land_purpose ||
      "—"
    );
  };

  // =====================================================
  // SALE AMOUNT
  // =====================================================

  const getSaleAmount = (land) => {
    const amount =
      land.expected_sale_amount ??
      land.sale_amount ??
      land.land_amount ??
      land.expected_amount ??
      null;

    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {
      return "—";
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount)) {
      return `₹${amount}`;
    }

    return `₹${numericAmount.toLocaleString("en-IN")}`;
  };

  // =====================================================
  // BLOCK NUMBER
  // =====================================================

  const getBlockNumber = (land) => {
    return (
      land.block_number ||
      land.blockchain_block_number ||
      "—"
    );
  };

  // =====================================================
  // TRANSACTION HASH
  // =====================================================

  const getTransactionHash = (land) => {
    return (
      land.blockchain_tx_hash ||
      land.transaction_hash ||
      "—"
    );
  };

  // =====================================================
  // BLOCKCHAIN LAND ID
  // =====================================================

  const getBlockchainLandId = (land) => {
    return (
      land.blockchain_land_id ||
      "—"
    );
  };

  // =====================================================
  // NETWORK
  // =====================================================

  const getBlockchainNetwork = (land) => {
    return (
      land.blockchain_network ||
      land.network ||
      "—"
    );
  };

  // =====================================================
  // DOCUMENT URL
  // =====================================================

  const getDocumentUrl = (land) => {
    if (
      land.document_url
    ) {
      return land.document_url;
    }

    if (
      land.document_path
    ) {
      const cleanPath = String(land.document_path)
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

      return `${window.location.protocol}//${window.location.hostname}:5000/${cleanPath}`;
    }

    if (
      land.land_document
    ) {
      return land.land_document;
    }

    return null;
  };

  // =====================================================
  // STATISTICS
  // =====================================================

  const statistics = useMemo(() => {
    const total = lands.length;

    const verified = lands.filter(
      (land) => getStatus(land) === "VERIFIED"
    ).length;

    const pending = lands.filter(
      (land) => getStatus(land) === "PENDING"
    ).length;

    const rejected = lands.filter(
      (land) => getStatus(land) === "REJECTED"
    ).length;

    return {
      total,
      verified,
      pending,
      rejected,
    };
  }, [lands]);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredLands = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return lands.filter((land) => {
      const status = getStatus(land);

      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter;

      if (!searchText) {
        return matchesStatus;
      }

      const searchableText = [
        land.land_id,
        land.blockchain_land_id,

        getOwnerName(land),
        getOwnerMobile(land),

        land.owner_name,
        land.owner,
        land.seller_name,
        land.seller_mobile,

        land.location,
        land.address,
        land.full_address,

        land.survey_number,
        land.subdivision_number,
        land.registration_number,

        land.district,
        land.taluk,
        land.village,
        land.state,
        land.pincode,

        land.land_type,
        land.usage,
        land.usage_type,

        land.wallet_address,
        land.seller_wallet_address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        searchableText.includes(searchText)
      );
    });
  }, [lands, search, statusFilter]);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // FORMAT AREA
  // =====================================================

  const formatArea = (land) => {
    if (
      land.area === null ||
      land.area === undefined ||
      land.area === ""
    ) {
      return "—";
    }

    const area = Number(land.area);

    if (Number.isNaN(area)) {
      return `${land.area}${
        land.area_unit
          ? ` ${land.area_unit}`
          : ""
      }`;
    }

    return `${area}${
      land.area_unit
        ? ` ${land.area_unit}`
        : ""
    }`;
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const statusClass = (status) => {
    switch (status) {
      case "VERIFIED":
        return "property-status verified";

      case "REJECTED":
        return "property-status rejected";

      case "PENDING":
      default:
        return "property-status pending";
    }
  };

  // =====================================================
  // OPEN DETAILS
  // =====================================================

  const openDetails = (land) => {
    setSelectedLand(land);
  };

  const closeDetails = () => {
    setSelectedLand(null);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="all-properties-page">
        <style>{pageStyles}</style>

        <div className="property-loading">
          <div className="property-spinner"></div>
          <p>Loading properties...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="all-properties-page">
      <style>{pageStyles}</style>

      {/* HEADER */}

      <div className="properties-header">
        <div>
          <h1>All Properties</h1>

          <p>
            View and monitor all registered land properties in the
            land registry system.
          </p>
        </div>

        <button
          className="refresh-properties-btn"
          onClick={() => fetchProperties(true)}
          disabled={refreshing}
        >
          <span
            className={
              refreshing ? "refresh-spin" : ""
            }
          >
            ↻
          </span>

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="property-error">
          <strong>
            Unable to load properties
          </strong>

          <span>{error}</span>

          <button
            onClick={() => fetchProperties()}
          >
            Try Again
          </button>
        </div>
      )}

      {/* STAT CARDS */}

      <div className="property-stat-grid">

        <div className="property-stat-card">
          <div className="property-stat-icon total">
            ⌂
          </div>

          <div>
            <span>Total Properties</span>
            <strong>
              {statistics.total}
            </strong>
          </div>
        </div>

        <div className="property-stat-card">
          <div className="property-stat-icon verified">
            ✓
          </div>

          <div>
            <span>Verified</span>
            <strong>
              {statistics.verified}
            </strong>
          </div>
        </div>

        <div className="property-stat-card">
          <div className="property-stat-icon pending">
            ◷
          </div>

          <div>
            <span>Pending</span>
            <strong>
              {statistics.pending}
            </strong>
          </div>
        </div>

        <div className="property-stat-card">
          <div className="property-stat-icon rejected">
            ×
          </div>

          <div>
            <span>Rejected</span>
            <strong>
              {statistics.rejected}
            </strong>
          </div>
        </div>

      </div>

      {/* FILTER BAR */}

      <div className="property-filter-card">

        <div className="property-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search by land ID, owner, location, survey number..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="property-status-filters">

          <button
            className={
              statusFilter === "ALL"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter("ALL")
            }
          >
            All
          </button>

          <button
            className={
              statusFilter === "VERIFIED"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter("VERIFIED")
            }
          >
            Verified
          </button>

          <button
            className={
              statusFilter === "PENDING"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter("PENDING")
            }
          >
            Pending
          </button>

          <button
            className={
              statusFilter === "REJECTED"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter("REJECTED")
            }
          >
            Rejected
          </button>

        </div>
      </div>

      {/* TABLE */}

      <div className="property-table-card">

        <div className="property-table-header">
          <div>
            <h2>Registered Properties</h2>

            <span>
              Showing {filteredLands.length} of{" "}
              {lands.length}
            </span>
          </div>
        </div>

        {filteredLands.length === 0 ? (
          <div className="property-empty">

            <div>⌂</div>

            <h3>No properties found</h3>

            <p>
              {lands.length === 0
                ? "No land registration records are available."
                : "No properties match your current search or filter."}
            </p>

          </div>
        ) : (
          <div className="property-table-wrapper">

            <table className="property-table">

              <thead>
                <tr>
                  <th>Land ID</th>
                  <th>Owner</th>
                  <th>Location</th>
                  <th>Survey Number</th>
                  <th>Area</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredLands.map(
                  (land, index) => {

                    const status =
                      getStatus(land);

                    const ownerName =
                      getOwnerName(land);

                    return (
                      <tr
                        key={
                          land.id ||
                          land.land_id ||
                          land.blockchain_land_id ||
                          index
                        }
                      >

                        <td>
                          <strong className="land-id">
                            {land.land_id ||
                              land.blockchain_land_id ||
                              `LAND-${index + 1}`}
                          </strong>
                        </td>

                        <td>

                          <div className="owner-cell">

                            <div className="owner-avatar">
                              {ownerName
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <span>
                              {ownerName}
                            </span>

                          </div>

                        </td>

                        <td>

                          <span className="location-cell">
                            {land.location ||
                              land.address ||
                              land.full_address ||
                              "—"}
                          </span>

                        </td>

                        <td>
                          {land.survey_number ||
                            "—"}
                        </td>

                        <td>
                          {formatArea(land)}
                        </td>

                        <td>

                          <span
                            className={statusClass(
                              status
                            )}
                          >
                            {status}
                          </span>

                        </td>

                        <td>
                          {formatDate(
                            land.created_at ||
                            land.registration_date ||
                            land.registered_on
                          )}
                        </td>

                        <td>

                          <button
                            className="view-property-btn"
                            onClick={() =>
                              openDetails(land)
                            }
                          >
                            View
                          </button>

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

      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      {selectedLand && (

        <div
          className="property-modal-overlay"
          onClick={closeDetails}
        >

          <div
            className="property-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="property-modal-header">

              <div>
                <h2>
                  Property Details
                </h2>

                <p>
                  Complete registered land information
                </p>
              </div>

              <button
                className="property-close-btn"
                onClick={closeDetails}
              >
                ×
              </button>

            </div>

            <div className="property-modal-body">

              {/* =================================================
                  LAND IDENTIFICATION
              ================================================= */}

              <div className="details-section">

                <h3>
                  Land Identification
                </h3>

                <div className="details-grid">

                  <Detail
                    label="Land ID"
                    value={
                      selectedLand.land_id ||
                      selectedLand.blockchain_land_id
                    }
                  />

                  <Detail
                    label="Survey Number"
                    value={
                      selectedLand.survey_number
                    }
                  />

                  <Detail
                    label="Subdivision Number"
                    value={
                      selectedLand.subdivision_number
                    }
                  />

                  <Detail
                    label="Registration Number"
                    value={
                      selectedLand.registration_number
                    }
                  />

                  <Detail
                    label="Registration Date"
                    value={formatDate(
                      selectedLand.registration_date
                    )}
                  />

                  <Detail
                    label="Verification Status"
                    value={getStatus(
                      selectedLand
                    )}
                    status
                  />

                </div>

              </div>

              {/* =================================================
                  LOCATION
              ================================================= */}

              <div className="details-section">

                <h3>
                  Land Location
                </h3>

                <div className="details-grid">

                  <Detail
                    label="District"
                    value={
                      selectedLand.district
                    }
                  />

                  <Detail
                    label="State"
                    value={
                      selectedLand.state
                    }
                  />

                  <Detail
                    label="Taluk"
                    value={
                      selectedLand.taluk
                    }
                  />

                  <Detail
                    label="Village"
                    value={
                      selectedLand.village
                    }
                  />

                  <Detail
                    label="Pincode"
                    value={
                      selectedLand.pincode
                    }
                  />

                  <Detail
                    label="Full Address"
                    value={
                      selectedLand.full_address ||
                      selectedLand.address ||
                      selectedLand.location
                    }
                  />

                </div>

              </div>

              {/* =================================================
                  LAND INFORMATION
              ================================================= */}

              <div className="details-section">

                <h3>
                  Land Information
                </h3>

                <div className="details-grid">

                  <Detail
                    label="Area"
                    value={
                      formatArea(
                        selectedLand
                      )
                    }
                  />

                  <Detail
                    label="Land Type"
                    value={
                      selectedLand.land_type
                    }
                  />

                  <Detail
                    label="Usage"
                    value={
                      getUsage(
                        selectedLand
                      )
                    }
                  />

                  <Detail
                    label="Latitude"
                    value={
                      selectedLand.latitude
                    }
                  />

                  <Detail
                    label="Longitude"
                    value={
                      selectedLand.longitude
                    }
                  />

                  <Detail
                    label="Expected Sale Amount"
                    value={
                      getSaleAmount(
                        selectedLand
                      )
                    }
                  />

                </div>

              </div>

              {/* =================================================
                  OWNER INFORMATION
              ================================================= */}

              <div className="details-section">

                <h3>
                  Owner Information
                </h3>

                <div className="details-grid">

                  <Detail
                    label="Owner Name"
                    value={
                      getOwnerName(
                        selectedLand
                      )
                    }
                  />

                  <Detail
                    label="Owner Mobile"
                    value={
                      getOwnerMobile(
                        selectedLand
                      )
                    }
                  />

                  <Detail
                    label="Wallet Address"
                    value={
                      selectedLand.wallet_address ||
                      selectedLand.seller_wallet_address ||
                      "Wallet not connected"
                    }
                  />

                </div>

              </div>

              {/* =================================================
                  BLOCKCHAIN INFORMATION
              ================================================= */}

              <div className="details-section">

                <h3>
                  Blockchain Information
                </h3>

                <div className="details-grid">

                  <Detail
                    label="Blockchain Land ID"
                    value={
                      getBlockchainLandId(
                        selectedLand
                      )
                    }
                  />

                  <Detail
                    label="Transaction Hash"
                    value={
                      getTransactionHash(
                        selectedLand
                      )
                    }
                  />

                  <Detail
                    label="Block Number"
                    value={
                      getBlockNumber(
                        selectedLand
                      )
                    }
                  />

                  <Detail
                    label="Network"
                    value={
                      getBlockchainNetwork(
                        selectedLand
                      )
                    }
                  />

                </div>

              </div>

              {/* =================================================
                  LAND DOCUMENT
              ================================================= */}

              {getDocumentUrl(
                selectedLand
              ) && (

                <div className="details-section">

                  <h3>
                    Land Document
                  </h3>

                  <div className="document-box">

                    <span>
                      📄 Land registration document
                    </span>

                    <a
                      href={getDocumentUrl(
                        selectedLand
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open PDF
                    </a>

                  </div>

                </div>

              )}

            </div>

            {/* FOOTER */}

            <div className="property-modal-footer">

              <button
                className="modal-close-action"
                onClick={closeDetails}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


// =====================================================
// DETAIL COMPONENT
// =====================================================

function Detail({
  label,
  value,
  status = false
}) {
  let displayValue = value;

  if (
    displayValue === null ||
    displayValue === undefined ||
    displayValue === ""
  ) {
    displayValue = "—";
  }

  return (
    <div className="detail-item">

      <span>{label}</span>

      {status ? (

        <strong
          className={`detail-status ${String(
            displayValue
          ).toLowerCase()}`}
        >
          {displayValue}
        </strong>

      ) : (

        <strong>
          {displayValue}
        </strong>

      )}

    </div>
  );
}


// =====================================================
// PAGE CSS
// =====================================================

const pageStyles = `
.all-properties-page {
  width: 100%;
  padding: 28px;
  box-sizing: border-box;
  color: #173b2a;
}

.properties-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.properties-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #173b2a;
}

.properties-header p {
  margin: 7px 0 0;
  color: #718078;
  font-size: 14px;
}

.refresh-properties-btn {
  border: 1px solid #d8e7de;
  background: #ffffff;
  color: #176b43;
  border-radius: 9px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
}

.refresh-properties-btn:hover {
  background: #f2f9f5;
}

.refresh-properties-btn span {
  display: inline-block;
  margin-right: 7px;
  font-size: 18px;
}

.refresh-spin {
  animation: property-spin 0.8s linear infinite;
}

@keyframes property-spin {
  to {
    transform: rotate(360deg);
  }
}

.property-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 22px;
}

.property-stat-card {
  background: #ffffff;
  border: 1px solid #e4eee8;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(22, 67, 43, 0.04);
}

.property-stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.property-stat-icon.total {
  background: #eaf5ef;
  color: #187348;
}

.property-stat-icon.verified {
  background: #e9f7ef;
  color: #16854c;
}

.property-stat-icon.pending {
  background: #fff6df;
  color: #a66a00;
}

.property-stat-icon.rejected {
  background: #ffeded;
  color: #c63c3c;
}

.property-stat-card span {
  display: block;
  color: #75847c;
  font-size: 13px;
  margin-bottom: 4px;
}

.property-stat-card strong {
  display: block;
  color: #173b2a;
  font-size: 23px;
}

.property-filter-card {
  background: #ffffff;
  border: 1px solid #e4eee8;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.property-search {
  display: flex;
  align-items: center;
  border: 1px solid #dce8e1;
  border-radius: 9px;
  padding: 0 13px;
  height: 44px;
  margin-bottom: 14px;
}

.property-search span {
  color: #718078;
  font-size: 20px;
  margin-right: 9px;
}

.property-search input {
  width: 100%;
  border: 0;
  outline: none;
  font-size: 14px;
  color: #263d31;
  background: transparent;
}

.property-status-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.property-status-filters button {
  border: 1px solid #dce8e1;
  background: #ffffff;
  color: #63736b;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
}

.property-status-filters button:hover {
  background: #f4faf7;
}

.property-status-filters button.active {
  background: #197346;
  border-color: #197346;
  color: #ffffff;
}

.property-table-card {
  background: #ffffff;
  border: 1px solid #e4eee8;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(22, 67, 43, 0.04);
}

.property-table-header {
  padding: 20px;
  border-bottom: 1px solid #e8eee9;
}

.property-table-header h2 {
  margin: 0 0 5px;
  color: #173b2a;
  font-size: 18px;
}

.property-table-header span {
  color: #7a8881;
  font-size: 13px;
}

.property-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.property-table {
  width: 100%;
  min-width: 1050px;
  border-collapse: collapse;
}

.property-table th {
  background: #f7faf8;
  color: #617168;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  padding: 13px 15px;
  white-space: nowrap;
  border-bottom: 1px solid #e6eee9;
}

.property-table td {
  padding: 15px;
  border-bottom: 1px solid #edf2ef;
  color: #35483e;
  font-size: 13px;
  vertical-align: middle;
}

.property-table tbody tr:hover {
  background: #fbfdfc;
}

.land-id {
  color: #176b43;
}

.owner-cell {
  display: flex;
  align-items: center;
  gap: 9px;
  white-space: nowrap;
}

.owner-avatar {
  width: 31px;
  height: 31px;
  border-radius: 50%;
  background: #e6f3eb;
  color: #176b43;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
}

.location-cell {
  display: block;
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-status {
  display: inline-flex;
  align-items: center;
  border-radius: 20px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
}

.property-status.verified {
  background: #e8f7ef;
  color: #16834c;
}

.property-status.pending {
  background: #fff5dc;
  color: #9b6800;
}

.property-status.rejected {
  background: #ffeaea;
  color: #c03939;
}

.view-property-btn {
  border: 1px solid #bcdccc;
  background: #f2faf5;
  color: #176b43;
  border-radius: 7px;
  padding: 7px 13px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.view-property-btn:hover {
  background: #dff2e7;
}

.property-empty {
  text-align: center;
  padding: 55px 20px;
}

.property-empty > div {
  font-size: 35px;
  color: #9aac9f;
}

.property-empty h3 {
  margin: 12px 0 6px;
  color: #33463c;
}

.property-empty p {
  margin: 0;
  color: #7c8a83;
  font-size: 13px;
}

.property-error {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 13px 15px;
  margin-bottom: 20px;
  background: #fff1f1;
  border: 1px solid #f1d1d1;
  border-radius: 9px;
  color: #9e3b3b;
}

.property-error span {
  font-size: 13px;
}

.property-error button {
  margin-left: auto;
  border: 0;
  background: #b84b4b;
  color: #ffffff;
  border-radius: 6px;
  padding: 7px 12px;
  cursor: pointer;
}

.property-loading {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #6e7e75;
}

.property-spinner {
  width: 35px;
  height: 35px;
  border: 3px solid #dcebe2;
  border-top-color: #197346;
  border-radius: 50%;
  animation: property-spin 0.8s linear infinite;
  margin-bottom: 12px;
}

.property-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(18, 37, 28, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 25px;
  z-index: 9999;
}

.property-modal {
  width: min(900px, 100%);
  max-height: 90vh;
  overflow: hidden;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
}

.property-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px;
  border-bottom: 1px solid #e6eee9;
}

.property-modal-header h2 {
  margin: 0;
  color: #173b2a;
  font-size: 20px;
}

.property-modal-header p {
  margin: 5px 0 0;
  color: #7a8881;
  font-size: 13px;
}

.property-close-btn {
  width: 35px;
  height: 35px;
  border: 0;
  border-radius: 50%;
  background: #f1f5f2;
  color: #53635a;
  font-size: 22px;
  cursor: pointer;
}

.property-modal-body {
  padding: 22px;
  overflow-y: auto;
}

.details-section {
  margin-bottom: 25px;
}

.details-section:last-child {
  margin-bottom: 0;
}

.details-section h3 {
  margin: 0 0 13px;
  font-size: 15px;
  color: #176b43;
  padding-bottom: 9px;
  border-bottom: 1px solid #e8eee9;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 13px;
}

.detail-item {
  padding: 11px 13px;
  background: #f8faf9;
  border-radius: 8px;
  min-width: 0;
}

.detail-item > span {
  display: block;
  color: #7b8982;
  font-size: 11px;
  margin-bottom: 5px;
}

.detail-item > strong {
  display: block;
  color: #30443a;
  font-size: 13px;
  word-break: break-word;
}

.detail-status {
  display: inline-block !important;
  width: fit-content;
  padding: 4px 8px;
  border-radius: 15px;
  background: #e8f7ef;
  color: #16834c !important;
}

.detail-status.pending {
  background: #fff5dc;
  color: #9b6800 !important;
}

.detail-status.rejected {
  background: #ffeaea;
  color: #c03939 !important;
}

.document-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 13px 15px;
  background: #f7faf8;
  border: 1px solid #e4eee8;
  border-radius: 9px;
}

.document-box span {
  color: #42554b;
  font-size: 13px;
}

.document-box a {
  color: #176b43;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.document-box a:hover {
  text-decoration: underline;
}

.property-modal-footer {
  padding: 15px 22px;
  border-top: 1px solid #e6eee9;
  display: flex;
  justify-content: flex-end;
}

.modal-close-action {
  border: 1px solid #d5e3da;
  background: #ffffff;
  color: #3d5147;
  border-radius: 8px;
  padding: 9px 18px;
  cursor: pointer;
  font-weight: 600;
}

@media (max-width: 900px) {
  .property-stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .all-properties-page {
    padding: 18px;
  }

  .properties-header {
    flex-direction: column;
  }

  .property-stat-grid {
    grid-template-columns: 1fr;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .property-modal-overlay {
    padding: 10px;
  }

  .property-modal {
    max-height: 95vh;
  }
}
`;

export default AllProperties;