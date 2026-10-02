import React, { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

const CSS = `
*{box-sizing:border-box}
.wallet-page{min-height:100%;width:100%}
.wallet-card-large{text-align:center;max-width:760px;margin:0 auto 16px;background:#fff;border:1px solid #e4e8ee;border-radius:11px;box-shadow:0 3px 14px rgba(15,23,42,.035);padding:20px}
.wallet-big-icon{width:65px;height:65px;border-radius:50%;background:#eaf1ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 14px}
.wallet-card-large h2{margin:0;font-size:20px;color:#172033}
.wallet-card-large>p{max-width:520px;margin:8px auto 18px;color:#667085;font-size:11px;line-height:1.6}
.wallet-address-box{font-family:monospace;background:#f7f9fb;border:1px solid #e2e8ee;border-radius:8px;padding:13px;font-size:11px;overflow-wrap:anywhere;margin-bottom:13px;color:#172033}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 20px;text-align:left}
.info-item{padding:12px 0;border-bottom:1px solid #edf0f3;min-width:0}
.info-item span{display:block;color:#7a8494;font-size:10px;margin-bottom:4px}
.info-item strong{display:block;color:#273142;font-size:12px;overflow-wrap:anywhere}
.mono{font-family:monospace;font-size:11px!important}
.wallet-action-row{display:flex;justify-content:center;gap:9px;margin-top:20px;flex-wrap:wrap}
.primary-button,.secondary-button,.danger-button{border-radius:7px;height:38px;padding:0 15px;border:1px solid transparent;font-size:12px;font-weight:700;cursor:pointer;font:inherit}
.primary-button{background:#087c42;color:#fff}.primary-button:hover{background:#056b38}
.secondary-button{background:#fff;border-color:#d6dde5;color:#344054}.secondary-button:hover{border-color:#087c42;color:#087c42}
.danger-button{background:#fff;border-color:#f2b8b5;color:#b42318}.danger-button:hover{background:#fff4f2}
.wallet-info-note{margin-top:16px;padding:11px 12px;background:#f8fafc;border:1px dashed #cfd8e3;border-radius:7px;color:#667085;font-size:10px;line-height:1.55;text-align:left;display:flex;flex-direction:column;gap:3px}
.wallet-info-note strong{color:#344054;font-size:10px}
@media(max-width:850px){.wallet-card-large{max-width:100%}.info-grid{grid-template-columns:1fr}}
`;

export default function AdminWallet() {
  const [walletAddress, setWalletAddress] = useState(() => getSavedAddress("adminWallet"));
  const [walletNetwork, setWalletNetwork] = useState(() => getSavedNetwork("adminWallet", "adminWalletNetwork"));

  // Restore only the saved application state. This does not open MetaMask.
  useEffect(() => {
    const restoreWallet = async () => {
      const savedAddress = getSavedAddress("adminWallet");
      let savedNetwork = getSavedNetwork("adminWallet", "adminWalletNetwork");

      setWalletAddress(savedAddress);
      setWalletNetwork(savedNetwork);

      // If an older saved wallet did not have a separate network value,
      // read the current chain id without requesting account permission.
      if (savedAddress && !savedNetwork && window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: "eth_chainId" });
          savedNetwork = getNetworkName(parseInt(chainId, 16).toString());
          setWalletNetwork(savedNetwork);
          localStorage.setItem("adminWalletNetwork", savedNetwork);
        } catch (error) {
          console.error("Wallet network restore error:", error);
        }
      }
    };

    restoreWallet();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install MetaMask first.");
      return;
    }

    const previousWallet = walletAddress;
    const previousNetwork = walletNetwork;

    try {
      let accounts;

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
          permissionError?.message?.toLowerCase().includes("method")
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

      const address = String(accounts[0]);
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const networkName = getNetworkName(network.chainId.toString());

      // Store the address as a plain string, never as { address, network }.
      setWalletAddress(address);
      setWalletNetwork(networkName);
      localStorage.setItem("adminWallet", address);
      localStorage.setItem("adminWalletNetwork", networkName);
    } catch (error) {
      console.error("AdminWallet MetaMask connection error:", error);

      if (
        error?.code === 4001 ||
        error?.info?.error?.code === 4001
      ) {
        setWalletAddress(previousWallet);
        setWalletNetwork(previousNetwork);
        return;
      }

      if (error?.code === -32002) {
        alert("MetaMask is already processing a request. Open MetaMask and finish the pending request.");
        return;
      }

      alert(error?.message || "Unable to connect MetaMask.");
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    setWalletNetwork("");
    localStorage.removeItem("adminWallet");
    localStorage.removeItem("adminWalletNetwork");
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="wallet-page">
        <section className="card wallet-card-large">
          <div className="wallet-big-icon">◈</div>

          <h2>{walletAddress ? "Wallet Connected" : "Connect MetaMask"}</h2>

          <p>This is the public Ethereum-compatible address used by MetaMask for administrator blockchain transactions.</p>

          {walletAddress ? (
            <>
              <div className="wallet-address-box">{walletAddress}</div>

              <div className="info-grid">
                <div className="info-item">
                  <span>Network</span>
                  <strong>{walletNetwork || "Unknown"}</strong>
                </div>

                <div className="info-item">
                  <span>Address</span>
                  <strong className="mono">{walletAddress}</strong>
                </div>

                <div className="info-item">
                  <span>Role</span>
                  <strong>Administrator wallet</strong>
                </div>
              </div>

              <div className="wallet-action-row">
                <button type="button" className="danger-button" onClick={disconnectWallet}>
                  Disconnect Wallet
                </button>
                <button type="button" className="secondary-button" onClick={connectWallet}>
                  Change Wallet
                </button>
              </div>
            </>
          ) : (
            <div className="wallet-action-row">
              <button type="button" className="primary-button" onClick={connectWallet}>
                Connect MetaMask
              </button>
            </div>
          )}

          <div className="wallet-info-note">
            <strong>Administrator blockchain wallet</strong>
            <span>
              MetaMask opens only when you click Connect Wallet or Change Wallet. The connected wallet is restored when you return to this page.
            </span>
          </div>
        </section>
      </div>
    </>
  );
}

function getSavedAddress(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return "";

  // Supports both the new plain-address format and your old saved object format.
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object") return String(parsed.address || "");
  } catch {
    // Old value was already a plain address.
  }

  return raw.trim();
}

function getSavedNetwork(addressKey, networkKey) {
  const separate = localStorage.getItem(networkKey);
  if (separate) return separate;

  const raw = localStorage.getItem(addressKey);
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return String(parsed.network || "");
  } catch {
    // Plain address has no embedded network.
  }

  return "";
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

export { getNetworkName };
