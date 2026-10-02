import React, {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

const API_BASE_URL =
  "http://localhost:5000/api";

function MyRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const buyerToken =
    localStorage.getItem(
      "buyerToken"
    );


  useEffect(() => {
    if (!buyerToken) {
      navigate(
        "/buyer/login",
        { replace: true }
      );

      return;
    }

    fetchRequests();
  }, [buyerToken]);


  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${API_BASE_URL}/buyer/requests`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${buyerToken}`,

              "Content-Type":
                "application/json"
            }
          }
        );

      const data =
        await response.json();


      if (response.status === 401) {
        localStorage.removeItem(
          "buyerToken"
        );

        localStorage.removeItem(
          "buyerUser"
        );

        navigate(
          "/buyer/login",
          { replace: true }
        );

        return;
      }


      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Failed to load purchase requests"
        );
      }


      setRequests(
        data.requests || []
      );

    } catch (err) {
      console.error(
        "My Requests error:",
        err
      );

      setError(
        err.message ||
        "Failed to load purchase requests"
      );

    } finally {
      setLoading(false);
    }
  };


  const getStatusClass =
    (status) => {
      switch (status) {

        case "APPROVED":
          return "status approved";

        case "REJECTED":
          return "status rejected";

        case "CANCELLED":
          return "status cancelled";

        default:
          return "status pending";
      }
    };


  const formatDate =
    (date) => {
      if (!date) return "-";

      const value =
        new Date(date);

      if (
        Number.isNaN(
          value.getTime()
        )
      ) {
        return date;
      }

      return value.toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }
      );
    };


  const formatAmount =
    (amount) => {
      if (
        amount === null ||
        amount === undefined ||
        amount === ""
      ) {
        return "Not specified";
      }

      return `₹${Number(
        amount
      ).toLocaleString("en-IN")}`;
    };


  const getLocation =
    (request) => {
      return (
        request.location ||
        [
          request.address,
          request.village,
          request.taluk,
          request.district,
          request.state
        ]
          .filter(Boolean)
          .join(", ") ||
        "-"
      );
    };


  const getLandId =
    (request) => {
      // request.land_id is the numeric lands.id foreign key.
      // request.land_code is the public land identifier used in URLs.
      return request.land_code || request.land_identifier || "-";
    };


  if (loading) {
    return (
      <div className="buyer-page">

        <div className="page-header">

          <div>
            <h1>
              My Requests
            </h1>

            <p>
              View your property
              purchase requests
            </p>
          </div>

        </div>

        <div className="loading-box">
          Loading your purchase
          requests...
        </div>

        <style>{styles}</style>

      </div>
    );
  }


  return (
    <div className="buyer-page">

      <div className="page-header">

        <div>

          <h1>
            My Requests
          </h1>

          <p>
            Track the status of
            your property purchase
            requests
          </p>

        </div>

        <button
          className="browse-btn"
          onClick={() =>
            navigate(
              "/buyer/properties"
            )
          }
        >
          Browse Properties
        </button>

      </div>


      {error && (
        <div className="error-box">

          <span>
            {error}
          </span>

          <button
            onClick={
              fetchRequests
            }
          >
            Retry
          </button>

        </div>
      )}


      {!error &&
        requests.length === 0 && (
          <div className="empty-box">

            <div className="empty-icon">
              📋
            </div>

            <h2>
              No Purchase Requests
            </h2>

            <p>
              You have not sent any
              property purchase
              requests yet.
            </p>

            <button
              className="browse-btn"
              onClick={() =>
                navigate(
                  "/buyer/properties"
                )
              }
            >
              Browse Properties
            </button>

          </div>
        )}


      {requests.length > 0 && (
        <div className="requests-container">

          <div className="request-summary">

            <div className="summary-card">
              <span>
                Total Requests
              </span>

              <strong>
                {requests.length}
              </strong>
            </div>


            <div className="summary-card pending-card">
              <span>
                Pending
              </span>

              <strong>
                {
                  requests.filter(
                    (r) =>
                      r.request_status ===
                      "PENDING"
                  ).length
                }
              </strong>
            </div>


            <div className="summary-card approved-card">
              <span>
                Approved
              </span>

              <strong>
                {
                  requests.filter(
                    (r) =>
                      r.request_status ===
                      "APPROVED"
                  ).length
                }
              </strong>
            </div>


            <div className="summary-card rejected-card">
              <span>
                Rejected
              </span>

              <strong>
                {
                  requests.filter(
                    (r) =>
                      r.request_status ===
                      "REJECTED"
                  ).length
                }
              </strong>
            </div>

          </div>


          <div className="requests-list">

            {requests.map(
              (request) => {

                const publicLandId =
                  getLandId(request);

                return (
                  <div
                    className="request-card"
                    key={
                      request.request_id
                    }
                  >

                    <div className="request-card-header">

                      <div>

                        <span className="request-label">
                          Property
                        </span>

                        <h2>
                          {publicLandId}
                        </h2>

                      </div>


                      <span
                        className={
                          getStatusClass(
                            request.request_status
                          )
                        }
                      >
                        {
                          request.request_status
                        }
                      </span>

                    </div>


                    <div className="request-details">

                      <div className="detail-section">

                        <h3>
                          Property Details
                        </h3>

                        <div className="detail-grid">

                          <div>
                            <span>
                              Land ID
                            </span>

                            <strong>
                              {publicLandId}
                            </strong>
                          </div>


                          <div>
                            <span>
                              Survey Number
                            </span>

                            <strong>
                              {
                                request.survey_number ||
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
                                request.subdivision_number ||
                                "-"
                              }
                            </strong>
                          </div>


                          <div>
                            <span>
                              Area
                            </span>

                            <strong>
                              {request.area
                                ? `${request.area} ${
                                    request.area_unit ||
                                    ""
                                  }`
                                : "-"}
                            </strong>
                          </div>


                          <div>
                            <span>
                              Property Type
                            </span>

                            <strong>
                              {
                                request.land_type ||
                                "-"
                              }
                            </strong>
                          </div>


                          <div>
                            <span>
                              Usage
                            </span>

                            <strong>
                              {
                                request.usage_type ||
                                request.usage ||
                                "-"
                              }
                            </strong>
                          </div>


                          <div>
                            <span>
                              Location
                            </span>

                            <strong>
                              {
                                getLocation(
                                  request
                                )
                              }
                            </strong>
                          </div>


                          <div>
                            <span>
                              Expected Amount
                            </span>

                            <strong>
                              {
                                formatAmount(
                                  request.expected_sale_amount
                                )
                              }
                            </strong>
                          </div>

                        </div>

                      </div>


                      <div className="detail-section">

                        <h3>
                          Seller Details
                        </h3>

                        <div className="seller-info">

                          <div>
                            <span>
                              Name
                            </span>

                            <strong>
                              {
                                request.seller_name ||
                                "-"
                              }
                            </strong>
                          </div>


                          <div>
                            <span>
                              Email
                            </span>

                            <strong>
                              {
                                request.seller_email ||
                                "-"
                              }
                            </strong>
                          </div>


                          <div>
                            <span>
                              Mobile
                            </span>

                            <strong>
                              {
                                request.seller_mobile ||
                                "-"
                              }
                            </strong>
                          </div>

                        </div>

                      </div>


                      <div className="detail-section">

                        <h3>
                          Request Information
                        </h3>

                        <div className="seller-info">

                          <div>
                            <span>
                              Request ID
                            </span>

                            <strong>
                              #
                              {
                                request.request_id
                              }
                            </strong>
                          </div>


                          <div>
                            <span>
                              Requested On
                            </span>

                            <strong>
                              {
                                formatDate(
                                  request.requested_at
                                )
                              }
                            </strong>
                          </div>


                          <div>
                            <span>
                              Last Updated
                            </span>

                            <strong>
                              {
                                formatDate(
                                  request.updated_at
                                )
                              }
                            </strong>
                          </div>

                        </div>

                      </div>


                      {/* REQUEST STATUS MESSAGE */}

                      <div className="status-message">

                        {request.request_status ===
                          "PENDING" && (
                          <>
                            <strong>
                              Purchase request pending
                            </strong>

                            <span>
                              Waiting for the request
                              to be processed.
                            </span>
                          </>
                        )}

                        {request.request_status ===
                          "APPROVED" && (
                          <>
                            <strong>
                              Purchase request approved
                            </strong>

                            <span>
                              Approval does not mean
                              ownership has transferred
                              yet. Ownership transfer
                              will happen in the next
                              transaction step.
                            </span>
                          </>
                        )}

                        {request.request_status ===
                          "REJECTED" && (
                          <>
                            <strong>
                              Purchase request rejected
                            </strong>

                            <span>
                              This request was not
                              approved.
                            </span>
                          </>
                        )}

                      </div>

                    </div>


                    <div className="request-card-footer">

                      <button
                        className="view-property-btn"
                        onClick={() =>
                          navigate(
                            `/buyer/properties/${encodeURIComponent(
                              publicLandId
                            )}`
                          )
                        }
                      >
                        View Property
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>
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

.loading-box,
.empty-box {
  background: white;
  border-radius: 14px;
  padding: 50px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}

.empty-icon {
  font-size: 45px;
  margin-bottom: 10px;
}

.empty-box h2 {
  color: #173d2b;
}

.empty-box p {
  color: #68776e;
  margin-bottom: 22px;
}

.error-box {
  background: #fff0f0;
  border: 1px solid #f0b7b7;
  color: #a52828;
  padding: 15px 18px;
  border-radius: 10px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.error-box button {
  border: none;
  background: #a52828;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}

.request-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.summary-card span {
  display: block;
  color: #68776e;
  font-size: 14px;
  margin-bottom: 7px;
}

.summary-card strong {
  color: #173d2b;
  font-size: 27px;
}

.pending-card strong {
  color: #d68a00;
}

.approved-card strong {
  color: #198754;
}

.rejected-card strong {
  color: #dc3545;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.request-card {
  background: white;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: hidden;
}

.request-card-header {
  padding: 20px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #edf1ee;
}

.request-label {
  color: #78847d;
  font-size: 13px;
}

.request-card-header h2 {
  margin: 4px 0 0;
  color: #173d2b;
  font-size: 21px;
}

.status {
  padding: 7px 13px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.status.pending {
  background: #fff3cd;
  color: #856404;
}

.status.approved {
  background: #d1e7dd;
  color: #0f5132;
}

.status.rejected {
  background: #f8d7da;
  color: #842029;
}

.status.cancelled {
  background: #e2e3e5;
  color: #41464b;
}

.request-details {
  padding: 22px;
}

.detail-section {
  margin-bottom: 25px;
}

.detail-section h3 {
  color: #173d2b;
  margin: 0 0 15px;
  font-size: 17px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.detail-grid div,
.seller-info div {
  background: #f8faf9;
  padding: 12px;
  border-radius: 8px;
}

.detail-grid span,
.seller-info span {
  display: block;
  font-size: 12px;
  color: #7b867f;
  margin-bottom: 5px;
}

.detail-grid strong,
.seller-info strong {
  color: #26382d;
  font-size: 14px;
  word-break: break-word;
}

.seller-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.status-message {
  background: #f6faf7;
  border: 1px solid #dceae1;
  padding: 15px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.status-message strong {
  color: #173d2b;
}

.status-message span {
  color: #68776e;
  font-size: 13px;
}

.request-card-footer {
  padding: 15px 22px;
  border-top: 1px solid #edf1ee;
  display: flex;
  justify-content: flex-end;
}

.view-property-btn {
  border: 1px solid #198754;
  background: white;
  color: #198754;
  padding: 9px 17px;
  border-radius: 7px;
  cursor: pointer;
  font-weight: 600;
}

.view-property-btn:hover {
  background: #198754;
  color: white;
}

@media (max-width: 900px) {
  .request-summary,
  .detail-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .seller-info {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .buyer-page {
    padding: 15px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .request-summary,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
`;

export default MyRequests;