
import React, { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

const GANACHE_CHAIN_IDS = ["0x539", "0x169"];

const CSS = `
*{box-sizing:border-box}

.wallet-page{
  min-height:100%;
  width:100%;
}

.wallet-card-large{
  text-align:center;
  max-width:760px;
  margin:0 auto 16px;
  background:#fff;
  border:1px solid #e4e8ee;
  border-radius:11px;
  box-shadow:0 3px 14px rgba(15,23,42,.035);
  padding:24px;
}

.wallet-big-icon{
  width:65px;
  height:65px;
  border-radius:50%;
  background:#eaf1ff;
  color:#2563eb;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:28px;
  margin:0 auto 14px;
}

.wallet-card-large h2{
  margin:0;
  font-size:20px;
  color:#172033;
}

.wallet-card-large>p{
  max-width:540px;
  margin:8px auto 18px;
  color:#667085;
  font-size:11px;
  line-height:1.6;
}

.wallet-address-box{
  font-family:monospace;
  background:#f7f9fb;
  border:1px solid #e2e8ee;
  border-radius:8px;
  padding:13px;
  font-size:11px;
  overflow-wrap:anywhere;
  margin-bottom:13px;
  color:#172033;
}

.info-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:0 20px;
  text-align:left;
}

.info-item{
  padding:12px 0;
  border-bottom:1px solid #edf0f3;
  min-width:0;
}

.info-item span{
  display:block;
  color:#7a8494;
  font-size:10px;
  margin-bottom:4px;
}

.info-item strong{
  display:block;
  color:#273142;
  font-size:12px;
  overflow-wrap:anywhere;
}

.mono{
  font-family:monospace;
  font-size:11px!important;
}

.wallet-action-row{
  display:flex;
  justify-content:center;
  gap:9px;
  margin-top:20px;
  flex-wrap:wrap;
}

.primary-button,
.secondary-button,
.danger-button{
  border-radius:7px;
  height:38px;
  padding:0 15px;
  border:1px solid transparent;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
}

.primary-button{
  background:#087c42;
  color:#fff;
}

.primary-button:hover{
  background:#056b38;
}

.secondary-button{
  background:#fff;
  border-color:#d6dde5;
  color:#344054;
}

.secondary-button:hover{
  border-color:#087c42;
  color:#087c42;
}

.danger-button{
  background:#fff;
  border-color:#f2b8b5;
  color:#b42318;
}

.danger-button:hover{
  background:#fff4f2;
}

.wallet-info-note{
  margin-top:16px;
  padding:12px;
  background:#f8fafc;
  border:1px dashed #cfd8e3;
  border-radius:7px;
  color:#667085;
  font-size:10px;
  line-height:1.55;
  text-align:left;
  display:flex;
  flex-direction:column;
  gap:3px;
}

.wallet-info-note strong{
  color:#344054;
  font-size:10px;
}

.ganache-warning{
  margin-top:15px;
  padding:12px;
  background:#fff7e6;
  border:1px solid #f5d58a;
  border-radius:8px;
  color:#8a5a00;
  font-size:10px;
  line-height:1.55;
  text-align:left;
}

.ganache-success{
  margin-top:15px;
  padding:12px;
  background:#edf9f1;
  border:1px solid #b8e9c4;
  border-radius:8px;
  color:#166534;
  font-size:10px;
  line-height:1.55;
  text-align:left;
}

@media(max-width:850px){
  .wallet-card-large{
    max-width:100%;
  }

  .info-grid{
    grid-template-columns:1fr;
  }
}
`;

function readSavedBuyerWallet(){
  const address =
    localStorage.getItem("buyerWallet") || "";

  const network =
    localStorage.getItem("buyerWalletNetwork") || "";

  return {
    address,
    network
  };
}

function getNetworkName(chainId){
  const networks = {
    "1":"Ethereum Mainnet",
    "11155111":"Sepolia Testnet",
    "1337":"Ganache Local",
    "5777":"Ganache Local",
    "31337":"Hardhat Local"
  };

  return (
    networks[String(chainId)] ||
    `Chain ${chainId}`
  );
}

function isGanacheNetwork(chainId){
  const value =
    String(chainId).toLowerCase();

  return GANACHE_CHAIN_IDS.includes(value);
}

export default function BuyerWallet(){

  const saved =
    readSavedBuyerWallet();

  const [walletAddress,setWalletAddress] =
    useState(saved.address);

  const [walletNetwork,setWalletNetwork] =
    useState(saved.network);

  const [isGanache,setIsGanache] =
    useState(false);

  const [loading,setLoading] =
    useState(false);

  useEffect(() => {

    const loadWallet = async () => {

      if(!window.ethereum){
        return;
      }

      try{

        const provider =
          new BrowserProvider(
            window.ethereum
          );

        const network =
          await provider.getNetwork();

        const chainId =
          `0x${BigInt(network.chainId).toString(16)}`;

        setIsGanache(
          isGanacheNetwork(chainId)
        );

      }catch(error){

        console.error(
          "Buyer wallet network check error:",
          error
        );

      }

    };

    loadWallet();

  },[]);

  const connectWallet = async () => {

    if(!window.ethereum){

      alert(
        "MetaMask is not installed. Please install MetaMask first."
      );

      return;
    }

    const previousWallet =
      walletAddress;

    const previousNetwork =
      walletNetwork;

    try{

      setLoading(true);

      let accounts = [];

      try{

        await window.ethereum.request({
          method:"wallet_requestPermissions",
          params:[
            {
              eth_accounts:{}
            }
          ]
        });

        accounts =
          await window.ethereum.request({
            method:"eth_accounts"
          });

      }catch(permissionError){

        if(
          permissionError?.code === -32601 ||
          permissionError?.message
            ?.toLowerCase()
            .includes("method")
        ){

          accounts =
            await window.ethereum.request({
              method:"eth_requestAccounts"
            });

        }else{

          throw permissionError;

        }

      }

      if(
        !accounts ||
        accounts.length === 0
      ){

        throw new Error(
          "No MetaMask account was selected."
        );

      }

      const address =
        String(
          accounts[0] || ""
        ).trim();

      if(!address){

        throw new Error(
          "No MetaMask account was selected."
        );

      }

      const provider =
        new BrowserProvider(
          window.ethereum
        );

      const network =
        await provider.getNetwork();

      const chainId =
        `0x${BigInt(network.chainId).toString(16)}`;

      const networkName =
        getNetworkName(
          network.chainId.toString()
        );

      if(
        !isGanacheNetwork(chainId)
      ){

        setWalletAddress("");
        setWalletNetwork(networkName);
        setIsGanache(false);

        localStorage.removeItem(
          "buyerWallet"
        );

        localStorage.removeItem(
          "buyerWalletNetwork"
        );

        throw new Error(
          "Please switch MetaMask to Ganache Local before connecting the buyer wallet."
        );

      }

      setWalletAddress(address);
      setWalletNetwork(networkName);
      setIsGanache(true);

      localStorage.setItem(
        "buyerWallet",
        address
      );

      localStorage.setItem(
        "buyerWalletNetwork",
        networkName
      );

      alert(
        "Ganache buyer wallet connected successfully.\n\nWallet:\n" +
        address +
        "\n\nNow this wallet must be saved during Buyer Registration so Admin can verify it."
      );

    }catch(error){

      console.error(
        "Buyer MetaMask connection error:",
        error
      );

      if(
        error?.code === 4001 ||
        error?.info?.error?.code === 4001
      ){

        setWalletAddress(
          previousWallet
        );

        setWalletNetwork(
          previousNetwork
        );

        return;

      }

      if(error?.code === -32002){

        alert(
          "MetaMask is already processing a request. Open MetaMask and finish the pending request."
        );

        return;

      }

      alert(
        error?.message ||
        "Unable to connect MetaMask."
      );

    }finally{

      setLoading(false);

    }

  };

  const disconnectWallet = () => {

    setWalletAddress("");
    setWalletNetwork("");
    setIsGanache(false);

    localStorage.removeItem(
      "buyerWallet"
    );

    localStorage.removeItem(
      "buyerWalletNetwork"
    );

  };

  return(
    <>
      <style>{CSS}</style>

      <div className="wallet-page">

        <section className="card wallet-card-large">

          <div className="wallet-big-icon">
            ◈
          </div>

          <h2>
            {walletAddress
              ? "Buyer Wallet Connected"
              : "Connect Buyer Wallet"}
          </h2>

          <p>
            Connect the Ganache MetaMask account
            that will identify this buyer on the
            Land Registry blockchain.
          </p>

          {walletAddress ? (

            <>

              <div className="wallet-address-box">
                {walletAddress}
              </div>

              <div className="info-grid">

                <div className="info-item">

                  <span>
                    Network
                  </span>

                  <strong>
                    {walletNetwork || "Unknown"}
                  </strong>

                </div>

                <div className="info-item">

                  <span>
                    Wallet Address
                  </span>

                  <strong className="mono">
                    {walletAddress}
                  </strong>

                </div>

                <div className="info-item">

                  <span>
                    Role
                  </span>

                  <strong>
                    Buyer
                  </strong>

                </div>

                <div className="info-item">

                  <span>
                    Blockchain Network
                  </span>

                  <strong>
                    {isGanache
                      ? "Ganache Local"
                      : "Not Ganache"}
                  </strong>

                </div>

              </div>

              {isGanache ? (

                <div className="ganache-success">

                  <strong>
                    ✓ Ganache wallet ready
                  </strong>

                  <br />

                  This is the wallet that should
                  be stored in the buyer's database
                  record and registered on the
                  LandRegistry smart contract before
                  Admin verification.

                </div>

              ) : (

                <div className="ganache-warning">

                  <strong>
                    Ganache required
                  </strong>

                  <br />

                  Switch MetaMask to your Ganache
                  Local network before continuing.

                </div>

              )}

              <div className="wallet-action-row">

                <button
                  type="button"
                  className="danger-button"
                  onClick={disconnectWallet}
                  disabled={loading}
                >
                  Disconnect Wallet
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={connectWallet}
                  disabled={loading}
                >
                  {loading
                    ? "Connecting..."
                    : "Change Wallet"}
                </button>

              </div>

            </>

          ) : (

            <div className="wallet-action-row">

              <button
                type="button"
                className="primary-button"
                onClick={connectWallet}
                disabled={loading}
              >
                {loading
                  ? "Connecting..."
                  : "Connect Ganache MetaMask"}
              </button>

            </div>

          )}

          <div className="wallet-info-note">

            <strong>
              Important for Admin Verification
            </strong>

            <span>
              The wallet must be stored in the
              buyer's MySQL record. LocalStorage
              alone is not enough because the Admin
              module runs separately.
            </span>

          </div>

        </section>

      </div>
    </>
  );
}

export { getNetworkName };
