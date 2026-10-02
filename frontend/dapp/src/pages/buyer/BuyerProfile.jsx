import React, { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

import {
  getNetworkName,
  getBlockchainUser,
  registerBlockchainUser
} from "../../blockchain/blockchain";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const BuyerProfile = () => {
  const [buyer, setBuyer] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: ""
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================================
  // BLOCKCHAIN WALLET STATE
  // ==========================================================

  const [walletAddress, setWalletAddress] = useState("");
  const [walletNetwork, setWalletNetwork] = useState("");

  const [blockchainRegistered, setBlockchainRegistered] =
    useState(false);

  const [blockchainVerified, setBlockchainVerified] =
    useState(false);

  const [blockchainLoading, setBlockchainLoading] =
    useState(false);

  const [blockchainError, setBlockchainError] =
    useState("");

  // ==========================================================
  // LOAD PROFILE
  // ==========================================================

  useEffect(() => {
    loadBuyerProfile();
  }, []);

  // ==========================================================
  // LOAD BUYER PROFILE
  // ==========================================================

  const loadBuyerProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("buyerToken") ||
        localStorage.getItem("token");

      if (!token) {
        setError("Buyer session not found. Please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/buyer/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load buyer profile"
        );
      }

      const profile = data.buyer || data.user || {};

      setBuyer(profile);

      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        mobile: profile.mobile || "",
        address: profile.address || ""
      });

      // Keep buyer session updated
      const storedBuyer = JSON.parse(
        localStorage.getItem("buyerUser") || "{}"
      );

      localStorage.setItem(
        "buyerUser",
        JSON.stringify({
          ...storedBuyer,
          ...profile
        })
      );

      // ======================================================
      // DATABASE WALLET IS THE MAIN WALLET
      // ======================================================

      const databaseWallet =
        profile.wallet_address ||
        profile.wallet ||
        "";

      if (databaseWallet) {
        setWalletAddress(databaseWallet);

        localStorage.setItem(
          "buyerWallet",
          databaseWallet
        );

        // Get network from localStorage
        setWalletNetwork(
          localStorage.getItem("buyerWalletNetwork") ||
          "Ganache Local"
        );

        // Check THIS wallet on blockchain
        await checkBlockchainBuyer(databaseWallet);
      } else {
        setWalletAddress("");
        setBlockchainRegistered(false);
        setBlockchainVerified(false);
      }

    } catch (err) {
      console.error("Buyer profile error:", err);

      try {
        const storedBuyer = JSON.parse(
          localStorage.getItem("buyerUser") || "{}"
        );

        if (
          storedBuyer &&
          Object.keys(storedBuyer).length > 0
        ) {
          setBuyer(storedBuyer);

          setFormData({
            name: storedBuyer.name || "",
            email: storedBuyer.email || "",
            mobile: storedBuyer.mobile || "",
            address: storedBuyer.address || ""
          });

          const savedWallet =
            storedBuyer.wallet_address ||
            storedBuyer.wallet ||
            "";

          if (savedWallet) {
            setWalletAddress(savedWallet);

            await checkBlockchainBuyer(savedWallet);
          }

          setError("");
        } else {
          setError(err.message);
        }
      } catch {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // CHECK BLOCKCHAIN BUYER
  // ==========================================================

  const checkBlockchainBuyer = async (address) => {
    if (!address) {
      setBlockchainRegistered(false);
      setBlockchainVerified(false);
      return;
    }

    try {
      setBlockchainError("");

      const blockchainUser =
        await getBlockchainUser(address);

      if (!blockchainUser) {
        setBlockchainRegistered(false);
        setBlockchainVerified(false);
        return;
      }

      setBlockchainRegistered(
        Boolean(blockchainUser.registered)
      );

      setBlockchainVerified(
        Boolean(blockchainUser.verified)
      );

    } catch (err) {
      console.error(
        "Blockchain buyer check error:",
        err
      );

      // VERY IMPORTANT:
      // If this is a new wallet, old wallet status
      // must NOT remain on screen.
      setBlockchainRegistered(false);
      setBlockchainVerified(false);

      setBlockchainError(
        err?.message ||
          "Unable to check blockchain buyer status."
      );
    }
  };

  // ==========================================================
  // CONNECT / CHANGE METAMASK WALLET
  // ==========================================================

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert(
        "MetaMask is not installed. Please install MetaMask first."
      );
      return;
    }

    try {
      setBlockchainLoading(true);
      setBlockchainError("");
      setMessage("");
      setError("");

      const provider =
        new BrowserProvider(window.ethereum);

      // Ask MetaMask for account
      const accounts =
        await provider.send(
          "eth_requestAccounts",
          []
        );

      if (!accounts || accounts.length === 0) {
        throw new Error(
          "No MetaMask account was selected."
        );
      }

      const address = accounts[0];

      // ======================================================
      // NETWORK
      // ======================================================

      const network =
        await provider.getNetwork();

      const chainId =
        network.chainId.toString();

      if (
        chainId !== "1337" &&
        chainId !== "5777"
      ) {
        throw new Error(
          "Please connect MetaMask to Ganache Local before continuing."
        );
      }

      const networkName =
        getNetworkName(chainId);

      // ======================================================
      // IMPORTANT:
      // DO NOT COMPARE WITH OLD DATABASE WALLET
      // ======================================================
      //
      // The user is intentionally changing the wallet.
      //
      // Old wallet:
      // 0xdfd563...
      //
      // New wallet:
      // 0x54c087...
      //
      // New wallet should replace old wallet.
      // ======================================================

      setWalletAddress(address);
      setWalletNetwork(networkName);

      localStorage.setItem(
        "buyerWallet",
        address
      );

      localStorage.setItem(
        "buyerWalletNetwork",
        networkName
      );

      // ======================================================
      // RESET OLD BLOCKCHAIN STATUS IMMEDIATELY
      // ======================================================

      setBlockchainRegistered(false);
      setBlockchainVerified(false);

      // ======================================================
      // SAVE NEW WALLET TO MYSQL
      // ======================================================

      const token =
        localStorage.getItem("buyerToken") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Buyer session not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/buyer/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name:
              buyer?.name ||
              formData.name,

            mobile:
              buyer?.mobile ||
              formData.mobile,

            address:
              buyer?.address ||
              formData.address,

            wallet_address: address
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Wallet could not be saved to buyer account."
        );
      }

      // ======================================================
      // UPDATE BUYER
      // ======================================================

      const updatedBuyer =
        data.buyer ||
        data.user ||
        {
          ...(buyer || {}),
          wallet_address: address
        };

      setBuyer(updatedBuyer);

      localStorage.setItem(
        "buyerUser",
        JSON.stringify(updatedBuyer)
      );

      setMessage(
        "New MetaMask wallet connected and saved successfully."
      );

      // ======================================================
      // CHECK NEW WALLET ON BLOCKCHAIN
      // ======================================================

      await checkBlockchainBuyer(address);

    } catch (err) {
      console.error(
        "Buyer MetaMask error:",
        err
      );

      if (
        err?.code === 4001 ||
        err?.info?.error?.code === 4001
      ) {
        setBlockchainError(
          "MetaMask connection was cancelled."
        );
      } else {
        setBlockchainError(
          err?.message ||
            "Unable to connect MetaMask."
        );
      }
    } finally {
      setBlockchainLoading(false);
    }
  };

  // ==========================================================
  // FORCE CHANGE WALLET
  // ==========================================================

  const changeWallet = async () => {
    if (!window.ethereum) {
      setBlockchainError(
        "MetaMask is not installed."
      );
      return;
    }

    try {
      setBlockchainLoading(true);
      setBlockchainError("");
      setMessage("");

      // Clear old frontend wallet
      localStorage.removeItem("buyerWallet");
      localStorage.removeItem("buyerWalletNetwork");

      setWalletAddress("");
      setWalletNetwork("");

      setBlockchainRegistered(false);
      setBlockchainVerified(false);

      // Ask MetaMask to allow account selection
      try {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [
            {
              eth_accounts: {}
            }
          ]
        });
      } catch (permissionError) {
        console.log(
          "MetaMask permission selection skipped:",
          permissionError
        );
      }

      // Connect selected account
      await connectWallet();

    } catch (err) {
      console.error(
        "Change wallet error:",
        err
      );

      setBlockchainError(
        err?.message ||
          "Unable to change wallet."
      );

      setBlockchainLoading(false);
    }
  };

  // ==========================================================
  // REGISTER CURRENT WALLET ON BLOCKCHAIN
  // ==========================================================

  const registerBuyerBlockchain = async () => {
    if (!walletAddress) {
      setBlockchainError(
        "Please connect your MetaMask wallet first."
      );
      return;
    }

    if (!buyer?.name || !buyer?.email) {
      setBlockchainError(
        "Buyer profile information is missing."
      );
      return;
    }

    try {
      setBlockchainLoading(true);
      setBlockchainError("");
      setMessage("");

      // ======================================================
      // CHECK CURRENT METAMASK ACCOUNT
      // ======================================================

      const provider =
        new BrowserProvider(window.ethereum);

      const accounts =
        await provider.send(
          "eth_accounts",
          []
        );

      if (!accounts || accounts.length === 0) {
        throw new Error(
          "Please connect the buyer wallet in MetaMask."
        );
      }

      const activeWallet =
        accounts[0];

      // IMPORTANT:
      // Registration MUST happen from the wallet
      // displayed on this page.
      if (
        activeWallet.toLowerCase() !==
        walletAddress.toLowerCase()
      ) {
        throw new Error(
          `MetaMask is currently using ${activeWallet}. Please select the buyer wallet ${walletAddress}.`
        );
      }

      // Check network
      const network =
        await provider.getNetwork();

      const chainId =
        network.chainId.toString();

      if (
        chainId !== "1337" &&
        chainId !== "5777"
      ) {
        throw new Error(
          "Please connect MetaMask to Ganache Local."
        );
      }

      // ======================================================
      // REGISTER THIS CURRENT WALLET
      // ======================================================

      const result =
        await registerBlockchainUser(
          buyer.name,
          buyer.email
        );

      // Recheck blockchain
      await checkBlockchainBuyer(
        walletAddress
      );

      setMessage(
        result?.alreadyRegistered
          ? "This buyer wallet is already registered on Ganache."
          : "Buyer wallet registered successfully on Ganache. Admin verification is now required."
      );

    } catch (err) {
      console.error(
        "Buyer blockchain registration error:",
        err
      );

      setBlockchainError(
        err?.message ||
          "Unable to register buyer on blockchain."
      );
    } finally {
      setBlockchainLoading(false);
    }
  };

  // ==========================================================
  // INPUT
  // ==========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // ==========================================================
  // SAVE PROFILE
  // ==========================================================

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (!formData.name.trim()) {
        setError("Name is required.");
        return;
      }

      if (!formData.email.trim()) {
        setError("Email is required.");
        return;
      }

      const token =
        localStorage.getItem("buyerToken") ||
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Buyer session not found. Please login again."
        );
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/buyer/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            mobile: formData.mobile.trim(),
            address: formData.address.trim(),
            wallet_address:
              walletAddress ||
              buyer?.wallet_address ||
              ""
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update profile"
        );
      }

      const updatedBuyer =
        data.buyer ||
        data.user ||
        {
          ...buyer,
          ...formData,
          wallet_address: walletAddress
        };

      setBuyer(updatedBuyer);

      localStorage.setItem(
        "buyerUser",
        JSON.stringify(updatedBuyer)
      );

      setEditing(false);

      setMessage(
        "Profile updated successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);

    } catch (err) {
      console.error(
        "Update buyer profile error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCEL EDIT
  // ==========================================================

  const handleCancel = () => {
    setFormData({
      name: buyer?.name || "",
      email: buyer?.email || "",
      mobile: buyer?.mobile || "",
      address: buyer?.address || ""
    });

    setEditing(false);
    setError("");
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner}></div>

          <p style={styles.loadingText}>
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error && !buyer) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>
            !
          </div>

          <h2>Unable to Load Profile</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadBuyerProfile}
            style={styles.primaryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PROFILE
  // ==========================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>
              My Profile
            </h1>

            <p style={styles.pageSubtitle}>
              Manage your buyer account information
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setMessage("");
                setError("");
              }}
              style={styles.primaryButton}
            >
              ✎ Edit Profile
            </button>
          )}
        </div>

        {/* MESSAGE */}

        {message && (
          <div style={styles.successMessage}>
            <span>✓</span>
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div style={styles.warningMessage}>
            <span>!</span>
            <span>{error}</span>
          </div>
        )}

        {/* PROFILE CARD */}

        <div style={styles.profileCard}>

          {/* PROFILE HEADER */}

          <div style={styles.profileHeader}>

            <div style={styles.avatar}>
              {(formData.name || "Buyer")
                .trim()
                .charAt(0)
                .toUpperCase()}
            </div>

            <div style={styles.profileHeaderInfo}>
              <h2 style={styles.profileName}>
                {formData.name || "Buyer"}
              </h2>

              <p style={styles.profileRole}>
                Buyer
              </p>

              <div
                style={
                  blockchainVerified
                    ? styles.verifiedBadge
                    : styles.pendingBadge
                }
              >
                <span>
                  {blockchainVerified ? "✓" : "!"}
                </span>

                {blockchainVerified
                  ? "Verified Buyer"
                  : "Verification Pending"}
              </div>
            </div>

          </div>

          {/* ACCOUNT INFORMATION */}

          <div style={styles.section}>

            <div style={styles.sectionTitleRow}>

              <div style={styles.sectionIcon}>
                👤
              </div>

              <div>
                <h3 style={styles.sectionTitle}>
                  Account Information
                </h3>

                <p style={styles.sectionSubtitle}>
                  Your registered buyer account details
                </p>
              </div>

            </div>

            <div style={styles.divider}></div>

            <form onSubmit={handleSave}>

              <div style={styles.grid}>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    style={
                      editing
                        ? styles.input
                        : styles.disabledInput
                    }
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    style={styles.disabledInput}
                  />

                  <small style={styles.helperText}>
                    Email cannot be changed here.
                  </small>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Mobile Number
                  </label>

                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    disabled={!editing}
                    maxLength={10}
                    style={
                      editing
                        ? styles.input
                        : styles.disabledInput
                    }
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Account Role
                  </label>

                  <input
                    type="text"
                    value="BUYER"
                    disabled
                    style={styles.disabledInput}
                  />
                </div>

                <div
                  style={{
                    ...styles.field,
                    gridColumn: "1 / -1"
                  }}
                >
                  <label style={styles.label}>
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!editing}
                    rows={4}
                    style={
                      editing
                        ? styles.textarea
                        : styles.disabledInput
                    }
                  />
                </div>

              </div>

              {editing && (
                <div style={styles.actionRow}>

                  <button
                    type="button"
                    onClick={handleCancel}
                    style={styles.cancelButton}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={styles.primaryButton}
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>
              )}

            </form>

          </div>

          {/* ==================================================
              BLOCKCHAIN WALLET
          ================================================== */}

          <div style={styles.section}>

            <div style={styles.sectionTitleRow}>

              <div style={styles.sectionIcon}>
                🦊
              </div>

              <div>
                <h3 style={styles.sectionTitle}>
                  Blockchain Wallet
                </h3>

                <p style={styles.sectionSubtitle}>
                  Connect the MetaMask wallet used for buyer blockchain transactions
                </p>
              </div>

            </div>

            <div style={styles.divider}></div>

            {!walletAddress ? (

              <div style={styles.walletEmpty}>

                <div style={styles.walletIcon}>
                  🦊
                </div>

                <div>
                  <strong style={styles.walletTitle}>
                    Wallet Not Connected
                  </strong>

                  <p style={styles.walletText}>
                    Connect your Ganache MetaMask account to use blockchain purchase functions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={connectWallet}
                  disabled={blockchainLoading}
                  style={styles.primaryButton}
                >
                  {blockchainLoading
                    ? "Connecting..."
                    : "Connect MetaMask"}
                </button>

              </div>

            ) : (

              <>

                <div style={styles.walletBox}>

                  <div>
                    <strong style={styles.walletTitle}>
                      Wallet Connected
                    </strong>

                    <p style={styles.walletText}>
                      This wallet is used for buyer-side blockchain transactions.
                    </p>
                  </div>

                  <div style={styles.walletAddress}>
                    {walletAddress}
                  </div>

                  <div style={styles.infoGrid}>

                    <div>
                      <span style={styles.infoLabel}>
                        Network
                      </span>

                      <strong style={styles.infoValue}>
                        {walletNetwork || "Ganache Local"}
                      </strong>
                    </div>

                    <div>
                      <span style={styles.infoLabel}>
                        Role
                      </span>

                      <strong style={styles.infoValue}>
                        Buyer Wallet
                      </strong>
                    </div>

                  </div>

                  {/* CHANGE WALLET */}

                  <div style={styles.walletButtonRow}>

                    <button
                      type="button"
                      onClick={changeWallet}
                      disabled={blockchainLoading}
                      style={styles.secondaryButton}
                    >
                      {blockchainLoading
                        ? "Changing..."
                        : "Change Wallet"}
                    </button>

                  </div>

                </div>

                {/* BLOCKCHAIN STATUS */}

                <div style={styles.blockchainCard}>

                  <h4 style={styles.blockchainTitle}>
                    Blockchain Buyer Verification
                  </h4>

                  <p style={styles.blockchainSubtitle}>
                    Your wallet must be registered on the LandRegistry smart contract and verified by the Admin.
                  </p>

                  <div style={styles.statusGrid}>

                    <div style={styles.statusItem}>

                      <span style={styles.statusLabel}>
                        Wallet Registration
                      </span>

                      <span
                        style={
                          blockchainRegistered
                            ? styles.statusVerified
                            : styles.statusPending
                        }
                      >
                        {blockchainRegistered
                          ? "REGISTERED"
                          : "PENDING"}
                      </span>

                      <small style={styles.statusDescription}>
                        {blockchainRegistered
                          ? "This wallet is registered on Ganache."
                          : "This wallet is not registered on the smart contract."}
                      </small>

                    </div>

                    <div style={styles.statusItem}>

                      <span style={styles.statusLabel}>
                        Admin Verification
                      </span>

                      <span
                        style={
                          blockchainVerified
                            ? styles.statusVerified
                            : styles.statusPending
                        }
                      >
                        {blockchainVerified
                          ? "VERIFIED"
                          : "PENDING"}
                      </span>

                      <small style={styles.statusDescription}>
                        {blockchainVerified
                          ? "Admin has verified this wallet."
                          : blockchainRegistered
                            ? "Waiting for Admin to verify this wallet."
                            : "Register this wallet first."}
                      </small>

                    </div>

                  </div>

                  {blockchainError && (
                    <div style={styles.blockchainError}>
                      {blockchainError}
                    </div>
                  )}

                  {/* STEP 1 */}

                  {!blockchainRegistered && (
                    <div style={styles.blockchainAction}>

                      <div>
                        <strong>
                          Step 1 — Register Buyer Wallet
                        </strong>

                        <p>
                          Confirm the MetaMask transaction to register this wallet on Ganache.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={registerBuyerBlockchain}
                        disabled={blockchainLoading}
                        style={styles.primaryButton}
                      >
                        {blockchainLoading
                          ? "Waiting for MetaMask..."
                          : "Register Buyer on Blockchain"}
                      </button>

                    </div>
                  )}

                  {/* STEP 2 */}

                  {blockchainRegistered &&
                    !blockchainVerified && (
                      <div style={styles.waitingBox}>

                        <strong>
                          Step 2 — Admin Verification Required
                        </strong>

                        <p>
                          This wallet is registered on the blockchain.
                          The Admin must now verify this wallet using
                          <b> verifyUser()</b>.
                        </p>

                      </div>
                    )}

                  {/* COMPLETE */}

                  {blockchainRegistered &&
                    blockchainVerified && (
                      <div style={styles.verifiedBox}>

                        <strong>
                          ✓ Buyer Blockchain Verification Complete
                        </strong>

                        <p>
                          This wallet is registered and verified.
                          You can now send purchase requests for verified properties.
                        </p>

                      </div>
                    )}

                </div>

              </>

            )}

          </div>

          {/* SECURITY */}

          <div style={styles.section}>

            <div style={styles.sectionTitleRow}>

              <div style={styles.sectionIcon}>
                🔐
              </div>

              <div>
                <h3 style={styles.sectionTitle}>
                  Security
                </h3>

                <p style={styles.sectionSubtitle}>
                  Account and authentication information
                </p>
              </div>

            </div>

            <div style={styles.divider}></div>

            <div style={styles.securityRow}>

              <div>
                <strong style={styles.securityTitle}>
                  Password
                </strong>

                <p style={styles.securityText}>
                  Your password is securely encrypted.
                </p>
              </div>

              <span style={styles.secureBadge}>
                Protected
              </span>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

// ==========================================================
// STYLES
// ==========================================================

const styles = {

  page: {
    minHeight: "100%",
    padding: "32px",
    background: "#f5f9f7",
    boxSizing: "border-box"
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto"
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px"
  },

  pageTitle: {
    margin: 0,
    color: "#073b2d",
    fontSize: "28px",
    fontWeight: "800"
  },

  pageSubtitle: {
    margin: "7px 0 0",
    color: "#718078",
    fontSize: "14px"
  },

  profileCard: {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e3ebe7",
    boxShadow: "0 4px 16px rgba(0, 70, 50, 0.06)",
    overflow: "hidden"
  },

  profileHeader: {
    padding: "28px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background:
      "linear-gradient(135deg, #f0fbf5, #ffffff)",
    borderBottom: "1px solid #e6eee9"
  },

  avatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "#16a765",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "800",
    flexShrink: 0
  },

  profileHeaderInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start"
  },

  profileName: {
    margin: 0,
    color: "#073b2d",
    fontSize: "22px",
    fontWeight: "800"
  },

  profileRole: {
    margin: "4px 0 9px",
    color: "#687a72",
    fontSize: "14px"
  },

  verifiedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#dcf8e8",
    color: "#087b43",
    borderRadius: "20px",
    padding: "6px 11px",
    fontSize: "12px",
    fontWeight: "700"
  },

  pendingBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#fff5d9",
    color: "#966d00",
    borderRadius: "20px",
    padding: "6px 11px",
    fontSize: "12px",
    fontWeight: "700"
  },

  section: {
    padding: "28px"
  },

  sectionTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "13px"
  },

  sectionIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "11px",
    background: "#e8f8ef",
    color: "#079447",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0
  },

  sectionTitle: {
    margin: 0,
    color: "#123d30",
    fontSize: "18px",
    fontWeight: "800"
  },

  sectionSubtitle: {
    margin: "4px 0 0",
    color: "#78847f",
    fontSize: "13px"
  },

  divider: {
    height: "1px",
    background: "#e6ece9",
    margin: "22px 0"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "20px"
  },

  field: {
    display: "flex",
    flexDirection: "column"
  },

  label: {
    marginBottom: "8px",
    color: "#51645c",
    fontSize: "13px",
    fontWeight: "700"
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "9px",
    border: "1px solid #cfdad5",
    background: "#ffffff",
    color: "#173c31",
    fontSize: "14px",
    outline: "none"
  },

  disabledInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "9px",
    border: "1px solid #e1e8e4",
    background: "#f5f8f6",
    color: "#50625a",
    fontSize: "14px",
    outline: "none"
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "9px",
    border: "1px solid #cfdad5",
    background: "#ffffff",
    color: "#173c31",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit"
  },

  helperText: {
    marginTop: "5px",
    color: "#89948f",
    fontSize: "11px"
  },

  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "24px"
  },

  primaryButton: {
    border: "none",
    borderRadius: "9px",
    padding: "11px 18px",
    background: "#078b4b",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer"
  },

  secondaryButton: {
    border: "1px solid #078b4b",
    borderRadius: "9px",
    padding: "9px 15px",
    background: "#ffffff",
    color: "#078b4b",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer"
  },

  cancelButton: {
    border: "1px solid #ccd8d3",
    borderRadius: "9px",
    padding: "11px 18px",
    background: "#ffffff",
    color: "#496158",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer"
  },

  successMessage: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "12px 15px",
    marginBottom: "18px",
    borderRadius: "9px",
    background: "#e5f8ed",
    color: "#087b43",
    border: "1px solid #bcebd0",
    fontSize: "13px",
    fontWeight: "600"
  },

  warningMessage: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "12px 15px",
    marginBottom: "18px",
    borderRadius: "9px",
    background: "#fff7e5",
    color: "#986c00",
    border: "1px solid #f2dda5",
    fontSize: "13px",
    fontWeight: "600"
  },

  walletEmpty: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    background: "#f8fbf9",
    border: "1px solid #e1ebe5",
    borderRadius: "12px"
  },

  walletIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    background: "#fff4df",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0
  },

  walletTitle: {
    color: "#173c31",
    fontSize: "14px"
  },

  walletText: {
    margin: "5px 0 0",
    color: "#74827c",
    fontSize: "13px"
  },

  walletBox: {
    padding: "20px",
    background: "#f0fbf5",
    border: "1px solid #d3efdf",
    borderRadius: "12px"
  },

  walletAddress: {
    marginTop: "15px",
    padding: "12px",
    borderRadius: "8px",
    background: "#ffffff",
    border: "1px solid #dce8e1",
    color: "#174b38",
    fontSize: "12px",
    fontFamily: "monospace",
    wordBreak: "break-all"
  },

  walletButtonRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "15px"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "15px",
    marginTop: "15px"
  },

  infoLabel: {
    display: "block",
    color: "#78847f",
    fontSize: "11px",
    marginBottom: "5px"
  },

  infoValue: {
    color: "#173c31",
    fontSize: "13px"
  },

  blockchainCard: {
    marginTop: "18px",
    padding: "20px",
    background: "#ffffff",
    border: "1px solid #dfe9e3",
    borderRadius: "12px"
  },

  blockchainTitle: {
    margin: 0,
    color: "#123d30",
    fontSize: "16px",
    fontWeight: "800"
  },

  blockchainSubtitle: {
    margin: "6px 0 18px",
    color: "#74827c",
    fontSize: "13px",
    lineHeight: 1.5
  },

  statusGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "15px"
  },

  statusItem: {
    padding: "16px",
    background: "#f8fbf9",
    border: "1px solid #e2ebe6",
    borderRadius: "10px"
  },

  statusLabel: {
    display: "block",
    color: "#52655d",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "9px"
  },

  statusVerified: {
    display: "inline-block",
    background: "#dcf8e8",
    color: "#087b43",
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "10px",
    fontWeight: "800"
  },

  statusPending: {
    display: "inline-block",
    background: "#fff4d8",
    color: "#936900",
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "10px",
    fontWeight: "800"
  },

  statusDescription: {
    display: "block",
    marginTop: "9px",
    color: "#74827c",
    fontSize: "11px",
    lineHeight: 1.5
  },

  blockchainAction: {
    marginTop: "18px",
    padding: "17px",
    background: "#f0fbf5",
    border: "1px solid #d3efdf",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px"
  },

  waitingBox: {
    marginTop: "18px",
    padding: "17px",
    background: "#fff9e9",
    border: "1px solid #f0dfaa",
    borderRadius: "10px",
    color: "#765900"
  },

  verifiedBox: {
    marginTop: "18px",
    padding: "17px",
    background: "#eaf9f0",
    border: "1px solid #c9ead7",
    borderRadius: "10px",
    color: "#087b43"
  },

  blockchainError: {
    marginTop: "15px",
    padding: "12px 14px",
    background: "#fff1f1",
    border: "1px solid #f0caca",
    borderRadius: "8px",
    color: "#b32929",
    fontSize: "13px"
  },

  securityRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "16px 0"
  },

  securityTitle: {
    color: "#173c31",
    fontSize: "14px"
  },

  securityText: {
    margin: "5px 0 0",
    color: "#74827c",
    fontSize: "13px"
  },

  secureBadge: {
    background: "#edf8f1",
    color: "#087b43",
    borderRadius: "18px",
    padding: "6px 11px",
    fontSize: "11px",
    fontWeight: "700"
  },

  loadingCard: {
    maxWidth: "500px",
    margin: "80px auto",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "45px",
    textAlign: "center",
    boxShadow: "0 4px 18px rgba(0,0,0,0.06)"
  },

  spinner: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    border: "4px solid #dff3e8",
    borderTop: "4px solid #078b4b",
    margin: "0 auto 15px"
  },

  loadingText: {
    color: "#60716a",
    fontSize: "14px"
  },

  errorCard: {
    maxWidth: "650px",
    margin: "60px auto",
    padding: "50px",
    background: "#ffffff",
    border: "1px solid #f1caca",
    borderRadius: "16px",
    textAlign: "center"
  },

  errorIcon: {
    width: "46px",
    height: "46px",
    margin: "0 auto 15px",
    borderRadius: "50%",
    background: "#fff1f1",
    color: "#d62f2f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    fontWeight: "800"
  }
};

export default BuyerProfile;