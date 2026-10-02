import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BrowserProvider, Contract } from "ethers";

const API_BASE_URL = "http://localhost:5000/api";

/*
  IMPORTANT:
  These addresses must match the LandRegistry contract deployed
  in your Ganache network.
*/
const GANACHE_LAND_REGISTRY_ADDRESSES = {
  1337: "0xFDa7dEEDCe65295dA889bFEC27019e2F896178ED",
  5777: "0xA59327c3bc1C87af200C14279DcaA5514C626719"
};

const LAND_REGISTRY_REQUEST_ABI = [
  "function requestToBuy(uint256 _landId)",
  "function getUser(address _user) view returns (address wallet, string memory name, string memory email, bool registered, bool verified)",
  "function getLand(uint256 _landId) view returns (uint256 landId, string memory ownerName, string memory location, string memory surveyNumber, uint256 area, string memory documentHash, address owner, bool registered, bool verified, bool saleRequested, address buyer, bool saleApproved)"
];

function PurchaseRequest() {
  const { landId } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProperty();
  }, [landId]);

  // =========================================================
  // LOAD PROPERTY
  // =========================================================

  const loadProperty = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("buyerToken");

      if (!token) {
        navigate("/buyer/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/buyer/properties/${landId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load property"
        );
      }

      setProperty(data.property);

    } catch (err) {
      console.error("Purchase request property error:", err);

      setError(
        err?.message ||
        "Unable to load property"
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FORMAT AMOUNT
  // =========================================================

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

    return `₹${number.toLocaleString("en-IN")}`;
  };

  // =========================================================
  // OWNER
  // =========================================================

  const getOwnerName = () => {
    return (
      property?.current_owner?.name ||
      property?.current_owner_name ||
      property?.owner_name ||
      "Not specified"
    );
  };

  // =========================================================
  // LOCATION
  // =========================================================

  const getLocation = () => {
    const parts = [
      property?.village,
      property?.taluk,
      property?.district,
      property?.state
    ].filter(Boolean);

    return parts.length > 0
      ? parts.join(", ")
      : "Location not specified";
  };

  // =========================================================
  // SEND PURCHASE REQUEST
  // =========================================================

  const sendRequest = async () => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("buyerToken");

      if (!token) {
        navigate("/buyer/login");
        return;
      }

      if (!property) {
        throw new Error(
          "Property information is not available."
        );
      }

      // -------------------------------------------------------
      // GET BLOCKCHAIN LAND ID
      // -------------------------------------------------------

      const blockchainLandId =
        property?.blockchain_land_id ??
        property?.blockchainLandId ??
        property?.blockchain_id ??
        property?.blockchainId;

      if (
        blockchainLandId === null ||
        blockchainLandId === undefined ||
        blockchainLandId === ""
      ) {
        throw new Error(
          "This property is not linked to a blockchain land record yet."
        );
      }

      // -------------------------------------------------------
      // CHECK METAMASK
      // -------------------------------------------------------

      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed. Please install MetaMask."
        );
      }

      const provider =
        new BrowserProvider(window.ethereum);

      // -------------------------------------------------------
      // GET CURRENT METAMASK ACCOUNT
      // -------------------------------------------------------

      const accounts =
        await provider.send("eth_accounts", []);

      if (
        !Array.isArray(accounts) ||
        accounts.length === 0 ||
        !accounts[0]
      ) {
        throw new Error(
          "Buyer wallet is not connected. Please connect your Buyer wallet in MetaMask."
        );
      }

      const signer =
        await provider.getSigner();

      const signerAddress =
        await signer.getAddress();

      if (!signerAddress) {
        throw new Error(
          "Unable to read the active MetaMask wallet."
        );
      }

      // -------------------------------------------------------
      // NORMALIZE ADDRESSES SAFELY
      // -------------------------------------------------------

      const activeWallet =
        String(signerAddress).trim().toLowerCase();

      const storedBuyerWallet =
        localStorage.getItem("buyerWallet");

      const normalizedStoredWallet =
        storedBuyerWallet
          ? String(storedBuyerWallet)
              .trim()
              .toLowerCase()
          : "";

      console.log(
        "Active MetaMask wallet:",
        activeWallet
      );

      console.log(
        "Saved Buyer wallet:",
        normalizedStoredWallet
      );

      // -------------------------------------------------------
      // CHECK SAVED BUYER WALLET
      // -------------------------------------------------------

      if (
        normalizedStoredWallet &&
        normalizedStoredWallet !== activeWallet
      ) {
        throw new Error(
          `Wrong MetaMask account. Your verified Buyer wallet is ${storedBuyerWallet}. Please switch MetaMask to that account and try again.`
        );
      }

      // -------------------------------------------------------
      // CHECK GANACHE NETWORK
      // -------------------------------------------------------

      const network =
        await provider.getNetwork();

      const chainId =
        Number(network.chainId);

      console.log(
        "Current chain ID:",
        chainId
      );

      if (
        chainId !== 1337 &&
        chainId !== 5777
      ) {
        throw new Error(
          "Wrong blockchain network. Please connect MetaMask to Ganache Local."
        );
      }

      // -------------------------------------------------------
      // CONTRACT ADDRESS
      // -------------------------------------------------------

      const contractAddress =
        GANACHE_LAND_REGISTRY_ADDRESSES[chainId];

      if (!contractAddress) {
        throw new Error(
          `LandRegistry contract is not configured for chain ID ${chainId}.`
        );
      }

      console.log(
        "LandRegistry contract:",
        contractAddress
      );

      // -------------------------------------------------------
      // CREATE CONTRACT
      // -------------------------------------------------------

      const landRegistry =
        new Contract(
          contractAddress,
          LAND_REGISTRY_REQUEST_ABI,
          signer
        );

      // -------------------------------------------------------
      // CHECK BUYER ON BLOCKCHAIN
      // -------------------------------------------------------

      let blockchainUser;

      try {
        blockchainUser =
          await landRegistry.getUser(
            signerAddress
          );
      } catch (userError) {
        console.error(
          "Blockchain user read error:",
          userError
        );

        throw new Error(
          "Unable to read Buyer registration from the LandRegistry contract. Check that the contract address matches the contract deployed in Ganache."
        );
      }

      console.log(
        "Blockchain buyer:",
        blockchainUser
      );

      const buyerRegistered =
        Boolean(blockchainUser?.registered);

      const buyerVerified =
        Boolean(blockchainUser?.verified);

      // -------------------------------------------------------
      // BUYER MUST ALREADY BE REGISTERED
      // -------------------------------------------------------

      if (!buyerRegistered) {
        throw new Error(
          "This MetaMask wallet is NOT registered on the LandRegistry blockchain. Please switch to the Buyer wallet that was registered and verified by Admin."
        );
      }

      // -------------------------------------------------------
      // BUYER MUST BE VERIFIED
      // -------------------------------------------------------

      if (!buyerVerified) {
        throw new Error(
          "This Buyer wallet is registered but NOT verified by Admin yet."
        );
      }

      // -------------------------------------------------------
      // CHECK LAND FROM BLOCKCHAIN
      // -------------------------------------------------------

      let blockchainLand;

      try {
        blockchainLand =
          await landRegistry.getLand(
            BigInt(String(blockchainLandId))
          );
      } catch (landError) {
        console.error(
          "Blockchain land read error:",
          landError
        );

        throw new Error(
          "Unable to read this land from the LandRegistry blockchain."
        );
      }

      console.log(
        "Blockchain land:",
        blockchainLand
      );

      const landRegistered =
        Boolean(blockchainLand?.registered);

      const landVerified =
        Boolean(blockchainLand?.verified);

      const saleRequested =
        Boolean(blockchainLand?.saleRequested);

      const saleApproved =
        Boolean(blockchainLand?.saleApproved);

      const blockchainOwner =
        blockchainLand?.owner;

      // -------------------------------------------------------
      // LAND VALIDATION
      // -------------------------------------------------------

      if (!landRegistered) {
        throw new Error(
          "This land is not registered on the blockchain."
        );
      }

      if (!landVerified) {
        throw new Error(
          "This land has not been verified by Admin on the blockchain."
        );
      }

      // -------------------------------------------------------
      // BUYER CANNOT BUY OWN LAND
      // -------------------------------------------------------

      if (
        blockchainOwner &&
        String(blockchainOwner)
          .toLowerCase() === activeWallet
      ) {
        throw new Error(
          "You cannot send a purchase request for your own land."
        );
      }

      // -------------------------------------------------------
      // EXISTING REQUEST CHECK
      // -------------------------------------------------------

      if (saleRequested) {
        throw new Error(
          "A purchase request already exists for this property."
        );
      }

      if (saleApproved) {
        throw new Error(
          "This land has already been sold on the blockchain."
        );
      }

      // -------------------------------------------------------
      // SEND BLOCKCHAIN TRANSACTION
      // -------------------------------------------------------

      setSuccess(
        "Please confirm the purchase request in MetaMask..."
      );

      const tx =
        await landRegistry.requestToBuy(
          BigInt(String(blockchainLandId))
        );

      console.log(
        "Purchase request transaction:",
        tx.hash
      );

      setSuccess(
        "Purchase request submitted to Ganache. Waiting for confirmation..."
      );

      const receipt =
        await tx.wait();

      console.log(
        "Purchase request confirmed:",
        receipt
      );

      const blockchainTxHash =
        tx.hash;

      const blockchainBlockNumber =
        receipt?.blockNumber ?? null;

      const blockchainNetwork =
        chainId === 1337
          ? "Ganache Local (1337)"
          : "Ganache Local (5777)";

      // -------------------------------------------------------
      // SAVE REQUEST IN MYSQL
      // -------------------------------------------------------

      const response =
        await fetch(
          `${API_BASE_URL}/buyer/properties/${landId}/request`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              blockchainTxHash,
              blockchainBlockNumber,
              blockchainNetwork,
              blockchainLandId:
                String(blockchainLandId),
              buyerWallet:
                signerAddress,
              blockchainContractAddress:
                contractAddress,
              blockchainChainId:
                chainId
            })
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Blockchain transaction succeeded, but the backend purchase request could not be created."
        );
      }

      // -------------------------------------------------------
      // SUCCESS
      // -------------------------------------------------------

      setSuccess(
        "Purchase request sent successfully. The blockchain transaction and buyer request have been recorded."
      );

    } catch (err) {
      console.error(
        "Send purchase request error:",
        err
      );

      if (err?.code === 4001) {
        setError(
          "MetaMask transaction was cancelled. No purchase request was created."
        );
      } else if (
        err?.code === "ACTION_REJECTED"
      ) {
        setError(
          "MetaMask transaction was cancelled."
        );
      } else {
        setError(
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          "Failed to send purchase request."
        );
      }

      setSuccess("");

    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <>
        <style>{styles}</style>

        <div className="request-page">
          <div className="loading-card">
            <div className="spinner"></div>

            <h2>
              Loading Property
            </h2>

            <p>
              Please wait while we prepare
              your purchase request.
            </p>
          </div>
        </div>
      </>
    );
  }

  // =========================================================
  // PROPERTY LOAD ERROR
  // =========================================================

  if (error && !property) {
    return (
      <>
        <style>{styles}</style>

        <div className="request-page">

          <button
            className="back-button"
            onClick={() =>
              navigate(
                `/buyer/properties/${landId}`
              )
            }
          >
            ← Back to Property
          </button>

          <div className="error-card">

            <div className="error-icon">
              !
            </div>

            <h2>
              Unable to Load Property
            </h2>

            <p>
              {error}
            </p>

            <button
              className="primary-button"
              onClick={loadProperty}
            >
              Try Again
            </button>

          </div>
        </div>
      </>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <>
      <style>{styles}</style>

      <div className="request-page">

        <button
          className="back-button"
          onClick={() =>
            navigate(
              `/buyer/properties/${landId}`
            )
          }
        >
          ← Back to Property
        </button>

        <div className="page-title">

          <div className="title-icon">
            🏠
          </div>

          <div>
            <h1>
              Send Purchase Request
            </h1>

            <p>
              Submit a request to purchase
              this verified property.
            </p>
          </div>

        </div>

        {error && (
          <div className="alert error-alert">
            <strong>
              Request failed:
            </strong>

            <span>
              {error}
            </span>
          </div>
        )}

        {success && (
          <div className="alert success-alert">
            <strong>
              ✓ Blockchain
            </strong>

            <span>
              {success}
            </span>
          </div>
        )}

        <div className="request-grid">

          {/* PROPERTY SUMMARY */}

          <section className="card">

            <div className="section-header">

              <div className="section-icon">
                ▣
              </div>

              <div>
                <h2>
                  Property Summary
                </h2>

                <p>
                  Details of the property
                  you are requesting.
                </p>
              </div>

            </div>

            <div className="divider"></div>

            <div className="summary-item">
              <span>
                Land ID
              </span>

              <strong>
                {property?.land_id ||
                  property?.id}
              </strong>
            </div>

            <div className="summary-item">
              <span>
                Location
              </span>

              <strong>
                {getLocation()}
              </strong>
            </div>

            <div className="summary-item">
              <span>
                Survey Number
              </span>

              <strong>
                {property?.survey_number ||
                  "Not specified"}
              </strong>
            </div>

            <div className="summary-item">
              <span>
                Area
              </span>

              <strong>
                {property?.area ||
                  "Not specified"}{" "}
                {property?.area_unit ||
                  ""}
              </strong>
            </div>

            <div className="summary-item">
              <span>
                Property Type
              </span>

              <strong>
                {property?.land_type ||
                  property?.usage_type ||
                  "Not specified"}
              </strong>
            </div>

            <div className="summary-item">
              <span>
                Current Owner
              </span>

              <strong>
                {getOwnerName()}
              </strong>
            </div>

            <div className="price-box">

              <span>
                Expected Sale Amount
              </span>

              <strong>
                {formatAmount(
                  property?.expected_sale_amount ??
                  property?.sale_amount ??
                  property?.land_amount
                )}
              </strong>

            </div>

          </section>

          {/* CONFIRM REQUEST */}

          <section className="card">

            <div className="section-header">

              <div className="section-icon">
                ✓
              </div>

              <div>
                <h2>
                  Confirm Purchase Request
                </h2>

                <p>
                  Review before submitting
                  your request.
                </p>
              </div>

            </div>

            <div className="divider"></div>

            {success &&
            success.includes("recorded") ? (
              <div className="success-content">

                <div className="success-circle">
                  ✓
                </div>

                <h2>
                  Request Submitted
                </h2>

                <p>
                  Your purchase request has
                  been sent to the property
                  owner.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    navigate(
                      "/buyer/requests"
                    )
                  }
                >
                  View My Requests
                </button>

              </div>
            ) : (
              <>

                <div className="confirmation-box">

                  <h3>
                    Purchase Request
                  </h3>

                  <p>
                    You are requesting to
                    purchase:
                  </p>

                  <strong>
                    Land ID:{" "}
                    {property?.land_id ||
                      property?.id}
                  </strong>

                  <strong>
                    Owner:{" "}
                    {getOwnerName()}
                  </strong>

                  <strong>
                    Amount:{" "}
                    {formatAmount(
                      property?.expected_sale_amount ??
                      property?.sale_amount ??
                      property?.land_amount
                    )}
                  </strong>

                </div>

                <div className="notice-box">

                  <div className="notice-icon">
                    i
                  </div>

                  <div>

                    <strong>
                      Important
                    </strong>

                    <p>
                      Sending this request
                      does not transfer
                      ownership. The property
                      owner must approve the
                      request before the sale
                      can continue.
                    </p>

                  </div>

                </div>

                <button
                  className="primary-button submit-button"
                  onClick={sendRequest}
                  disabled={submitting}
                >
                  {submitting
                    ? "Sending Request..."
                    : "Confirm & Send Request →"}
                </button>

                <button
                  className="cancel-button"
                  onClick={() =>
                    navigate(
                      `/buyer/properties/${landId}`
                    )
                  }
                  disabled={submitting}
                >
                  Cancel
                </button>

              </>
            )}

          </section>

        </div>

      </div>
    </>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = `
* {
  box-sizing: border-box;
}

.request-page {
  min-height: 100vh;
  background: #f5f8f6;
  padding: 45px 48px 80px;
  color: #12372f;
}

.back-button {
  border: none;
  background: transparent;
  color: #08783d;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  margin-bottom: 25px;
}

.back-button:hover {
  color: #075f31;
}

.page-title {
  background: white;
  border: 1px solid #e1e9e5;
  border-radius: 16px;
  padding: 25px 30px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
  box-shadow: 0 3px 12px rgba(0,0,0,.035);
}

.title-icon {
  width: 54px;
  height: 54px;
  background: #e3f8ea;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.page-title h1 {
  margin: 0;
  color: #082f27;
  font-size: 25px;
  font-weight: 800;
}

.page-title p {
  margin: 6px 0 0;
  color: #72827c;
  font-size: 13px;
}

.alert {
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 18px;
  display: flex;
  gap: 8px;
  font-size: 13px;
  word-break: break-word;
}

.error-alert {
  background: #fff1f1;
  border: 1px solid #f1cccc;
  color: #9b3030;
}

.success-alert {
  background: #eaf9ef;
  border: 1px solid #cbead5;
  color: #08783d;
}

.request-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}

.card {
  background: white;
  border: 1px solid #e0e8e4;
  border-radius: 16px;
  padding: 26px;
  box-shadow: 0 3px 12px rgba(0,0,0,.025);
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
  font-size: 19px;
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

.summary-item {
  padding: 14px 0;
  border-bottom: 1px solid #e8eeeb;
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.summary-item span {
  color: #72827c;
  font-size: 12px;
}

.summary-item strong {
  color: #102f28;
  font-size: 13px;
  text-align: right;
}

.price-box {
  margin-top: 20px;
  background: #eaf9ef;
  border: 1px solid #ccebd7;
  border-radius: 10px;
  padding: 17px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.price-box span {
  color: #587068;
  font-size: 12px;
}

.price-box strong {
  color: #08783d;
  font-size: 18px;
}

.confirmation-box {
  background: #f7faf8;
  border: 1px solid #dfe9e4;
  border-radius: 11px;
  padding: 19px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.confirmation-box h3 {
  margin: 0 0 3px;
  color: #0a3028;
  font-size: 15px;
}

.confirmation-box p {
  margin: 0 0 5px;
  color: #71817b;
  font-size: 12px;
}

.confirmation-box strong {
  color: #183b32;
  font-size: 13px;
}

.notice-box {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  padding: 15px;
  background: #f3f8f5;
  border: 1px solid #dbe8e1;
  border-radius: 10px;
}

.notice-icon {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: #d9f1e2;
  color: #08783d;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 800;
  flex-shrink: 0;
}

.notice-box strong {
  color: #164036;
  font-size: 12px;
}

.notice-box p {
  margin: 5px 0 0;
  color: #687b73;
  font-size: 11px;
  line-height: 1.6;
}

.primary-button {
  border: none;
  background: #087c3e;
  color: white;
  border-radius: 9px;
  padding: 13px 20px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.primary-button:hover {
  background: #066b35;
}

.primary-button:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.submit-button {
  width: 100%;
  margin-top: 20px;
}

.cancel-button {
  width: 100%;
  margin-top: 10px;
  background: white;
  border: 1px solid #d6e2dc;
  color: #50655d;
  border-radius: 9px;
  padding: 12px;
  font-weight: 700;
  cursor: pointer;
}

.cancel-button:hover {
  background: #f5f8f6;
}

.cancel-button:disabled {
  opacity: .5;
}

.success-content {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.success-circle {
  width: 65px;
  height: 65px;
  border-radius: 50%;
  background: #dcf8e6;
  color: #07833e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 31px;
  font-weight: 800;
  margin-bottom: 17px;
}

.success-content h2 {
  color: #0a3028;
  margin: 0 0 8px;
  font-size: 19px;
}

.success-content p {
  color: #71817b;
  font-size: 13px;
  margin: 0 0 20px;
}

.loading-card {
  min-height: 450px;
  background: white;
  border: 1px solid #e0e8e4;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 42px;
  height: 42px;
  border: 4px solid #dcefe3;
  border-top-color: #087c3e;
  border-radius: 50%;
  animation: spin .8s linear infinite;
  margin-bottom: 18px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-card h2 {
  color: #12372f;
  margin: 0 0 7px;
}

.loading-card p {
  color: #778780;
  font-size: 13px;
}

.error-card {
  background: white;
  border: 1px solid #efd0d0;
  border-radius: 16px;
  padding: 50px;
  min-height: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.error-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fff0f0;
  color: #d32d2d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23px;
  font-weight: 800;
  margin-bottom: 15px;
}

.error-card h2 {
  color: #552525;
  margin: 0 0 8px;
}

.error-card p {
  color: #896767;
  font-size: 13px;
  margin-bottom: 18px;
}

@media (max-width: 850px) {
  .request-page {
    padding: 30px 22px 60px;
  }

  .request-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 550px) {
  .request-page {
    padding: 25px 15px 50px;
  }

  .page-title {
    padding: 20px;
  }

  .page-title h1 {
    font-size: 21px;
  }

  .card {
    padding: 20px;
  }

  .summary-item,
  .price-box {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-item strong {
    text-align: left;
  }
}
`;

export default PurchaseRequest;