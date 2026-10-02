import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

function MyProperties() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchaseRequests, setPurchaseRequests] = useState([]);

  const buyerToken = localStorage.getItem("buyerToken");

  useEffect(() => {
    if (!buyerToken) {
      navigate("/buyer/login", {
        replace: true
      });
      return;
    }

    fetchMyProperties();
  }, [buyerToken]);

  const fetchMyProperties = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/buyer/my-properties`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${buyerToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("buyerToken");
        localStorage.removeItem("buyerUser");

        navigate("/buyer/login", {
          replace: true
        });

        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load your properties"
        );
      }

      setProperties(data.properties || []);

      // Load buyer requests so we can display the
      // ownership-transfer information.
      try {
        const requestResponse = await fetch(
          `${API_BASE_URL}/buyer/requests`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${buyerToken}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (requestResponse.ok) {
          const requestData = await requestResponse.json();

          setPurchaseRequests(
            Array.isArray(requestData?.requests)
              ? requestData.requests
              : []
          );
        }
      } catch (requestError) {
        console.warn(
          "Buyer request details could not be loaded:",
          requestError
        );
      }
    } catch (err) {
      console.error("My Properties error:", err);

      setError(
        err.message || "Failed to load your properties"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {
      return "Not specified";
    }

    const number = Number(amount);

    if (Number.isNaN(number)) {
      return amount;
    }

    return `₹${number.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  const formatArea = (property) => {
    if (
      property.area === null ||
      property.area === undefined
    ) {
      return "-";
    }

    return `${property.area} ${
      property.area_unit || ""
    }`;
  };

  const getLocation = (property) => {
    if (property.address) {
      return property.address;
    }

    return [
      property.village,
      property.taluk,
      property.district,
      property.state
    ]
      .filter(Boolean)
      .join(", ") || "-";
  };

  const getStatusClass = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "VERIFIED":
        return "status verified";

      case "REJECTED":
        return "status rejected";

      default:
        return "status pending";
    }
  };

  const findRequestForProperty = (property) => {
    const ids = [
      property?.id,
      property?.land_id,
      property?.blockchain_land_id
    ]
      .filter(
        (value) =>
          value !== null &&
          value !== undefined
      )
      .map((value) => String(value).trim());

    return (
      purchaseRequests.find((request) => {
        const requestIds = [
          request?.land_id,
          request?.land_identifier,
          request?.land_code,
          request?.property_id,
          request?.blockchain_land_id,
          request?.blockchain?.land_id
        ]
          .filter(
            (value) =>
              value !== null &&
              value !== undefined
          )
          .map((value) => String(value).trim());

        return requestIds.some((id) =>
          ids.includes(id)
        );
      }) || null
    );
  };

  /*
   * ==========================================================
   * OWNERSHIP TRANSFER INFORMATION
   * ==========================================================
   *
   * We are NOT generating a PDF here because jspdf is not
   * installed. Instead, the actual ownership-transfer data
   * is displayed directly in My Properties.
   *
   * Once ownership transfer is completed, this section shows:
   *
   * Previous Owner
   * New Owner
   * Blockchain Land ID
   * Network
   * Transaction Hash
   * Block Number
   * Status
   */

  const getTransferHash = (property) => {
    const request =
      findRequestForProperty(property);

    return (
      property?.ownership_transfer_tx_hash ||
      property?.blockchain_tx_hash ||
      property?.blockchain?.transaction_hash ||
      request?.blockchain_tx_hash ||
      request?.blockchain?.transaction_hash ||
      ""
    );
  };

  const getBlockNumber = (property) => {
    const request =
      findRequestForProperty(property);

    return (
      property?.ownership_transfer_block_number ||
      property?.blockchain_block_number ||
      property?.blockchain?.block_number ||
      request?.blockchain_block_number ||
      request?.block_number ||
      "-"
    );
  };

  const getBlockchainLandId = (property) => {
    const request =
      findRequestForProperty(property);

    return (
      property?.blockchain_land_id ||
      property?.blockchain?.land_id ||
      request?.blockchain_land_id ||
      request?.blockchain?.land_id ||
      "-"
    );
  };

  const getNetwork = (property) => {
    const request =
      findRequestForProperty(property);

    return (
      property?.blockchain_network ||
      property?.blockchain?.network ||
      request?.blockchain_network ||
      request?.blockchain?.network ||
      "Ganache Local"
    );
  };

  const getPreviousOwner = (property) => {
    const request =
      findRequestForProperty(property);

    return (
      property?.previous_owner_name ||
      property?.seller_name ||
      request?.seller_name ||
      request?.seller ||
      "-"
    );
  };

  const getPreviousOwnerWallet = (property) => {
    const request =
      findRequestForProperty(property);

    return (
      property?.previous_owner_wallet ||
      property?.seller_wallet_address ||
      property?.seller_wallet ||
      request?.seller_wallet_address ||
      request?.seller_wallet ||
      "-"
    );
  };

  const getBuyerWallet = (property) => {
    return (
      property?.current_owner_wallet ||
      property?.buyer_wallet_address ||
      localStorage.getItem("buyerWallet") ||
      "-"
    );
  };

  const isOwnershipTransferred = (property) => {
    const request =
      findRequestForProperty(property);

    const transactionHash =
      getTransferHash(property);

    const status = String(
      request?.request_status ||
        request?.status ||
        property?.ownership_status ||
        property?.status ||
        ""
    ).toUpperCase();

    return (
      Boolean(transactionHash) ||
      [
        "TRANSFERRED",
        "OWNERSHIP_TRANSFERRED",
        "COMPLETED",
        "SOLD"
      ].includes(status)
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="buyer-page">
        <div className="page-header">
          <div>
            <h1>My Properties</h1>
            <p>
              View properties currently owned by you
            </p>
          </div>
        </div>

        <div className="loading-box">
          <div className="loading-icon">
            🏠
          </div>

          <h2>
            Loading Your Properties
          </h2>

          <p>
            Please wait while we load your properties.
          </p>
        </div>

        <style>{styles}</style>
      </div>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <div className="buyer-page">

      <div className="page-header">
        <div>
          <h1>My Properties</h1>

          <p>
            Properties currently registered under your ownership
          </p>
        </div>

        <button
          className="browse-btn"
          onClick={() =>
            navigate("/buyer/properties")
          }
        >
          Browse Properties
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="error-box">
          <span>{error}</span>

          <button
            onClick={fetchMyProperties}
          >
            Retry
          </button>
        </div>
      )}

      {/* EMPTY */}

      {!error &&
        properties.length === 0 && (
          <div className="empty-box">

            <div className="empty-icon">
              🏠
            </div>

            <h2>
              No Properties Yet
            </h2>

            <p>
              Properties will appear here after
              ownership is transferred to your
              buyer account.
            </p>

            <div className="ownership-note">
              <strong>Important:</strong>

              <span>
                An approved purchase request does
                not transfer ownership. Ownership
                appears here only after the ownership
                transfer is completed.
              </span>
            </div>

            <button
              className="browse-btn"
              onClick={() =>
                navigate("/buyer/properties")
              }
            >
              Browse Properties
            </button>
          </div>
        )}

      {/* PROPERTIES */}

      {properties.length > 0 && (
        <>
          <div className="summary-card">

            <span>
              Total Owned Properties
            </span>

            <strong>
              {properties.length}
            </strong>

          </div>

          <div className="properties-list">

            {properties.map((property) => {

              const publicLandId =
                property.land_id;

              const request =
                findRequestForProperty(property);

              const transferred =
                isOwnershipTransferred(property);

              const transactionHash =
                getTransferHash(property);

              const blockchainLandId =
                getBlockchainLandId(property);

              const blockNumber =
                getBlockNumber(property);

              const network =
                getNetwork(property);

              return (
                <div
                  className="property-card"
                  key={
                    publicLandId ||
                    property.id
                  }
                >

                  {/* HEADER */}

                  <div className="property-card-header">

                    <div>
                      <span className="property-label">
                        LAND ID
                      </span>

                      <h2>
                        {
                          publicLandId ||
                          "Property"
                        }
                      </h2>
                    </div>

                    <span
                      className={
                        getStatusClass(
                          property.verification_status ||
                            "VERIFIED"
                        )
                      }
                    >
                      {
                        property.verification_status ||
                        "VERIFIED"
                      }
                    </span>

                  </div>

                  {/* DETAILS */}

                  <div className="property-details">

                    <div className="detail-section">

                      <h3>
                        Property Details
                      </h3>

                      <div className="detail-grid">

                        <div>
                          <span>Land ID</span>

                          <strong>
                            {
                              publicLandId ||
                              "-"
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Survey Number
                          </span>

                          <strong>
                            {
                              property.survey_number ||
                              "-"
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Subdivision
                          </span>

                          <strong>
                            {
                              property.subdivision_number ||
                              "-"
                            }
                          </strong>
                        </div>

                        <div>
                          <span>Area</span>

                          <strong>
                            {formatArea(property)}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Property Type
                          </span>

                          <strong>
                            {
                              property.land_type ||
                              "-"
                            }
                          </strong>
                        </div>

                        <div>
                          <span>Usage</span>

                          <strong>
                            {
                              property.usage_type ||
                              property.usage ||
                              "-"
                            }
                          </strong>
                        </div>

                        <div>
                          <span>Location</span>

                          <strong>
                            {
                              getLocation(property)
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Property Value
                          </span>

                          <strong>
                            {
                              formatAmount(
                                property.sale_amount ??
                                  property.land_amount
                              )
                            }
                          </strong>
                        </div>

                      </div>
                    </div>

                    {/* OWNERSHIP */}

                    <div className="detail-section">

                      <h3>
                        Ownership Details
                      </h3>

                      <div className="owner-info">

                        <div>
                          <span>
                            Current Owner
                          </span>

                          <strong>
                            {
                              property.current_owner_name ||
                              property.owner_name ||
                              "-"
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Owner Email
                          </span>

                          <strong>
                            {
                              property.current_owner_email ||
                              "-"
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Owner Mobile
                          </span>

                          <strong>
                            {
                              property.current_owner_mobile ||
                              property.owner_mobile ||
                              "-"
                            }
                          </strong>
                        </div>

                      </div>

                    </div>

                    {/* REGISTRATION */}

                    <div className="detail-section">

                      <h3>
                        Registration Details
                      </h3>

                      <div className="owner-info">

                        <div>
                          <span>
                            Registration Number
                          </span>

                          <strong>
                            {
                              property.registration_number ||
                              "-"
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Registration Date
                          </span>

                          <strong>
                            {
                              property.registration_date
                                ? new Date(
                                    property.registration_date
                                  ).toLocaleDateString(
                                    "en-IN"
                                  )
                                : "-"
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            District
                          </span>

                          <strong>
                            {
                              property.district ||
                              "-"
                            }
                          </strong>
                        </div>

                      </div>

                    </div>

                    {/* BLOCKCHAIN */}

                    <div className="detail-section">

                      <h3>
                        Blockchain Information
                      </h3>

                      <div className="owner-info">

                        <div>
                          <span>
                            Blockchain Land ID
                          </span>

                          <strong>
                            {
                              blockchainLandId
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Network
                          </span>

                          <strong>
                            {network}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Transaction Hash
                          </span>

                          <strong className="hash-text">
                            {
                              transactionHash ||
                              "Not available"
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Block Number
                          </span>

                          <strong>
                            {blockNumber}
                          </strong>
                        </div>

                      </div>

                    </div>

                    {/* OWNERSHIP TRANSFER */}

                    {transferred && (
                      <div className="ownership-transfer-section">

                        <div className="transfer-title">
                          <span className="transfer-icon">
                            ✓
                          </span>

                          <div>
                            <h3>
                              Ownership Transfer Completed
                            </h3>

                            <p>
                              This property is now registered
                              under the buyer's ownership.
                            </p>
                          </div>
                        </div>

                        <div className="transfer-grid">

                          <div>
                            <span>
                              Previous Owner
                            </span>

                            <strong>
                              {
                                getPreviousOwner(
                                  property
                                )
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Previous Owner Wallet
                            </span>

                            <strong className="hash-text">
                              {
                                getPreviousOwnerWallet(
                                  property
                                )
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              New Owner
                            </span>

                            <strong>
                              {
                                property.current_owner_name ||
                                property.owner_name ||
                                request?.buyer_name ||
                                "Buyer"
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Buyer Wallet
                            </span>

                            <strong className="hash-text">
                              {
                                getBuyerWallet(property)
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Blockchain Land ID
                            </span>

                            <strong>
                              {
                                blockchainLandId
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Network
                            </span>

                            <strong>
                              {network}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Block Number
                            </span>

                            <strong>
                              {blockNumber}
                            </strong>
                          </div>

                          <div className="full-width">

                            <span>
                              Transaction Hash
                            </span>

                            <strong className="hash-text">
                              {
                                transactionHash ||
                                "-"
                              }
                            </strong>

                          </div>

                        </div>

                        <div className="transfer-status">
                          OWNERSHIP TRANSFERRED
                        </div>

                      </div>
                    )}

                  </div>

                  {/* FOOTER */}

                  <div className="property-card-footer">

                    <button
                      className="view-property-btn"
                      disabled={!publicLandId}
                      onClick={() => {

                        if (!publicLandId) {
                          console.error(
                            "Cannot open property: land_id is missing",
                            property
                          );

                          return;
                        }

                        navigate(
                          `/buyer/properties/${encodeURIComponent(
                            publicLandId
                          )}`
                        );
                      }}
                    >
                      View Property
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        </>
      )}

      <style>{styles}</style>

    </div>
  );
}

const styles = `

.buyer-page {
  padding: 30px;
  min-height: 100vh;
  background: #f7faf8;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  gap: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 30px;
  color: #173d2b;
}

.page-header p {
  margin: 7px 0 0;
  color: #68776e;
}

.browse-btn {
  border: none;
  background: #198754;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.browse-btn:hover {
  background: #157347;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  margin-bottom: 25px;
}

.summary-card span {
  display: block;
  color: #68776e;
  font-size: 14px;
  margin-bottom: 7px;
}

.summary-card strong {
  color: #198754;
  font-size: 27px;
}

.loading-box,
.empty-box {
  background: white;
  border-radius: 14px;
  padding: 50px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}

.loading-icon,
.empty-icon {
  font-size: 45px;
  margin-bottom: 10px;
}

.loading-box h2,
.empty-box h2 {
  color: #173d2b;
  margin-bottom: 8px;
}

.loading-box p,
.empty-box p {
  color: #68776e;
}

.ownership-note {
  max-width: 650px;
  margin: 20px auto;
  padding: 14px;
  border-radius: 9px;
  background: #f7faf8;
  color: #68776e;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.error-box {
  background: #fff0f0;
  border: 1px solid #f1b7b7;
  color: #a33a3a;
  padding: 15px 18px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.error-box button {
  border: none;
  background: #198754;
  color: white;
  padding: 9px 15px;
  border-radius: 7px;
  cursor: pointer;
  font-weight: 600;
}

.properties-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.property-card {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.property-card-header {
  padding: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #edf2ef;
}

.property-label {
  font-size: 12px;
  color: #68776e;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.property-card-header h2 {
  margin: 6px 0 0;
  color: #173d2b;
  font-size: 23px;
}

.status {
  padding: 7px 13px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.status.verified {
  background: #e5f8ed;
  color: #198754;
}

.status.pending {
  background: #fff5d9;
  color: #9a7400;
}

.status.rejected {
  background: #ffe7e7;
  color: #b42318;
}

.property-details {
  padding: 22px;
}

.detail-section {
  margin-bottom: 28px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h3 {
  color: #173d2b;
  margin: 0 0 15px;
  font-size: 17px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.detail-grid > div,
.owner-info > div,
.transfer-grid > div {
  background: #f7faf8;
  padding: 14px;
  border-radius: 9px;
  min-width: 0;
}

.detail-grid span,
.owner-info span,
.transfer-grid span {
  display: block;
  color: #68776e;
  font-size: 12px;
  margin-bottom: 6px;
}

.detail-grid strong,
.owner-info strong,
.transfer-grid strong {
  display: block;
  color: #173d2b;
  font-size: 14px;
  word-break: break-word;
}

.owner-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.hash-text {
  word-break: break-all;
}

.property-card-footer {
  padding: 18px 22px;
  border-top: 1px solid #edf2ef;
}

.view-property-btn {
  width: 100%;
  border: none;
  background: #198754;
  color: white;
  padding: 13px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
}

.view-property-btn:hover:not(:disabled) {
  background: #157347;
}

.view-property-btn:disabled {
  background: #9bb8a9;
  cursor: not-allowed;
}

.ownership-transfer-section {
  margin-top: 25px;
  padding: 20px;
  border-radius: 12px;
  background: #eef9f2;
  border: 1px solid #b9e4c9;
}

.transfer-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.transfer-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #198754;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 20px;
}

.transfer-title h3 {
  margin: 0;
  color: #176b43;
}

.transfer-title p {
  margin: 4px 0 0;
  color: #68776e;
  font-size: 13px;
}

.transfer-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.transfer-grid .full-width {
  grid-column: 1 / -1;
}

.transfer-status {
  margin-top: 18px;
  padding: 12px;
  border-radius: 8px;
  background: #198754;
  color: white;
  text-align: center;
  font-weight: 800;
  letter-spacing: 0.4px;
}

@media (max-width: 900px) {

  .detail-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .owner-info {
    grid-template-columns: 1fr;
  }

  .transfer-grid {
    grid-template-columns: 1fr;
  }

  .transfer-grid .full-width {
    grid-column: auto;
  }
}

@media (max-width: 600px) {

  .buyer-page {
    padding: 18px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .ownership-note {
    flex-direction: column;
  }
}

`;

export default MyProperties;