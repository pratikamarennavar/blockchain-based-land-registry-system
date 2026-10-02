import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

function PropertyDetails() {
  const { landId } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProperty();
  }, [landId]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("buyerToken");

      if (!token) {
        navigate("/buyer/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/buyer/properties/${encodeURIComponent(
          landId
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
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
          data.message ||
            "Unable to load property"
        );
      }

      setProperty(data.property);

    } catch (err) {
      console.error(
        "Property details error:",
        err
      );

      setError(
        err.message ||
          "Unable to load property"
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // HELPERS
  // ==========================================================

  const getValue = (...values) => {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return "Not specified";
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

    return `₹${number.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    )}`;
  };


  const formatDate = (date) => {
    if (!date) {
      return "Not specified";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    );
  };


  const getOwnerName = () => {
    return getValue(
      property?.current_owner?.name,
      property?.current_owner_name,
      property?.owner_name
    );
  };


  const getOwnerMobile = () => {
    return getValue(
      property?.current_owner?.mobile,
      property?.current_owner_mobile,
      property?.owner_mobile
    );
  };


  const getExpectedAmount = () => {
    return getValue(
      property?.expected_sale_amount,
      property?.sale_amount,
      property?.land_amount
    );
  };


  const getOwnerNames = () => {
    let owners =
      property?.owner_names;

    if (typeof owners === "string") {
      try {
        owners = JSON.parse(owners);
      } catch {
        owners = [];
      }
    }

    if (!Array.isArray(owners)) {
      owners = [];
    }

    return owners;
  };


  const getDocumentUrl = () => {
    if (property?.document_url) {
      return property.document_url.startsWith(
        "http"
      )
        ? property.document_url
        : `http://localhost:5000${property.document_url}`;
    }

    if (property?.document_path) {
      const filename =
        property.document_path
          .split("/")
          .pop();

      return `http://localhost:5000/uploads/land-documents/${filename}`;
    }

    return null;
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <>
        <style>{styles}</style>

        <div className="property-page">
          <div className="loading-card">
            <div className="loading-spinner"></div>

            <h2>
              Loading Property
            </h2>

            <p>
              Please wait while we load
              the property information.
            </p>
          </div>
        </div>
      </>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !property) {
    return (
      <>
        <style>{styles}</style>

        <div className="property-page">

          <button
            className="back-button"
            onClick={() =>
              navigate(
                "/buyer/properties"
              )
            }
          >
            ← Back to Properties
          </button>

          <div className="error-card">

            <div className="error-icon">
              !
            </div>

            <h2>
              Unable to Load Property
            </h2>

            <p>
              {error ||
                "Property information is unavailable."}
            </p>

            <button
              className="retry-button"
              onClick={loadProperty}
            >
              Try Again
            </button>

          </div>
        </div>
      </>
    );
  }


  // ==========================================================
  // VALUES
  // ==========================================================

  const ownerNames =
    getOwnerNames();

  const documentUrl =
    getDocumentUrl();

  const blockchain =
    property.blockchain || {};

  const blockchainConnected =
    property.blockchain_land_id ||
    blockchain.land_id ||
    property.blockchain_tx_hash ||
    blockchain.transaction_hash;

  // ==========================================================
  // BUYER REQUEST / OWNERSHIP STATE
  // ==========================================================

  // The backend returns the latest request made by this buyer
  // for this property.
  const requestStatus =
    property.request_status ||
    property.buyer_request?.status ||
    null;

  const isCurrentBuyerOwner =
    Boolean(property.is_current_buyer_owner);


  return (
    <>
      <style>{styles}</style>

      <div className="property-page">

        {/* ==================================================
            BACK
        ================================================== */}

        <button
          className="back-button"
          onClick={() =>
            navigate(
              "/buyer/properties"
            )
          }
        >
          ← Back to Properties
        </button>


        {/* ==================================================
            PROPERTY HEADER
        ================================================== */}

        <div className="property-header">

          <div className="property-header-left">

            <div className="property-house-icon">
              🏠
            </div>

            <div>

              <div className="small-label">
                LAND ID
              </div>

              <h1>
                {getValue(
                  property.land_id,
                  property.id
                )}
              </h1>

              <div className="property-location">

                📍{" "}

                {getValue(
                  property.village,
                  "Location"
                )}

                {property.taluk
                  ? `, ${property.taluk}`
                  : ""}

                {property.district
                  ? `, ${property.district}`
                  : ""}

                {property.state
                  ? `, ${property.state}`
                  : ""}

              </div>

            </div>

          </div>


          {/* ==================================================
              AMOUNT + VERIFIED BADGE
          ================================================== */}

          <div className="property-header-right">

            <div className="amount-label">
              Expected Sale Amount
            </div>

            <div className="amount-value">
              {formatAmount(
                getExpectedAmount()
              )}
            </div>

            {property.verification_status ===
              "VERIFIED" && (
              <div className="verified-badge">
                ✓ Verified Property
              </div>
            )}

          </div>

        </div>


        {/* ==================================================
            LAND IDENTIFICATION
        ================================================== */}

        <section className="details-card">

          <div className="section-header">

            <div className="section-icon">
              ▣
            </div>

            <div>
              <h2>
                Land Identification
              </h2>

              <p>
                Official identification
                and registration information
              </p>
            </div>

          </div>

          <div className="divider"></div>

          <div className="info-grid">

            <InfoItem
              label="Land ID"
              value={getValue(
                property.land_id,
                property.id
              )}
            />

            <InfoItem
              label="Survey Number"
              value={getValue(
                property.survey_number
              )}
            />

            <InfoItem
              label="Subdivision Number"
              value={getValue(
                property.subdivision_number
              )}
            />

            <InfoItem
              label="Registration Number"
              value={getValue(
                property.registration_number
              )}
            />

            <InfoItem
              label="Registration Date"
              value={formatDate(
                property.registration_date
              )}
            />

            <InfoItem
              label="Verification Status"
              value={
                property.verification_status ||
                "VERIFIED"
              }
              verified
            />

          </div>

        </section>


        {/* ==================================================
            LAND LOCATION
        ================================================== */}

        <section className="details-card">

          <div className="section-header">

            <div className="section-icon">
              📍
            </div>

            <div>
              <h2>
                Land Location
              </h2>

              <p>
                Registered property location
              </p>
            </div>

          </div>

          <div className="divider"></div>

          <div className="info-grid">

            <InfoItem
              label="District"
              value={getValue(
                property.district
              )}
            />

            <InfoItem
              label="State"
              value={getValue(
                property.state
              )}
            />

            <InfoItem
              label="Taluk"
              value={getValue(
                property.taluk
              )}
            />

            <InfoItem
              label="Village"
              value={getValue(
                property.village
              )}
            />

            <InfoItem
              label="Pincode"
              value={getValue(
                property.pincode
              )}
            />

            <InfoItem
              label="Full Address"
              value={getValue(
                property.address
              )}
            />

          </div>

        </section>


        {/* ==================================================
            PROPERTY INFORMATION
        ================================================== */}

        <section className="details-card">

          <div className="section-header">

            <div className="section-icon">
              ◈
            </div>

            <div>
              <h2>
                Property Information
              </h2>

              <p>
                Physical and classification
                details
              </p>
            </div>

          </div>

          <div className="divider"></div>

          <div className="info-grid">

            <InfoItem
              label="Area"
              value={getValue(
                property.area
              )}
            />

            <InfoItem
              label="Area Unit"
              value={getValue(
                property.area_unit
              )}
            />

            <InfoItem
              label="Land Type"
              value={getValue(
                property.land_type
              )}
            />

            <InfoItem
              label="Usage Type"
              value={getValue(
                property.usage_type,
                property.usage
              )}
            />

            <InfoItem
              label="Latitude"
              value={getValue(
                property.latitude
              )}
            />

            <InfoItem
              label="Longitude"
              value={getValue(
                property.longitude
              )}
            />

          </div>

          {property.description && (
            <div className="description-box">

              <div className="info-label">
                DESCRIPTION
              </div>

              <div className="description-text">
                {property.description}
              </div>

            </div>
          )}

        </section>


        {/* ==================================================
            OWNER INFORMATION
        ================================================== */}

        <section className="details-card">

          <div className="section-header">

            <div className="section-icon">
              ♙
            </div>

            <div>
              <h2>
                Owner Information
              </h2>

              <p>
                Registered ownership information
              </p>
            </div>

          </div>

          <div className="divider"></div>

          <div className="owner-grid">

            <InfoItem
              label="Number of Owners"
              value={getValue(
                property.number_of_owners,
                property.owner_count,
                1
              )}
            />

            <InfoItem
              label="Primary Owner"
              value={getOwnerName()}
            />

            <InfoItem
              label="Primary Owner Mobile"
              value={getOwnerMobile()}
            />

          </div>

          <div className="legal-owner-section">

            <div className="info-label">
              LEGAL OWNER NAMES
            </div>

            <div className="owner-tags">

              {ownerNames.length > 0 ? (
                ownerNames.map(
                  (owner, index) => {

                    const ownerName =
                      typeof owner === "string"
                        ? owner
                        : owner?.name ||
                          "Owner";

                    return (
                      <span
                        className="owner-tag"
                        key={index}
                      >
                        {ownerName}
                      </span>
                    );
                  }
                )
              ) : (
                <span className="owner-tag">
                  {getOwnerName()}
                </span>
              )}

            </div>

          </div>

        </section>


        {/* ==================================================
            DOCUMENTS
        ================================================== */}

        <section className="details-card">

          <div className="section-header">

            <div className="section-icon">
              ▤
            </div>

            <div>
              <h2>
                Property Documents
              </h2>

              <p>
                Supporting document information
              </p>
            </div>

          </div>

          <div className="divider"></div>

          <div className="document-box">

            <div className="pdf-icon">
              PDF
            </div>

            <div className="document-content">

              <h3>
                Land Registration Document
              </h3>

              <p>
                Supporting document uploaded
                for property verification.
              </p>

              {property.document_hash && (
                <>
                  <div className="hash-label">
                    SHA-256 Hash:
                  </div>

                  <div className="hash-value">
                    {property.document_hash}
                  </div>
                </>
              )}

            </div>

            {documentUrl && (
              <button
                className="pdf-button"
                onClick={() =>
                  window.open(
                    documentUrl,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                View PDF
              </button>
            )}

          </div>

        </section>


        {/* ==================================================
            BLOCKCHAIN
        ================================================== */}

        <section className="details-card">

          <div className="section-header">

            <div className="section-icon">
              ⛓
            </div>

            <div>
              <h2>
                Blockchain Record
              </h2>

              <p>
                Blockchain information associated
                with this property
              </p>
            </div>

          </div>

          <div className="divider"></div>

          <div className="blockchain-box">

            <div className="blockchain-status">

              <span
                className={
                  blockchainConnected
                    ? "status-dot connected"
                    : "status-dot"
                }
              ></span>

              <div>
                <strong>
                  Blockchain Record
                </strong>

                <span>
                  {blockchainConnected
                    ? "Connected"
                    : "Not connected"}
                </span>
              </div>

            </div>

            <div className="blockchain-grid">

              <InfoItem
                label="Blockchain Land ID"
                value={
                  blockchain.land_id ||
                  property.blockchain_land_id ||
                  "Not linked yet"
                }
              />

              <InfoItem
                label="Block Number"
                value={
                  blockchain.block_number ||
                  property.blockchain_block_number ||
                  "Not linked yet"
                }
              />

              <InfoItem
                label="Network"
                value={
                  blockchain.network ||
                  property.blockchain_network ||
                  "Not linked yet"
                }
              />

              <InfoItem
                label="Transaction Hash"
                value={
                  blockchain.transaction_hash ||
                  property.blockchain_tx_hash ||
                  "Not linked yet"
                }
              />

            </div>

          </div>

        </section>


        {/* ==================================================
            PURCHASE ACTION
        ================================================== */}

        <section className="purchase-card">

          <div>

            <h2>
              {isCurrentBuyerOwner
                ? "You own this property"
                : requestStatus === "PENDING"
                ? "Purchase request pending"
                : requestStatus === "APPROVED"
                ? "Purchase request approved"
                : requestStatus === "REJECTED"
                ? "Purchase request rejected"
                : "Interested in this property?"}
            </h2>

            <p>
              {isCurrentBuyerOwner
                ? "This property is currently registered under your ownership."
                : requestStatus === "PENDING"
                ? "Your purchase request has already been sent and is waiting for a decision."
                : requestStatus === "APPROVED"
                ? "Your purchase request was approved. Ownership will appear in My Properties only after the ownership transfer is completed."
                : requestStatus === "REJECTED"
                ? "Your previous purchase request was rejected. You can submit a new request if the property is still available."
                : "You can submit a purchase request for this verified property."}
            </p>

          </div>

          {isCurrentBuyerOwner ? (
            <button
              className="purchase-button"
              disabled
            >
              Already Owned ✓
            </button>
          ) : requestStatus === "PENDING" ? (
            <button
              className="purchase-button"
              disabled
            >
              Request Pending
            </button>
          ) : requestStatus === "APPROVED" ? (
            <button
              className="purchase-button"
              disabled
            >
              Request Approved ✓
            </button>
          ) : (
            <button
              className="purchase-button"
              onClick={() =>
                navigate(
                  `/buyer/properties/${encodeURIComponent(
                    property.land_id
                  )}/request`
                )
              }
            >
              {requestStatus === "REJECTED"
                ? "Send New Purchase Request →"
                : "Send Purchase Request →"}
            </button>
          )}

        </section>

      </div>
    </>
  );
}


// ==========================================================
// INFO ITEM
// ==========================================================

function InfoItem({
  label,
  value,
  verified = false
}) {
  return (
    <div className="info-item">

      <div className="info-label">
        {label}
      </div>

      <div
        className={
          verified
            ? "info-value verified-text"
            : "info-value"
        }
      >
        {verified && "✓ "}
        {value}
      </div>

    </div>
  );
}


// ==========================================================
// STYLES
// ==========================================================

const styles = `
* {
  box-sizing: border-box;
}

.property-page {
  min-height: 100vh;
  background: #f5f8f6;
  padding: 55px 48px 80px;
  color: #12372f;
}


/* BACK */

.back-button {
  border: none;
  background: transparent;
  color: #08783d;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  margin: 0 0 12px 0;
}

.back-button:hover {
  color: #075f31;
}


/* HEADER */

.property-header {
  background: #ffffff;
  border: 1px solid #e1e9e5;
  border-radius: 16px;
  min-height: 132px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 32px;
  box-shadow: 0 3px 12px rgba(0,0,0,0.04);
  margin-bottom: 12px;
}

.property-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.property-house-icon {
  width: 62px;
  height: 62px;
  border-radius: 14px;
  background: #e3f8ea;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 31px;
}

.small-label {
  font-size: 11px;
  color: #72847d;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 5px;
}

.property-header h1 {
  margin: 0;
  font-size: 27px;
  color: #062e26;
  font-weight: 800;
}

.property-location {
  margin-top: 8px;
  font-size: 13px;
  color: #647871;
}


/* AMOUNT */

.property-header-right {
  min-width: 260px;
  border-left: 1px solid #dfe7e3;
  padding-left: 30px;
}

.amount-label {
  color: #708079;
  font-size: 12px;
  margin-bottom: 7px;
}

.amount-value {
  color: #07833e;
  font-size: 22px;
  font-weight: 800;
}


/* VERIFIED BADGE
   FIXED: no absolute positioning
*/

.verified-badge {
  display: inline-block;
  margin-top: 10px;
  background: #dcf8e6;
  color: #07833e;
  border-radius: 25px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
}


/* CARDS */

.details-card {
  background: #ffffff;
  border: 1px solid #e0e8e4;
  border-radius: 16px;
  padding: 26px;
  margin-top: 22px;
  box-shadow: 0 3px 12px rgba(0,0,0,0.025);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.section-icon {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: #e5f8eb;
  color: #079044;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.section-header h2 {
  margin: 0;
  color: #0a3028;
  font-size: 18px;
  font-weight: 800;
}

.section-header p {
  margin: 5px 0 0;
  color: #7a8984;
  font-size: 12px;
}

.divider {
  height: 1px;
  background: #e6ece9;
  margin: 21px 0;
}


/* INFO */

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.info-item {
  padding: 14px 0;
  border-bottom: 1px solid #e8eeeb;
}

.info-item:nth-last-child(-n + 2) {
  border-bottom: none;
}

.info-item:nth-child(odd) {
  padding-right: 30px;
}

.info-item:nth-child(even) {
  padding-left: 30px;
}

.info-label {
  color: #71817b;
  font-size: 11px;
  margin-bottom: 8px;
}

.info-value {
  color: #092d25;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-word;
}

.verified-text {
  color: #07833e;
  font-weight: 800;
}


/* DESCRIPTION */

.description-box {
  margin-top: 20px;
  padding: 16px;
  background: #f7faf8;
  border-radius: 10px;
}

.description-text {
  color: #3d5049;
  font-size: 13px;
  line-height: 1.7;
}


/* OWNER */

.owner-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.legal-owner-section {
  border-top: 1px solid #e6ece9;
  padding-top: 20px;
  margin-top: 4px;
}

.owner-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 10px;
}

.owner-tag {
  background: #e8f8ed;
  border: 1px solid #cdebd7;
  color: #08763b;
  border-radius: 7px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
}


/* DOCUMENT */

.document-box {
  border: 1px solid #dce7e2;
  background: #f9fbfa;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.pdf-icon {
  width: 52px;
  height: 58px;
  border-radius: 8px;
  background: #ffe9e9;
  color: #df2c2c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
}

.document-content {
  flex: 1;
  min-width: 0;
}

.document-content h3 {
  margin: 0 0 6px;
  color: #0a3028;
  font-size: 14px;
}

.document-content p {
  margin: 0 0 10px;
  color: #71817b;
  font-size: 12px;
}

.hash-label {
  color: #64756e;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 5px;
}

.hash-value {
  background: #edf2ef;
  border-radius: 5px;
  padding: 8px 10px;
  color: #53645e;
  font-family: monospace;
  font-size: 10px;
  word-break: break-all;
}

.pdf-button {
  background: #087c3e;
  border: none;
  border-radius: 8px;
  color: white;
  padding: 12px 21px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}

.pdf-button:hover {
  background: #066a35;
}


/* BLOCKCHAIN */

.blockchain-box {
  background: #f6faf7;
  border: 1px solid #dceae1;
  border-radius: 12px;
  padding: 20px;
}

.blockchain-status {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 17px;
}

.status-dot {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #17b865;
  box-shadow: 0 0 0 4px #dff7e9;
  flex-shrink: 0;
}

.status-dot.connected {
  background: #08a955;
}

.blockchain-status div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.blockchain-status strong {
  color: #103a30;
  font-size: 13px;
}

.blockchain-status span {
  color: #7b8984;
  font-size: 11px;
}

.blockchain-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}


/* PURCHASE */

.purchase-card {
  background: #ffffff;
  border: 1px solid #dfe9e4;
  border-radius: 16px;
  margin-top: 22px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  box-shadow: 0 3px 12px rgba(0,0,0,0.025);
}

.purchase-card h2 {
  margin: 0 0 6px;
  color: #0a3028;
  font-size: 17px;
}

.purchase-card p {
  margin: 0;
  color: #71817b;
  font-size: 12px;
}

.purchase-button {
  background: #087c3e;
  border: none;
  color: white;
  border-radius: 9px;
  padding: 13px 22px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.purchase-button:hover {
  background: #066b35;
}


/* LOADING */

.loading-card {
  min-height: 450px;
  background: white;
  border: 1px solid #e0e8e4;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 25px;
}

.loading-spinner {
  width: 42px;
  height: 42px;
  border: 4px solid #dcefe3;
  border-top-color: #087c3e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 18px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


/* ERROR */

.error-card {
  min-height: 400px;
  background: white;
  border: 1px solid #f2cccc;
  border-radius: 16px;
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 30px;
}

.error-icon {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #fff2f2;
  border: 1px solid #f3c8c8;
  color: #d62d2d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 15px;
}

.error-card h2 {
  margin: 0 0 8px;
  color: #552525;
  font-size: 20px;
}

.error-card p {
  color: #8a6666;
  font-size: 13px;
  margin: 0 0 18px;
  max-width: 600px;
}

.retry-button {
  border: none;
  background: #087c3e;
  color: white;
  padding: 12px 22px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}


/* RESPONSIVE */

@media (max-width: 900px) {

  .property-page {
    padding: 35px 25px 60px;
  }

  .property-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 25px;
  }

  .property-header-right {
    width: 100%;
    border-left: none;
    border-top: 1px solid #e0e7e4;
    padding-left: 0;
    padding-top: 18px;
  }

  .owner-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 650px) {

  .property-page {
    padding: 25px 15px 50px;
  }

  .property-header {
    padding: 20px;
  }

  .property-header-left {
    align-items: flex-start;
  }

  .property-header h1 {
    font-size: 21px;
  }

  .property-house-icon {
    width: 50px;
    height: 50px;
    font-size: 25px;
  }

  .details-card {
    padding: 20px;
  }

  .info-grid,
  .owner-grid,
  .blockchain-grid {
    grid-template-columns: 1fr;
  }

  .info-item:nth-child(odd),
  .info-item:nth-child(even) {
    padding-left: 0;
    padding-right: 0;
  }

  .info-item {
    border-bottom: 1px solid #e8eeeb;
  }

  .document-box {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .pdf-button {
    width: 100%;
  }

  .purchase-card {
    flex-direction: column;
    align-items: stretch;
  }

  .purchase-button {
    width: 100%;
  }
}
`;

export default PropertyDetails;