import React, { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5000/api";

const LandVerification = () => {
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selectedLand, setSelectedLand] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const getAdminToken = () =>
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token");

  // =========================================================
  // FETCH LANDS
  // =========================================================

  const fetchLands = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAdminToken();

      if (!token) {
        throw new Error("Admin session expired. Please login again.");
      }

      const response = await fetch(`${API_URL}/admin/lands`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load land records"
        );
      }

      const records =
        Array.isArray(data)
          ? data
          : data.lands ||
            data.data ||
            data.records ||
            [];

      setLands(records);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLands();
  }, []);

  // =========================================================
  // STATUS COUNTS
  // =========================================================

  const pendingCount = lands.filter(
    (land) =>
      String(land.verification_status || "")
        .toUpperCase() === "PENDING"
  ).length;

  const verifiedCount = lands.filter(
    (land) =>
      String(land.verification_status || "")
        .toUpperCase() === "VERIFIED"
  ).length;

  const rejectedCount = lands.filter(
    (land) =>
      String(land.verification_status || "")
        .toUpperCase() === "REJECTED"
  ).length;

  const totalCount = lands.length;

  // =========================================================
  // DISTRICTS
  // =========================================================

  const districts = useMemo(() => {
    return [
      ...new Set(
        lands
          .map((land) => land.district)
          .filter(Boolean)
      ),
    ];
  }, [lands]);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredLands = useMemo(() => {
    return lands.filter((land) => {
      const status = String(
        land.verification_status || ""
      ).toUpperCase();

      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter;

      const matchesDistrict =
        districtFilter === "ALL" ||
        land.district === districtFilter;

      const searchText = search
        .toLowerCase()
        .trim();

      const matchesSearch =
        !searchText ||
        String(land.land_id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(land.seller_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(land.seller_email || "")
          .toLowerCase()
          .includes(searchText) ||
        String(land.survey_number || "")
          .toLowerCase()
          .includes(searchText) ||
        String(land.village || "")
          .toLowerCase()
          .includes(searchText);

      return (
        matchesStatus &&
        matchesDistrict &&
        matchesSearch
      );
    });
  }, [
    lands,
    statusFilter,
    districtFilter,
    search,
  ]);

  // =========================================================
  // VERIFY LAND
  // =========================================================

  const verifyLand = async (land) => {
    const landId = land?.id;
    const displayLandId = land?.land_id || `LAND-${landId}`;

    if (!landId) {
      alert("This land record does not contain a valid database ID.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to verify ${displayLandId}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      const token = getAdminToken();

      if (!token) {
        throw new Error("Admin session expired. Please login again.");
      }

      const response = await fetch(
        `${API_URL}/admin/lands/${encodeURIComponent(landId)}/verify`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      let data = {};

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      /*
       * Important: the blockchain is NOT involved in Admin land verification.
       * Admin verification only changes the MySQL land verification status.
       * The Seller registers the already-verified land on Ganache afterwards.
       *
       * A 404 with "Pending land record not found" can happen when the
       * record was already changed to VERIFIED by an earlier click/request.
       * Therefore we refresh the list before treating that response as a real
       * failure.
       */
      if (!response.ok) {
        await fetchLands();

        const latest = lands.find(
          (item) => String(item.id) === String(landId)
        );

        const latestStatus = String(
          latest?.verification_status || ""
        ).toUpperCase();

        if (latestStatus === "VERIFIED") {
          setSelectedLand(null);
          alert(
            `${displayLandId} is already verified. Seller can now register it on Ganache.`
          );
          return;
        }

        throw new Error(
          data.message ||
            `Failed to verify ${displayLandId}.`
        );
      }

      // Refresh from MySQL so the table and modal use the real saved status.
      await fetchLands();

      // fetchLands updates React state asynchronously. Read the current record
      // directly once more to verify that the backend actually saved VERIFIED.
      const verifyCheckResponse = await fetch(
        `${API_URL}/admin/lands`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (verifyCheckResponse.ok) {
        const verifyCheckData = await verifyCheckResponse.json();
        const latestRecords = Array.isArray(verifyCheckData)
          ? verifyCheckData
          : verifyCheckData.lands ||
            verifyCheckData.data ||
            verifyCheckData.records ||
            [];

        const updatedLand = latestRecords.find(
          (item) => String(item.id) === String(landId)
        );

        if (
          String(updatedLand?.verification_status || "").toUpperCase() !==
          "VERIFIED"
        ) {
          throw new Error(
            "The server accepted the request, but the land is still not marked VERIFIED in the database. Please refresh the Admin page and check the record."
          );
        }
      }

      setSelectedLand(null);

      alert(
        `${displayLandId} verified successfully. The Seller can now register this land on Ganache.`
      );
    } catch (err) {
      console.error("Verify land error:", err);
      alert(err?.message || "Failed to verify land.");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // REJECT LAND
  // =========================================================

  const rejectLand = async (land) => {
    const reason = window.prompt(
      "Enter rejection reason:"
    );

    if (reason === null) return;

    if (!reason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    try {
      setActionLoading(true);

      const token = getAdminToken();

      if (!token) {
        throw new Error("Admin session expired. Please login again.");
      }

      const response = await fetch(
        `${API_URL}/admin/lands/${land.id}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: reason.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to reject land"
        );
      }

      setSelectedLand(null);

      await fetchLands();

      alert("Land rejected successfully.");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const getInitial = (name) => {
    if (!name) return "P";

    return name
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return "—";
    }

    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatArea = (land) => {
    if (!land.area) return "—";

    return `${land.area} ${String(
      land.area_unit || "ACRES"
    ).toUpperCase()}`;
  };

  const getLandType = (land) => {
    return (
      land.land_type ||
      land.usage_type ||
      "—"
    );
  };

  const getStatusClass = (status) => {
    const value = String(status || "")
      .toLowerCase();

    if (value === "verified") return "verified";
    if (value === "rejected") return "rejected";

    return "pending";
  };

  // =========================================================
  // PDF URL
  // =========================================================

  const getDocumentUrl = (documentPath) => {
    if (!documentPath) return "";

    const path = String(documentPath).trim();

    if (!path) return "";

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `http://localhost:5000/${path.replace(/^\/+/, "")}`;
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <>
      <style>{landVerificationCSS}</style>

      <div className="seller-content">

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div className="page-heading">
          <h1>
            Land Verification
          </h1>

          <p>
            Review submitted land information and
            supporting official documents before
            approving registration.
          </p>
        </div>

        {/* ===================================================
            STAT CARDS
        =================================================== */}

        <div className="stats-grid">

          {/* PENDING */}

          <div className="stat-card">
            <div className="stat-icon yellow">
              ◷
            </div>

            <div>
              <span>
                Pending
              </span>

              <strong>
                {pendingCount}
              </strong>

              <small>
                Awaiting verification
              </small>
            </div>
          </div>

          {/* VERIFIED */}

          <div className="stat-card">
            <div className="stat-icon green">
              ✓
            </div>

            <div>
              <span>
                Verified
              </span>

              <strong>
                {verifiedCount}
              </strong>

              <small>
                Approved records
              </small>
            </div>
          </div>

          {/* REJECTED */}

          <div className="stat-card">
            <div className="stat-icon red">
              ×
            </div>

            <div>
              <span>
                Rejected
              </span>

              <strong>
                {rejectedCount}
              </strong>

              <small>
                Rejected records
              </small>
            </div>
          </div>

          {/* TOTAL */}

          <div className="stat-card">
            <div className="stat-icon blue">
              ◇
            </div>

            <div>
              <span>
                Total Records
              </span>

              <strong>
                {totalCount}
              </strong>

              <small>
                Land submissions
              </small>
            </div>
          </div>

        </div>

        {/* ===================================================
            FILTER TOOLBAR
        =================================================== */}

        <div className="land-filter-panel">

          <div className="land-filter-left">

            <div className="land-search">

              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search land ID, seller, survey number..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            <select
              value={districtFilter}
              onChange={(e) =>
                setDistrictFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Districts
              </option>

              {districts.map((district) => (
                <option
                  key={district}
                  value={district}
                >
                  {district}
                </option>
              ))}

            </select>

          </div>

          <button
            className="outline-button"
            onClick={fetchLands}
            disabled={loading}
          >
            ↻ Refresh
          </button>

        </div>

        {/* ===================================================
            STATUS FILTERS
        =================================================== */}

        <div className="filter-tabs">

          <button
            className={`filter-tab ${
              statusFilter === "ALL"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setStatusFilter("ALL")
            }
          >
            All ({totalCount})
          </button>

          <button
            className={`filter-tab ${
              statusFilter === "PENDING"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setStatusFilter("PENDING")
            }
          >
            Pending ({pendingCount})
          </button>

          <button
            className={`filter-tab ${
              statusFilter === "VERIFIED"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setStatusFilter("VERIFIED")
            }
          >
            Verified ({verifiedCount})
          </button>

          <button
            className={`filter-tab ${
              statusFilter === "REJECTED"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setStatusFilter("REJECTED")
            }
          >
            Rejected ({rejectedCount})
          </button>

        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="alert error">

            {error}

            <button
              className="secondary-button"
              onClick={fetchLands}
              style={{
                marginLeft: "12px",
                height: "30px",
              }}
            >
              Retry
            </button>

          </div>
        )}

        {/* ===================================================
            LAND TABLE PANEL
        =================================================== */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Land Verification Requests
              </h2>

              <span
                style={{
                  display: "block",
                  marginTop: "4px",
                }}
              >
                {filteredLands.length} records found
              </span>

            </div>

          </div>

          {/* LOADING */}

          {loading ? (

            <div className="state-box">
              Loading land verification
              requests...
            </div>

          ) : filteredLands.length === 0 ? (

            <div className="empty-box">

              <div className="empty-icon">
                ◇
              </div>

              <h3>
                No land records found
              </h3>

              <p>
                There are no land records matching
                the selected filters.
              </p>

            </div>

          ) : (

            <div className="table-wrap">

              <table>

                <thead>

                  <tr>

                    <th>
                      LAND ID
                    </th>

                    <th>
                      SELLER
                    </th>

                    <th>
                      SURVEY / SUBDIVISION
                    </th>

                    <th>
                      LOCATION
                    </th>

                    <th>
                      AREA
                    </th>

                    <th>
                      LAND TYPE
                    </th>

                    <th>
                      STATUS
                    </th>

                    <th>
                      ACTION
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredLands.map((land) => {

                    const status =
                      String(
                        land.verification_status ||
                        "PENDING"
                      ).toUpperCase();

                    return (

                      <tr
                        key={land.id}
                        className="clickable-row"
                      >

                        {/* LAND ID */}

                        <td>

                          <div className="land-id-cell">

                            <strong>
                              {land.land_id ||
                                "LAND-" + land.id}
                            </strong>

                            <small>
                              Submitted{" "}
                              {formatDate(
                                land.created_at
                              )}
                            </small>

                          </div>

                        </td>

                        {/* SELLER */}

                        <td>

                          <div className="seller-table-cell">

                            <div className="table-avatar">

                              {getInitial(
                                land.seller_name
                              )}

                            </div>

                            <div>

                              <strong>
                                {land.seller_name ||
                                  "Unknown Seller"}
                              </strong>

                              <small>
                                {land.seller_email ||
                                  "—"}
                              </small>

                            </div>

                          </div>

                        </td>

                        {/* SURVEY */}

                        <td>

                          <div className="survey-cell">

                            <strong>
                              {land.survey_number ||
                                "—"}
                            </strong>

                            <small>
                              Subdivision:{" "}
                              {land.subdivision_number ||
                                "—"}
                            </small>

                          </div>

                        </td>

                        {/* LOCATION */}

                        <td>

                          <div className="location-cell">

                            <strong>
                              {land.village ||
                                "—"}
                            </strong>

                            <small>
                              {land.taluk ||
                                "—"}
                              {" · "}
                              {land.district ||
                                "—"}
                            </small>

                          </div>

                        </td>

                        {/* AREA */}

                        <td>

                          <strong className="area-cell">
                            {formatArea(land)}
                          </strong>

                        </td>

                        {/* LAND TYPE */}

                        <td>

                          <div className="land-type-cell">

                            <strong>
                              {getLandType(land)}
                            </strong>

                            <small>
                              {land.usage_type ||
                                land.land_type ||
                                "—"}
                            </small>

                          </div>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`status-badge ${getStatusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>

                        </td>

                        {/* ACTION */}

                        <td>

                          <button
                            className="review-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLand(land);
                            }}
                          >
                            Review
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

      </div>

      {/* =====================================================
          REVIEW MODAL
      ===================================================== */}

      {selectedLand && (

        <div
          className="land-modal-overlay"
          onClick={() =>
            !actionLoading &&
            setSelectedLand(null)
          }
        >

          <div
            className="land-review-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="land-modal-header">

              <div>

                <span className="eyebrow">
                  LAND VERIFICATION
                </span>

                <h2>
                  {selectedLand.land_id}
                </h2>

                <p>
                  Review submitted land information
                  before verification.
                </p>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedLand(null)
                }
                disabled={actionLoading}
              >
                ×
              </button>

            </div>

            {/* MODAL CONTENT */}

            <div className="land-modal-content">

              {/* SELLER */}

              <div className="review-section">

                <div className="review-section-title">
                  Seller Information
                </div>

                <div className="review-info-grid">

                  <div>
                    <span>
                      Seller Name
                    </span>

                    <strong>
                      {selectedLand.seller_name ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Email
                    </span>

                    <strong>
                      {selectedLand.seller_email ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Seller ID
                    </span>

                    <strong>
                      {selectedLand.seller_id ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Wallet Address
                    </span>

                    <strong className="mono">
                      {selectedLand.wallet_address ||
                        "Not provided"}
                    </strong>
                  </div>

                </div>

              </div>

              {/* LAND */}

              <div className="review-section">

                <div className="review-section-title">
                  Land Information
                </div>

                <div className="review-info-grid">

                  <div>
                    <span>
                      Land ID
                    </span>

                    <strong>
                      {selectedLand.land_id}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Survey Number
                    </span>

                    <strong>
                      {selectedLand.survey_number ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Subdivision Number
                    </span>

                    <strong>
                      {selectedLand.subdivision_number ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Registration Number
                    </span>

                    <strong>
                      {selectedLand.registration_number ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Registration Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedLand.registration_date
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Area
                    </span>

                    <strong>
                      {formatArea(selectedLand)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Land Type
                    </span>

                    <strong>
                      {selectedLand.land_type ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Usage
                    </span>

                    <strong>
                      {selectedLand.usage_type ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Owner Count
                    </span>

                    <strong>
                      {selectedLand.owner_count ||
                        selectedLand.number_of_owners ||
                        "1"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Owner Name
                    </span>

                    <strong>
                      {selectedLand.owner_name ||
                        "—"}
                    </strong>
                  </div>

                  <div className="wide-review-info">
                    <span>
                      Description
                    </span>

                    <strong>
                      {selectedLand.description ||
                        "Not provided"}
                    </strong>
                  </div>

                </div>

              </div>

              {/* LOCATION */}

              <div className="review-section">

                <div className="review-section-title">
                  Land Location
                </div>

                <div className="review-info-grid">

                  <div>
                    <span>
                      District
                    </span>

                    <strong>
                      {selectedLand.district ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Taluk
                    </span>

                    <strong>
                      {selectedLand.taluk ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Village
                    </span>

                    <strong>
                      {selectedLand.village ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Pincode
                    </span>

                    <strong>
                      {selectedLand.pincode ||
                        "—"}
                    </strong>
                  </div>

                  <div className="wide-review-info">
                    <span>
                      Address
                    </span>

                    <strong>
                      {selectedLand.address ||
                        selectedLand.full_address ||
                        "Not provided"}
                    </strong>
                  </div>

                </div>

              </div>

              {/* OFFICIAL DOCUMENT */}

              <div className="review-section">

                <div className="review-section-title">
                  Supporting Official Document
                </div>

                <div className="document-review-card">

                  <div className="document-review-icon">
                    PDF
                  </div>

                  <div>

                    <strong>
                      Land Registration Documents
                    </strong>

                    <span>
                      Sale deed, ownership certificate,
                      tax receipt and supporting records.
                    </span>

                  </div>

                  {selectedLand.document_path ? (

                    <a
                      href={getDocumentUrl(
                        selectedLand.document_path
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-document-button"
                    >
                      Open PDF
                    </a>

                  ) : (

                    <span className="document-missing">
                      PDF unavailable
                    </span>

                  )}

                </div>

                {/* DOCUMENT HASH */}

                {selectedLand.document_hash && (

                  <div className="document-hash">

                    <span>
                      SHA-256 Document Hash
                    </span>

                    <strong>
                      {selectedLand.document_hash}
                    </strong>

                    <small>
                      This hash was generated from the
                      uploaded PDF and is used to verify
                      document integrity.
                    </small>

                  </div>

                )}

                <div className="document-note">

                  <strong>
                    Verification note
                  </strong>

                  <span>
                    The document hash verifies document
                    integrity. The land information must
                    still be checked against the appropriate
                    official land record/source.
                  </span>

                </div>

              </div>

              {/* BLOCKCHAIN */}

              <div className="review-section">

                <div className="review-section-title">
                  Blockchain Information
                </div>

                <div className="review-info-grid">

                  <div>
                    <span>
                      Blockchain Land ID
                    </span>

                    <strong>
                      {selectedLand.blockchain_land_id ||
                        "Waiting for Seller Registration"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Network
                    </span>

                    <strong>
                      {selectedLand.blockchain_network ||
                        "Ganache Local"}
                    </strong>
                  </div>

                  <div className="wide-review-info">

                    <span>
                      Transaction Hash
                    </span>

                    <strong className="mono">

                      {selectedLand.blockchain_tx_hash ||
                        "Not available"}

                    </strong>

                  </div>

                  <div>
                    <span>
                      Block Number
                    </span>

                    <strong>
                      {selectedLand.blockchain_block_number ??
                        "Not available"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Blockchain Status
                    </span>

                    <strong>
                      {selectedLand.blockchain_tx_hash
                        ? "RECORDED ON BLOCKCHAIN"
                        : String(selectedLand.verification_status || "").toUpperCase() === "VERIFIED"
                        ? "ADMIN VERIFIED — WAITING FOR SELLER REGISTRATION"
                        : "WAITING FOR ADMIN VERIFICATION"}
                    </strong>
                  </div>

                </div>

                <div className="blockchain-note">
                  <strong>Next step:</strong> Admin verification and blockchain registration are two separate steps.
                  After Admin verifies this land, the Seller must register the verified land from the Seller module using MetaMask on Ganache.
                </div>

              </div>

              {/* COORDINATES */}

              <div className="review-section">

                <div className="review-section-title">
                  Location Coordinates
                </div>

                <div className="review-info-grid">

                  <div>
                    <span>
                      Latitude
                    </span>

                    <strong>
                      {selectedLand.latitude ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Longitude
                    </span>

                    <strong>
                      {selectedLand.longitude ||
                        "—"}
                    </strong>
                  </div>

                </div>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="land-modal-footer">

              <button
                className="secondary-button"
                onClick={() =>
                  setSelectedLand(null)
                }
                disabled={actionLoading}
              >
                Close
              </button>

              {String(
                selectedLand.verification_status ||
                  "PENDING"
              ).toUpperCase() === "PENDING" && (

                <>

                  <button
                    className="danger-button"
                    onClick={() =>
                      rejectLand(selectedLand)
                    }
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? "Processing..."
                      : "Reject Land"}
                  </button>

                  <button
                    className="primary-button"
                    onClick={() =>
                      verifyLand(selectedLand)
                    }
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? "Processing..."
                      : "✓ Verify Land"}
                  </button>

                </>

              )}

            </div>

          </div>

        </div>

      )}

    </>
  );
};


/* =============================================================
   SAME SELLER-STYLE CSS
============================================================= */

const landVerificationCSS = `

*{
  box-sizing:border-box
}

button,input,select{
  font:inherit
}

button{
  cursor:pointer
}

button:disabled{
  opacity:.65;
  cursor:not-allowed
}


/* CONTENT */

.seller-content{
  padding:24px 30px 45px;
  max-width:1600px;
  margin:auto
}


/* PAGE HEADING */

.page-heading{
  margin-bottom:20px
}

.page-heading h1{
  margin:0;
  font-size:23px;
  color:#172033
}

.page-heading p{
  margin:6px 0 0;
  color:#687386;
  font-size:14px
}


/* STATS */

.stats-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:18px;
  margin-bottom:22px
}

.stat-card{
  border:1px solid #e5e9ef;
  background:#fff;
  border-radius:11px;
  padding:18px 14px;
  display:flex;
  align-items:center;
  gap:14px;
  text-align:left;
  min-height:114px;
  box-shadow:0 3px 12px rgba(15,23,42,.035);
  transition:.2s
}

.stat-card:hover{
  transform:translateY(-2px);
  box-shadow:0 8px 20px rgba(15,23,42,.07)
}

.stat-icon{
  width:58px;
  height:58px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:25px;
  font-weight:700;
  flex:none
}

.stat-icon.green{
  background:#dff6e6;
  color:#159447
}

.stat-icon.blue{
  background:#e0ebff;
  color:#2c6bed
}

.stat-icon.yellow{
  background:#fff0cb;
  color:#e79500
}

.stat-icon.red{
  background:#ffe2e0;
  color:#db4440
}

.stat-card>div:last-child{
  display:flex;
  flex-direction:column
}

.stat-card span{
  font-size:12px;
  color:#455064;
  margin-bottom:4px
}

.stat-card strong{
  font-size:24px;
  color:#111827
}

.stat-card small{
  color:#159447;
  font-size:11px;
  margin-top:4px
}


/* FILTER PANEL */

.land-filter-panel{
  background:#fff;
  border:1px solid #e4e8ee;
  border-radius:11px;
  padding:14px;
  margin-bottom:13px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
  box-shadow:0 3px 14px rgba(15,23,42,.035)
}

.land-filter-left{
  display:flex;
  gap:10px;
  flex:1
}

.land-search{
  height:38px;
  min-width:320px;
  max-width:480px;
  border:1px solid #d8dee6;
  border-radius:7px;
  display:flex;
  align-items:center;
  padding:0 11px;
  background:#fff
}

.land-search:focus-within{
  border-color:#159447;
  box-shadow:0 0 0 3px rgba(21,148,71,.08)
}

.land-search span{
  color:#98a2b3;
  font-size:18px;
  margin-right:7px
}

.land-search input{
  width:100%;
  height:100%;
  border:0;
  outline:0;
  font-size:11px;
  color:#172033
}

.land-filter-left select{
  height:38px;
  border:1px solid #d8dee6;
  border-radius:7px;
  padding:0 30px 0 11px;
  color:#475467;
  background:#fff;
  font-size:11px;
  outline:none
}

.land-filter-left select:focus{
  border-color:#159447
}

.outline-button{
  background:#fff;
  border:1px solid #d8dee6;
  color:#334155;
  border-radius:6px;
  height:32px;
  padding:0 12px;
  font-size:11px
}

.outline-button:hover{
  border-color:#159447;
  color:#159447
}


/* FILTER TABS */

.filter-tabs{
  display:flex;
  gap:7px;
  margin-bottom:14px;
  flex-wrap:wrap
}

.filter-tab{
  border:1px solid #d8dee6;
  background:#fff;
  border-radius:18px;
  padding:7px 13px;
  font-size:11px;
  color:#475467
}

.filter-tab.active{
  background:#e8f7ee;
  border-color:#a8dfbc;
  color:#087c42;
  font-weight:700
}


/* PANEL */

.panel{
  background:#fff;
  border:1px solid #e4e8ee;
  border-radius:11px;
  box-shadow:0 3px 14px rgba(15,23,42,.035);
  overflow:hidden
}

.panel-header{
  min-height:61px;
  padding:12px 18px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  border-bottom:1px solid #edf0f3
}

.panel-header h2{
  margin:0;
  font-size:17px
}

.panel-header span{
  color:#98a2b3;
  font-size:10px
}


/* TABLE */

.table-wrap{
  width:100%;
  overflow-x:auto
}

table{
  width:100%;
  border-collapse:collapse;
  min-width:1050px
}

th{
  background:#fafbfc;
  color:#374151;
  font-size:10px;
  font-weight:700;
  text-align:left;
  padding:13px 15px;
  border-bottom:1px solid #e8ebef;
  white-space:nowrap
}

td{
  padding:14px 15px;
  font-size:11px;
  border-bottom:1px solid #edf0f3;
  color:#344054;
  white-space:nowrap;
  vertical-align:middle
}

tr:last-child td{
  border-bottom:0
}

.clickable-row:hover{
  background:#f9fbfa
}


/* LAND ID */

.land-id-cell{
  display:flex;
  flex-direction:column;
  gap:5px
}

.land-id-cell strong{
  color:#172033;
  font-size:11px
}

.land-id-cell small{
  color:#98a2b3;
  font-size:9px
}


/* SELLER */

.seller-table-cell{
  display:flex;
  align-items:center;
  gap:9px;
  min-width:180px
}

.table-avatar{
  width:34px;
  height:34px;
  border-radius:50%;
  background:linear-gradient(135deg,#35c978,#16a45d);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:12px;
  font-weight:800;
  flex:none
}

.seller-table-cell>div:last-child{
  display:flex;
  flex-direction:column;
  gap:3px;
  min-width:0
}

.seller-table-cell strong{
  font-size:11px;
  color:#172033
}

.seller-table-cell small{
  color:#98a2b3;
  font-size:9px
}


/* SURVEY */

.survey-cell,
.location-cell,
.land-type-cell{
  display:flex;
  flex-direction:column;
  gap:4px
}

.survey-cell strong,
.location-cell strong,
.land-type-cell strong{
  font-size:11px;
  color:#172033
}

.survey-cell small,
.location-cell small,
.land-type-cell small{
  color:#98a2b3;
  font-size:9px
}

.area-cell{
  color:#172033;
  font-size:11px
}


/* STATUS */

.status-badge{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:25px;
  padding:4px 9px;
  border-radius:6px;
  font-size:9px;
  font-weight:800;
  white-space:nowrap
}

.status-badge.pending{
  background:#fff6dc;
  border:1px solid #f5d58a;
  color:#a15c00
}

.status-badge.verified{
  background:#e4f8e9;
  border:1px solid #b8e9c4;
  color:#15803d
}

.status-badge.rejected{
  background:#ffe8e7;
  border:1px solid #f6b6b4;
  color:#b42318
}


/* REVIEW */

.review-button{
  height:31px;
  border:1px solid #087c42;
  border-radius:6px;
  background:#087c42;
  color:#fff;
  padding:0 14px;
  font-size:10px;
  font-weight:700
}

.review-button:hover{
  background:#056b38
}


/* STATE */

.state-box{
  padding:48px;
  text-align:center;
  color:#667085;
  font-size:13px
}

.empty-box{
  padding:55px 25px;
  text-align:center
}

.empty-icon{
  width:50px;
  height:50px;
  border-radius:50%;
  background:#edf7f0;
  color:#159447;
  display:flex;
  align-items:center;
  justify-content:center;
  margin:0 auto 13px;
  font-size:22px;
  font-weight:800
}

.empty-box h3{
  margin:0;
  font-size:15px
}

.empty-box p{
  max-width:500px;
  margin:8px auto 17px;
  color:#667085;
  font-size:12px;
  line-height:1.6
}


/* ALERT */

.alert{
  padding:11px 13px;
  border-radius:8px;
  font-size:11px;
  font-weight:600;
  margin-bottom:18px
}

.alert.error{
  background:#fff0ef;
  border:1px solid #f2c2bf;
  color:#b42318
}

.secondary-button,
.primary-button,
.danger-button{
  border-radius:7px;
  height:38px;
  padding:0 15px;
  font-size:12px;
  font-weight:700
}

.secondary-button{
  background:#fff;
  border:1px solid #d6dde5;
  color:#344054
}

.primary-button{
  background:#087c42;
  color:#fff;
  border:1px solid #087c42
}

.primary-button:hover{
  background:#056b38
}

.danger-button{
  background:#fff;
  border:1px solid #f2b8b5;
  color:#b42318
}


/* =============================================================
   REVIEW MODAL
============================================================= */

.land-modal-overlay{
  position:fixed;
  inset:0;
  background:rgba(15,23,42,.48);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:25px;
  z-index:100
}

.land-review-modal{
  width:min(1050px,100%);
  max-height:92vh;
  background:#fff;
  border-radius:12px;
  box-shadow:0 25px 70px rgba(15,23,42,.22);
  overflow:hidden;
  display:flex;
  flex-direction:column
}

.land-modal-header{
  padding:20px 23px;
  border-bottom:1px solid #edf0f3;
  display:flex;
  justify-content:space-between;
  gap:20px
}

.eyebrow{
  font-size:9px;
  letter-spacing:1px;
  color:#98a2b3;
  font-weight:800
}

.land-modal-header h2{
  margin:5px 0 4px;
  font-size:21px;
  color:#172033
}

.land-modal-header p{
  margin:0;
  color:#667085;
  font-size:11px
}

.modal-close{
  width:35px;
  height:35px;
  border:0;
  border-radius:7px;
  background:#f5f7f9;
  color:#667085;
  font-size:22px;
  flex:none
}

.modal-close:hover{
  background:#edf0f3
}


/* MODAL CONTENT */

.land-modal-content{
  overflow-y:auto;
  padding:20px 23px
}

.review-section{
  border:1px solid #e3e8ed;
  border-radius:9px;
  margin-bottom:15px;
  overflow:hidden
}

.review-section-title{
  background:#fafbfc;
  border-bottom:1px solid #edf0f3;
  padding:11px 13px;
  font-size:11px;
  font-weight:800;
  color:#344054
}

.review-info-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:0
}

.review-info-grid>div{
  padding:12px 13px;
  border-bottom:1px solid #edf0f3;
  min-width:0
}

.review-info-grid>div:nth-last-child(-n+2){
  border-bottom:0
}

.review-info-grid span{
  display:block;
  color:#98a2b3;
  font-size:9px;
  margin-bottom:4px
}

.review-info-grid strong{
  display:block;
  color:#273142;
  font-size:11px;
  overflow-wrap:anywhere
}

.wide-review-info{
  grid-column:1/-1
}

.mono{
  font-family:monospace!important;
  font-size:10px!important
}


/* DOCUMENT */

.document-review-card{
  display:flex;
  align-items:center;
  gap:12px;
  padding:13px;
  margin:13px;
  border:1px solid #e1e7ed;
  border-radius:8px;
  background:#fbfdfc
}

.document-review-icon{
  width:42px;
  height:42px;
  border-radius:8px;
  background:#ffe8e7;
  color:#b42318;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:10px;
  font-weight:900;
  flex:none
}

.document-review-card>div:nth-child(2){
  flex:1;
  min-width:0
}

.document-review-card strong{
  display:block;
  font-size:11px;
  color:#344054
}

.document-review-card span{
  display:block;
  margin-top:4px;
  color:#667085;
  font-size:9px;
  line-height:1.45
}

.view-document-button{
  height:32px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0 12px;
  border-radius:6px;
  background:#087c42;
  color:#fff;
  text-decoration:none;
  font-size:10px;
  font-weight:700;
  flex:none
}

.view-document-button:hover{
  background:#056b38
}

.document-missing{
  color:#b42318!important;
  font-size:9px!important
}

.document-hash{
  margin:0 13px 12px;
  padding:10px;
  border-radius:7px;
  background:#f7f9fb;
  border:1px solid #e2e8ee
}

.document-hash span{
  display:block;
  color:#98a2b3;
  font-size:9px
}

.document-hash strong{
  display:block;
  margin-top:5px;
  color:#2563eb;
  font-family:monospace;
  font-size:9px;
  overflow-wrap:anywhere
}

.document-hash small{
  display:block;
  margin-top:7px;
  color:#667085;
  font-size:9px;
  line-height:1.45
}

.document-note{
  margin:0 13px 13px;
  padding:11px;
  border-radius:7px;
  background:#fffaf0;
  border:1px solid #f3dfae;
  display:flex;
  flex-direction:column;
  gap:4px
}

.document-note strong{
  font-size:10px;
  color:#92400e
}

.document-note span{
  color:#667085;
  font-size:9px;
  line-height:1.5
}


.blockchain-note{
  margin:0 13px 13px;
  padding:11px 12px;
  border-radius:7px;
  background:#eef7ff;
  border:1px solid #cfe4f7;
  color:#475467;
  font-size:9px;
  line-height:1.55
}

.blockchain-note strong{
  color:#1d4ed8
}


/* MODAL FOOTER */

.land-modal-footer{
  border-top:1px solid #edf0f3;
  padding:12px 18px;
  display:flex;
  justify-content:flex-end;
  gap:8px;
  background:#fff
}


/* =============================================================
   RESPONSIVE
============================================================= */

@media(max-width:1100px){

  .stats-grid{
    grid-template-columns:repeat(2,1fr)
  }

  .land-filter-panel{
    align-items:stretch;
    flex-direction:column
  }

  .land-filter-left{
    width:100%
  }

  .land-search{
    flex:1;
    max-width:none
  }

}


@media(max-width:700px){

  .seller-content{
    padding:18px
  }

  .stats-grid{
    grid-template-columns:1fr
  }

  .land-filter-left{
    flex-direction:column
  }

  .land-search{
    min-width:0
  }

  .review-info-grid{
    grid-template-columns:1fr
  }

  .wide-review-info{
    grid-column:auto
  }

  .land-modal-overlay{
    padding:10px
  }

  .land-review-modal{
    max-height:96vh
  }

  .land-modal-footer{
    flex-wrap:wrap
  }

  .land-modal-footer button{
    flex:1
  }

}

`;

export default LandVerification;