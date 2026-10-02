import React, { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, getAddress } from "ethers";

const API_URL = "http://localhost:5000/api";

// Deployed LandRegistry contracts used by this project.
const LAND_REGISTRY_ADDRESSES = {
  1337: "0xFDa7dEEDCe65295dA889bFEC27019e2F896178ED",
  5777: "0xA59327c3bc1C87af200C14279DcaA5514C626719",
};

const LAND_REGISTRY_VERIFY_ABI = [
  "function admin() view returns (address)",
  "function verifyUser(address _user)",
  "function getUser(address _user) view returns (address wallet, string memory name, string memory email, bool registered, bool verified)"
];

const SellerVerification = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selectedSeller, setSelectedSeller] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [blockchainStatusLoading, setBlockchainStatusLoading] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const getToken = () => {
    return (
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token")
    );
  };

  /* =========================================================
     FETCH SELLERS
  ========================================================= */

  const fetchSellers = async () => {
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
        `${API_URL}/admin/sellers`,
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
          data.message || "Failed to load sellers"
        );
      }

      /*
        Supports both:
        { sellers: [...] }
        { data: [...] }
        [...]
      */

      const sellerData =
        Array.isArray(data)
          ? data
          : data.sellers ||
            data.data ||
            [];

      setSellers(sellerData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  const getStatus = (seller) => {
    return (
      seller.verification_status ||
      seller.status ||
      "PENDING"
    ).toUpperCase();
  };

  const getName = (seller) => {
    return (
      seller.name ||
      seller.full_name ||
      seller.username ||
      "Unknown Seller"
    );
  };

  const getEmail = (seller) => {
    return seller.email || "Not provided";
  };

  const getMobile = (seller) => {
    return (
      seller.mobile ||
      seller.phone ||
      seller.mobile_number ||
      "Not provided"
    );
  };

  const getGovernmentId = (seller) => {
    return (
      seller.government_id ||
      seller.govt_id ||
      seller.governmentId ||
      "Not provided"
    );
  };

  const getWallet = (seller) => {
    return (
      seller.wallet_address ||
      seller.walletAddress ||
      "Not connected"
    );
  };

  const getDate = (seller) => {
    const date =
      seller.created_at ||
      seller.registered_at ||
      seller.createdAt;

    if (!date) return "Not available";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) return "S";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  /* =========================================================
     COUNTS
  ========================================================= */

  const counts = useMemo(() => {
    const pending = sellers.filter(
      (seller) => getStatus(seller) === "PENDING"
    ).length;

    const verified = sellers.filter(
      (seller) => getStatus(seller) === "VERIFIED"
    ).length;

    const rejected = sellers.filter(
      (seller) => getStatus(seller) === "REJECTED"
    ).length;

    return {
      pending,
      verified,
      rejected,
      total: sellers.length,
    };
  }, [sellers]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredSellers = useMemo(() => {
    return sellers.filter((seller) => {
      const status = getStatus(seller);

      const matchesFilter =
        filter === "ALL" ||
        status === filter;

      const text =
        `${getName(seller)}
        ${getEmail(seller)}
        ${getMobile(seller)}
        ${getGovernmentId(seller)}
        ${getWallet(seller)}
        ${seller.id || ""}`
          .toLowerCase();

      const matchesSearch =
        text.includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [sellers, filter, search]);

  /* =========================================================
     VERIFY SELLER ON BLOCKCHAIN
  ========================================================= */

  const verifySellerOnBlockchain = async (seller) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const wallet = getWallet(seller);
      if (!wallet || wallet === "Not connected") throw new Error("This seller has no MetaMask wallet address registered.");
      if (!window.ethereum) throw new Error("MetaMask is not installed. Please open MetaMask and try again.");

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const contractAddress = LAND_REGISTRY_ADDRESSES[chainId];

      if (!contractAddress) {
        throw new Error(`Unsupported blockchain network (chain ${chainId}). Switch MetaMask to Ganache Local (1337/5777).`);
      }

      const accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts?.length) throw new Error("Please connect the Admin MetaMask wallet.");

      const signer = await provider.getSigner();
      const adminAddress = await signer.getAddress();
      const contract = new Contract(contractAddress, LAND_REGISTRY_VERIFY_ABI, signer);
      const contractAdmin = await contract.admin();

      console.log("========== SELLER BLOCKCHAIN VERIFICATION ==========");
      console.log("Chain ID:", chainId);
      console.log("Contract address:", contractAddress);
      console.log("Connected MetaMask account:", adminAddress);
      console.log("Smart contract admin:", contractAdmin);
      console.log("Seller wallet:", wallet);
      console.log("===================================================");

      if (adminAddress.toLowerCase() !== contractAdmin.toLowerCase()) {
        throw new Error(`Wrong Admin Wallet. Connected MetaMask: ${adminAddress}. Smart Contract Admin: ${contractAdmin}. Switch MetaMask to the account that deployed the LandRegistry contract.`);
      }

      let normalizedSellerWallet;
      try { normalizedSellerWallet = getAddress(wallet); }
      catch { throw new Error("The seller wallet address stored in the database is invalid."); }

      const user = await contract.getUser(normalizedSellerWallet);
      if (!user.registered) {
        throw new Error("This seller wallet is not registered on the blockchain yet. Ask the Seller to click 'Register Seller on Blockchain' first.");
      }
      if (user.verified) {
        setSelectedSeller({
          ...seller,
          blockchainVerified: true,
          blockchainRegistered: true,
        });
        setSuccess(`${getName(seller)} is already verified on the blockchain.`);
        await fetchSellers();
        return;
      }

      setSuccess("Blockchain transaction submitted. Waiting for confirmation...");
      const tx = await contract.verifyUser(normalizedSellerWallet);
      console.log("Verification transaction hash:", tx.hash);
      await tx.wait();

      const updatedUser = await contract.getUser(normalizedSellerWallet);
      if (!updatedUser.verified) {
        throw new Error("Transaction was confirmed, but the seller is still not marked as verified on the blockchain.");
      }

      const verifiedSeller = {
        ...seller,
        blockchainVerified: true,
        blockchainRegistered: true,
      };

      setSelectedSeller(verifiedSeller);
      setSuccess(`${getName(seller)} blockchain wallet verified successfully by Admin (${adminAddress.slice(0, 8)}...${adminAddress.slice(-6)}).`);
      await fetchSellers();
    } catch (err) {
      console.error("Blockchain seller verification error:", err);
      let message = err?.shortMessage || err?.reason || err?.message || "Failed to verify seller wallet on blockchain.";
      if (err?.code === "ACTION_REJECTED" || err?.code === 4001) message = "Transaction was cancelled in MetaMask.";
      else if (message.includes("Only admin can perform this action")) message = "The connected MetaMask account is not the Admin account of this LandRegistry contract.";
      else if (message.includes("User not registered")) message = "Seller wallet is not registered on the blockchain yet. Register the seller wallet first.";
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     VERIFY SELLER
  ========================================================= */

  const verifySeller = async (seller) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/admin/sellers/${seller.id}/verify`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to verify seller"
        );
      }

      setSuccess(
        `${getName(seller)} has been verified successfully.`
      );

      setReviewOpen(false);
      setSelectedSeller(null);

      await fetchSellers();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     REJECT SELLER
  ========================================================= */

  const openRejectModal = (seller) => {
    setSelectedSeller(seller);
    setRejectReason("");
    setRejectOpen(true);
  };

  const rejectSeller = async () => {
    if (!selectedSeller) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/admin/sellers/${selectedSeller.id}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: rejectReason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to reject seller"
        );
      }

      setSuccess(
        `${getName(selectedSeller)} has been rejected.`
      );

      setRejectOpen(false);
      setReviewOpen(false);
      setSelectedSeller(null);
      setRejectReason("");

      await fetchSellers();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     REVIEW
  ========================================================= */

  const loadBlockchainVerificationStatus = async (seller) => {
    const wallet = getWallet(seller);

    if (!wallet || wallet === "Not connected" || !window.ethereum) {
      setSelectedSeller({ ...seller, blockchainVerified: false });
      return;
    }

    try {
      setBlockchainStatusLoading(true);

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const contractAddress = LAND_REGISTRY_ADDRESSES[chainId];

      if (!contractAddress) {
        setSelectedSeller({ ...seller, blockchainVerified: false });
        return;
      }

      let normalizedWallet;
      try {
        normalizedWallet = getAddress(wallet);
      } catch {
        setSelectedSeller({ ...seller, blockchainVerified: false });
        return;
      }

      const contract = new Contract(
        contractAddress,
        LAND_REGISTRY_VERIFY_ABI,
        provider
      );

      const user = await contract.getUser(normalizedWallet);

      setSelectedSeller({
        ...seller,
        blockchainVerified: Boolean(user.verified),
        blockchainRegistered: Boolean(user.registered),
      });
    } catch (err) {
      console.error("Blockchain seller status check error:", err);
      setSelectedSeller({ ...seller, blockchainVerified: false });
    } finally {
      setBlockchainStatusLoading(false);
    }
  };

  const openReview = async (seller) => {
    setSelectedSeller({ ...seller, blockchainVerified: false });
    setReviewOpen(true);
    setError("");
    setSuccess("");
    await loadBlockchainVerificationStatus(seller);
  };

  const closeReview = () => {
    if (actionLoading) return;

    setReviewOpen(false);
    setSelectedSeller(null);
  };

  /* =========================================================
     STATUS BADGE
  ========================================================= */

  const StatusBadge = ({ status }) => {
    const normalized = status.toLowerCase();

    return (
      <span
        className={`status-badge ${normalized}`}
      >
        {status}
      </span>
    );
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <>
        <style>{sellerVerificationCSS}</style>

        <div className="seller-content">

          <div className="page-heading">
            <h1>Seller Verification</h1>

            <p>
              Review seller accounts and verify their
              registration details before they can
              register land.
            </p>
          </div>

          <div className="state-box">
            Loading seller verification requests...
          </div>

        </div>
      </>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <>
      <style>{sellerVerificationCSS}</style>

      <div className="seller-content">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="page-heading">

          <h1>
            Seller Verification
          </h1>

          <p>
            Review seller accounts and verify their
            registration details before they can
            register land.
          </p>

        </div>


        {/* ===================================================
            ALERTS
        =================================================== */}

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert success">
            {success}
          </div>
        )}


        {/* ===================================================
            STAT CARDS
        =================================================== */}

        <div className="stats-grid">


          <div className="stat-card">

            <div className="stat-icon yellow">
              ◷
            </div>

            <div>

              <span>
                Pending Sellers
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

            <div className="stat-icon green">
              ✓
            </div>

            <div>

              <span>
                Verified Sellers
              </span>

              <strong>
                {counts.verified}
              </strong>

              <small>
                Approved accounts
              </small>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon red">
              ×
            </div>

            <div>

              <span>
                Rejected Sellers
              </span>

              <strong>
                {counts.rejected}
              </strong>

              <small>
                Rejected accounts
              </small>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon blue">
              ♙
            </div>

            <div>

              <span>
                Total Sellers
              </span>

              <strong>
                {counts.total}
              </strong>

              <small>
                Registered sellers
              </small>

            </div>

          </div>

        </div>


        {/* ===================================================
            SELLER TABLE
        =================================================== */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Seller Verification Requests
              </h2>

              <p className="panel-description">
                Check seller information before
                approving their account.
              </p>

            </div>

            <button
              className="outline-button"
              onClick={fetchSellers}
              disabled={loading}
            >
              ↻ Refresh
            </button>

          </div>


          {/* FILTER BAR */}

          <div className="verification-toolbar">

            <div className="filter-tabs">

              <button
                className={`filter-tab ${
                  filter === "ALL"
                    ? "active"
                    : ""
                }`}
                onClick={() => setFilter("ALL")}
              >
                All ({counts.total})
              </button>


              <button
                className={`filter-tab ${
                  filter === "PENDING"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setFilter("PENDING")
                }
              >
                Pending ({counts.pending})
              </button>


              <button
                className={`filter-tab ${
                  filter === "VERIFIED"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setFilter("VERIFIED")
                }
              >
                Verified ({counts.verified})
              </button>


              <button
                className={`filter-tab ${
                  filter === "REJECTED"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setFilter("REJECTED")
                }
              >
                Rejected ({counts.rejected})
              </button>

            </div>


            <div className="seller-search">

              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search seller..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

          </div>


          {/* TABLE */}

          {filteredSellers.length === 0 ? (

            <div className="empty-box">

              <div className="empty-icon">
                ✓
              </div>

              <h3>
                No sellers found
              </h3>

              <p>
                There are no seller accounts matching
                the current filter or search.
              </p>

            </div>

          ) : (

            <div className="table-wrap">

              <table>

                <thead>

                  <tr>

                    <th>
                      SELLER
                    </th>

                    <th>
                      CONTACT
                    </th>

                    <th>
                      GOVERNMENT ID
                    </th>

                    <th>
                      WALLET ADDRESS
                    </th>

                    <th>
                      REGISTERED
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

                  {filteredSellers.map(
                    (seller) => {

                      const status =
                        getStatus(seller);

                      const name =
                        getName(seller);

                      return (
                        <tr
                          key={seller.id}
                        >

                          {/* SELLER */}

                          <td>

                            <div className="seller-table-profile">

                              <div className="seller-table-avatar">
                                {getInitials(name)}
                              </div>

                              <div>

                                <strong>
                                  {name}
                                </strong>

                                <span>
                                  ID #{seller.id}
                                </span>

                              </div>

                            </div>

                          </td>


                          {/* CONTACT */}

                          <td>

                            <div className="seller-contact">

                              <strong>
                                {getEmail(seller)}
                              </strong>

                              <span>
                                {getMobile(seller)}
                              </span>

                            </div>

                          </td>


                          {/* GOVERNMENT ID */}

                          <td>

                            <span
                              className={
                                getGovernmentId(
                                  seller
                                ) === "Not provided"
                                  ? "muted-cell"
                                  : "strong-cell"
                              }
                            >
                              {getGovernmentId(
                                seller
                              )}
                            </span>

                          </td>


                          {/* WALLET */}

                          <td>

                            {getWallet(seller) ===
                            "Not connected" ? (

                              <span className="muted-cell">
                                Not connected
                              </span>

                            ) : (

                              <span className="wallet-cell">
                                {getWallet(
                                  seller
                                ).length > 18
                                  ? `${getWallet(
                                      seller
                                    ).slice(
                                      0,
                                      8
                                    )}...${getWallet(
                                      seller
                                    ).slice(
                                      -6
                                    )}`
                                  : getWallet(
                                      seller
                                    )}
                              </span>

                            )}

                          </td>


                          {/* DATE */}

                          <td>
                            {getDate(seller)}
                          </td>


                          {/* STATUS */}

                          <td>

                            <StatusBadge
                              status={status}
                            />

                          </td>


                          {/* ACTION */}

                          <td>

                            <button
                              className="view-button"
                              onClick={() =>
                                openReview(seller)
                              }
                            >
                              Review
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


        {/* ===================================================
            REVIEW MODAL
        =================================================== */}

        {reviewOpen &&
          selectedSeller && (

            <div
              className="modal-overlay"
              onClick={closeReview}
            >

              <div
                className="seller-review-modal"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <div className="modal-header">

                  <div>

                    <span className="eyebrow">
                      SELLER VERIFICATION
                    </span>

                    <h2>
                      Review Seller
                    </h2>

                    <p>
                      Check the seller's registration
                      information before verification.
                    </p>

                  </div>

                  <button
                    className="modal-close"
                    onClick={closeReview}
                  >
                    ×
                  </button>

                </div>


                {/* PROFILE */}

                <div className="review-profile">

                  <div className="review-avatar">
                    {getInitials(
                      getName(selectedSeller)
                    )}
                  </div>

                  <div>

                    <h3>
                      {getName(selectedSeller)}
                    </h3>

                    <p>
                      Seller ID #{selectedSeller.id}
                    </p>

                  </div>

                  <StatusBadge
                    status={getStatus(
                      selectedSeller
                    )}
                  />

                </div>


                {/* INFORMATION */}

                <div className="review-section">

                  <div className="review-section-title">
                    Personal Information
                  </div>

                  <div className="info-grid">

                    <div className="info-item">

                      <span>
                        Full Name
                      </span>

                      <strong>
                        {getName(
                          selectedSeller
                        )}
                      </strong>

                    </div>


                    <div className="info-item">

                      <span>
                        Email Address
                      </span>

                      <strong>
                        {getEmail(
                          selectedSeller
                        )}
                      </strong>

                    </div>


                    <div className="info-item">

                      <span>
                        Mobile Number
                      </span>

                      <strong>
                        {getMobile(
                          selectedSeller
                        )}
                      </strong>

                    </div>


                    <div className="info-item">

                      <span>
                        Government ID
                      </span>

                      <strong>
                        {getGovernmentId(
                          selectedSeller
                        )}
                      </strong>

                    </div>


                    <div className="info-item wide">

                      <span>
                        Address
                      </span>

                      <strong>
                        {selectedSeller.address ||
                          "Not provided"}
                      </strong>

                    </div>

                  </div>

                </div>


                {/* WALLET */}

                <div className="review-section">

                  <div className="review-section-title">
                    Blockchain Wallet
                  </div>

                  <div className="wallet-review-box">

                    <div className="wallet-review-icon">
                      ⬡
                    </div>

                    <div>

                      <span>
                        Wallet Address
                      </span>

                      <strong>
                        {getWallet(
                          selectedSeller
                        )}
                      </strong>

                    </div>

                  </div>

                </div>


                {/* REGISTRATION */}

                <div className="review-section">

                  <div className="review-section-title">
                    Registration Details
                  </div>

                  <div className="info-grid">

                    <div className="info-item">

                      <span>
                        Seller ID
                      </span>

                      <strong>
                        #{selectedSeller.id}
                      </strong>

                    </div>


                    <div className="info-item">

                      <span>
                        Registered Date
                      </span>

                      <strong>
                        {getDate(
                          selectedSeller
                        )}
                      </strong>

                    </div>


                    <div className="info-item">

                      <span>
                        Role
                      </span>

                      <strong>
                        {selectedSeller.role ||
                          "SELLER"}
                      </strong>

                    </div>


                    <div className="info-item">

                      <span>
                        Verification Status
                      </span>

                      <StatusBadge
                        status={getStatus(
                          selectedSeller
                        )}
                      />

                    </div>

                  </div>

                </div>


                {/* BLOCKCHAIN VERIFICATION */}

                <div className="review-section">

                  <div className="review-section-title">
                    Blockchain Verification
                  </div>

                  <div className="wallet-review-box">
                    <div className="wallet-review-icon">
                      ⬡
                    </div>

                    <div style={{ flex: 1 }}>
                      <span>Seller Wallet Status</span>
                      <strong>
                        {getWallet(selectedSeller) === "Not connected"
                          ? "Wallet not connected"
                          : blockchainStatusLoading
                            ? "Checking blockchain status..."
                            : selectedSeller.blockchainVerified
                              ? "✓ Verified on blockchain"
                              : "Blockchain verification required"}
                      </strong>
                    </div>
                  </div>

                  {getWallet(selectedSeller) !== "Not connected" &&
                    !blockchainStatusLoading &&
                    !selectedSeller.blockchainVerified && (
                      <div style={{ marginTop: 12 }}>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => verifySellerOnBlockchain(selectedSeller)}
                          disabled={actionLoading}
                        >
                          {actionLoading
                            ? "Waiting for Blockchain..."
                            : "✓ Verify Seller Wallet on Blockchain"}
                        </button>
                      </div>
                    )}

                </div>


                {/* VERIFICATION NOTE */}

                <div className="verification-note">

                  <div className="verification-note-icon">
                    ✓
                  </div>

                  <div>

                    <strong>
                      Verification requirement
                    </strong>

                    <p>
                      Verify that the seller's
                      registration details and submitted
                      identity information are consistent
                      with the available official records.
                    </p>

                  </div>

                </div>


                {/* ACTIONS */}

                <div className="modal-actions">

                  <button
                    className="secondary-button"
                    onClick={closeReview}
                    disabled={actionLoading}
                  >
                    Close
                  </button>


                  {getStatus(selectedSeller) !==
                    "REJECTED" && (

                    <button
                      className="danger-button"
                      onClick={() =>
                        openRejectModal(
                          selectedSeller
                        )
                      }
                      disabled={actionLoading}
                    >
                      Reject Seller
                    </button>

                  )}


                  {getStatus(selectedSeller) !==
                    "VERIFIED" && (

                    <button
                      className="primary-button"
                      onClick={() =>
                        verifySeller(
                          selectedSeller
                        )
                      }
                      disabled={actionLoading}
                    >
                      {actionLoading
                        ? "Processing..."
                        : "✓ Verify Seller"}
                    </button>

                  )}

                </div>

              </div>

            </div>
          )}


        {/* ===================================================
            REJECT MODAL
        =================================================== */}

        {rejectOpen &&
          selectedSeller && (

            <div className="modal-overlay">

              <div className="reject-modal">

                <div className="reject-icon">
                  !
                </div>

                <h2>
                  Reject Seller?
                </h2>

                <p>
                  You are about to reject the seller
                  account of{" "}
                  <strong>
                    {getName(selectedSeller)}
                  </strong>.
                </p>


                <div className="field">

                  <span>
                    Rejection Reason
                  </span>

                  <textarea
                    value={rejectReason}
                    onChange={(e) =>
                      setRejectReason(
                        e.target.value
                      )
                    }
                    placeholder="Enter the reason for rejecting this seller..."
                  />

                </div>


                <div className="modal-actions">

                  <button
                    className="secondary-button"
                    onClick={() =>
                      setRejectOpen(false)
                    }
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>

                  <button
                    className="danger-button"
                    onClick={rejectSeller}
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? "Rejecting..."
                      : "Reject Seller"}
                  </button>

                </div>

              </div>

            </div>
          )}

      </div>
    </>
  );
};


/* =============================================================
   SAME SELLER CSS STYLE
============================================================= */

const sellerVerificationCSS = `

/* =============================================================
   PAGE
============================================================= */

.seller-content{
  padding:24px 30px 45px;
  max-width:1600px;
  margin:auto
}

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


/* =============================================================
   STATISTICS
============================================================= */

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


/* =============================================================
   PANEL
============================================================= */

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
  gap:15px;
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

.panel-description{
  margin:5px 0 0!important;
  color:#667085!important;
  font-size:11px!important
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


/* =============================================================
   TOOLBAR
============================================================= */

.verification-toolbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
  padding:15px 18px;
  border-bottom:1px solid #edf0f3;
  background:#fff
}

.filter-tabs{
  display:flex;
  gap:7px;
  margin:0;
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

.seller-search{
  height:37px;
  width:240px;
  border:1px solid #d8dee6;
  border-radius:7px;
  display:flex;
  align-items:center;
  gap:7px;
  padding:0 11px;
  background:#fff
}

.seller-search span{
  color:#98a2b3;
  font-size:18px
}

.seller-search input{
  border:0;
  outline:0;
  width:100%;
  font-size:11px;
  color:#172033;
  background:transparent
}

.seller-search input::placeholder{
  color:#98a2b3
}

.seller-search:focus-within{
  border-color:#159447;
  box-shadow:0 0 0 3px rgba(21,148,71,.08)
}


/* =============================================================
   TABLE
============================================================= */

.table-wrap{
  width:100%;
  overflow-x:auto
}

table{
  width:100%;
  border-collapse:collapse
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
  padding:13px 15px;
  font-size:10px;
  border-bottom:1px solid #edf0f3;
  color:#344054;
  white-space:nowrap
}

tr:last-child td{
  border-bottom:0
}

tbody tr:hover{
  background:#f9fbfa
}


/* =============================================================
   SELLER PROFILE
============================================================= */

.seller-table-profile{
  display:flex;
  align-items:center;
  gap:9px;
  min-width:150px
}

.seller-table-avatar{
  width:38px;
  height:38px;
  border-radius:50%;
  background:linear-gradient(135deg,#35c978,#16a45d);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:11px;
  font-weight:800;
  flex:none
}

.seller-table-profile div:last-child{
  display:flex;
  flex-direction:column;
  gap:3px
}

.seller-table-profile strong{
  font-size:11px;
  color:#172033
}

.seller-table-profile span{
  font-size:9px;
  color:#98a2b3
}


/* =============================================================
   CONTACT
============================================================= */

.seller-contact{
  display:flex;
  flex-direction:column;
  gap:3px
}

.seller-contact strong{
  font-size:10px;
  color:#344054
}

.seller-contact span{
  color:#667085;
  font-size:9px
}

.strong-cell{
  font-weight:700;
  color:#344054
}

.muted-cell{
  color:#98a2b3
}

.wallet-cell{
  font-family:monospace;
  font-size:9px;
  color:#2563eb
}


/* =============================================================
   STATUS
============================================================= */

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


/* =============================================================
   BUTTONS
============================================================= */

.primary-button,
.secondary-button,
.danger-button{
  border-radius:7px;
  height:38px;
  padding:0 15px;
  border:1px solid transparent;
  font-size:12px;
  font-weight:700
}

.primary-button{
  background:#087c42;
  color:#fff
}

.primary-button:hover{
  background:#056b38
}

.secondary-button{
  background:#fff;
  border-color:#d6dde5;
  color:#344054
}

.secondary-button:hover{
  border-color:#087c42;
  color:#087c42
}

.danger-button{
  background:#fff;
  border-color:#f2b8b5;
  color:#b42318
}

.danger-button:hover{
  background:#fff4f2
}

.view-button{
  height:30px;
  border:0;
  border-radius:5px;
  background:#087c42;
  color:#fff;
  padding:0 13px;
  font-size:11px;
  font-weight:600
}

.view-button:hover{
  background:#056b38
}


/* =============================================================
   ALERT
============================================================= */

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

.alert.success{
  background:#edf9f0;
  border:1px solid #b9e4c3;
  color:#15803d
}


/* =============================================================
   EMPTY
============================================================= */

.empty-box{
  padding:55px 25px;
  text-align:center;
  margin-bottom:0
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


/* =============================================================
   MODAL
============================================================= */

.modal-overlay{
  position:fixed;
  inset:0;
  background:rgba(15,23,42,.45);
  backdrop-filter:blur(2px);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:25px;
  z-index:100
}

.seller-review-modal{
  width:min(760px,100%);
  max-height:90vh;
  overflow-y:auto;
  background:#fff;
  border:1px solid #e1e7ed;
  border-radius:13px;
  box-shadow:0 25px 60px rgba(15,23,42,.2)
}

.modal-header{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:20px;
  padding:21px 23px;
  border-bottom:1px solid #edf0f3
}

.eyebrow{
  font-size:9px;
  letter-spacing:1px;
  color:#98a2b3;
  font-weight:800
}

.modal-header h2{
  margin:5px 0 3px;
  font-size:20px
}

.modal-header p{
  margin:0;
  color:#667085;
  font-size:11px
}

.modal-close{
  width:32px;
  height:32px;
  border:0;
  border-radius:7px;
  background:#f5f7f9;
  color:#667085;
  font-size:21px
}

.modal-close:hover{
  background:#edf1f3;
  color:#172033
}


/* =============================================================
   REVIEW PROFILE
============================================================= */

.review-profile{
  display:flex;
  align-items:center;
  gap:13px;
  padding:18px 23px;
  background:#fafcfb;
  border-bottom:1px solid #edf0f3
}

.review-avatar{
  width:55px;
  height:55px;
  border-radius:50%;
  background:linear-gradient(135deg,#35c978,#16a45d);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:800;
  font-size:17px;
  flex:none
}

.review-profile>div:nth-child(2){
  flex:1
}

.review-profile h3{
  margin:0;
  font-size:15px
}

.review-profile p{
  margin:4px 0 0;
  color:#98a2b3;
  font-size:10px
}


/* =============================================================
   REVIEW SECTIONS
============================================================= */

.review-section{
  padding:18px 23px;
  border-bottom:1px solid #edf0f3
}

.review-section-title{
  font-size:12px;
  font-weight:800;
  color:#344054;
  margin-bottom:13px
}

.info-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:0 20px
}

.info-item{
  padding:10px 0;
  border-bottom:1px solid #edf0f3;
  min-width:0
}

.info-item.wide{
  grid-column:1/-1
}

.info-item span{
  display:block;
  color:#7a8494;
  font-size:9px;
  margin-bottom:4px
}

.info-item strong{
  display:block;
  color:#273142;
  font-size:11px;
  overflow-wrap:anywhere
}


/* =============================================================
   WALLET
============================================================= */

.wallet-review-box{
  display:flex;
  align-items:center;
  gap:11px;
  padding:12px;
  border:1px solid #e2e8ee;
  background:#fafcfd;
  border-radius:8px
}

.wallet-review-icon{
  width:38px;
  height:38px;
  border-radius:50%;
  background:#eaf1ff;
  color:#2563eb;
  display:flex;
  align-items:center;
  justify-content:center;
  flex:none
}

.wallet-review-box div:last-child{
  display:flex;
  flex-direction:column;
  gap:4px;
  min-width:0
}

.wallet-review-box span{
  color:#667085;
  font-size:9px
}

.wallet-review-box strong{
  font-family:monospace;
  color:#2563eb;
  font-size:10px;
  overflow-wrap:anywhere
}


/* =============================================================
   VERIFICATION NOTE
============================================================= */

.verification-note{
  display:flex;
  gap:11px;
  align-items:flex-start;
  margin:18px 23px;
  padding:12px;
  border-radius:8px;
  background:#f1f8f4;
  border:1px solid #d5eadc
}

.verification-note-icon{
  width:30px;
  height:30px;
  border-radius:50%;
  background:#dff6e6;
  color:#15803d;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:900;
  flex:none
}

.verification-note strong{
  font-size:10px;
  color:#14532d
}

.verification-note p{
  margin:4px 0 0;
  color:#667085;
  font-size:9px;
  line-height:1.55
}


/* =============================================================
   MODAL ACTIONS
============================================================= */

.modal-actions{
  display:flex;
  justify-content:flex-end;
  gap:8px;
  padding:16px 23px;
  border-top:1px solid #edf0f3;
  flex-wrap:wrap
}


/* =============================================================
   REJECT MODAL
============================================================= */

.reject-modal{
  width:min(460px,100%);
  background:#fff;
  border-radius:12px;
  border:1px solid #e1e7ed;
  box-shadow:0 25px 60px rgba(15,23,42,.2);
  padding:25px
}

.reject-icon{
  width:50px;
  height:50px;
  border-radius:50%;
  background:#ffe8e7;
  color:#b42318;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:23px;
  font-weight:900;
  margin-bottom:14px
}

.reject-modal h2{
  margin:0;
  font-size:19px
}

.reject-modal>p{
  color:#667085;
  font-size:11px;
  line-height:1.6;
  margin:8px 0 18px
}

.field{
  display:flex;
  flex-direction:column;
  gap:7px
}

.field>span{
  font-size:11px;
  font-weight:700;
  color:#344054
}

.field textarea{
  width:100%;
  border:1px solid #d8dee6;
  border-radius:7px;
  background:#fff;
  color:#172033;
  outline:none;
  padding:10px 11px;
  font-size:12px;
  min-height:100px;
  resize:vertical
}

.field textarea:focus{
  border-color:#159447;
  box-shadow:0 0 0 3px rgba(21,148,71,.08)
}


/* =============================================================
   STATE
============================================================= */

.state-box{
  padding:48px;
  text-align:center;
  color:#667085;
  font-size:13px;
  background:#fff;
  border:1px solid #e4e8ee;
  border-radius:11px
}


/* =============================================================
   RESPONSIVE
============================================================= */

@media(max-width:1200px){

  .stats-grid{
    grid-template-columns:repeat(2,1fr)
  }

}

@media(max-width:850px){

  .seller-content{
    padding:18px
  }

  .verification-toolbar{
    align-items:flex-start;
    flex-direction:column
  }

  .seller-search{
    width:100%
  }

  .info-grid{
    grid-template-columns:1fr
  }

  .info-item.wide{
    grid-column:auto
  }

}

@media(max-width:560px){

  .stats-grid{
    grid-template-columns:1fr
  }

  .panel-header{
    align-items:flex-start;
    flex-direction:column
  }

  .modal-overlay{
    padding:10px
  }

  .modal-header,
  .review-section,
  .review-profile{
    padding-left:16px;
    padding-right:16px
  }

  .verification-note{
    margin-left:16px;
    margin-right:16px
  }

  .modal-actions{
    padding-left:16px;
    padding-right:16px
  }

  .modal-actions button{
    flex:1
  }

}

`;

export default SellerVerification;