import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserProvider } from "ethers";
import {
  registerLandOnBlockchain,
  registerBlockchainUser,
  checkSellerBlockchainStatus,
  approveSaleOnBlockchain
} from "../../blockchain/blockchain";

/*
  SellerModule.jsx
  Replacement for the existing SellerModule.

  Keeps the current project architecture and current backend contract:
    GET  http://localhost:5000/api/lands/my-lands
    POST http://localhost:5000/api/lands/register

  Important:
  - The current backend registration flow accepts one PDF field named
    "land_document". Therefore the UI asks the seller to combine the
    required land documents into one PDF package. This avoids sending
    unsupported multipart field names to the existing backend.
  - Extra land fields are sent as normal FormData fields. The backend must
    have matching DB columns before those new fields can be persisted.
  - Blockchain status is never marked confirmed just because MetaMask is
    connected. A real transaction hash is shown only when one exists.
*/

const API_BASE = "http://localhost:5000/api";

const EMPTY_LAND_FORM = {
  land_id: "",
  survey_number: "",
  subdivision_number: "",
  registration_number: "",
  registration_date: "",
  district: "",
  state: "",
  taluk: "",
  village: "",
  address: "",
  pincode: "",
  area: "",
  area_unit: "ACRES",
  land_type: "Agricultural",
  usage_type: "Agriculture",
  owner_count: "1",
  owner_name: "",
  owner_mobile: "",
  owner_names: [""],
  sale_amount: "",
  description: "",
  latitude: "",
  longitude: "",
};

const PAGE_TITLES = {
  dashboard: ["Dashboard", "Overview of your land records and seller activity."],
  profile: ["My Profile", "View your verified seller identity and account information."],
  "edit-profile": ["Edit Profile", "Update the information that is allowed to be changed."],
  "my-properties": ["My Properties", "All land records registered under your seller account."],
  "add-property": ["Register Land", "Submit complete land and ownership details for administrator verification."],
  "property-list": ["Property List", "Track verification status of every submitted land record."],
  "property-details": ["Property Details", "Review land, ownership, document and blockchain information."],
  listings: ["My Listings", "Approved properties that are available for sale."],
  "buyer-requests": ["Buyer Requests", "Purchase requests received for your verified listed properties."],
  "request-details": ["Buyer Request Details", "Review a buyer request before accepting or rejecting it."],
  transactions: ["Transactions", "Completed and pending ownership-transfer transactions."],
  "transaction-details": ["Transaction Details", "Blockchain transaction and ownership-transfer information."],
  ownership: ["Ownership History", "Blockchain-confirmed ownership transfers for your land."],
  wallet: ["Wallet", "Connect and inspect the MetaMask wallet used by the seller."],
  blockchain: ["Blockchain Records", "Actual blockchain references associated with your land records."],
  notifications: ["Notifications", "Verification, request and transaction updates."],
  help: ["Help & Support", "Guidance for land registration and verification."]
};

export default function SellerModule() {
  const [activePage, setActivePage] = useState("dashboard");
  const [history, setHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [seller, setSeller] = useState(() => readJson("sellerUser", {}));
  const [lands, setLands] = useState([]);
  const [loadingLands, setLoadingLands] = useState(true);
  const [landError, setLandError] = useState("");

  const [walletAddress, setWalletAddress] = useState(
    () => getSavedSellerWallet().address
  );
  const [walletNetwork, setWalletNetwork] = useState(
    () => getSavedSellerWallet().network
  );
  const [blockchainSellerStatus, setBlockchainSellerStatus] = useState({
    connected: false,
    registered: false,
    verified: false,
    wallet: null,
    name: "",
    email: ""
  });
  const [blockchainSellerLoading, setBlockchainSellerLoading] = useState(false);
  const [blockchainSellerError, setBlockchainSellerError] = useState("");

  const [buyerRequests, setBuyerRequests] = useState([]);
  const [loadingBuyerRequests, setLoadingBuyerRequests] = useState(false);
  const [buyerRequestError, setBuyerRequestError] = useState("");

  const [selectedLand, setSelectedLand] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [notifications, setNotifications] = useState(() => {
    const saved = readJson("sellerNotifications", []);
    return Array.isArray(saved) ? saved : [];
  });

  useEffect(() => {
    const savedSeller = readJson("sellerUser", {});

    setSeller(savedSeller || {});
    loadSellerProfile();
    loadLands();
    loadSellerRequests();

    /*
     * IMPORTANT:
     *
     * Do NOT automatically open or query MetaMask here.
     * The wallet shown by this Seller Module is restored from localStorage.
     * MetaMask opens only when the seller clicks Connect/Change Wallet.
     *
     * There is intentionally NO accountsChanged listener here. This prevents
     * changing the active account in MetaMask (for example to the Admin
     * account) from silently changing the seller wallet shown by this page.
     */
  }, []);

  const loadBlockchainSellerStatus = async () => {
    try {
      const status = await checkSellerBlockchainStatus();
      setBlockchainSellerStatus(status || {
        connected: false,
        registered: false,
        verified: false
      });
      setBlockchainSellerError("");
    } catch (error) {
      console.error("Seller blockchain status error:", error);
      setBlockchainSellerError(
        error?.message || "Unable to read blockchain seller status."
      );
    }
  };

  const registerSellerOnBlockchain = async () => {
    setBlockchainSellerError("");
    setBlockchainSellerLoading(true);

    try {
      await assertActiveMetaMaskWallet();

      const storedWallet = seller?.wallet_address || seller?.wallet || "";
      if (
        storedWallet &&
        storedWallet.toLowerCase() !== walletAddress.toLowerCase()
      ) {
        throw new Error(
          "The connected MetaMask wallet does not match the seller wallet saved in the seller account."
        );
      }

      if (!seller?.name || !seller?.email) {
        throw new Error(
          "Seller name and email are required for blockchain registration."
        );
      }

      const result = await registerBlockchainUser(
        seller.name,
        seller.email
      );

      await loadBlockchainSellerStatus();

      addNotification(
        "success",
        "Seller registered on blockchain",
        `Blockchain seller registration completed. Transaction: ${shortHash(
          result?.transactionHash || result?.hash
        )}.`
      );

      return result;
    } catch (error) {
      console.error("Seller blockchain registration error:", error);
      setBlockchainSellerError(
        error?.message || "Unable to register seller on the blockchain."
      );
      throw error;
    } finally {
      setBlockchainSellerLoading(false);
    }
  };

  const loadSellerProfile = async () => {
    const authToken = localStorage.getItem("sellerToken") || localStorage.getItem("token");
    if (!authToken) return;

    try {
      const response = await fetch(`${API_BASE}/seller/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const data = await readApiResponse(response);

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to load seller profile.");
      }

      const profile = data?.seller || data?.profile || data?.data || data;
      if (profile && typeof profile === "object") {
        setSeller((previous) => {
          const updated = { ...previous, ...profile };
          localStorage.setItem("sellerUser", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error("Seller profile loading error:", error);
    }
  };

  const loadLands = async () => {
    const authToken = localStorage.getItem("sellerToken") || localStorage.getItem("token");
    if (!authToken) {
      setLoadingLands(false);
      setLandError("Seller session not found. Please login again.");
      return;
    }

    try {
      setLoadingLands(true);
      setLandError("");

      const response = await fetch(`${API_BASE}/lands/my-lands`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const data = await readApiResponse(response);

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to load land records.");
      }

      const records = Array.isArray(data)
        ? data
        : Array.isArray(data?.lands)
          ? data.lands
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setLands(records);
    } catch (error) {
      console.error("Seller land loading error:", error);
      setLandError(error.message || "Unable to load land records.");
      setLands([]);
    } finally {
      setLoadingLands(false);
    }
  };

  const loadSellerRequests = async () => {
    const authToken =
      localStorage.getItem("sellerToken") ||
      localStorage.getItem("token");

    if (!authToken) {
      setLoadingBuyerRequests(false);
      setBuyerRequestError("Seller session not found. Please login again.");
      setBuyerRequests([]);
      return;
    }

    try {
      setLoadingBuyerRequests(true);
      setBuyerRequestError("");

      const response = await fetch(`${API_BASE}/seller/requests`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const data = await readApiResponse(response);

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to load buyer requests.");
      }

      const records = Array.isArray(data?.requests)
        ? data.requests
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setBuyerRequests(records);
    } catch (error) {
      console.error("Seller buyer requests loading error:", error);
      setBuyerRequestError(
        error?.message || "Unable to load buyer requests."
      );
      setBuyerRequests([]);
    } finally {
      setLoadingBuyerRequests(false);
    }
  };

  const saveSellerWalletToBackend = async (address) => {
    const authToken =
      localStorage.getItem("sellerToken") ||
      localStorage.getItem("token");

    if (!authToken) {
      throw new Error("Seller session not found. Please login again.");
    }

    const response = await fetch(`${API_BASE}/seller/wallet`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        wallet_address: address
      })
    });

    const data = await readApiResponse(response);

    if (!response.ok || data?.success === false) {
      throw new Error(
        data?.message ||
        "Wallet connected, but it could not be saved to the seller account."
      );
    }

    if (data?.seller) {
      setSeller((previous) => {
        const updated = { ...previous, ...data.seller };
        localStorage.setItem("sellerUser", JSON.stringify(updated));
        return updated;
      });
    }

    return data;
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Install MetaMask first.");
      return;
    }

    const previousAddress = walletAddress;
    const previousNetwork = walletNetwork;

    try {
      let accounts = [];

      /*
       * wallet_requestPermissions forces MetaMask to show its account
       * selection/permission UI when the seller clicks Connect or Change.
       * Some wallet implementations do not support this method, so fall
       * back to eth_requestAccounts.
       */
      try {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }]
        });

        accounts = await window.ethereum.request({
          method: "eth_accounts"
        });
      } catch (permissionError) {
        if (
          permissionError?.code === -32601 ||
          permissionError?.code === "-32601"
        ) {
          accounts = await window.ethereum.request({
            method: "eth_requestAccounts"
          });
        } else {
          throw permissionError;
        }
      }

      if (!accounts || accounts.length === 0) {
        throw new Error("No MetaMask account was selected.");
      }

      const address = accounts[0];

      /*
       * Do not attach a different wallet to a seller account that already
       * has a wallet saved in the seller profile.
       */
      const registeredWallet =
        seller?.wallet_address ||
        seller?.wallet ||
        "";

      if (
        registeredWallet &&
        registeredWallet.toLowerCase() !== address.toLowerCase()
      ) {
        throw new Error(
          "The selected MetaMask account does not match the wallet registered for this seller account."
        );
      }

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const networkName = getNetworkName(network.chainId.toString());

      setWalletAddress(address);
      setWalletNetwork(networkName);

      localStorage.setItem("sellerWallet", address);
      localStorage.setItem("sellerWalletNetwork", networkName);

      await saveSellerWalletToBackend(address);
      await loadBlockchainSellerStatus();

      addNotification(
        "success",
        previousAddress && previousAddress.toLowerCase() !== address.toLowerCase()
          ? "Wallet changed"
          : "Wallet connected",
        `MetaMask connected: ${shortAddress(address)} on ${networkName}.`
      );
    } catch (error) {
      console.error("Seller MetaMask error:", error);

      /*
       * MetaMask Cancel must never destroy the wallet that was already
       * connected. On first connect, the state simply remains disconnected.
       */
      if (
        error?.code === 4001 ||
        error?.info?.error?.code === 4001
      ) {
        setWalletAddress(previousAddress);
        setWalletNetwork(previousNetwork);
        return;
      }

      setWalletAddress(previousAddress);
      setWalletNetwork(previousNetwork);
      alert(error?.message || "Unable to connect MetaMask.");
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    setWalletNetwork("");
    setBlockchainSellerStatus({
      connected: false,
      registered: false,
      verified: false,
      wallet: null,
      name: "",
      email: ""
    });
    setBlockchainSellerError("");
    localStorage.removeItem("sellerWallet");
    localStorage.removeItem("sellerWalletNetwork");
  };

  const assertActiveMetaMaskWallet = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Install MetaMask first.");
    }

    if (!walletAddress) {
      throw new Error("Connect the seller wallet before starting a blockchain transaction.");
    }

    const activeAccounts = await window.ethereum.request({
      method: "eth_accounts"
    });

    const activeAddress = activeAccounts?.[0] || "";

    if (!activeAddress) {
      throw new Error("MetaMask has no active account. Open MetaMask and select the seller wallet.");
    }

    if (activeAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error(
        `MetaMask is currently using ${shortAddress(activeAddress)}. Switch back to the seller wallet ${shortAddress(walletAddress)} before continuing.`
      );
    }

    return activeAddress;
  };

  const addNotification = (type, title, text) => {
    const item = {
      id: Date.now(),
      type,
      title,
      text,
      time: "Just now",
      read: false
    };

    setNotifications((previous) => {
      const next = [item, ...previous].slice(0, 20);
      localStorage.setItem("sellerNotifications", JSON.stringify(next));
      return next;
    });
  };

  const unreadNotifications = notifications.filter((item) => !item.read);

  const markAllNotificationsRead = () => {
    setNotifications((previous) => {
      const next = previous.map((item) => ({ ...item, read: true }));
      localStorage.setItem("sellerNotifications", JSON.stringify(next));
      return next;
    });
  };

  const openPage = (page) => {
    if (!PAGE_TITLES[page] && page !== "logout") return;

    if (page === "logout") {
      logout();
      return;
    }

    setProfileMenuOpen(false);

    if (page === "notifications") {
      markAllNotificationsRead();
    }

    if (page === activePage) return;

    setHistory((previous) => [...previous, activePage]);
    setActivePage(page);
  };

  const goBack = () => {
    setProfileMenuOpen(false);

    setHistory((previous) => {
      if (!previous.length) {
        setActivePage("dashboard");
        return [];
      }

      const nextPage = previous[previous.length - 1];
      setActivePage(nextPage);
      return previous.slice(0, -1);
    });
  };

  const logout = () => {
    localStorage.removeItem("sellerToken");
    localStorage.removeItem("sellerUser");
    // Keep sellerWallet and sellerWalletNetwork so the seller wallet
    // survives logout/login. Only Disconnect Wallet clears them.
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "/seller/login";
  };

  const stats = useMemo(() => {
    const status = (land) => getStatus(land);

    return {
      total: lands.length,
      verified: lands.filter((land) => ["VERIFIED", "APPROVED"].includes(status(land))).length,
      listed: lands.filter((land) => ["LISTED", "LISTED_FOR_SALE", "FOR_SALE"].includes(status(land))).length,
      pending: lands.filter((land) => ["PENDING", "SUBMITTED", "UNDER_VERIFICATION"].includes(status(land))).length,
      rejected: lands.filter((land) => status(land) === "REJECTED").length,
      sold: lands.filter((land) => status(land) === "SOLD").length
    };
  }, [lands]);

  const requests = buyerRequests;

  const transactions = useMemo(() => {
    return buyerRequests
      .filter((request) => {
        const status = String(
          request?.request_status || request?.status || ""
        ).toUpperCase();

        const txHash =
          request?.blockchain_tx_hash ||
          request?.blockchain_transaction_hash ||
          request?.tx_hash ||
          "";

        // A Seller transaction is completed only after
        // approveSale() has produced a real blockchain hash.
        return status === "APPROVED" && Boolean(txHash);
      })
      .map((request) => ({
        ...request,
        id: request.request_id || request.id,
        transaction_id: request.request_id || request.id,
        property:
          request.public_land_id ||
          request.land_identifier ||
          request.land_id ||
          "-",
        buyer_name: request.buyer_name || "Unknown Buyer",
        buyer_wallet:
          request.buyer_wallet_address ||
          request.buyer_wallet ||
          "Not available",
        seller_name:
          request.seller_name ||
          seller?.name ||
          "Current Seller",
        seller_wallet:
          request.seller_wallet_address ||
          seller?.wallet_address ||
          walletAddress ||
          "Not available",
        amount:
          request.sale_amount ??
          request.land_amount ??
          request.expected_sale_amount ??
          0,
        status: "BLOCKCHAIN COMPLETED",
        tx_hash:
          request.blockchain_tx_hash ||
          request.blockchain_transaction_hash ||
          request.tx_hash ||
          "",
        blockchain_land_id: request.blockchain_land_id,
        blockchain_block_number:
          request.blockchain_block_number ||
          request.block_number,
        blockchain_network:
          request.blockchain_network ||
          request.network ||
          "Ganache Local",
        date:
          request.updated_at ||
          request.requested_at
      }));
  }, [buyerRequests, seller, walletAddress]);

  // Once approveSale() has completed and a real transaction hash exists,
  // that land is no longer a current property of this seller. Keep the
  // ownership transfer visible in Ownership History, but remove the sold
  // property from Seller -> My Properties.
  const transferredLandIds = useMemo(() => {
    const ids = new Set();

    buyerRequests.forEach((request) => {
      const status = String(
        request?.request_status || request?.status || ""
      ).toUpperCase();

      const txHash =
        request?.blockchain_tx_hash ||
        request?.blockchain_transaction_hash ||
        request?.tx_hash ||
        "";

      if (status !== "APPROVED" || !txHash) return;

      [
        request?.public_land_id,
        request?.land_identifier,
        request?.land_id,
        request?.property,
        request?.property_id,
        request?.landId,
        request?.blockchain_land_id
      ]
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
        .forEach((value) => ids.add(String(value).trim().toLowerCase()));
    });

    return ids;
  }, [buyerRequests]);

  const currentSellerProperties = useMemo(() => {
    return lands.filter((land) => {
      const landId = String(getLandId(land) || "").trim().toLowerCase();
      if (landId && transferredLandIds.has(landId)) return false;

      const status = getStatus(land);
      if (["SOLD", "TRANSFERRED", "OWNERSHIP_TRANSFERRED"].includes(status)) return false;

      return true;
    });
  }, [lands, transferredLandIds]);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardPage
            seller={seller}
            lands={currentSellerProperties}
            stats={stats}
            requests={requests}
            transactions={transactions}
            notifications={notifications}
            loading={loadingLands}
            error={landError}
            onOpen={openPage}
            onViewLand={(land) => {
              setSelectedLand(land);
              openPage("property-details");
            }}
          />
        );

      case "profile":
        return (
          <ProfilePage
            seller={seller}
            walletAddress={walletAddress}
            walletNetwork={walletNetwork}
            onOpen={openPage}
            onConnectWallet={connectWallet}
          />
        );

      case "edit-profile":
        return (
          <EditProfilePage
            seller={seller}
            onSave={(updated) => {
              setSeller(updated);
              localStorage.setItem("sellerUser", JSON.stringify(updated));
              addNotification(
                "success",
                "Profile updated",
                "Your current seller session profile was updated."
              );
              setActivePage("profile");
              setHistory([]);
            }}
            onCancel={goBack}
          />
        );

      case "my-properties":
        return (
          <PropertiesPage
            title="My Properties"
            subtitle="All land records registered under your seller account."
            lands={currentSellerProperties}
            loading={loadingLands}
            error={landError}
            onAdd={() => openPage("add-property")}
            onView={(land) => {
              setSelectedLand(land);
              openPage("property-details");
            }}
          />
        );

      case "add-property":
        return (
          <RegisterLandPage
            seller={seller}
            walletAddress={walletAddress}
            onBack={goBack}
            onSuccess={async (message) => {
              addNotification("success", "Land submitted", message);
              await loadLands();
              setActivePage("my-properties");
              setHistory([]);
            }}
          />
        );

      case "property-list":
        return (
          <PropertiesPage
            title="Property List"
            subtitle="Track verification status and ownership information."
            lands={lands}
            loading={loadingLands}
            error={landError}
            onAdd={() => openPage("add-property")}
            onView={(land) => {
              setSelectedLand(land);
              openPage("property-details");
            }}
            filters
          />
        );

      case "property-details":
        return (
          <PropertyDetailsPage
            land={selectedLand}
            walletAddress={walletAddress}
            walletNetwork={walletNetwork}
            seller={seller}
            onBack={goBack}
            onRegisterBlockchain={async (land) => {
              const token =
                localStorage.getItem("sellerToken") ||
                localStorage.getItem("token");

              if (!token) {
                throw new Error("Seller session not found. Please login again.");
              }

              if (!land) {
                throw new Error("No land record selected.");
              }

              const databaseLandId = getLandId(land);

              if (!databaseLandId || databaseLandId === "N/A") {
                throw new Error("Land ID is missing from the selected record.");
              }

              if (land?.blockchain_tx_hash) {
                throw new Error(
                  "This land already has a blockchain transaction recorded."
                );
              }

              await assertActiveMetaMaskWallet();

              const blockchainResult = await registerLandOnBlockchain({
                ownerName:
                  land?.owner_name ||
                  land?.ownerName ||
                  seller?.name ||
                  "",

                location: getLocation(land),

                surveyNumber: getSurveyNumber(land),

                area:
                  land?.area ??
                  land?.land_area ??
                  land?.size,

                documentHash:
                  land?.document_hash ||
                  land?.documentHash ||
                  ""
              });

              const response = await fetch(
                `${API_BASE}/lands/${encodeURIComponent(databaseLandId)}/blockchain`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    blockchain_land_id:
                      blockchainResult.blockchainLandId,

                    blockchain_tx_hash:
                      blockchainResult.transactionHash,

                    blockchain_block_number:
                      blockchainResult.blockNumber,

                    blockchain_network:
                      blockchainResult.blockchainNetwork,

                    wallet_address:
                      blockchainResult.walletAddress,

                    blockchain_contract_address:
                      blockchainResult.contractAddress,

                    blockchain_chain_id:
                      blockchainResult.chainId
                  })
                }
              );

              const data = await readApiResponse(response);

              if (!response.ok || data?.success === false) {
                throw new Error(
                  data?.message ||
                  "Blockchain transaction succeeded, but the blockchain record could not be saved to the backend."
                );
              }

              await loadLands();

              const refreshed = await fetch(
                `${API_BASE}/lands/${encodeURIComponent(databaseLandId)}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );

              if (refreshed.ok) {
                const refreshedData =
                  await readApiResponse(refreshed);

                if (refreshedData?.success !== false) {
                  const refreshedLand =
                    refreshedData?.land ||
                    refreshedData?.data ||
                    refreshedData;

                  if (
                    refreshedLand &&
                    typeof refreshedLand === "object"
                  ) {
                    setSelectedLand(refreshedLand);
                  }
                }
              }

              addNotification(
                "success",
                "Land registered on blockchain",
                `Blockchain Land ID ${blockchainResult.blockchainLandId} was created successfully. Transaction: ${shortHash(blockchainResult.transactionHash)}.`
              );

              return blockchainResult;
            }}
          />
        );

      case "listings":
        return (
          <ListingsPage
            lands={lands}
            onView={(land) => {
              setSelectedLand(land);
              openPage("property-details");
            }}
            onBack={goBack}
          />
        );

      case "buyer-requests":
        return (
          <BuyerRequestsPage
            requests={requests}
            loading={loadingBuyerRequests}
            error={buyerRequestError}
            onRefresh={loadSellerRequests}
            onView={(request) => {
              setSelectedRequest(request);
              openPage("request-details");
            }}
            onBack={goBack}
          />
        );

      case "request-details":
        return (
          <RequestDetailsPage
            request={selectedRequest}
            onBack={goBack}
            onAction={async (action) => {
              await loadSellerRequests();
              await loadLands();

              addNotification(
                action === "accepted" ? "success" : "error",
                action === "accepted"
                  ? "Request accepted"
                  : "Request rejected",
                action === "accepted"
                  ? "Blockchain sale completed and ownership updated."
                  : "Buyer request rejected."
              );

              if (action === "accepted") {
                setActivePage("transactions");
                setHistory([]);
              }
            }}
          />
        );

      case "transactions":
        return (
          <TransactionsPage
            transactions={transactions}
            onView={(transaction) => {
              setSelectedTransaction(transaction);
              openPage("transaction-details");
            }}
            onBack={goBack}
          />
        );

      case "transaction-details":
        return (
          <TransactionDetailsPage
            transaction={selectedTransaction}
            onBack={goBack}
          />
        );

      case "ownership":
        return (
          <OwnershipPage
            records={buyerRequests
              .filter((request) => {
                const status = String(
                  request?.request_status || request?.status || ""
                ).toUpperCase();
                const txHash =
                  request?.blockchain_tx_hash ||
                  request?.blockchain_transaction_hash ||
                  request?.tx_hash ||
                  "";
                return status === "APPROVED" && Boolean(txHash);
              })
              .map((request) => ({
                property:
                  request.public_land_id ||
                  request.property ||
                  request.land_id ||
                  "-",
                previous_owner:
                  request.seller_name ||
                  seller?.name ||
                  "Previous Owner",
                previous_owner_wallet:
                  request.seller_wallet_address ||
                  request.seller_wallet ||
                  seller?.wallet_address ||
                  walletAddress ||
                  "",
                new_owner:
                  request.buyer_name ||
                  request.new_owner_name ||
                  "New Owner",
                new_owner_wallet:
                  request.buyer_wallet_address ||
                  request.buyer_wallet ||
                  request.new_owner_wallet ||
                  "",
                blockchain_land_id:
                  request.blockchain_land_id ||
                  request.blockchainLandId ||
                  "-",
                tx_hash:
                  request.blockchain_tx_hash ||
                  request.blockchain_transaction_hash ||
                  request.tx_hash ||
                  "",
                block_number:
                  request.blockchain_block_number ||
                  request.block_number ||
                  "",
                network:
                  request.blockchain_network ||
                  request.network ||
                  "Ganache Local",
                date:
                  request.updated_at ||
                  request.requested_at,
                status: "OWNERSHIP TRANSFERRED",
                request_id: request.request_id || request.id
              }))}
            onBack={goBack}
          />
        );

      case "wallet":
        return (
          <WalletPage
            walletAddress={walletAddress}
            walletNetwork={walletNetwork}
            blockchainSellerStatus={blockchainSellerStatus}
            blockchainSellerLoading={blockchainSellerLoading}
            blockchainSellerError={blockchainSellerError}
            onRegisterBlockchainSeller={registerSellerOnBlockchain}
            onRefreshBlockchainSeller={loadBlockchainSellerStatus}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
            onBack={goBack}
          />
        );

      case "blockchain":
        return (
          <BlockchainPage
            lands={lands}
            walletAddress={walletAddress}
            walletNetwork={walletNetwork}
            onBack={goBack}
            onRegisterBlockchain={(land) => {
              setSelectedLand(land);
              openPage("property-details");
            }}
          />
        );

      case "notifications":
        return (
          <NotificationsPage
            notifications={notifications}
            onBack={goBack}
            onRead={(id) => {
              setNotifications((previous) => {
                const next = previous.map((item) =>
                  item.id === id ? { ...item, read: true } : item
                );
                localStorage.setItem("sellerNotifications", JSON.stringify(next));
                return next;
              });
            }}
          />
        );

      case "help":
        return <HelpPage onBack={goBack} onOpen={openPage} />;

      default:
        return null;
    }
  };

  const menuGroups = [
    {
      title: "MAIN",
      items: [
        ["dashboard", "⌂", "Dashboard"],
        ["profile", "♙", "My Profile"]
      ]
    },
    {
      title: "PROPERTIES",
      items: [
        ["my-properties", "⌂", "My Properties"],
        ["add-property", "+", "Register Land"],
        ["property-list", "☷", "Property List"],
        ["listings", "◇", "My Listings"]
      ]
    },
    {
      title: "TRANSACTIONS",
      items: [
        ["buyer-requests", "♧", "Buyer Requests"],
        ["transactions", "▣", "Transactions"],
        ["ownership", "♢", "Ownership History"]
      ]
    },
    {
      title: "BLOCKCHAIN",
      items: [
        ["wallet", "◈", "Wallet"],
        ["blockchain", "⬡", "Blockchain Records"]
      ]
    },
    {
      title: "SYSTEM",
      items: [
        ["notifications", "♧", "Notifications"],
        ["help", "?", "Help & Support"],
        ["logout", "↪", "Logout"]
      ]
    }
  ];

  const pageTitle = PAGE_TITLES[activePage] || PAGE_TITLES.dashboard;

  return (
    <>
      <style>{CSS}</style>

      <div className="seller-app">
        <aside className={`seller-sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="brand">
            <div className="brand-logo">⌂</div>
            {sidebarOpen && (
              <div>
                <div className="brand-title">Blockchain</div>
                <div className="brand-subtitle">Land Registry</div>
              </div>
            )}
          </div>

          {sidebarOpen && <div className="seller-module-label">SELLER MODULE</div>}

          {sidebarOpen && (
            <button className="sidebar-seller-profile" onClick={() => openPage("profile")}>
              <div className="sidebar-seller-avatar">{initial(seller?.name)}</div>
              <div className="sidebar-seller-info">
                <strong>{seller?.name || "Seller"}</strong>
                <span>Seller Account</span>
              </div>
              <span className="sidebar-profile-arrow">›</span>
            </button>
          )}

          <nav className="seller-nav">
            {menuGroups.map((group) => (
              <div className="nav-group" key={group.title}>
                {sidebarOpen && <div className="nav-group-title">{group.title}</div>}

                {group.items.map(([id, icon, label]) => (
                  <button
                    key={id}
                    className={`seller-nav-item ${activePage === id ? "active" : ""}`}
                    onClick={() => openPage(id)}
                    title={!sidebarOpen ? label : ""}
                  >
                    <span className="seller-nav-icon">{icon}</span>
                    {sidebarOpen && <span className="seller-nav-text">{label}</span>}
                    {id === "notifications" && unreadNotifications.length > 0 && sidebarOpen && (
                      <span className="seller-nav-badge">{unreadNotifications.length}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {sidebarOpen && (
            <div className="sidebar-security">
              <div className="security-icon">⬡</div>
              <strong>Secure Land Ownership</strong>
              <span>with Blockchain</span>
            </div>
          )}
        </aside>

        <main className={`seller-main ${sidebarOpen ? "" : "expanded"}`}>
          <header className="seller-topbar">
            <button
              className="top-menu-button"
              onClick={() => setSidebarOpen((value) => !value)}
              aria-label="Toggle sidebar"
            >
              ☰
            </button>

            <div className="topbar-spacer" />

            <button
              className="top-notification"
              onClick={() => openPage("notifications")}
              aria-label="Notifications"
            >
              ♧
              {unreadNotifications.length > 0 && (
                <span>{unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}</span>
              )}
            </button>

            <div className="top-divider" />

            <div className="profile-menu-wrap">
              <button
                className="top-profile-button"
                onClick={() => setProfileMenuOpen((value) => !value)}
                aria-label="Open seller profile"
              >
                <div className="top-avatar">{initial(seller?.name)}</div>
                <div className="top-profile-text">
                  <strong>{seller?.name || "Seller"}</strong>
                  <span>Seller</span>
                </div>
                <span className={`profile-chevron ${profileMenuOpen ? "up" : ""}`}>⌄</span>
              </button>

              {profileMenuOpen && (
                <div className="profile-dropdown">
                  <button onClick={() => openPage("profile")}><span>♙</span> My Profile</button>
                  <button onClick={() => openPage("edit-profile")}><span>✎</span> Edit Profile</button>
                  <button onClick={() => openPage("wallet")}><span>◈</span> Wallet</button>
                  <div className="dropdown-divider" />
                  <button className="logout-option" onClick={() => openPage("logout")}><span>↪</span> Logout</button>
                </div>
              )}
            </div>
          </header>

          <section className="seller-content">
            {activePage !== "dashboard" && (
              <button className="back-link" onClick={goBack}>← Back</button>
            )}

            {activePage !== "dashboard" && (
              <div className="page-heading">
                <div>
                  <h1>{pageTitle[0]}</h1>
                  <p>{pageTitle[1]}</p>
                </div>
              </div>
            )}

            {renderPage()}
          </section>
        </main>
      </div>
    </>
  );
}

/* ----------------------------- DASHBOARD --------------------------------- */

function DashboardPage({ seller, lands, stats, requests, transactions, notifications, loading, error, onOpen, onViewLand }) {
  const recentLands = lands.slice(0, 5);
  const recentRequests = requests.slice(0, 3);
  const recentTransactions = transactions.slice(0, 4);

  return (
    <div>
      <div className="welcome-row">
        <div>
          <h2>Welcome, {seller?.name || "Seller"}!</h2>
          <p>Here's what's happening with your properties.</p>
        </div>
        <div className="verification-chip">
          <span className="chip-dot" />
          Seller verification: {
            ["VERIFIED", "APPROVED"].includes(
              String(seller?.verification_status || "").toUpperCase()
            )
              ? "VERIFIED"
              : seller?.verification_status || "PENDING"
          }
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="⌂" title="Total Properties" value={stats.total} tone="green" onClick={() => onOpen("my-properties")} />
        <StatCard icon="✓" title="Verified Properties" value={stats.verified} tone="blue" onClick={() => onOpen("property-list")} />
        <StatCard icon="◇" title="Listed for Sale" value={stats.listed} tone="yellow" onClick={() => onOpen("listings")} />
        <StatCard icon="♧" title="Buyer Requests" value={requests.length} tone="purple" onClick={() => onOpen("buyer-requests")} />
        <StatCard icon="▣" title="Completed Sales" value={stats.sold} tone="red" onClick={() => onOpen("transactions")} />
      </div>

      <section className="panel graph-panel">
        <PanelHeader title="Property Status Overview" action="View Properties" onClick={() => onOpen("property-list")} />
        <PropertyStatusGraph stats={stats} />
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <PanelHeader title="My Properties" action="View All" onClick={() => onOpen("my-properties")} />

          {loading ? (
            <LoadingBox text="Loading your properties..." />
          ) : error ? (
            <ErrorBox text={error} />
          ) : recentLands.length === 0 ? (
            <EmptyBox
              icon="+"
              title="No properties registered"
              text="Register your first land record with survey, ownership and document details."
              action="Register Land"
              onClick={() => onOpen("add-property")}
            />
          ) : (
            <div className="table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Property ID</th>
                    <th>Location</th>
                    <th>Area</th>
                    <th>Status</th>
                    <th>Listed Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLands.map((land, index) => (
                    <tr key={getLandId(land) + index}>
                      <td>{getLandId(land)}</td>
                      <td>{getLocation(land)}</td>
                      <td>{formatArea(land)}</td>
                      <td><StatusBadge status={getStatus(land)} /></td>
                      <td>{formatPrice(getPrice(land))}</td>
                      <td><button className="view-button" onClick={() => onViewLand(land)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <PanelHeader title="Buyer Requests" action="View All" onClick={() => onOpen("buyer-requests")} />

          {recentRequests.length === 0 ? (
            <EmptyBox
              compact
              icon="♧"
              title="No buyer requests"
              text="Requests will appear here when buyers submit purchase requests for your listed land."
            />
          ) : (
            <div className="request-mini-list">
              {recentRequests.map((request, index) => (
                <div className="mini-request" key={request.request_id || index}>
                  <div className="buyer-avatar">{initial(request.buyer_name || request.buyer || "B")}</div>
                  <div className="mini-request-main">
                    <strong>{request.buyer_name || request.buyer || "Buyer"}</strong>
                    <span>{request.public_land_id || request.property || "Property"}</span>
                    <span>Offer: {formatPrice(request.sale_amount || request.offered_price || request.amount)}</span>
                  </div>
                  <StatusBadge
                    status={request.request_status || request.status || "PENDING"}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="dashboard-grid lower">
        <section className="panel">
          <PanelHeader title="Recent Transactions" action="View All" onClick={() => onOpen("transactions")} />

          {recentTransactions.length === 0 ? (
            <EmptyBox
              compact
              icon="▣"
              title="No completed transactions"
              text="Actual blockchain transaction records will appear here after ownership transfer."
            />
          ) : (
            <div className="table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Buyer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction, index) => (
                    <tr key={transaction.id || index}>
                      <td>{transaction.property || "-"}</td>
                      <td>{transaction.buyer_name || transaction.buyer || "-"}</td>
                      <td>{formatPrice(transaction.amount || transaction.sale_amount)}</td>
                      <td><StatusBadge status={transaction.status || "PENDING"} /></td>
                      <td className="hash-cell">{shortHash(transaction.tx_hash || transaction.hash)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <PanelHeader title="Latest Notifications" action="View All" onClick={() => onOpen("notifications")} />

          {notifications.length === 0 ? (
            <EmptyBox compact icon="♧" title="No notifications" />
          ) : (
            <div className="notification-mini-list">
              {notifications.slice(0, 4).map((notification) => (
                <div className="notification-mini" key={notification.id}>
                  <div className={`notification-mini-icon ${notification.type}`}>
                    {notification.type === "success" ? "✓" : notification.type === "error" ? "!" : "i"}
                  </div>
                  <div>
                    <strong>{notification.title}</strong>
                    <p>{notification.text}</p>
                    <span>{notification.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ------------------------------- PROFILE --------------------------------- */

function ProfilePage({ seller, walletAddress, walletNetwork, onOpen, onConnectWallet }) {
  return (
    <div className="profile-layout">
      <section className="profile-hero card">
        <div className="profile-cover" />
        <div className="profile-hero-body">
          <div className="profile-avatar-large">{initial(seller?.name)}</div>
          <div className="profile-name-area">
            <h2>{seller?.name || "Seller"}</h2>
            <p>Seller account</p>
            <StatusBadge status={seller?.verification_status || "VERIFIED"} />
          </div>
          <div className="profile-hero-actions">
            <button className="primary-button" onClick={() => onOpen("edit-profile")}>✎ Edit Profile</button>
            <button className="secondary-button" onClick={onConnectWallet}>◈ {walletAddress ? "Wallet Connected" : "Connect Wallet"}</button>
          </div>
        </div>
      </section>

      <div className="profile-grid">
        <section className="card">
          <CardTitle title="Personal Information" subtitle="Information associated with the seller account." />
          <InfoGrid>
            <InfoItem label="Full Name" value={seller?.name} />
            <InfoItem label="Email" value={seller?.email} />
            <InfoItem label="Mobile" value={seller?.mobile || seller?.phone} />
            <InfoItem label="Role" value="SELLER" />
            <InfoItem label="Seller ID" value={seller?.id || seller?.user_id || seller?.seller_id} />
          </InfoGrid>
        </section>

        <section className="card">
          <CardTitle title="Address" subtitle="Registered contact address." />
          <InfoGrid>
            <InfoItem label="Address" value={seller?.address} wide />
            <InfoItem label="District" value={seller?.district} />
            <InfoItem label="State" value={seller?.state || "India"} />
            <InfoItem label="Pincode" value={seller?.pincode} />
          </InfoGrid>
        </section>

        <section className="card">
          <CardTitle title="Wallet & Security" subtitle="The public wallet used for blockchain transactions." />
          <InfoGrid>
            <InfoItem label="Wallet Address" value={walletAddress || seller?.wallet_address || "Not connected"} wide mono />
            <InfoItem label="Network" value={walletNetwork || "Not connected"} />
            <InfoItem label="Blockchain Role" value="Seller wallet" />
          </InfoGrid>
          <div className="security-note">
            <strong>Do not share your private key.</strong>
            <span>Only the public wallet address is displayed in this application.</span>
          </div>
        </section>

        <section className="card">
          <CardTitle title="Verification" subtitle="Admin verification controls access to land registration and sale." />
          <div className="verification-list">
            <VerificationLine label="Seller identity" status={seller?.verification_status || "VERIFIED"} />
            <VerificationLine label="Wallet connection" status={walletAddress ? "CONNECTED" : "PENDING"} />
          </div>
        </section>
      </div>
    </div>
  );
}

function EditProfilePage({ seller, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: seller?.name || "",
    mobile: seller?.mobile || seller?.phone || "",
    address: seller?.address || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (form.mobile && !/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
      setError("Enter a valid 6-digit pincode.");
      return;
    }

    const token = localStorage.getItem("sellerToken") || localStorage.getItem("token");
    if (!token) {
      setError("Seller session not found. Please login again.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/seller/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          address: form.address.trim(),
        })
      });

      const data = await readApiResponse(response);

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to update seller profile.");
      }

      const updatedSeller = data?.seller || data?.profile || data?.data || {
        ...seller,
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        address: form.address.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim()
      };

      onSave({ ...seller, ...updatedSeller });
    } catch (saveError) {
      console.error("Seller profile update error:", saveError);
      setError(saveError.message || "Unable to update seller profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card form-card-large">
      <CardTitle title="Edit Seller Profile" subtitle="Email and verification fields remain protected." />
      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={save}>
        <div className="form-grid">
          <Input label="Full Name *" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Input label="Email" value={seller?.email || ""} disabled />
          <Input label="Mobile Number" value={form.mobile} onChange={(value) => setForm({ ...form, mobile: value })} />
          <Input label="District" value={form.district} onChange={(value) => setForm({ ...form, district: value })} />
          <Input label="State" value={form.state} onChange={(value) => setForm({ ...form, state: value })} />
          <Input label="Pincode" value={form.pincode} onChange={(value) => setForm({ ...form, pincode: value })} />
          <TextArea label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} full />
        </div>

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>

      <div className="backend-note">
        Profile changes are saved to the seller account in MySQL and then reflected in the current seller session.
      </div>
    </section>
  );
}

/* ----------------------------- REGISTER LAND ----------------------------- */

function RegisterLandPage({ seller, walletAddress, onBack, onSuccess }) {
  const [form, setForm] = useState(EMPTY_LAND_FORM);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  const ownerCount = Math.max(1, Number(form.owner_count) || 1);

  useEffect(() => {
    setForm((previous) => {
      const current = Array.isArray(previous.owner_names)
        ? previous.owner_names
        : [previous.owner_name || ""];
      const next = [...current];

      while (next.length < ownerCount) next.push("");
      while (next.length > ownerCount) next.pop();

      return {
        ...previous,
        owner_names: next,
        owner_name: next[0] || ""
      };
    });
  }, [ownerCount]);

  const update = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setMessage("");
  };

  const updateOwnerName = (index, value) => {
    setForm((previous) => {
      const next = [...previous.owner_names];
      next[index] = value;
      return {
        ...previous,
        owner_names: next,
        owner_name: next[0] || ""
      };
    });
  };

  const selectDocument = (file) => {
    setError("");
    setMessage("");

    if (!file) {
      setDocument(null);
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF documents are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("The document package must be smaller than 10 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setDocument(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const token = localStorage.getItem("sellerToken");
    const wallet = walletAddress || localStorage.getItem("sellerWallet");

    if (!token) {
      setError("Please login as seller first.");
      return;
    }

    if (!wallet) {
      setError("Connect MetaMask before registering land.");
      return;
    }

    if (!document) {
      setError("Upload the land document package in PDF format.");
      return;
    }

    if (!form.land_id.trim() || !form.survey_number.trim()) {
      setError("Land ID and Survey Number are required.");
      return;
    }

    if (!form.district.trim() || !form.state.trim() || !form.taluk.trim() || !form.village.trim()) {
      setError("District, State, Taluk and Village are required.");
      return;
    }

    if (!form.area || Number(form.area) <= 0) {
      setError("Enter a valid land area.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.owner_mobile.trim())) {
      setError("Enter a valid 10-digit Indian mobile number for the primary owner.");
      return;
    }

    if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
      setError("Enter a valid 6-digit pincode.");
      return;
    }

    if (ownerCount < 1 || ownerCount > 20) {
      setError("Number of owners must be between 1 and 20.");
      return;
    }

    if (form.owner_names.some((name) => !name.trim())) {
      setError("Enter the name of every legal owner shown in the ownership document.");
      return;
    }

    if (form.sale_amount && Number(form.sale_amount) < 0) {
      setError("Sale amount cannot be negative.");
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();

      const backendForm = {
        owner_name: form.owner_names[0],
        owner_mobile: form.owner_mobile.trim(),
        owner_count: String(ownerCount),
        owner_names: JSON.stringify(form.owner_names),
        sale_amount: form.sale_amount,
        land_id: form.land_id.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        taluk: form.taluk.trim(),
        village: form.village.trim(),
        address: form.address.trim(),
        pincode: form.pincode.trim(),
        survey_number: form.survey_number.trim(),
        subdivision_number: form.subdivision_number.trim(),
        registration_number: form.registration_number.trim(),
        registration_date: form.registration_date,
        area: form.area,
        area_unit: form.area_unit,
        land_type: form.land_type,
        usage_type: form.usage_type,
        latitude: form.latitude.trim(),
        longitude: form.longitude.trim(),
        description: form.description.trim(),
        wallet_address: wallet
      };

      Object.entries(backendForm).forEach(([key, value]) => {
        payload.append(key, value ?? "");
      });

      // Current backend expects this exact upload field.
      payload.append("land_document", document);

      const response = await fetch(`${API_BASE}/lands/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: payload
      });

      const data = await readApiResponse(response);

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Land registration failed.");
      }

      const successText =
        data?.message ||
        "Land submitted successfully. It is now waiting for administrator verification.";

      setMessage(successText);
      await new Promise((resolve) => setTimeout(resolve, 500));
      onSuccess(successText);
    } catch (err) {
      console.error("Register land error:", err);
      setError(err.message || "Unable to register land.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      {error && <Alert type="error">{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <section className="verification-banner">
        <div className="banner-icon">✓</div>
        <div>
          <strong>Seller verification: {seller?.verification_status || "PENDING"}</strong>
          <p>Only verified seller accounts should submit land for administrator review.</p>
        </div>
      </section>

      <form onSubmit={submit}>
        <section className="card registration-card">
          <CardTitle
            title="Land Identification"
            subtitle="Use the official land ID, survey and registration details from the supporting records."
          />
          <div className="form-grid">
            <Input label="Land ID *" value={form.land_id} onChange={(value) => update("land_id", value)} placeholder="TN-LAND-0001" />
            <Input label="Survey Number *" value={form.survey_number} onChange={(value) => update("survey_number", value)} placeholder="101/1A" />
            <Input label="Subdivision Number" value={form.subdivision_number} onChange={(value) => update("subdivision_number", value)} placeholder="101/1A1" />
            <Input label="Registration Number" value={form.registration_number} onChange={(value) => update("registration_number", value)} placeholder="Registered document number" />
            <Input type="date" label="Registration Date" value={form.registration_date} onChange={(value) => update("registration_date", value)} />
          </div>
        </section>

        <section className="card registration-card">
          <CardTitle title="Land Location" subtitle="Enter the location exactly as it appears in the official land record." />
          <div className="form-grid">
            <Input label="District *" value={form.district} onChange={(value) => update("district", value)} />
            <Input label="State *" value={form.state} onChange={(value) => update("state", value)} placeholder="" />
            <Input label="Taluk *" value={form.taluk} onChange={(value) => update("taluk", value)} />
            <Input label="Village *" value={form.village} onChange={(value) => update("village", value)} />
            <Input label="Pincode" value={form.pincode} onChange={(value) => update("pincode", value)} maxLength={6} />
            <TextArea label="Full Address" value={form.address} onChange={(value) => update("address", value)} full />
          </div>
        </section>

        <section className="card registration-card">
          <CardTitle title="Land Details" subtitle="Physical and usage information for the parcel." />
          <div className="form-grid">
            <Input type="number" label="Area *" value={form.area} onChange={(value) => update("area", value)} min="0" step="0.01" />
            <Select
              label="Area Unit"
              value={form.area_unit}
              onChange={(value) => update("area_unit", value)}
              options={[
                ["ACRES", "Acres"],
                ["HECTARES", "Hectares"],
                ["SQ_FT", "Square Feet"],
                ["SQ_M", "Square Metres"]
              ]}
            />
            <Select
              label="Land Type"
              value={form.land_type}
              onChange={(value) => update("land_type", value)}
              options={[
                ["Agricultural", "Agricultural"],
                ["Residential", "Residential"],
                ["Commercial", "Commercial"],
                ["Industrial", "Industrial"]
              ]}
            />
            <Select
              label="Usage Type"
              value={form.usage_type}
              onChange={(value) => update("usage_type", value)}
              options={[
                ["Agriculture", "Agriculture"],
                ["Residential", "Residential"],
                ["Commercial", "Commercial"],
                ["Industrial", "Industrial"]
              ]}
            />
            <Input label="Latitude" value={form.latitude} onChange={(value) => update("latitude", value)} placeholder="Optional" />
            <Input label="Longitude" value={form.longitude} onChange={(value) => update("longitude", value)} placeholder="Optional" />
            <Input type="number" label="Expected Sale Amount (₹)" value={form.sale_amount} onChange={(value) => update("sale_amount", value)} min="0" step="0.01" />
            <TextArea label="Property Description" value={form.description} onChange={(value) => update("description", value)} full />
          </div>
        </section>

        <section className="card registration-card">
          <CardTitle title="Ownership Details" subtitle="Enter every legal owner exactly as shown in the ownership document." />

          <div className="form-grid">
            <Input
              type="number"
              label="Number of Legal Owners *"
              value={form.owner_count}
              onChange={(value) => update("owner_count", value)}
              min="1"
              max="20"
            />
            <Input
              label="Primary Owner Mobile *"
              value={form.owner_mobile}
              onChange={(value) => update("owner_mobile", value)}
              maxLength={10}
              placeholder="10-digit mobile"
            />
          </div>

          <div className="owner-list">
            {form.owner_names.map((name, index) => (
              <div className="owner-row" key={index}>
                <div className="owner-index">{index + 1}</div>
                <Input
                  label={`Owner ${index + 1} Name *`}
                  value={name}
                  onChange={(value) => updateOwnerName(index, value)}
                  placeholder="Full legal owner name"
                />
              </div>
            ))}
          </div>

          <div className="info-callout">
            <strong>Why this is required</strong>
            <p>
              The administrator compares the owner count and owner names with the uploaded ownership record.
              The application should not mark this as genuine by itself; final verification belongs to the administrator
              and the official land-record source used by your institution.
            </p>
          </div>
        </section>

        <section className="card registration-card">
          <CardTitle
            title="Land Documents"
            subtitle="Upload one PDF package containing the supporting records so the current backend can store it without changing its upload API."
          />

          <div className="document-checklist">
            <DocumentRequirement label="Sale deed / registered ownership deed" />
            <DocumentRequirement label="Ownership / patta / title certificate" />
            <DocumentRequirement label="Latest land or property tax receipt" />
            <DocumentRequirement label="Government identity proof of the owner(s)" />
            <DocumentRequirement label="Other supporting land records, if applicable" />
          </div>

          <label className="file-drop">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => selectDocument(event.target.files?.[0])}
              disabled={loading}
            />
            <span className="file-drop-icon">⇧</span>
            <strong>{document ? document.name : "Choose land document "}</strong>
            <small>PDF only · maximum 10 MB</small>
          </label>

          <div className="info-callout warning">
            <strong>Verification is not automatic</strong>
            <p>
              Uploading a document does not mean the land is verified. The record remains pending until the Admin
              checks the survey number, ownership, location, documents and other official records.
            </p>
          </div>
        </section>

        

        <section className="card registration-card">
          <CardTitle
            title="Blockchain Association"
            subtitle="The seller wallet identifies who submitted the land record. It does not prove ownership by itself."
          />

          <div className="wallet-inline">
            <div className="wallet-inline-icon">◈</div>
            <div>
              <span>Connected Seller Wallet</span>
              <strong>{walletAddress ? walletAddress : "Not connected"}</strong>
            </div>
          </div>

          <div className="process-steps">
            <ProcessStep number="1" title="Seller submits" text="Land + ownership details + document package" active />
            <ProcessStep number="2" title="Admin verifies" text="Checks official records and documents" />
            <ProcessStep number="3" title="Approved" text="Property can become eligible for sale" />
            <ProcessStep number="4" title="Blockchain transaction" text="Only a real smart-contract transaction creates a tx hash" />
          </div>
        </section>

        <div className="form-actions sticky-actions">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Submitting..." : "Submit Land for Verification"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------- PROPERTIES ------------------------------ */

function PropertiesPage({ title, subtitle, lands, loading, error, onAdd, onView, filters }) {
  const [filter, setFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") return lands;
    return lands.filter((land) => getStatus(land) === filter);
  }, [lands, filter]);

  return (
    <div>
      <div className="page-toolbar page-toolbar-actions-only">
        <div />
        <button className="primary-button" onClick={onAdd}>+ Register Land</button>
      </div>

      {filters && (
        <div className="filter-tabs">
          {[
            ["ALL", `All (${lands.length})`],
            ["VERIFIED", `Verified (${lands.filter((x) => ["VERIFIED", "APPROVED"].includes(getStatus(x))).length})`],
            ["PENDING", `Pending (${lands.filter((x) => ["PENDING", "SUBMITTED", "UNDER_VERIFICATION"].includes(getStatus(x))).length})`],
            ["REJECTED", `Rejected (${lands.filter((x) => getStatus(x) === "REJECTED").length})`],
            ["SOLD", `Sold (${lands.filter((x) => getStatus(x) === "SOLD").length})`]
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? "filter-tab active" : "filter-tab"}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingBox text="Loading your properties..." />
      ) : error ? (
        <ErrorBox text={error} />
      ) : filtered.length === 0 ? (
        <EmptyBox
          icon="⌂"
          title="No matching properties"
          text="No land records are available for this filter."
          action="Register Land"
          onClick={onAdd}
        />
      ) : (
        <div className="card table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Property ID</th>
                  <th>Survey No.</th>
                  <th>Location</th>
                  <th>Area</th>
                  <th>Owners</th>
                  <th>Status</th>
                  <th>Listed Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((land, index) => (
                  <tr key={getLandId(land) + index}>
                    <td className="strong-cell">{getLandId(land)}</td>
                    <td>{getSurveyNumber(land)}</td>
                    <td>{getLocation(land)}</td>
                    <td>{formatArea(land)}</td>
                    <td>{getOwnerCount(land)}</td>
                    <td><StatusBadge status={getStatus(land)} /></td>
                    <td>{formatPrice(getPrice(land))}</td>
                    <td><button className="view-button" onClick={() => onView(land)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PropertyDetailsPage({ land, walletAddress, walletNetwork, onBack, onRegisterBlockchain }) {
  if (!land) {
    return <EmptyBox icon="⌂" title="No property selected" text="Select a property from My Properties." />;
  }

  const owners = getOwnerNames(land);
  const blockchainHash = land?.transaction_hash || land?.tx_hash || land?.blockchain_tx_hash || "";
  const documentName = land?.document_name || land?.land_document || land?.document || "Land document package";

  return (
    <div>
      <div className="detail-top card">
        <div>
          <span className="eyebrow">PROPERTY ID</span>
          <h2>{getLandId(land)}</h2>
          <p>{getLocation(land)}</p>
        </div>
        <StatusBadge status={getStatus(land)} />
      </div>

      <div className="details-grid">
        <section className="card">
          <CardTitle title="Land Information" />
          <InfoGrid>
            <InfoItem label="Land ID" value={getLandId(land)} />
            <InfoItem label="Survey Number" value={getSurveyNumber(land)} />
            <InfoItem label="Subdivision" value={land?.subdivision_number || land?.subdivisionNumber} />
            <InfoItem label="Registration Number" value={land?.registration_number || land?.registrationNumber} />
            <InfoItem label="Registration Date" value={land?.registration_date || land?.registrationDate} />
            <InfoItem label="District" value={land?.district} />
            <InfoItem label="Taluk" value={land?.taluk} />
            <InfoItem label="Village" value={land?.village} />
            <InfoItem label="Area" value={formatArea(land)} />
            <InfoItem label="Land Type" value={land?.land_type || land?.landType} />
            <InfoItem label="Usage" value={land?.usage_type || land?.usageType} />
            <InfoItem label="Address" value={land?.address} wide />
          </InfoGrid>
        </section>

        <section className="card">
          <CardTitle title="Ownership" subtitle={`${getOwnerCount(land)} legal owner(s) recorded`} />
          <div className="owner-detail-list">
            {owners.length ? owners.map((owner, index) => (
              <div className="owner-detail" key={index}>
                <div className="owner-number">{index + 1}</div>
                <div>
                  <strong>{owner}</strong>
                  <span>{index === 0 ? "Primary owner" : "Joint owner"}</span>
                </div>
              </div>
            )) : (
              <EmptyBox compact icon="♙" title="Owner names not returned by API" />
            )}
          </div>
          <InfoItem label="Primary Owner Mobile" value={land?.owner_mobile || land?.ownerMobile} />
        </section>

        <section className="card">
          <CardTitle
            title="Document Verification"
            subtitle="The current backend stores one land_document PDF package. Each required record is shown below as part of that package."
          />
          <div className="document-package-head">
            <div className="document-package-icon">PDF</div>
            <div className="document-package-main">
              <strong>{documentName}</strong>
              <span>Uploaded land document package</span>
            </div>
            {getDocumentUrl(land) ? (
              <button
                type="button"
                className="document-view-button"
                onClick={() => window.open(getDocumentUrl(land), "_blank", "noopener,noreferrer")}
              >
                View PDF
              </button>
            ) : (
              <span className="document-view-disabled">PDF URL not returned by API</span>
            )}
          </div>
          <div className="document-status-list">
            {getDocumentRequirements(land).map((documentItem) => (
              <div className="document-status" key={documentItem.label}>
                <span className="document-icon">PDF</span>
                <div>
                  <strong>{documentItem.label}</strong>
                  <span>{documentItem.detail}</span>
                </div>
                <StatusBadge status={documentItem.status} />
              </div>
            ))}
          </div>
          <div className="document-note">
            <strong>Important:</strong> These are five required document categories, not five separate uploads.
            Your present registration API accepts the single <b>land_document</b> PDF field, so the seller should combine the records into one PDF package.
          </div>
        </section>

        <section className="card full-width">
          <CardTitle
            title="Blockchain Record"
            subtitle="Only actual smart-contract transactions should appear as confirmed."
          />

          <div className="blockchain-detail">
            <div className="blockchain-stat">
              <span>Network</span>
              <strong>
                {land?.blockchain_network ||
                  land?.network ||
                  "Not recorded"}
              </strong>
            </div>

            <div className="blockchain-stat">
              <span>Seller Wallet</span>
              <strong className="mono">
                {land?.wallet_address ||
                  walletAddress ||
                  "Not connected"}
              </strong>
            </div>

            <div className="blockchain-stat">
              <span>Blockchain Land ID</span>
              <strong>
                {land?.blockchain_land_id ||
                  "Not recorded"}
              </strong>
            </div>

            <div className="blockchain-stat">
              <span>Transaction Hash</span>
              <strong className="mono">
                {blockchainHash ||
                  "Not available — no confirmed transaction linked yet"}
              </strong>
            </div>

            <div className="blockchain-stat">
              <span>Block Number</span>
              <strong>
                {land?.blockchain_block_number ??
                  land?.block_number ??
                  "Not recorded"}
              </strong>
            </div>
          </div>

          {["VERIFIED", "APPROVED"].includes(getStatus(land)) &&
           !blockchainHash &&
           onRegisterBlockchain && (
            <BlockchainRegistrationAction
              land={land}
              onRegister={onRegisterBlockchain}
            />
          )}

          {!["VERIFIED", "APPROVED"].includes(getStatus(land)) &&
           !blockchainHash && (
            <div className="backend-note">
              Admin must verify this land record before it can be registered on the blockchain.
            </div>
          )}
        </section>
      </div>

    </div>
  );
}

/* ------------------------------- LISTINGS -------------------------------- */

function BlockchainRegistrationAction({ land, onRegister }) {
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");
    setLoading(true);

    try {
      // Wait until MetaMask transaction + backend update are completed.
      await onRegister(land);

      // IMPORTANT:
      // MetaMask transaction was confirmed successfully.
      // Keep the UI in completed state immediately.
      setRegistered(true);
    } catch (err) {
      console.error("Blockchain land registration error:", err);

      setError(
        err?.message ||
          "Unable to register this land on the blockchain."
      );
    } finally {
      setLoading(false);
    }
  };

  // After successful MetaMask confirmation
  if (registered) {
    return (
      <div className="blockchain-action">
        <div>
          <strong>✓ Blockchain Registration Completed</strong>
          <p>
            This land has been successfully registered on Ganache
            blockchain.
          </p>
        </div>

        <div className="backend-note">
          Blockchain Land ID:{" "}
          <b>
            {land?.blockchain_land_id ||
              "Registered successfully"}
          </b>
        </div>
      </div>
    );
  }

  return (
    <div className="blockchain-action">
      <div>
        <strong>Ready for blockchain registration</strong>
        <p>
          This land has been verified by Admin. Register it on the
          deployed LandRegistry smart contract using the connected
          seller wallet.
        </p>
      </div>

      <button
        type="button"
        className="primary-button"
        onClick={handleRegister}
        disabled={loading}
      >
        {loading
          ? "Confirming on Ganache..."
          : "Register on Blockchain"}
      </button>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}
    </div>
  );
}
function ListingsPage({ lands, onView, onBack }) {
  const listed = lands.filter((land) => ["LISTED", "LISTED_FOR_SALE", "FOR_SALE"].includes(getStatus(land)));
  const eligible = lands.filter((land) => ["VERIFIED", "APPROVED"].includes(getStatus(land)));

  return (
    <div>
      <section className="card listing-info-banner">
        <div className="listing-banner-icon">◇</div>
        <div>
          <h2>My Listings</h2>
          <p>Properties that are approved by Admin and made available for buyers.</p>
          <small>Only verified/approved land should be listed. The current backend does not yet expose a seller listing endpoint, so this page will not invent a sale status.</small>
        </div>
      </section>

      <div className="listing-summary-grid">
        <div className="chain-card"><span>Currently Listed</span><strong>{listed.length}</strong></div>
        <div className="chain-card"><span>Ready to List</span><strong>{eligible.length}</strong></div>
        <div className="chain-card"><span>Total Properties</span><strong>{lands.length}</strong></div>
      </div>

      {listed.length > 0 && (
        <section className="card">
          <CardTitle title="Properties Already Listed" subtitle="These records have a LISTED/FOR_SALE status from the backend." />
          <div className="property-card-grid">
            {listed.map((land, index) => (
              <article className="property-card" key={getLandId(land) + index}>
                <div className="property-card-header">
                  <div><span className="eyebrow">LISTED LAND</span><h3>{getLandId(land)}</h3></div>
                  <StatusBadge status={getStatus(land)} />
                </div>
                <p>{getLocation(land)}</p>
                <div className="property-card-meta">
                  <span>Area <strong>{formatArea(land)}</strong></span>
                  <span>Price <strong>{formatPrice(getPrice(land))}</strong></span>
                </div>
                <button className="view-button full" onClick={() => onView(land)}>View Listing</button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <CardTitle title="Approved Properties Ready for Listing" subtitle="These properties passed verification but are not yet marked as listed." />
        {eligible.length === 0 ? (
          <EmptyBox icon="✓" title="No verified properties ready to list" text="Admin must verify a property before it can be offered for sale." />
        ) : (
          <div className="property-card-grid">
            {eligible.map((land, index) => (
              <article className="property-card" key={`eligible-${getLandId(land)}-${index}`}>
                <div className="property-card-header">
                  <div><span className="eyebrow">READY</span><h3>{getLandId(land)}</h3></div>
                  <StatusBadge status="VERIFIED" />
                </div>
                <p>{getLocation(land)}</p>
                <div className="property-card-meta">
                  <span>Area <strong>{formatArea(land)}</strong></span>
                  <span>Price <strong>{formatPrice(getPrice(land))}</strong></span>
                </div>
                <button className="view-button full" onClick={() => onView(land)}>Open Property</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------ BUYER REQUESTS / TXNS -------------------------- */

function BuyerRequestsPage({ requests, loading, error, onView, onBack, onRefresh }) {
  return (
    <div>
      <div className="page-toolbar">
        <button type="button" className="back-button" onClick={onBack}>← Back</button>
        <button type="button" className="secondary-button" onClick={onRefresh}>↻ Refresh</button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading && requests.length === 0 ? (
        <LoadingBox text="Loading buyer requests..." />
      ) : requests.length === 0 ? (
        <EmptyBox
          icon="♧"
          title="No live buyer requests"
          text="This screen reads buyer request data returned by the backend. No fake requests are inserted."
        />
      ) : (
        <div className="request-grid">
          {requests.map((request, index) => (
            <article className="request-card card" key={request.request_id || index}>
              <div className="request-head">
                <div className="buyer-avatar">{initial(request.buyer_name || request.buyer)}</div>
                <div>
                  <h3>{request.buyer_name || request.buyer || "Buyer"}</h3>
                  <p>{request.public_land_id || request.property || "Property"} · {request.district || request.village || request.location || "Location"}</p>
                </div>
                <StatusBadge status={request.request_status || request.status || "PENDING"} />
              </div>

              <div className="request-grid-info">
                <InfoItem label="Buyer ID" value={request.buyer_id || request.buyerId} />
                <InfoItem label="Offer" value={formatPrice(request.sale_amount || request.offered_price || request.amount)} />
                <InfoItem label="Request Date" value={request.requested_at || request.request_date || request.date} />
              </div>

              <div className="form-actions">
                <button className="secondary-button" onClick={() => onView(request)}>View</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestDetailsPage({ request, onBack, onAction }) {
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState("");

  if (!request) {
    return <EmptyBox icon="♧" title="No request selected" />;
  }

  const requestStatus =
    request.request_status ||
    request.status ||
    "PENDING";

  const blockchainLandId =
    request.blockchain_land_id ||
    request.blockchainLandId ||
    "";

  const publicLandId =
    request.public_land_id ||
    request.land_code ||
    request.property ||
    request.land_id ||
    "-";

  const buyerWallet =
    request.buyer_wallet_address ||
    request.wallet_address ||
    request.wallet ||
    "";

  const location =
    request.location ||
    [
      request.village,
      request.taluk,
      request.district,
      request.state
    ]
      .filter(Boolean)
      .join(", ") ||
    "-";

  const amount =
    request.sale_amount ??
    request.land_amount ??
    request.offered_price ??
    request.amount;

  const handleReject = async () => {
    try {
      setProcessing(true);
      setError("");

      const sellerToken =
        localStorage.getItem("sellerToken");

      if (!sellerToken) {
        throw new Error(
          "Seller session expired. Please login again."
        );
      }

      const response = await fetch(
        `http://localhost:5000/api/seller/requests/${request.request_id}/reject`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${sellerToken}`,
            "Content-Type":
              "application/json"
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Failed to reject purchase request."
        );
      }

      onAction?.(
        "rejected",
        data.request || request
      );

    } catch (err) {
      console.error(
        "Reject purchase request error:",
        err
      );

      setError(
        err.message ||
        "Failed to reject purchase request."
      );
    } finally {
      setProcessing(false);
    }
  };


  const handleAccept = async () => {
    try {
      setProcessing(true);
      setError("");

      /*
       * -----------------------------------------
       * STEP 1
       * Validate blockchain land ID
       * -----------------------------------------
       */

      if (!blockchainLandId) {
        throw new Error(
          "Blockchain land ID is missing for this request."
        );
      }


      /*
       * -----------------------------------------
       * STEP 2
       * Check seller token
       * -----------------------------------------
       */

      const sellerToken =
        localStorage.getItem("sellerToken");

      if (!sellerToken) {
        throw new Error(
          "Seller session expired. Please login again."
        );
      }


      /*
       * -----------------------------------------
       * STEP 3
       * Approve sale on blockchain
       *
       * MetaMask will open here.
       * Seller must confirm transaction.
       * -----------------------------------------
       */

      const blockchainResult =
        await approveSaleOnBlockchain(
          blockchainLandId
        );


      /*
       * -----------------------------------------
       * STEP 4
       * Send successful blockchain transaction
       * to backend
       * -----------------------------------------
       */

      const response = await fetch(
        `http://localhost:5000/api/seller/requests/${request.request_id}/approve`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${sellerToken}`,

            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            blockchainTxHash:
              blockchainResult?.transactionHash ||
              blockchainResult?.txHash ||
              "",

            blockchainBlockNumber:
              blockchainResult?.blockNumber ||
              "",

            blockchainNetwork:
              blockchainResult?.network ||
              "Ganache Local"
          })
        }
      );


      const data =
        await response.json();


      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Blockchain sale succeeded, but backend update failed."
        );
      }


      /*
       * -----------------------------------------
       * STEP 5
       * Notify SellerModule
       * -----------------------------------------
       */

      onAction?.(
        "accepted",
        data.request || request
      );


    } catch (err) {
      console.error(
        "Accept purchase request error:",
        err
      );

      setError(
        err.message ||
        "Failed to approve purchase request."
      );

    } finally {
      setProcessing(false);
    }
  };


  return (
    <section className="card">

      <div className="request-head large">

        <div className="buyer-avatar large">
          {initial(
            request.buyer_name ||
            request.buyer
          )}
        </div>

        <div>

          <h2>
            {request.buyer_name ||
              request.buyer ||
              "Buyer"}
          </h2>

          <p>
            Purchase request for{" "}
            {publicLandId}
          </p>

        </div>

        <StatusBadge
          status={requestStatus}
        />

      </div>


      <InfoGrid>

        <InfoItem
          label="Buyer ID"
          value={
            request.buyer_id ||
            request.buyerId
          }
        />

        <InfoItem
          label="Property ID"
          value={publicLandId}
        />

        <InfoItem
          label="Blockchain Land ID"
          value={blockchainLandId}
        />

        <InfoItem
          label="Location"
          value={location}
        />

        <InfoItem
          label="Offered Price"
          value={formatPrice(amount)}
        />

        <InfoItem
          label="Request Date"
          value={
            request.requested_at ||
            request.request_date ||
            request.date
          }
        />

        <InfoItem
          label="Status"
          value={requestStatus}
        />

        <InfoItem
          label="Buyer Wallet"
          value={buyerWallet}
          wide
          mono
        />

      </InfoGrid>


      {error && (
        <div
          className="alert error"
          style={{ marginTop: "16px" }}
        >
          {error}
        </div>
      )}


      {requestStatus === "PENDING" && (
        <div className="form-actions">

          <button
            className="danger-button"
            onClick={handleReject}
            disabled={processing}
          >
            {processing
              ? "Processing..."
              : "Reject"}
          </button>


          <button
            className="primary-button"
            onClick={handleAccept}
            disabled={processing}
          >
            {processing
              ? "Waiting for Transaction..."
              : "Accept Request"}
          </button>

        </div>
      )}


      {requestStatus === "APPROVED" && (
        <div
          className="alert success"
          style={{ marginTop: "20px" }}
        >
          ✓ Purchase request approved and
          ownership transfer was completed on
          the blockchain.
        </div>
      )}


      {requestStatus === "REJECTED" && (
        <div
          className="alert error"
          style={{ marginTop: "20px" }}
        >
          This purchase request was rejected.
        </div>
      )}


      <div className="backend-note">

        {requestStatus === "PENDING" ? (
          <>
            <strong>
              Accept flow:
            </strong>{" "}
            MetaMask →{" "}
            <b>approveSale()</b> → blockchain
            confirmation → backend request update.
          </>
        ) : (
          <>
            Blockchain sale status and backend
            request status are recorded for this
            request.
          </>
        )}

      </div>

    </section>
  );
}
function TransactionsPage({ transactions, onView, onBack }) {
  if (!transactions.length) {
    return (
      <EmptyBox
        icon="▣"
        title="No transaction records"
        text="Completed ownership transfers will appear here when the backend returns a transaction record."
        action="Back"
        onClick={onBack}
      />
    );
  }

  return (
    <section className="card table-card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Property</th>
              <th>Buyer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Blockchain Hash</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr key={transaction.id || index} className="clickable-row" onClick={() => onView(transaction)}>
                <td>{transaction.id || transaction.transaction_id || "-"}</td>
                <td>{transaction.property || "-"}</td>
                <td>{transaction.buyer_name || transaction.buyer || "-"}</td>
                <td>{formatPrice(transaction.amount || transaction.sale_amount)}</td>
                <td><StatusBadge status={transaction.status || "PENDING"} /></td>
                <td>{transaction.date || transaction.transaction_date || "-"}</td>
                <td className="hash-cell">{shortHash(transaction.tx_hash || transaction.hash)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TransactionDetailsPage({ transaction, onBack }) {
  if (!transaction) {
    return <EmptyBox icon="▣" title="No transaction selected" />;
  }

  return (
    <section className="card">
      <div className="transaction-status">
        <div className="success-circle">✓</div>
        <div>
          <h2>{["COMPLETED", "BLOCKCHAIN COMPLETED", "APPROVED", "OWNERSHIP TRANSFERRED"].includes(String(transaction.status || "").toUpperCase()) ? "Transaction Completed" : "Transaction Pending"}</h2>
          <p>Ownership transfer status returned by the application.</p>
        </div>
      </div>

      <InfoGrid>
        <InfoItem label="Transaction ID" value={transaction.id || transaction.transaction_id} />
        <InfoItem label="Property ID" value={transaction.property} />
        <InfoItem label="Buyer" value={transaction.buyer_name || transaction.buyer} />
        <InfoItem label="Amount" value={formatPrice(transaction.amount || transaction.sale_amount)} />
        <InfoItem label="Date" value={transaction.date || transaction.transaction_date} />
        <InfoItem label="Status" value={transaction.status} />
      </InfoGrid>

      <div className="hash-box">
        <span>Blockchain Transaction Hash</span>
        <strong>{transaction.tx_hash || transaction.hash || "Not available"}</strong>
      </div>

    </section>
  );
}

/* ---------------------- OWNERSHIP / WALLET / CHAIN ----------------------- */

function OwnershipPage({ records = [], onBack }) {
  return (
    <div>
      <div className="page-heading" style={{ marginBottom: "20px" }}>
        {/* <div>
          <h1>Ownership History</h1>
          <p>Blockchain-confirmed ownership transfers for your land.</p>
        </div> */}
      </div>

      {records.length === 0 ? (
        <EmptyBox
          icon="♢"
          title="No ownership transfers yet"
          text="Ownership history appears here only after a buyer request is approved and approveSale() is confirmed on Ganache."
          action="Back"
          onClick={onBack}
        />
      ) : (
        <section className="card table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Previous Owner</th>
                  <th>New Owner</th>
                  <th>Blockchain Land ID</th>
                  <th>Network</th>
                  <th>Status</th>
                  <th>Transaction</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record, index) => (
                  <tr key={record.request_id || `${record.property}-${index}`}>
                    <td>
                      <strong>{record.property || "-"}</strong>
                    </td>

                    <td>
                      <div>{record.previous_owner || "-"}</div>
                      <small>
                        {record.previous_owner_wallet || "Wallet not available"}
                      </small>
                    </td>

                    <td>
                      <div>{record.new_owner || "-"}</div>
                      <small>
                        {record.new_owner_wallet || "Wallet not available"}
                      </small>
                    </td>

                    <td>{record.blockchain_land_id || "-"}</td>
                    <td>{record.network || "Ganache Local"}</td>

                    <td>
                      <StatusBadge status="OWNERSHIP TRANSFERRED" />
                    </td>

                    <td>
                      <div className="hash-cell">
                        {record.tx_hash || "Not available"}
                      </div>
                      {record.block_number ? (
                        <small>Block {record.block_number}</small>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function WalletPage({
  walletAddress,
  walletNetwork,
  blockchainSellerStatus,
  blockchainSellerLoading,
  blockchainSellerError,
  onRegisterBlockchainSeller,
  onRefreshBlockchainSeller,
  onConnect,
  onDisconnect,
  onBack
}) {
  const registered = Boolean(blockchainSellerStatus?.registered);
  const verified = Boolean(blockchainSellerStatus?.verified);

  return (
    <div>
      <section className="card wallet-card-large">
        <div className="wallet-big-icon">◈</div>
        <h2>{walletAddress ? "Wallet Connected" : "Connect MetaMask"}</h2>
        <p>
          This is the public Ethereum-compatible address used by MetaMask for seller-side blockchain transactions.
        </p>

        {walletAddress ? (
          <>
            <div className="wallet-address-box">{walletAddress}</div>
            <InfoGrid>
              <InfoItem label="Network" value={walletNetwork || "Unknown"} />
              <InfoItem label="Address" value={walletAddress} mono />
              <InfoItem label="Role" value="Seller wallet" />
            </InfoGrid>
            <div className="form-actions wallet-actions">
              <button className="danger-button" onClick={onDisconnect}>Disconnect Wallet</button>
              <button className="secondary-button" onClick={onConnect}>Change Wallet</button>
            </div>
          </>
        ) : (
          <button className="primary-button" onClick={onConnect}>Connect MetaMask</button>
        )}
      </section>

      {walletAddress && (
        <section className="wallet-verification-section">
          <div className="wallet-verification-grid">
            <div className="card wallet-verification-card">
              <div className="wallet-verification-icon">◈</div>
              <div className="wallet-verification-content">
                <h3>Blockchain Verification</h3>
                <p>Seller wallet registration on the LandRegistry smart contract.</p>
                <div className="wallet-verification-status">
                  <span>Status</span>
                  <StatusBadge status={registered ? "VERIFIED" : "PENDING"} />
                </div>
                <small>
                  {registered
                    ? "Wallet registered on blockchain"
                    : "Wallet is not registered on blockchain"}
                </small>
              </div>

              {!registered && (
                <button
                  type="button"
                  className="primary-button wallet-verification-button"
                  onClick={onRegisterBlockchainSeller}
                  disabled={blockchainSellerLoading}
                >
                  {blockchainSellerLoading
                    ? "Waiting for MetaMask..."
                    : "Register on Blockchain"}
                </button>
              )}
            </div>

            <div className="card wallet-verification-card">
              <div className="wallet-verification-icon admin">✓</div>
              <div className="wallet-verification-content">
                <h3>Admin Verification</h3>
                <p>Admin verification of the seller wallet on the smart contract.</p>
                <div className="wallet-verification-status">
                  <span>Status</span>
                  <StatusBadge status={verified ? "VERIFIED" : "PENDING"} />
                </div>
                <small>
                  {verified
                    ? "Verified by contract Admin"
                    : registered
                      ? "Waiting for Admin to verify this wallet"
                      : "Register the wallet first"}
                </small>
              </div>

              {registered && !verified && (
                <button
                  type="button"
                  className="secondary-button wallet-verification-button"
                  onClick={onRefreshBlockchainSeller}
                  disabled={blockchainSellerLoading}
                >
                  Refresh Admin Status
                </button>
              )}
            </div>
          </div>

          {blockchainSellerError && (
            <div className="alert error wallet-verification-error">
              {blockchainSellerError}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
function BlockchainPage({
  lands,
  walletAddress,
  walletNetwork,
  onBack,
  onRegisterBlockchain
}) {
  return (
    <div>
      <div className="blockchain-summary-grid">

        <div className="chain-card">
          <span>Connected MetaMask Network</span>
          <strong>
            {walletNetwork || "Not connected"}
          </strong>
        </div>

        <div className="chain-card">
          <span>Seller Wallet</span>
          <strong className="mono">
            {walletAddress || "Not connected"}
          </strong>
        </div>

        <div className="chain-card">
          <span>Land Records</span>
          <strong>{lands.length}</strong>
        </div>

      </div>

      <section className="card table-card">

        <CardTitle
          title="Blockchain References"
          subtitle="Only real smart-contract transactions are displayed as blockchain records."
        />

        <div className="table-wrap">
          <table>

            <thead>
              <tr>
                <th>Land ID</th>
                <th>Property Status</th>
                <th>Network</th>
                <th>Wallet</th>
                <th>Tx Hash</th>
                <th>Block</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {lands.length === 0 ? (

                <tr>
                  <td colSpan="7" className="empty-cell">
                    No land records.
                  </td>
                </tr>

              ) : (

                lands.map((land, index) => {

                  const txHash =
                    land?.blockchain_tx_hash ||
                    land?.transaction_hash ||
                    land?.tx_hash ||
                    "";

                  const recordedWallet =
                    land?.wallet_address ||
                    land?.owner_wallet ||
                    walletAddress ||
                    "";

                  const recordedNetwork =
                    land?.blockchain_network ||
                    "";

                  const blockNumber =
                    land?.blockchain_block_number ??
                    "";

                  const status = getStatus(land);

                  const hasBlockchainRecord =
                    Boolean(txHash && blockNumber !== "");

                  const canRegister =
                    ["VERIFIED", "APPROVED"].includes(status) &&
                    !hasBlockchainRecord;

                  return (
                    <tr
                      key={`${getLandId(land)}-${index}`}
                    >

                      <td>
                        {getLandId(land)}
                      </td>

                      <td>
                        <StatusBadge
                          status={status}
                        />
                      </td>

                      <td>
                        {recordedNetwork || (
                          <span style={{ color: "#98a2b3" }}>
                            Not recorded
                          </span>
                        )}
                      </td>

                      <td className="hash-cell">
                        {shortHash(recordedWallet)}
                      </td>

                      <td className="hash-cell">
                        {hasBlockchainRecord
                          ? shortHash(txHash)
                          : "-"}
                      </td>

                      <td>
                        {hasBlockchainRecord
                          ? blockNumber
                          : "-"}
                      </td>

                      <td>

                        {hasBlockchainRecord ? (

                          <span className="backend-note">
                            Recorded
                          </span>

                        ) : canRegister ? (

                          <button
                            type="button"
                            className="primary-button"
                            onClick={() =>
                              onRegisterBlockchain?.(land)
                            }
                          >
                            Register
                          </button>

                        ) : (

                          <span className="backend-note">
                            Admin verification required
                          </span>

                        )}

                      </td>

                    </tr>
                  );

                })

              )}

            </tbody>

          </table>
        </div>

      </section>
    </div>
  );
}
/* ------------------------- NOTIFICATIONS / HELP -------------------------- */

function NotificationsPage({ notifications, onBack, onRead }) {
  return (
    <div>
      <section className="notification-list">
        {notifications.length === 0 ? (
          <EmptyBox icon="♧" title="No notifications" />
        ) : (
          notifications.map((item) => (
            <article className={`card notification-row ${item.read ? "read" : "unread"}`} key={item.id} onClick={() => onRead(item.id)}>
              <div className={`notification-icon ${item.type}`}>
                {item.type === "success" ? "✓" : item.type === "error" ? "!" : "i"}
              </div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span>{item.time}</span>
              </div>
            </article>
          ))
        )}
      </section>

    </div>
  );
}

function HelpPage({ onBack, onOpen }) {
  const items = [
    ["?", "How to register land?", "Connect MetaMask, complete the land form, upload the document package and submit it for Admin verification.", "add-property"],
    ["✓", "How verification works?", "The seller submits data. Admin checks survey, owner details, documents and official records before approval.", "property-list"],
    ["◈", "Why is my wallet shown?", "The public MetaMask address identifies the wallet that submits blockchain transactions. It is not a password or private key.", "wallet"],
    ["♧", "Buyer requests", "Requests should come from the buyer module/API and appear here only when the backend returns them.", "buyer-requests"]
  ];

  return (
    <div>
      <div className="help-grid">
        {items.map(([icon, title, text, page]) => (
          <button className="help-card card" key={title} onClick={() => onOpen(page)}>
            <div className="help-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{text}</p>
            <span>Open →</span>
          </button>
        ))}
      </div>

      <section className="card support-card">
        <h2>System verification note</h2>
        <p>
          Do not use fake government responses or fake blockchain hashes in the final demonstration.
          If an external land-record API is not available, show the verification state as Pending and let Admin perform the review.
        </p>
      </section>

    </div>
  );
}

/* ----------------------------- UI HELPERS -------------------------------- */

function PropertyStatusGraph({ stats }) {
  const items = [
    { label: "Verified", value: Number(stats?.verified || 0), tone: "verified" },
    { label: "Pending", value: Number(stats?.pending || 0), tone: "pending" },
    { label: "Listed", value: Number(stats?.listed || 0), tone: "listed" },
    { label: "Sold", value: Number(stats?.sold || 0), tone: "sold" },
    { label: "Rejected", value: Number(stats?.rejected || 0), tone: "rejected" }
  ];

  const max = Math.max(...items.map((item) => item.value), 1);
  const scaleValues = [max, Math.ceil(max * 0.75), Math.ceil(max * 0.5), Math.ceil(max * 0.25), 0];

  return (
    <div className="status-bar-chart" role="img" aria-label="Property status bar chart">
      <div className="bar-chart-area">
        <div className="bar-chart-y-axis">
          {scaleValues.map((value, index) => (
            <span key={`${value}-${index}`}>{value}</span>
          ))}
        </div>

        <div className="bar-chart-plot">
          <div className="bar-chart-grid">
            {scaleValues.map((value, index) => (
              <span key={`${value}-grid-${index}`} />
            ))}
          </div>

          <div className="vertical-status-bars">
            {items.map((item) => {
              const height = item.value > 0 ? Math.max((item.value / max) * 100, 7) : 0;
              return (
                <div className="vertical-status-item" key={item.label}>
                  <div className="vertical-bar-value">{item.value}</div>
                  <div className="vertical-bar-track">
                    <div
                      className={`vertical-bar-fill ${item.tone}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="vertical-bar-label">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bar-chart-legend" aria-hidden="true">
        {items.map((item) => (
          <span key={item.label}>
            <i className={`legend-dot ${item.tone}`} />
            {item.label}
          </span>
        ))}
      </div>

      <p className="graph-note">Live property counts from the seller API.</p>
    </div>
  );
}

function StatCard({ icon, title, value, tone, onClick }) {
  return (
    <button className="stat-card" onClick={onClick}>
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{String(value).padStart(2, "0")}</strong>
        <small>View all</small>
      </div>
    </button>
  );
}

function PanelHeader({ title, action, onClick }) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
      {action && <button className="outline-button" onClick={onClick}>{action}</button>}
    </div>
  );
}

function CardTitle({ title, subtitle }) {
  return (
    <div className="card-title">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "", disabled = false, min, max, maxLength, step }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        maxLength={maxLength}
        step={step}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, full = false, placeholder = "" }) {
  return (
    <label className={`field ${full ? "full-field" : ""}`}>
      <span>{label}</span>
      <textarea value={value ?? ""} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} rows="4" />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option value={optionValue} key={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function InfoGrid({ children }) { return <div className="info-grid">{children}</div>; }

function InfoItem({ label, value, wide = false, mono = false }) {
  return (
    <div className={`info-item ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong className={mono ? "mono" : ""}>{displayValue(value)}</strong>
    </div>
  );
}

function VerificationLine({ label, status }) {
  return (
    <div className="verification-line">
      <span>{label}</span>
      <StatusBadge status={status} />
    </div>
  );
}

function DocumentRequirement({ label }) {
  return (
    <div className="document-requirement">
      <span>✓</span>
      <strong>{label}</strong>
      <small>Include in PDF package</small>
    </div>
  );
}

function ProcessStep({ number, title, text, active }) {
  return (
    <div className={`process-step ${active ? "active" : ""}`}>
      <div className="process-number">{number}</div>
      <div><strong>{title}</strong><span>{text}</span></div>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "PENDING").toUpperCase().replace(/\s+/g, "_");
  let className = "pending";

  if (["VERIFIED", "APPROVED", "COMPLETED", "CONNECTED", "BLOCKCHAIN_COMPLETED", "OWNERSHIP_TRANSFERRED"].includes(normalized)) className = "verified";
  if (["REJECTED", "FAILED", "CANCELLED"].includes(normalized)) className = "rejected";
  if (["LISTED", "LISTED_FOR_SALE", "FOR_SALE"].includes(normalized)) className = "listed";
  if (normalized === "SOLD") className = "sold";

  return <span className={`status-badge ${className}`}>{normalized.replace(/_/g, " ")}</span>;
}

function Alert({ type, children }) { return <div className={`alert ${type}`}>{children}</div>; }

function LoadingBox({ text }) { return <div className="card state-box">{text}</div>; }

function ErrorBox({ text }) {
  return (
    <div className="card state-box error-state">
      <strong>Unable to load data</strong>
      <p>{text}</p>
      <small>Make sure the backend is running on http://localhost:5000 and the seller token is valid.</small>
    </div>
  );
}

function EmptyBox({ icon = "⌂", title, text, action, onClick, compact = false }) {
  return (
    <div className={`card empty-box ${compact ? "compact" : ""}`}>
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && onClick && <button className="primary-button" onClick={onClick}>{action}</button>}
    </div>
  );
}

/* -------------------------------- HELPERS -------------------------------- */

function getSavedSellerWallet() {
  const address = localStorage.getItem("sellerWallet") || "";
  const network = localStorage.getItem("sellerWalletNetwork") || "";
  return { address, network };
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

async function readApiResponse(response) {
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) return response.json();

  const text = await response.text();
  throw new Error(text || "Backend returned a non-JSON response. Check the API route.");
}

function displayValue(value) {
  return value === undefined || value === null || value === "" ? "Not provided" : String(value);
}

function initial(value) {
  return String(value || "S").trim().charAt(0).toUpperCase() || "S";
}

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortHash(value) {
  if (!value) return "-";
  const text = String(value);
  return text.length > 18 ? `${text.slice(0, 10)}...${text.slice(-8)}` : text;
}

function getNetworkName(chainId) {
  const networks = {
    "1": "Ethereum Mainnet",
    "11155111": "Sepolia Testnet",
    "1337": "Ganache Local",
    "5777": "Ganache Local",
    "31337": "Hardhat Local"
  };
  return networks[String(chainId)] || `Chain ${chainId}`;
}

function getDocumentUrl(land) {
  const raw = land?.document_url || land?.documentUrl || land?.land_document_url || land?.landDocumentUrl || land?.document_path || land?.documentPath || land?.land_document || "";
  if (!raw || typeof raw !== "string") return "";

  const value = raw.trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(value) || value.startsWith("blob:") || value.startsWith("data:")) return value;

  // The seller API runs on localhost:5000. Multer commonly returns either
  // /uploads/file.pdf, uploads/file.pdf, or only file.pdf.
  if (value.startsWith("/")) return `http://localhost:5000${value}`;
  if (/^(uploads|documents|files)\//i.test(value)) return `http://localhost:5000/${value}`;
  if (/\.pdf$/i.test(value)) return `http://localhost:5000/uploads/${value}`;
  return "";
}

function getDocumentRequirements(land) {
  const packageName =
    land?.document_name ||
    land?.land_document_name ||
    land?.land_document ||
    land?.document ||
    "Land document package";

  /*
   * Admin verification remains the source of truth.
   * The backend stores the verification result on the land record.
   * If the land is already VERIFIED/APPROVED, the five records in the
   * single uploaded PDF package are displayed as VERIFIED instead of
   * incorrectly showing PENDING.
   *
   * This does NOT remove or bypass Admin verification.
   */
  const landVerificationStatus = String(
    land?.verification_status ||
    land?.status ||
    ""
  ).toUpperCase();

  const overallStatus =
    landVerificationStatus === "VERIFIED" ||
    landVerificationStatus === "APPROVED"
      ? "VERIFIED"
      : String(
          land?.document_verification_status ||
          "PENDING"
        ).toUpperCase();

  const items = [
    ["Sale deed / registered ownership deed", land?.sale_deed_status, land?.sale_deed_url],
    ["Ownership certificate / patta / title certificate", land?.patta_status || land?.ownership_certificate_status, land?.patta_url || land?.ownership_certificate_url],
    ["Latest land or property tax receipt", land?.tax_receipt_status, land?.tax_receipt_url],
    ["Government identity proof of owner(s)", land?.government_id_status || land?.govt_id_status, land?.government_id_url || land?.govt_id_url],
    ["Other supporting land records", land?.other_document_status, land?.other_document_url]
  ];

  return items.map(([label, status, url]) => ({
    label,
    status:
      String(status || "").toUpperCase() === "VERIFIED" ||
      String(status || "").toUpperCase() === "APPROVED"
        ? "VERIFIED"
        : overallStatus,
    detail: url
      ? `Separate PDF available · ${url}`
      : `Included in ${packageName}`
  }));
}

function getLandId(land) {
  return land?.land_id || land?.landId || land?.property_id || land?.propertyId || land?.id || "N/A";
}

function getStatus(land) {
  return String(land?.verification_status || land?.status || "PENDING").toUpperCase();
}

function getSurveyNumber(land) {
  return land?.survey_number || land?.surveyNumber || "-";
}

function getLocation(land) {
  if (land?.location) return land.location;
  const parts = [land?.village, land?.taluk, land?.district].filter(Boolean);
  return parts.length ? parts.join(", ") : land?.address || "Location not available";
}

function getPrice(land) {
  return land?.price ?? land?.sale_amount ?? land?.listed_price ?? land?.sale_price ?? null;
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "-";
  const numeric = Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(numeric)) return `₹ ${value}`;
  return `₹ ${numeric.toLocaleString("en-IN")}`;
}

function formatArea(land) {
  const area = land?.area ?? land?.land_area ?? land?.size;
  if (area === undefined || area === null || area === "") return "-";
  const unit = land?.area_unit || land?.areaUnit || "";
  return `${area}${unit ? ` ${unit}` : ""}`;
}


function getOwnerNames(land) {
  const raw = land?.owner_names || land?.owners || land?.ownerNames;

  if (Array.isArray(raw)) {
    return raw.map((item) => typeof item === "string" ? item : item?.name).filter(Boolean);
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return raw.split(",").map((x) => x.trim()).filter(Boolean);
    }
  }

  if (land?.owner_name || land?.ownerName) return [land.owner_name || land.ownerName];

  return [];
}

function getOwnerCount(land) {
  const count = Number(land?.owner_count ?? land?.ownerCount);
  if (Number.isInteger(count) && count > 0) return count;
  return getOwnerNames(land).length || "-";
}

/* ---------------------------------- CSS ---------------------------------- */

const CSS = `
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;background:#f5f7fb;color:#172033}
button,input,textarea,select{font:inherit}
button{cursor:pointer}
button:disabled{opacity:.65;cursor:not-allowed}
.seller-app{min-height:100vh;background:#f5f7fb}
.seller-sidebar{position:fixed;left:0;top:0;bottom:0;width:282px;background:linear-gradient(180deg,#004434 0%,#005b48 54%,#003c30 100%);color:#fff;z-index:30;overflow-y:auto;transition:.25s}
.seller-sidebar.collapsed{width:78px}
.brand{height:78px;background:#fff;color:#064e3b;display:flex;align-items:center;gap:12px;padding:0 24px}
.brand-logo{width:42px;height:42px;border-radius:10px;background:#e7f7ee;color:#159447;display:flex;align-items:center;justify-content:center;font-size:25px;font-weight:800;flex:none}
.brand-title,.brand-subtitle{font-size:19px;font-weight:800;line-height:1.05}
.seller-module-label{padding:20px 25px 10px;font-size:13px;font-weight:800;letter-spacing:1px;color:#e7fff5}
.sidebar-seller-profile{width:calc(100% - 30px);margin:0 15px 15px;padding:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);border-radius:10px;display:flex;align-items:center;gap:10px;color:#fff;text-align:left;transition:.2s}.sidebar-seller-profile:hover{background:rgba(255,255,255,.14)}.sidebar-seller-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#35c978,#16a45d);display:flex;align-items:center;justify-content:center;font-weight:800;flex:none}.sidebar-seller-info{min-width:0;flex:1;display:flex;flex-direction:column;gap:3px}.sidebar-seller-info strong{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sidebar-seller-info span{font-size:9px;color:#bcebd7}.sidebar-profile-arrow{font-size:20px;color:#bcebd7}
.seller-nav{padding:0 12px 24px}
.nav-group{margin-bottom:12px}
.nav-group-title{padding:8px 14px;color:#82b9a9;font-size:10px;font-weight:800;letter-spacing:1.2px}
.seller-nav-item{width:100%;height:47px;border:0;background:transparent;color:#e2f5ef;display:flex;align-items:center;gap:13px;padding:0 14px;border-radius:7px;margin-bottom:4px;text-align:left}
.seller-nav-item:hover{background:rgba(255,255,255,.08)}
.seller-nav-item.active{background:linear-gradient(90deg,#25a84c,#3dbd59);color:#fff;box-shadow:0 7px 17px rgba(0,0,0,.13)}
.seller-nav-icon{width:23px;text-align:center;font-size:18px;flex:none}
.seller-nav-text{font-size:14px;font-weight:600;flex:1}
.seller-nav-badge{min-width:22px;height:22px;border-radius:50%;background:#35b957;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800}
.sidebar-security{margin:16px 15px 24px;min-height:180px;border-radius:12px;background:linear-gradient(180deg,rgba(21,151,89,.42),rgba(0,68,52,.9));border:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:15px}
.security-icon{font-size:56px;margin-bottom:12px}
.sidebar-security strong{font-size:14px}.sidebar-security span{font-size:12px;color:#bcebd7;margin-top:5px}
.seller-main{margin-left:282px;width:calc(100% - 282px);min-height:100vh;transition:.25s}
.seller-main.expanded{margin-left:78px;width:calc(100% - 78px)}
.seller-topbar{height:70px;background:#fff;border-bottom:1px solid #e5eaf0;display:flex;align-items:center;padding:0 25px;position:sticky;top:0;z-index:20}
.top-menu-button{width:38px;height:38px;border:0;background:#f6f8fa;border-radius:8px;color:#536173;font-size:19px}
.topbar-spacer{flex:1}
.top-notification{width:42px;height:42px;border:0;background:transparent;position:relative;font-size:22px;color:#182334}
.top-notification span{position:absolute;top:0;right:0;min-width:18px;height:18px;border-radius:50%;background:#159447;color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center}
.top-divider{width:1px;height:34px;background:#e5e7eb;margin:0 16px}
.profile-menu-wrap{position:relative}
.top-profile-button{border:0;background:transparent;display:flex;align-items:center;gap:10px;padding:6px 4px;border-radius:8px}
.top-profile-button:hover{background:#f7f9fa}
.top-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#35c978,#16a45d);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800}
.top-profile-text{display:flex;flex-direction:column;min-width:120px;text-align:left}
.top-profile-text strong{font-size:14px}.top-profile-text span{font-size:11px;color:#697386;margin-top:2px}
.profile-chevron{font-size:18px;transition:.2s}.profile-chevron.up{transform:rotate(180deg)}
.profile-dropdown{position:absolute;right:0;top:55px;width:205px;background:#fff;border:1px solid #e1e7ed;border-radius:10px;box-shadow:0 15px 35px rgba(15,23,42,.13);padding:7px;z-index:50}
.profile-dropdown button{width:100%;border:0;background:#fff;padding:10px 11px;border-radius:7px;text-align:left;color:#344054;display:flex;gap:10px;align-items:center;font-size:13px}
.profile-dropdown button:hover{background:#f4f8f5}.profile-dropdown .logout-option{color:#b42318}.dropdown-divider{height:1px;background:#edf0f3;margin:5px 0}
.seller-content{padding:24px 30px 45px;max-width:1600px;margin:auto}
.back-link{border:0;background:transparent;color:#087c42;font-weight:700;padding:0;margin:0 0 12px;font-size:13px}
.page-heading{margin-bottom:20px}.page-heading h1{margin:0;font-size:23px;color:#172033}.page-heading p{margin:6px 0 0;color:#687386;font-size:14px}
.welcome-row{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:21px}
.welcome-row h2{margin:0;font-size:22px}.welcome-row p{margin:5px 0 0;color:#687386;font-size:14px}
.verification-chip{background:#fff;border:1px solid #e3e9ee;border-radius:20px;padding:8px 12px;font-size:11px;font-weight:700;color:#475467;white-space:nowrap}
.chip-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#f59e0b;margin-right:7px}
.stats-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:18px;margin-bottom:22px}
.stat-card{border:1px solid #e5e9ef;background:#fff;border-radius:11px;padding:18px 14px;display:flex;align-items:center;gap:14px;text-align:left;min-height:114px;box-shadow:0 3px 12px rgba(15,23,42,.035);transition:.2s}
.stat-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(15,23,42,.07)}
.stat-icon{width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:25px;font-weight:700;flex:none}
.stat-icon.green{background:#dff6e6;color:#159447}.stat-icon.blue{background:#e0ebff;color:#2c6bed}.stat-icon.yellow{background:#fff0cb;color:#e79500}.stat-icon.purple{background:#eee4ff;color:#7040d8}.stat-icon.red{background:#ffe2e0;color:#db4440}
.stat-card>div:last-child{display:flex;flex-direction:column}.stat-card span{font-size:12px;color:#455064;margin-bottom:4px}.stat-card strong{font-size:24px;color:#111827}.stat-card small{color:#159447;font-size:11px;margin-top:4px}
.graph-panel{margin-bottom:20px;overflow:hidden}.status-graph{padding:20px 22px 17px;position:relative}.status-graph-grid{display:flex;justify-content:space-between;padding-left:85px;padding-right:52px;margin-bottom:-12px}.status-graph-grid span{font-size:9px;color:#a0a8b5}.status-bars{position:relative;display:flex;flex-direction:column;gap:14px;padding-top:5px}.status-bar-row{display:grid;grid-template-columns:75px 1fr 30px;align-items:center;gap:10px}.status-bar-label{font-size:11px;color:#475467;font-weight:600}.status-bar-track{height:13px;background:#edf1f3;border-radius:20px;overflow:hidden}.status-bar-fill{height:100%;border-radius:20px;transition:width .3s}.status-bar-fill.verified{background:#159447}.status-bar-fill.pending{background:#e9a21a}.status-bar-fill.listed{background:#3b82f6}.status-bar-fill.sold{background:#7c3aed}.status-bar-fill.rejected{background:#dc4b45}.status-bar-row>strong{font-size:11px;text-align:right;color:#172033}.graph-note{margin:16px 0 0;color:#98a2b3;font-size:9px}.dashboard-grid{display:grid;grid-template-columns:1.5fr .9fr;gap:20px;margin-bottom:20px}.dashboard-grid.lower{grid-template-columns:1.5fr .9fr}
.card,.panel{background:#fff;border:1px solid #e4e8ee;border-radius:11px;box-shadow:0 3px 14px rgba(15,23,42,.035)}
.panel{overflow:hidden}.panel-header{height:61px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #edf0f3}.panel-header h2{margin:0;font-size:17px}
.outline-button{background:#fff;border:1px solid #d8dee6;color:#334155;border-radius:6px;height:32px;padding:0 12px;font-size:11px}.outline-button:hover{border-color:#159447;color:#159447}
.table-wrap{width:100%;overflow-x:auto}
table{width:100%;border-collapse:collapse}th{background:#fafbfc;color:#374151;font-size:11px;font-weight:700;text-align:left;padding:13px 15px;border-bottom:1px solid #e8ebef;white-space:nowrap}td{padding:14px 15px;font-size:11px;border-bottom:1px solid #edf0f3;color:#344054;white-space:nowrap}tr:last-child td{border-bottom:0}.clickable-row{cursor:pointer}.clickable-row:hover{background:#f9fbfa}.strong-cell{font-weight:700;color:#172033}.hash-cell{font-family:monospace;color:#2563eb}
.view-button{height:30px;border:0;border-radius:5px;background:#087c42;color:#fff;padding:0 13px;font-size:11px;font-weight:600}.view-button:hover{background:#056b38}.view-button.full{width:100%;margin-top:15px}
.request-mini-list{padding:4px 17px}.mini-request{display:flex;align-items:center;gap:10px;padding:13px 0;border-bottom:1px solid #edf0f3}.mini-request:last-child{border-bottom:0}.buyer-avatar{width:38px;height:38px;border-radius:50%;background:#8b5cf6;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;flex:none}.mini-request-main{display:flex;flex-direction:column;flex:1;min-width:0}.mini-request-main strong{font-size:12px}.mini-request-main span{font-size:10px;color:#687386;margin-top:3px}
.notification-mini-list{padding:6px 17px}.notification-mini{display:flex;gap:10px;padding:12px 0;border-bottom:1px solid #edf0f3}.notification-mini:last-child{border-bottom:0}.notification-mini-icon{width:31px;height:31px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e7f3ff;color:#2563eb;font-weight:800;flex:none}.notification-mini-icon.success{background:#e3f8e9;color:#15803d}.notification-mini-icon.error{background:#ffe5e5;color:#b42318}.notification-mini strong{font-size:12px}.notification-mini p{margin:3px 0;font-size:10px;color:#687386;line-height:1.45}.notification-mini span{font-size:9px;color:#98a2b3}
.page-toolbar{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:18px}.page-toolbar-actions-only{justify-content:flex-end;margin-top:-8px}.page-toolbar h2{margin:0;font-size:18px}.page-toolbar p{margin:5px 0 0;color:#687386;font-size:13px}
.primary-button,.secondary-button,.danger-button{border-radius:7px;height:38px;padding:0 15px;border:1px solid transparent;font-size:12px;font-weight:700}.primary-button{background:#087c42;color:#fff}.primary-button:hover{background:#056b38}.secondary-button{background:#fff;border-color:#d6dde5;color:#344054}.secondary-button:hover{border-color:#087c42;color:#087c42}.danger-button{background:#fff;border-color:#f2b8b5;color:#b42318}.danger-button:hover{background:#fff4f2}
.filter-tabs{display:flex;gap:7px;margin-bottom:14px;flex-wrap:wrap}.filter-tab{border:1px solid #d8dee6;background:#fff;border-radius:18px;padding:7px 13px;font-size:11px;color:#475467}.filter-tab.active{background:#e8f7ee;border-color:#a8dfbc;color:#087c42;font-weight:700}
.status-badge{display:inline-flex;align-items:center;justify-content:center;min-height:25px;padding:4px 9px;border-radius:6px;font-size:9px;font-weight:800;white-space:nowrap}.status-badge.pending{background:#fff6dc;border:1px solid #f5d58a;color:#a15c00}.status-badge.verified{background:#e4f8e9;border:1px solid #b8e9c4;color:#15803d}.status-badge.rejected{background:#ffe8e7;border:1px solid #f6b6b4;color:#b42318}.status-badge.listed{background:#e6f0ff;border:1px solid #b8d0ff;color:#2563eb}.status-badge.sold{background:#f0e8ff;border:1px solid #d9c4ff;color:#6d28d9}
.state-box{padding:48px;text-align:center;color:#667085;font-size:13px;margin-bottom:18px}.error-state{color:#b42318}.error-state p{margin:8px 0;color:#b42318}.error-state small{color:#667085}
.empty-box{padding:55px 25px;text-align:center;margin-bottom:18px}.empty-box.compact{padding:32px 20px}.empty-icon{width:50px;height:50px;border-radius:50%;background:#edf7f0;color:#159447;display:flex;align-items:center;justify-content:center;margin:0 auto 13px;font-size:22px;font-weight:800}.empty-box h3{margin:0;font-size:15px}.empty-box p{max-width:500px;margin:8px auto 17px;color:#667085;font-size:12px;line-height:1.6}
.profile-layout{display:flex;flex-direction:column;gap:18px}.profile-hero{overflow:hidden}.profile-cover{height:105px;background:linear-gradient(135deg,#004434,#1e9d5b)}.profile-hero-body{display:flex;align-items:center;gap:16px;padding:0 24px 23px;margin-top:-32px}.profile-avatar-large{width:76px;height:76px;border-radius:50%;background:#fff;border:5px solid #fff;box-shadow:0 4px 15px rgba(0,0,0,.1);display:flex;align-items:center;justify-content:center;color:#159447;font-size:28px;font-weight:800}.profile-name-area{padding-top:35px;flex:1}.profile-name-area h2{margin:0;font-size:20px}.profile-name-area p{margin:4px 0 8px;color:#667085;font-size:12px}.profile-hero-actions{padding-top:35px;display:flex;gap:8px}.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.card{padding:20px}.card-title{margin-bottom:18px}.card-title h2{margin:0;font-size:16px}.card-title p{margin:5px 0 0;color:#667085;font-size:11px;line-height:1.5}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}.info-item{padding:12px 0;border-bottom:1px solid #edf0f3;min-width:0}.info-item.wide{grid-column:1/-1}.info-item span{display:block;color:#7a8494;font-size:10px;margin-bottom:4px}.info-item strong{display:block;color:#273142;font-size:12px;overflow-wrap:anywhere}.mono{font-family:monospace;font-size:11px!important}.security-note{margin-top:15px;padding:11px;border-radius:7px;background:#f1f8f4;color:#087c42;display:flex;flex-direction:column;gap:3px;font-size:11px}.security-note span{color:#667085}.verification-list{display:flex;flex-direction:column}.verification-line{display:flex;justify-content:space-between;align-items:center;padding:13px 0;border-bottom:1px solid #edf0f3;font-size:12px}.form-card-large{max-width:1050px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px}.field{display:flex;flex-direction:column;gap:7px}.field.full-field{grid-column:1/-1}.field>span{font-size:11px;font-weight:700;color:#344054}.field input,.field textarea,.field select{width:100%;border:1px solid #d8dee6;border-radius:7px;background:#fff;color:#172033;outline:none;padding:10px 11px;font-size:12px}.field input,.field select{height:40px}.field textarea{resize:vertical;min-height:90px}.field input:focus,.field textarea:focus,.field select:focus{border-color:#159447;box-shadow:0 0 0 3px rgba(21,148,71,.08)}.field input:disabled{background:#f3f5f7;color:#8a94a4}
.form-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:20px;flex-wrap:wrap}.backend-note{margin-top:16px;padding:11px 12px;background:#f8fafc;border:1px dashed #cfd8e3;border-radius:7px;color:#667085;font-size:10px;line-height:1.55}
.registration-page{display:flex;flex-direction:column;gap:16px}.verification-banner{display:flex;gap:12px;align-items:flex-start;background:#eef8f1;border:1px solid #bce2c6;border-radius:10px;padding:14px 16px}.banner-icon{width:32px;height:32px;border-radius:50%;background:#d9f4e0;color:#15803d;display:flex;align-items:center;justify-content:center;font-weight:900;flex:none}.verification-banner strong{font-size:12px;color:#14532d}.verification-banner p{margin:4px 0 0;color:#4b6355;font-size:11px}.registration-card{padding:22px}.owner-list{display:flex;flex-direction:column;gap:10px;margin-top:18px}.owner-row{display:grid;grid-template-columns:32px 1fr;gap:10px;align-items:end}.owner-index{width:32px;height:32px;border-radius:50%;background:#edf7f0;color:#087c42;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;margin-bottom:4px}.info-callout{margin-top:17px;background:#f3f8f5;border:1px solid #d9eae0;border-radius:8px;padding:12px 13px;color:#475467}.info-callout strong{font-size:11px;color:#14532d}.info-callout p{font-size:10px;line-height:1.55;margin:5px 0 0}.info-callout.warning{background:#fffaf0;border-color:#f3dfae}.info-callout.warning strong{color:#92400e}.document-checklist{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:16px}.document-requirement{border:1px solid #e1e7ed;border-radius:8px;padding:10px 11px;display:grid;grid-template-columns:24px 1fr;gap:2px 8px;align-items:center}.document-requirement>span{grid-row:1/3;width:23px;height:23px;border-radius:50%;background:#e5f7ea;color:#15803d;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900}.document-requirement strong{font-size:10px;color:#344054}.document-requirement small{font-size:9px;color:#98a2b3}.image-upload-info{display:flex;align-items:center;gap:12px;padding:13px;border:1px solid #e1e7ed;border-radius:9px;background:#fafdfb;margin-bottom:14px}.image-upload-icon{width:42px;height:42px;border-radius:9px;background:#e7f7ee;color:#159447;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;flex:none}.image-upload-info strong{display:block;font-size:12px;color:#344054}.image-upload-info p{margin:3px 0;font-size:10px;color:#667085}.image-upload-info small{font-size:9px;color:#98a2b3}.image-file-drop{border:1.5px dashed #b9c8c0;border-radius:10px;min-height:125px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;background:#fbfdfc;text-align:center;padding:16px;cursor:pointer}.image-file-drop:hover{border-color:#159447;background:#f4fbf6}.image-file-drop input{display:none}.image-upload-plus{width:38px;height:38px;border-radius:50%;background:#e7f7ee;color:#159447;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700}.image-file-drop strong{font-size:12px;color:#344054}.image-file-drop small{font-size:10px;color:#98a2b3}.land-image-preview-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:15px}.land-image-preview{position:relative;height:145px;border-radius:9px;overflow:hidden;border:1px solid #e1e7ed;background:#f5f7f9}.land-image-preview img{width:100%;height:100%;object-fit:cover;display:block}.land-image-number{position:absolute;left:7px;bottom:7px;background:rgba(0,0,0,.65);color:#fff;padding:4px 7px;border-radius:5px;font-size:9px;font-weight:700}.file-drop{border:1.5px dashed #b9c8c0;border-radius:10px;min-height:135px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;background:#fbfdfc;text-align:center;padding:16px;cursor:pointer}.file-drop:hover{border-color:#159447;background:#f4fbf6}.file-drop input{display:none}.file-drop-icon{width:38px;height:38px;border-radius:50%;background:#e7f7ee;color:#159447;display:flex;align-items:center;justify-content:center;font-size:18px}.file-drop strong{font-size:12px;color:#344054;overflow-wrap:anywhere}.file-drop small{font-size:10px;color:#98a2b3}.wallet-inline{display:flex;align-items:center;gap:12px;padding:13px;border:1px solid #e2e8ee;border-radius:8px;background:#fafcfd}.wallet-inline-icon{width:38px;height:38px;border-radius:50%;background:#eaf1ff;color:#2563eb;display:flex;align-items:center;justify-content:center}.wallet-inline div:last-child{display:flex;flex-direction:column;gap:4px;min-width:0}.wallet-inline span{font-size:10px;color:#667085}.wallet-inline strong{font-size:11px;overflow-wrap:anywhere}.process-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:17px}.process-step{border:1px solid #e1e7ed;border-radius:8px;padding:12px;display:flex;gap:9px}.process-step.active{border-color:#a8dfbc;background:#f4fbf6}.process-number{width:25px;height:25px;border-radius:50%;background:#edf2f5;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#475467;flex:none}.process-step.active .process-number{background:#159447;color:#fff}.process-step strong{display:block;font-size:10px}.process-step span{display:block;color:#667085;font-size:9px;line-height:1.45;margin-top:3px}.sticky-actions{position:sticky;bottom:10px;background:#fff;border:1px solid #e2e8ee;border-radius:9px;padding:11px;box-shadow:0 8px 25px rgba(15,23,42,.08);z-index:5}.blockchain-action{margin-top:18px;padding:14px;border:1px solid #bce2c6;border-radius:9px;background:#f4fbf6;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}.blockchain-action strong{display:block;font-size:12px;color:#14532d}.blockchain-action p{margin:4px 0 0;color:#667085;font-size:10px;line-height:1.5}.blockchain-action .alert{grid-column:1/-1;margin:0}
.alert{padding:11px 13px;border-radius:8px;font-size:11px;font-weight:600}.alert.error{background:#fff0ef;border:1px solid #f2c2bf;color:#b42318}.alert.success{background:#edf9f0;border:1px solid #b9e4c3;color:#15803d}
.detail-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.eyebrow{font-size:9px;letter-spacing:1px;color:#98a2b3;font-weight:800}.detail-top h2{margin:4px 0 3px;font-size:22px}.detail-top p{margin:0;color:#667085;font-size:12px}.details-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:18px}.details-image-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px}.details-image{position:relative;height:170px;border-radius:9px;overflow:hidden;border:1px solid #e2e8ee;background:#f5f7f9}.details-image img{width:100%;height:100%;object-fit:cover}.details-image span{position:absolute;left:8px;bottom:8px;background:rgba(0,0,0,.65);color:#fff;padding:5px 8px;border-radius:5px;font-size:9px}
.full-width{grid-column:1/-1}.owner-detail-list{display:flex;flex-direction:column;gap:9px;margin-bottom:12px}.owner-detail{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #e8edf1;border-radius:8px}.owner-number{width:28px;height:28px;border-radius:50%;background:#e8f7ee;color:#087c42;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800}.owner-detail strong{display:block;font-size:11px}.owner-detail span{display:block;font-size:9px;color:#98a2b3;margin-top:3px}.document-package-head{display:flex;align-items:center;gap:10px;padding:11px;border:1px solid #e1e7ed;border-radius:8px;background:#fafcfd;margin-bottom:10px}.document-package-icon{width:36px;height:30px;border-radius:6px;background:#fff0ef;color:#b42318;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;flex:none}.document-package-main{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}.document-package-main strong{font-size:10px;overflow-wrap:anywhere}.document-package-main span{font-size:9px;color:#98a2b3}.document-view-button{font-size:9px;font-weight:700;color:#087c42;border:1px solid #a8dfbc;background:#f4fbf6;border-radius:6px;padding:7px 9px;text-decoration:none;white-space:nowrap}.document-view-disabled{font-size:9px;color:#98a2b3;white-space:nowrap}.document-note{margin-top:12px;padding:10px 11px;background:#fffaf0;border:1px solid #f3dfae;border-radius:7px;color:#667085;font-size:9px;line-height:1.55}.document-note strong{color:#92400e}.document-status-list{display:flex;flex-direction:column}.document-status{display:grid;grid-template-columns:38px 1fr auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #edf0f3}.document-status:last-child{border-bottom:0}.document-icon{width:34px;height:28px;border-radius:6px;background:#fff0ef;color:#b42318;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800}.document-status strong{display:block;font-size:10px}.document-status div span{display:block;color:#98a2b3;font-size:9px;margin-top:2px;overflow-wrap:anywhere}.rejection-box{margin-top:14px;background:#fff3f2;border:1px solid #f5c4c0;border-radius:8px;padding:10px}.rejection-box strong{font-size:10px;color:#b42318}.rejection-box p{font-size:10px;color:#667085;margin:4px 0 0}.blockchain-detail{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.blockchain-stat{border:1px solid #e2e8ee;border-radius:8px;padding:12px}.blockchain-stat span{display:block;color:#98a2b3;font-size:9px}.blockchain-stat strong{display:block;margin-top:5px;font-size:10px;overflow-wrap:anywhere}.property-card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.property-card{background:#fff;border:1px solid #e3e8ed;border-radius:11px;padding:17px;box-shadow:0 3px 12px rgba(15,23,42,.035)}.property-card-header{display:flex;justify-content:space-between;gap:10px}.property-card h3{margin:4px 0 0;font-size:16px}.property-card>p{color:#667085;font-size:11px;margin:12px 0}.property-card-meta{display:flex;justify-content:space-between;border-top:1px solid #edf0f3;padding-top:12px;font-size:9px;color:#98a2b3}.property-card-meta strong{display:block;color:#344054;font-size:11px;margin-top:3px}.request-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.request-card{padding:18px}.request-head{display:flex;align-items:center;gap:10px}.request-head.large{padding-bottom:18px;border-bottom:1px solid #edf0f3;margin-bottom:16px}.request-head>div:nth-child(2){flex:1}.request-head h3,.request-head h2{margin:0;font-size:15px}.request-head p{margin:4px 0 0;color:#667085;font-size:10px}.buyer-avatar.large{width:52px;height:52px;font-size:18px}.request-grid-info{display:grid;grid-template-columns:1fr 1fr;gap:0 18px;margin-top:12px}.request-grid-info .info-item:last-child{grid-column:1/-1}.table-back{margin-top:15px}.transaction-status{display:flex;gap:13px;align-items:center;padding:15px;border-radius:8px;background:#f2faf4;margin-bottom:18px}.success-circle{width:42px;height:42px;border-radius:50%;background:#dff6e6;color:#15803d;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900}.transaction-status h2{margin:0;font-size:15px}.transaction-status p{margin:4px 0 0;color:#667085;font-size:10px}.hash-box{margin:18px 0;padding:13px;border-radius:8px;background:#f7f9fb;border:1px solid #e2e8ee}.hash-box span{display:block;font-size:9px;color:#98a2b3}.hash-box strong{display:block;font-family:monospace;color:#2563eb;font-size:11px;margin-top:5px;overflow-wrap:anywhere}.timeline{padding:23px}.timeline-row{display:flex;gap:14px;position:relative;padding:0 0 24px}.timeline-row:last-child{padding-bottom:0}.timeline-row:not(:last-child):after{content:"";position:absolute;left:12px;top:25px;bottom:0;width:1px;background:#dfe6e2}.timeline-dot{width:25px;height:25px;border-radius:50%;background:#159447;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;z-index:1;flex:none}.timeline-row h3{margin:0;font-size:13px}.timeline-row span{display:inline-block;margin-top:3px;color:#087c42;font-size:9px;font-weight:700}.timeline-row p{margin:6px 0;color:#667085;font-size:10px}.timeline-row small{font-size:9px;color:#98a2b3}.wallet-card-large{text-align:center;max-width:760px;margin-bottom:16px}.wallet-big-icon{width:65px;height:65px;border-radius:50%;background:#eaf1ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 14px}.wallet-card-large h2{margin:0;font-size:20px}.wallet-card-large>p{max-width:520px;margin:8px auto 18px;color:#667085;font-size:11px;line-height:1.6}.wallet-verification-section{max-width:760px}.wallet-verification-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.wallet-verification-card{padding:18px;min-height:205px;display:flex;flex-direction:column}.wallet-verification-icon{width:42px;height:42px;border-radius:10px;background:#eaf1ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;margin-bottom:12px}.wallet-verification-icon.admin{background:#e8f7ee;color:#087c42}.wallet-verification-content{flex:1}.wallet-verification-card h3{margin:0;font-size:14px}.wallet-verification-card p{margin:6px 0 14px;color:#667085;font-size:10px;line-height:1.5}.wallet-verification-status{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid #edf0f3;padding-top:11px}.wallet-verification-status span{font-size:9px;color:#98a2b3}.wallet-verification-card small{display:block;margin-top:8px;color:#667085;font-size:9px;line-height:1.45}.wallet-verification-button{margin-top:14px;width:100%}.wallet-verification-error{max-width:760px;margin-top:12px}
.wallet-address-box{font-family:monospace;background:#f7f9fb;border:1px solid #e2e8ee;border-radius:8px;padding:13px;font-size:11px;overflow-wrap:anywhere;margin-bottom:13px}.blockchain-summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:17px}.chain-card{background:#fff;border:1px solid #e3e8ed;border-radius:10px;padding:17px}.chain-card span{display:block;color:#98a2b3;font-size:9px}.chain-card strong{display:block;margin-top:5px;font-size:13px;overflow-wrap:anywhere}.notification-list{display:flex;flex-direction:column;gap:12px;margin-bottom:16px}.notification-row{display:flex;gap:13px;align-items:flex-start}.notification-icon{width:38px;height:38px;border-radius:50%;background:#e7f3ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:900;flex:none}.notification-icon.success{background:#e3f8e9;color:#15803d}.notification-icon.error{background:#ffe5e5;color:#b42318}.notification-row h3{margin:0;font-size:13px}.notification-row p{margin:5px 0;color:#667085;font-size:11px;line-height:1.5}.notification-row span{font-size:9px;color:#98a2b3}.help-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.help-card{text-align:left;border:1px solid #e4e8ee;padding:18px;transition:.2s}.help-card:hover{border-color:#a8dfbc;transform:translateY(-1px)}.help-icon{width:38px;height:38px;border-radius:9px;background:#e8f7ee;color:#087c42;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px}.help-card h3{font-size:14px;margin:12px 0 5px}.help-card p{font-size:10px;color:#667085;line-height:1.55;margin:0 0 10px}.help-card>span{font-size:10px;color:#087c42;font-weight:800}.support-card{margin-top:18px}.support-card h2{font-size:15px;margin:0}.support-card p{font-size:11px;color:#667085;line-height:1.6}
.status-bar-chart{width:100%;padding:8px 0 0}.bar-chart-area{display:flex;min-height:250px}.bar-chart-y-axis{width:34px;display:flex;flex-direction:column;justify-content:space-between;padding:4px 7px 34px 0;box-sizing:border-box}.bar-chart-y-axis span{font-size:10px;color:#98a2b3;text-align:right;line-height:1}.bar-chart-plot{position:relative;flex:1;min-width:0;padding:4px 8px 0}.bar-chart-grid{position:absolute;inset:4px 8px 34px 0;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none}.bar-chart-grid span{height:1px;background:#e7edf0;width:100%}.vertical-status-bars{position:relative;height:100%;min-height:250px;display:grid;grid-template-columns:repeat(5,minmax(52px,1fr));gap:20px;align-items:end;padding:0 18px 0 8px;box-sizing:border-box}.vertical-status-item{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;position:relative;z-index:1}.vertical-bar-value{height:18px;flex:none;font-size:11px;font-weight:800;color:#172033;margin-bottom:5px}.vertical-bar-track{width:min(72px,72%);height:190px;display:flex;align-items:flex-end;justify-content:center;background:transparent;border-radius:7px 7px 0 0;overflow:hidden}.vertical-bar-fill{width:100%;border-radius:7px 7px 0 0;transition:height .3s ease}.vertical-bar-fill.verified{background:#159447}.vertical-bar-fill.pending{background:#e9a21a}.vertical-bar-fill.listed{background:#3b82f6}.vertical-bar-fill.sold{background:#7c3aed}.vertical-bar-fill.rejected{background:#dc4b45}.vertical-bar-label{height:28px;display:flex;align-items:flex-end;justify-content:center;font-size:10px;color:#667085;text-align:center;white-space:nowrap}.bar-chart-legend{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin:3px 8px 0;padding-top:12px;border-top:1px solid #e7edf0}.bar-chart-legend span{display:inline-flex;align-items:center;gap:6px;font-size:9px;color:#667085}.legend-dot{width:8px;height:8px;border-radius:50%;display:inline-block}.legend-dot.verified{background:#159447}.legend-dot.pending{background:#e9a21a}.legend-dot.listed{background:#3b82f6}.legend-dot.sold{background:#7c3aed}.legend-dot.rejected{background:#dc4b45}.listing-info-banner{display:flex;align-items:flex-start;gap:13px;margin-bottom:17px}.listing-banner-icon{width:42px;height:42px;border-radius:10px;background:#e8f7ee;color:#087c42;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;flex:none}.listing-info-banner h2{margin:0 0 4px;font-size:16px}.listing-info-banner p{margin:0 0 5px;color:#667085;font-size:10px}.listing-info-banner small{display:block;color:#98a2b3;font-size:9px;line-height:1.5}.listing-summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:17px}.listing-summary-grid .chain-card{margin:0}.document-view-button{font-family:inherit;cursor:pointer}.document-view-disabled{font-size:9px;color:#b42318;white-space:nowrap}@media(max-width:850px){.listing-summary-grid{grid-template-columns:1fr}}
@media(max-width:1200px){.details-image-grid{grid-template-columns:repeat(3,1fr)}.land-image-preview-grid{grid-template-columns:repeat(3,1fr)}.stats-grid{grid-template-columns:repeat(3,1fr)}.dashboard-grid,.dashboard-grid.lower,.details-grid{grid-template-columns:1fr}.profile-grid{grid-template-columns:1fr}.property-card-grid{grid-template-columns:repeat(2,1fr)}.process-steps{grid-template-columns:repeat(2,1fr)}.blockchain-detail{grid-template-columns:1fr 1fr}}
@media(max-width:850px){.details-image-grid,.land-image-preview-grid{grid-template-columns:repeat(2,1fr)}.seller-sidebar{width:78px}.seller-sidebar:not(.collapsed){width:250px}.seller-main,.seller-main.expanded{margin-left:78px;width:calc(100% - 78px)}.stats-grid{grid-template-columns:repeat(2,1fr)}.form-grid,.document-checklist,.help-grid,.request-grid,.property-card-grid{grid-template-columns:1fr}.top-profile-text{display:none}.seller-content{padding:18px}.profile-hero-body{align-items:flex-start;flex-wrap:wrap}.profile-name-area{padding-top:35px}.profile-hero-actions{width:100%;padding-top:0}.info-grid{grid-template-columns:1fr}.info-item.wide{grid-column:auto}.blockchain-summary-grid{grid-template-columns:1fr}.blockchain-detail{grid-template-columns:1fr}}
@media(max-width:560px){.details-image-grid,.land-image-preview-grid{grid-template-columns:1fr}.stats-grid{grid-template-columns:1fr}.welcome-row{flex-direction:column}.verification-chip{white-space:normal}.top-divider{margin:0 6px}.seller-topbar{padding:0 12px}.page-toolbar{align-items:flex-start;flex-direction:column}.form-actions{justify-content:stretch}.form-actions button{flex:1}.owner-row{grid-template-columns:28px 1fr}}
`;

export {
  getLandId,
  getStatus,
  getSurveyNumber,
  getLocation,
  getOwnerNames,
  getOwnerCount,
  formatPrice,
  formatArea
};
