import React, { useEffect, useMemo, useState } from "react";

import {
  verifyUserOnBlockchain,
  getBlockchainUser,
} from "../../blockchain/blockchain";

const API_URL = "http://localhost:5000/api";

const BuyerVerification = () => {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [blockchainStatus, setBlockchainStatus] = useState(null);
  const [checkingBlockchain, setCheckingBlockchain] = useState(false);

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {
    return (
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token")
    );
  };

  // ============================================================
  // FETCH BUYERS
  // ============================================================

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Admin session expired. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/admin/buyers`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load buyers."
        );
      }

      const buyerData = Array.isArray(data)
        ? data
        : data.buyers ||
          data.data ||
          [];

      setBuyers(buyerData);
    } catch (err) {
      console.error(
        "Buyer verification fetch error:",
        err
      );

      setError(
        err.message ||
          "Failed to load buyers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, []);

  // ============================================================
  // STATUS
  // ============================================================

  const getStatus = (buyer) => {
    return (
      buyer.verification_status ||
      buyer.status ||
      "PENDING"
    ).toUpperCase();
  };

  // ============================================================
  // COUNTS
  // ============================================================

  const counts = useMemo(() => {
    return {
      all: buyers.length,

      pending: buyers.filter(
        (buyer) =>
          getStatus(buyer) === "PENDING"
      ).length,

      verified: buyers.filter(
        (buyer) =>
          getStatus(buyer) === "VERIFIED"
      ).length,

      rejected: buyers.filter(
        (buyer) =>
          getStatus(buyer) === "REJECTED"
      ).length,
    };
  }, [buyers]);

  // ============================================================
  // SEARCH + FILTER
  // ============================================================

  const filteredBuyers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return buyers.filter((buyer) => {
      const status = getStatus(buyer);

      const matchesFilter =
        filter === "ALL" ||
        status === filter;

      const name =
        buyer.name ||
        buyer.full_name ||
        "";

      const email =
        buyer.email ||
        "";

      const mobile =
        buyer.mobile ||
        buyer.phone ||
        "";

      const wallet =
        buyer.wallet_address ||
        buyer.wallet ||
        "";

      const id = String(
        buyer.id || ""
      );

      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        mobile.toLowerCase().includes(query) ||
        wallet.toLowerCase().includes(query) ||
        id.includes(query);

      return (
        matchesFilter &&
        matchesSearch
      );
    });
  }, [
    buyers,
    filter,
    search,
  ]);

  // ============================================================
  // GET BUYER WALLET
  // ============================================================

  const getBuyerWallet = (buyer) => {
    const wallet =
      buyer.wallet_address ||
      buyer.wallet ||
      "";

    return wallet.trim();
  };

  // ============================================================
  // CHECK BLOCKCHAIN STATUS
  // ============================================================

  const checkBuyerBlockchainStatus = async (
    buyer
  ) => {
    try {
      setCheckingBlockchain(true);
      setError("");
      setSuccess("");

      const wallet =
        getBuyerWallet(buyer);

      if (!wallet) {
        setBlockchainStatus({
          registered: false,
          verified: false,
          message:
            "Buyer has not connected a MetaMask wallet.",
        });

        return;
      }

      const blockchainBuyer =
        await getBlockchainUser(wallet);

      console.log(
        "Buyer blockchain status:",
        blockchainBuyer
      );

      setBlockchainStatus({
        registered:
          Boolean(
            blockchainBuyer?.registered
          ),
        verified:
          Boolean(
            blockchainBuyer?.verified
          ),
        wallet,
      });
    } catch (err) {
      console.error(
        "Blockchain status check failed:",
        err
      );

      setBlockchainStatus({
        registered: false,
        verified: false,
        wallet:
          getBuyerWallet(buyer),
        message:
          err.message ||
          "Unable to read blockchain status.",
      });
    } finally {
      setCheckingBlockchain(false);
    }
  };

  // ============================================================
  // SELECT BUYER
  // ============================================================

  const openBuyer = async (buyer) => {
    setSelectedBuyer(buyer);
    setError("");
    setSuccess("");
    setBlockchainStatus(null);

    await checkBuyerBlockchainStatus(
      buyer
    );
  };

  // ============================================================
  // VERIFY BUYER ON BLOCKCHAIN
  // ============================================================

  const verifyBuyerBlockchain = async (
    buyer
  ) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const wallet =
        getBuyerWallet(buyer);

      if (!wallet) {
        throw new Error(
          "This buyer has not connected a MetaMask wallet yet."
        );
      }

      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed. Please open MetaMask."
        );
      }

      setSuccess(
        "Checking buyer wallet on Ganache..."
      );

      // --------------------------------------------------------
      // READ BLOCKCHAIN USER
      // --------------------------------------------------------

      const blockchainBuyer =
        await getBlockchainUser(wallet);

      console.log(
        "Buyer blockchain record:",
        blockchainBuyer
      );

      // --------------------------------------------------------
      // BUYER MUST BE REGISTERED
      // --------------------------------------------------------

      if (
        !blockchainBuyer ||
        !blockchainBuyer.registered
      ) {
        throw new Error(
          "This buyer wallet is not registered on the blockchain. Ask the buyer to open Buyer Profile and click 'Register Buyer on Blockchain' first."
        );
      }

      // --------------------------------------------------------
      // ALREADY VERIFIED
      // --------------------------------------------------------

      if (blockchainBuyer.verified) {
        setBlockchainStatus({
          registered: true,
          verified: true,
          wallet,
        });

        setSuccess(
          `${buyer.name || "Buyer"} is already verified on the blockchain.`
        );

        return;
      }

      // --------------------------------------------------------
      // ADMIN EXECUTES verifyUser()
      // --------------------------------------------------------

      setSuccess(
        "Buyer is registered on Ganache. Please confirm the verification transaction in the Admin MetaMask."
      );

      const result =
        await verifyUserOnBlockchain(
          wallet
        );

      console.log(
        "verifyUser result:",
        result
      );

      // --------------------------------------------------------
      // READ AGAIN
      // --------------------------------------------------------

      const updatedBuyer =
        await getBlockchainUser(wallet);

      console.log(
        "Updated blockchain buyer:",
        updatedBuyer
      );

      if (
        !updatedBuyer ||
        !updatedBuyer.verified
      ) {
        throw new Error(
          "The blockchain transaction completed, but the buyer is not marked as verified."
        );
      }

      setBlockchainStatus({
        registered: true,
        verified: true,
        wallet,
      });

      setSuccess(
        `${buyer.name || "Buyer"} has been verified successfully on the blockchain.`
      );

    } catch (err) {
      console.error(
        "Buyer blockchain verification error:",
        err
      );

      let message =
        err?.shortMessage ||
        err?.reason ||
        err?.message ||
        "Failed to verify buyer on blockchain.";

      if (
        err?.code === "ACTION_REJECTED" ||
        err?.code === 4001
      ) {
        message =
          "Transaction was cancelled in MetaMask.";
      }

      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // DATABASE VERIFY
  // ============================================================

  const verifyBuyerDatabase = async (
    buyer
  ) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Admin session expired. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/admin/buyers/${buyer.id}/verify`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to verify buyer in database."
        );
      }

      await fetchBuyers();

      return true;
    } catch (err) {
      console.error(
        "Database buyer verification failed:",
        err
      );

      throw err;
    }
  };

  // ============================================================
  // VERIFY BUYER - BLOCKCHAIN FIRST
  // ============================================================

  const verifyBuyer = async (buyer) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const wallet =
        getBuyerWallet(buyer);

      if (!wallet) {
        throw new Error(
          "This buyer has not connected a MetaMask wallet yet."
        );
      }

      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed."
        );
      }

      // --------------------------------------------------------
      // STEP 1: READ BLOCKCHAIN
      // --------------------------------------------------------

      const blockchainBuyer =
        await getBlockchainUser(wallet);

      console.log(
        "Buyer before verification:",
        blockchainBuyer
      );

      if (
        !blockchainBuyer ||
        !blockchainBuyer.registered
      ) {
        throw new Error(
          "Buyer wallet is not registered on blockchain. Ask the buyer to register the wallet from Buyer Profile first."
        );
      }

      // --------------------------------------------------------
      // STEP 2: VERIFY ON BLOCKCHAIN
      // --------------------------------------------------------

      if (!blockchainBuyer.verified) {
        setSuccess(
          "Buyer is registered. Please confirm the verifyUser transaction in Admin MetaMask."
        );

        const result =
          await verifyUserOnBlockchain(
            wallet
          );

        console.log(
          "Blockchain verification result:",
          result
        );

        // Read again
        const updatedBuyer =
          await getBlockchainUser(
            wallet
          );

        if (
          !updatedBuyer ||
          !updatedBuyer.verified
        ) {
          throw new Error(
            "Blockchain transaction completed, but buyer verification could not be confirmed."
          );
        }
      }

      // --------------------------------------------------------
      // STEP 3: UPDATE DATABASE
      // --------------------------------------------------------

      await verifyBuyerDatabase(
        buyer
      );

      // --------------------------------------------------------
      // STEP 4: UPDATE UI
      // --------------------------------------------------------

      setBlockchainStatus({
        registered: true,
        verified: true,
        wallet,
      });

      setSuccess(
        `${buyer.name || "Buyer"} verified successfully on blockchain and database.`
      );

      await fetchBuyers();

    } catch (err) {
      console.error(
        "Buyer verification failed:",
        err
      );

      let message =
        err?.shortMessage ||
        err?.reason ||
        err?.message ||
        "Failed to verify buyer.";

      if (
        err?.code === "ACTION_REJECTED" ||
        err?.code === 4001
      ) {
        message =
          "Transaction was cancelled in MetaMask.";
      }

      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // REJECT BUYER
  // ============================================================

  const rejectBuyer = async (buyer) => {
    const buyerName =
      buyer.name ||
      buyer.full_name ||
      "this buyer";

    const confirmed =
      window.confirm(
        `Are you sure you want to reject ${buyerName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Admin session expired. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/admin/buyers/${buyer.id}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to reject buyer."
        );
      }

      await fetchBuyers();

      setSelectedBuyer(null);

      alert(
        "Buyer rejected successfully."
      );
    } catch (err) {
      console.error(
        "Reject buyer failed:",
        err
      );

      setError(
        err.message ||
        "Failed to reject buyer."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // INITIALS
  // ============================================================

  const getInitials = (name) => {
    if (!name) {
      return "TB";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (word) => word[0]
      )
      .join("")
      .toUpperCase();
  };

  // ============================================================
  // DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const d = new Date(date);

    if (
      Number.isNaN(
        d.getTime()
      )
    ) {
      return "—";
    }

    return d.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  // ============================================================
  // WALLET DISPLAY
  // ============================================================

  const shortWallet = (wallet) => {
    if (!wallet) {
      return "Not connected";
    }

    if (wallet.length <= 18) {
      return wallet;
    }

    return `${wallet.slice(
      0,
      10
    )}...${wallet.slice(-8)}`;
  };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <>
      <style>{buyerVerificationCSS}</style>

      <div className="seller-content">

        {/* HEADER */}

        <div className="page-heading">
          <h1>
            Buyer Verification
          </h1>

          <p>
            Review buyer details and
            verify their account on
            the database and blockchain.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="page-error">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="page-success">
            {success}
          </div>
        )}

        {/* STATS */}

        <div className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon green">
              ♙
            </div>

            <div>
              <span>
                Total Buyers
              </span>

              <strong>
                {counts.all}
              </strong>

              <small>
                Registered buyers
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon yellow">
              ◷
            </div>

            <div>
              <span>
                Pending
              </span>

              <strong>
                {counts.pending}
              </strong>

              <small>
                Awaiting review
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              ✓
            </div>

            <div>
              <span>
                Verified
              </span>

              <strong>
                {counts.verified}
              </strong>

              <small>
                Approved buyers
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">
              ×
            </div>

            <div>
              <span>
                Rejected
              </span>

              <strong>
                {counts.rejected}
              </strong>

              <small>
                Rejected requests
              </small>
            </div>
          </div>

          <button
            className="stat-card refresh-stat-card"
            onClick={fetchBuyers}
            disabled={loading}
          >
            <div className="stat-icon purple">
              ↻
            </div>

            <div>
              <span>
                Data
              </span>

              <strong>
                ↻
              </strong>

              <small>
                Refresh
              </small>
            </div>
          </button>

        </div>

        {/* FILTER */}

        <div className="buyer-filter-panel">

          <div className="filter-tabs">

            {[
              ["ALL", "All", counts.all],
              [
                "PENDING",
                "Pending",
                counts.pending,
              ],
              [
                "VERIFIED",
                "Verified",
                counts.verified,
              ],
              [
                "REJECTED",
                "Rejected",
                counts.rejected,
              ],
            ].map(
              ([value, label, count]) => (
                <button
                  key={value}
                  className={`filter-tab ${
                    filter === value
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setFilter(value)
                  }
                >
                  {label} ({count})
                </button>
              )
            )}

          </div>

          <div className="buyer-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search buyer, email, mobile or wallet..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* TABLE */}

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Buyer Verification Requests
              </h2>

              <span>
                {
                  filteredBuyers.length
                }{" "}
                records found
              </span>
            </div>

            <button
              className="outline-button"
              onClick={fetchBuyers}
              disabled={loading}
            >
              ↻ Refresh
            </button>

          </div>

          {loading ? (
            <div className="state-box">
              Loading buyer
              verification requests...
            </div>
          ) : filteredBuyers.length === 0 ? (
            <div className="empty-box">

              <div className="empty-icon">
                ♙
              </div>

              <h3>
                No buyer records found
              </h3>

              <p>
                There are no buyer
                verification requests
                matching the selected
                filter.
              </p>

            </div>
          ) : (
            <div className="table-wrap">

              <table>

                <thead>
                  <tr>
                    <th>
                      BUYER
                    </th>

                    <th>
                      CONTACT
                    </th>

                    <th>
                      WALLET
                    </th>

                    <th>
                      STATUS
                    </th>

                    <th>
                      REGISTERED
                    </th>

                    <th>
                      ACTIONS
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredBuyers.map(
                    (buyer) => {

                      const status =
                        getStatus(
                          buyer
                        );

                      const name =
                        buyer.name ||
                        buyer.full_name ||
                        "Unknown Buyer";

                      const email =
                        buyer.email ||
                        "—";

                      const mobile =
                        buyer.mobile ||
                        buyer.phone ||
                        "—";

                      const wallet =
                        getBuyerWallet(
                          buyer
                        );

                      return (
                        <tr
                          key={buyer.id}
                          className="clickable-row"
                          onClick={() =>
                            openBuyer(
                              buyer
                            )
                          }
                        >

                          <td>
                            <div className="buyer-table-user">

                              <div className="buyer-table-avatar">
                                {getInitials(
                                  name
                                )}
                              </div>

                              <div>
                                <strong>
                                  {name}
                                </strong>

                                <small>
                                  ID:{" "}
                                  {buyer.id}
                                </small>
                              </div>

                            </div>
                          </td>

                          <td>
                            <div className="contact-cell">

                              <strong>
                                {email}
                              </strong>

                              <small>
                                {mobile}
                              </small>

                            </div>
                          </td>

                          <td>
                            <span className="hash-cell">
                              {shortWallet(
                                wallet
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${status.toLowerCase()}`}
                            >
                              {status}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              buyer.created_at ||
                              buyer.registered_at
                            )}
                          </td>

                          <td>
                            <div
                              className="buyer-actions"
                              onClick={(e) =>
                                e.stopPropagation()
                              }
                            >

                              <button
                                className="view-button"
                                onClick={() =>
                                  openBuyer(
                                    buyer
                                  )
                                }
                              >
                                View
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

        {/* MODAL */}

        {selectedBuyer && (
          <div
            className="buyer-modal-overlay"
            onClick={() =>
              setSelectedBuyer(null)
            }
          >

            <div
              className="buyer-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="buyer-modal-header">

                <div>
                  <div className="eyebrow">
                    BUYER VERIFICATION
                  </div>

                  <h2>
                    Buyer Details
                  </h2>
                </div>

                <button
                  className="modal-close"
                  onClick={() =>
                    setSelectedBuyer(
                      null
                    )
                  }
                >
                  ×
                </button>

              </div>

              <div className="buyer-detail-profile">

                <div className="buyer-detail-avatar">
                  {getInitials(
                    selectedBuyer.name ||
                    selectedBuyer.full_name
                  )}
                </div>

                <div>
                  <h3>
                    {selectedBuyer.name ||
                    selectedBuyer.full_name ||
                    "Unknown Buyer"}
                  </h3>

                  <p>
                    Buyer ID:{" "}
                    {selectedBuyer.id}
                  </p>
                </div>

                <span
                  className={`status-badge ${getStatus(
                    selectedBuyer
                  ).toLowerCase()}`}
                >
                  {getStatus(
                    selectedBuyer
                  )}
                </span>

              </div>

              <div className="buyer-detail-grid">

                <div className="buyer-detail-item">
                  <span>
                    Full Name
                  </span>

                  <strong>
                    {selectedBuyer.name ||
                    selectedBuyer.full_name ||
                    "—"}
                  </strong>
                </div>

                <div className="buyer-detail-item">
                  <span>
                    Buyer ID
                  </span>

                  <strong>
                    {selectedBuyer.id ||
                    "—"}
                  </strong>
                </div>

                <div className="buyer-detail-item">
                  <span>
                    Email
                  </span>

                  <strong>
                    {selectedBuyer.email ||
                    "—"}
                  </strong>
                </div>

                <div className="buyer-detail-item">
                  <span>
                    Mobile
                  </span>

                  <strong>
                    {selectedBuyer.mobile ||
                    selectedBuyer.phone ||
                    "—"}
                  </strong>
                </div>

                <div className="buyer-detail-item wide">
                  <span>
                    Wallet Address
                  </span>

                  <strong className="mono">
                    {getBuyerWallet(
                      selectedBuyer
                    ) ||
                      "Wallet not connected"}
                  </strong>
                </div>

                <div className="buyer-detail-item wide">
                  <span>
                    Registration Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedBuyer.created_at ||
                      selectedBuyer.registered_at
                    )}
                  </strong>
                </div>

              </div>

              {/* BLOCKCHAIN STATUS */}

              <div className="verification-note">

                <div className="verification-note-icon">
                  ⛓
                </div>

                <div>

                  <strong>
                    Blockchain Verification
                  </strong>

                  <p>
                    Admin uses MetaMask to
                    verify this buyer wallet
                    on the LandRegistry smart
                    contract using verifyUser().
                  </p>

                  {!getBuyerWallet(
                    selectedBuyer
                  ) ? (
                    <p className="wallet-missing">
                      ⚠ Wallet is missing.
                      Buyer must connect
                      MetaMask first.
                    </p>
                  ) : checkingBlockchain ? (
                    <p>
                      Checking blockchain
                      status...
                    </p>
                  ) : blockchainStatus?.verified ? (
                    <p className="wallet-confirmed">
                      ✓ Buyer wallet is
                      VERIFIED on Ganache.
                    </p>
                  ) : blockchainStatus?.registered ? (
                    <p className="wallet-pending">
                      ✓ Wallet is REGISTERED
                      on Ganache.
                      <br />
                      ⚠ Admin verification
                      is still required.
                    </p>
                  ) : (
                    <p className="wallet-missing">
                      ⚠ Wallet is not registered
                      on blockchain yet.
                    </p>
                  )}

                </div>

              </div>

              <div className="buyer-modal-actions">

                <button
                  className="secondary-button"
                  onClick={() =>
                    setSelectedBuyer(
                      null
                    )
                  }
                >
                  Close
                </button>

                {/* BLOCKCHAIN VERIFY BUTTON */}

                {getBuyerWallet(
                  selectedBuyer
                ) &&
                !blockchainStatus?.verified && (
                  <button
                    className="primary-button"
                    onClick={() =>
                      verifyBuyer(
                        selectedBuyer
                      )
                    }
                    disabled={
                      actionLoading ||
                      checkingBlockchain ||
                      !blockchainStatus?.registered
                    }
                  >
                    {actionLoading
                      ? "Processing..."
                      : "✓ Verify on Blockchain"}
                  </button>
                )}

                {/* ALREADY BLOCKCHAIN VERIFIED */}

                {blockchainStatus?.verified && (
                  <button
                    className="verified-button"
                    disabled
                  >
                    ✓ Blockchain Verified
                  </button>
                )}

                {/* REJECT */}

                {getStatus(
                  selectedBuyer
                ) !== "REJECTED" &&
                  !blockchainStatus?.verified && (
                    <button
                      className="danger-button"
                      onClick={() =>
                        rejectBuyer(
                          selectedBuyer
                        )
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      Reject Buyer
                    </button>
                  )}

              </div>

            </div>

          </div>
        )}

      </div>
    </>
  );
};

// ============================================================
// CSS
// ============================================================

const buyerVerificationCSS = `

* {
  box-sizing: border-box;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  opacity: .65;
  cursor: not-allowed;
}

.seller-content {
  padding: 24px 30px 45px;
  max-width: 1600px;
  margin: auto;
}

.page-heading {
  margin-bottom: 20px;
}

.page-heading h1 {
  margin: 0;
  font-size: 23px;
  color: #172033;
}

.page-heading p {
  margin: 6px 0 0;
  color: #687386;
  font-size: 14px;
}

.page-error {
  background: #fff1f0;
  border: 1px solid #f3b5b1;
  color: #b42318;
  border-radius: 8px;
  padding: 12px 15px;
  margin-bottom: 18px;
  font-size: 12px;
}

.page-success {
  background: #eaf8ef;
  border: 1px solid #b8e9c4;
  color: #15803d;
  border-radius: 8px;
  padding: 12px 15px;
  margin-bottom: 18px;
  font-size: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.stat-card {
  border: 1px solid #e5e9ef;
  background: #fff;
  border-radius: 11px;
  padding: 18px 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
  min-height: 114px;
  box-shadow: 0 3px 12px rgba(15,23,42,.035);
  transition: .2s;
}

button.stat-card {
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15,23,42,.07);
}

.stat-icon {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 25px;
  font-weight: 700;
  flex: none;
}

.stat-icon.green {
  background: #dff6e6;
  color: #159447;
}

.stat-icon.blue {
  background: #e0ebff;
  color: #2c6bed;
}

.stat-icon.yellow {
  background: #fff0cb;
  color: #e79500;
}

.stat-icon.purple {
  background: #eee4ff;
  color: #7040d8;
}

.stat-icon.red {
  background: #ffe2e0;
  color: #db4440;
}

.stat-card > div:last-child {
  display: flex;
  flex-direction: column;
}

.stat-card span {
  font-size: 12px;
  color: #455064;
  margin-bottom: 4px;
}

.stat-card strong {
  font-size: 24px;
  color: #111827;
}

.stat-card small {
  color: #159447;
  font-size: 11px;
  margin-top: 4px;
}

.buyer-filter-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.filter-tabs {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.filter-tab {
  border: 1px solid #d8dee6;
  background: #fff;
  border-radius: 18px;
  padding: 7px 13px;
  font-size: 11px;
  color: #475467;
}

.filter-tab.active {
  background: #e8f7ee;
  border-color: #a8dfbc;
  color: #087c42;
  font-weight: 700;
}

.buyer-search {
  width: 300px;
  height: 38px;
  background: #fff;
  border: 1px solid #d8dee6;
  border-radius: 7px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 11px;
}

.buyer-search span {
  color: #98a2b3;
  font-size: 17px;
}

.buyer-search input {
  width: 100%;
  border: 0;
  outline: 0;
  font-size: 11px;
  color: #344054;
}

.panel {
  background: #fff;
  border: 1px solid #e4e8ee;
  border-radius: 11px;
  box-shadow: 0 3px 14px rgba(15,23,42,.035);
  overflow: hidden;
}

.panel-header {
  min-height: 61px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #edf0f3;
}

.panel-header h2 {
  margin: 0;
  font-size: 17px;
}

.panel-header span {
  color: #98a2b3;
  font-size: 10px;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #fafbfc;
  color: #374151;
  font-size: 11px;
  font-weight: 700;
  text-align: left;
  padding: 13px 15px;
  border-bottom: 1px solid #e8ebef;
  white-space: nowrap;
}

td {
  padding: 14px 15px;
  font-size: 11px;
  border-bottom: 1px solid #edf0f3;
  color: #344054;
  white-space: nowrap;
}

tr:last-child td {
  border-bottom: 0;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background: #f9fbfa;
}

.buyer-table-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.buyer-table-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #8b5cf6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.buyer-table-user > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.buyer-table-user strong {
  font-size: 12px;
  color: #172033;
}

.buyer-table-user small {
  font-size: 9px;
  color: #98a2b3;
}

.contact-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.contact-cell strong {
  font-size: 11px;
}

.contact-cell small {
  font-size: 9px;
  color: #98a2b3;
}

.hash-cell {
  font-family: monospace;
  color: #2563eb;
  font-size: 10px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 25px;
  padding: 4px 9px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 800;
}

.status-badge.pending {
  background: #fff6dc;
  border: 1px solid #f5d58a;
  color: #a15c00;
}

.status-badge.verified {
  background: #e4f8e9;
  border: 1px solid #b8e9c4;
  color: #15803d;
}

.status-badge.rejected {
  background: #ffe8e7;
  border: 1px solid #f6b6b4;
  color: #b42318;
}

.buyer-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.view-button {
  height: 30px;
  border: 0;
  border-radius: 5px;
  background: #087c42;
  color: #fff;
  padding: 0 13px;
  font-size: 11px;
  font-weight: 600;
}

.state-box {
  padding: 48px;
  text-align: center;
  color: #667085;
  font-size: 13px;
}

.empty-box {
  padding: 55px 25px;
  text-align: center;
}

.empty-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #edf7f0;
  color: #159447;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 13px;
  font-size: 22px;
  font-weight: 800;
}

.empty-box h3 {
  margin: 0;
  font-size: 15px;
}

.empty-box p {
  max-width: 500px;
  margin: 8px auto 17px;
  color: #667085;
  font-size: 12px;
  line-height: 1.6;
}

.outline-button,
.primary-button,
.secondary-button,
.danger-button,
.verified-button {
  border-radius: 7px;
  height: 38px;
  padding: 0 15px;
  font-size: 12px;
  font-weight: 700;
}

.outline-button {
  background: #fff;
  border: 1px solid #d8dee6;
  color: #334155;
  height: 32px;
}

.primary-button {
  background: #087c42;
  color: #fff;
  border: 1px solid transparent;
}

.secondary-button {
  background: #fff;
  border: 1px solid #d6dde5;
  color: #344054;
}

.danger-button {
  background: #fff;
  border: 1px solid #f2b8b5;
  color: #b42318;
}

.verified-button {
  background: #e4f8e9;
  border: 1px solid #b8e9c4;
  color: #15803d;
}

.buyer-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 25px;
  z-index: 100;
}

.buyer-modal {
  width: min(700px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e1e7ed;
  box-shadow: 0 25px 70px rgba(15,23,42,.25);
  padding: 22px;
}

.buyer-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #edf0f3;
  padding-bottom: 15px;
}

.eyebrow {
  font-size: 9px;
  letter-spacing: 1px;
  color: #98a2b3;
  font-weight: 800;
}

.buyer-modal-header h2 {
  margin: 5px 0 0;
  font-size: 21px;
}

.modal-close {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 7px;
  background: #f5f7f9;
  color: #667085;
  font-size: 22px;
}

.buyer-detail-profile {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 18px 0;
  border-bottom: 1px solid #edf0f3;
}

.buyer-detail-avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #8b5cf6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  font-weight: 800;
}

.buyer-detail-profile > div:nth-child(2) {
  flex: 1;
}

.buyer-detail-profile h3 {
  margin: 0;
  font-size: 17px;
}

.buyer-detail-profile p {
  margin: 4px 0 0;
  color: #98a2b3;
  font-size: 10px;
}

.buyer-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 20px;
  padding: 8px 0;
}

.buyer-detail-item {
  padding: 13px 0;
  border-bottom: 1px solid #edf0f3;
}

.buyer-detail-item.wide {
  grid-column: 1 / -1;
}

.buyer-detail-item span {
  display: block;
  color: #7a8494;
  font-size: 10px;
  margin-bottom: 5px;
}

.buyer-detail-item strong {
  display: block;
  color: #273142;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.mono {
  font-family: monospace !important;
  font-size: 10px !important;
}

.verification-note {
  margin-top: 15px;
  padding: 12px;
  background: #f1f8f4;
  border: 1px solid #d9eae0;
  border-radius: 8px;
  display: flex;
  gap: 10px;
}

.verification-note-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #dff6e6;
  color: #15803d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  flex: none;
}

.verification-note strong {
  display: block;
  font-size: 11px;
  color: #14532d;
}

.verification-note p {
  margin: 4px 0 0;
  color: #667085;
  font-size: 10px;
  line-height: 1.5;
}

.wallet-confirmed {
  color: #15803d !important;
  font-weight: 700;
}

.wallet-pending {
  color: #a15c00 !important;
  font-weight: 700;
}

.wallet-missing {
  color: #b42318 !important;
  font-weight: 700;
}

.buyer-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #edf0f3;
}

@media(max-width:1200px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media(max-width:850px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .buyer-filter-panel {
    align-items: stretch;
    flex-direction: column;
  }

  .buyer-search {
    width: 100%;
  }
}

@media(max-width:600px) {
  .seller-content {
    padding: 18px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .buyer-detail-grid {
    grid-template-columns: 1fr;
  }

  .buyer-detail-item.wide {
    grid-column: auto;
  }

  .buyer-modal-actions {
    flex-direction: column;
  }

  .buyer-modal-actions button {
    width: 100%;
  }
}

`;

export default BuyerVerification;