import React, { useEffect, useState } from 'react';

const GANACHE_CHAIN_ID = '0x539';

const CONTRACT_ADDRESS =
  '0xFDa7dEEDCe65295dA889bFEC27019e2F896178ED';

const GANACHE_NETWORK = {
  chainId: GANACHE_CHAIN_ID,
  chainName: 'Ganache Local',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: [
    'http://127.0.0.1:7545'
  ]
};


// ============================================================
// WALLET PAGE
// ============================================================

export default function Wallet() {

  const [wallet, setWallet] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] =
    useState('Unknown Network');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [balance, setBalance] =
    useState(null);


  // ==========================================================
  // FORMAT ADDRESS
  // ==========================================================

  const shortAddress = (address) => {

    if (!address) {
      return '';
    }

    return (
      address.substring(0, 10) +
      '...' +
      address.substring(address.length - 8)
    );

  };


  // ==========================================================
  // NETWORK NAME
  // ==========================================================

  const getNetworkName = (id) => {

    if (!id) {
      return 'Unknown Network';
    }

    switch (id.toLowerCase()) {

      case '0x1':
        return 'Ethereum Mainnet';

      case '0xaa36a7':
        return 'Sepolia Testnet';

      case '0x539':
        return 'Ganache Local';

      case '0x7a69':
        return 'Hardhat Local';

      default:
        return `Unknown Network (${id})`;
    }

  };


  // ==========================================================
  // LOAD WALLET
  // ==========================================================

  const loadWallet = async () => {

    if (!window.ethereum) {
      setError('MetaMask is not installed.');
      return;
    }

    try {

      const accounts =
        await window.ethereum.request({
          method: 'eth_accounts'
        });

      const currentChainId =
        await window.ethereum.request({
          method: 'eth_chainId'
        });

      setChainId(currentChainId);

      setNetworkName(
        getNetworkName(currentChainId)
      );


      if (
        accounts &&
        accounts.length > 0
      ) {

        setWallet(accounts[0]);

        await loadBalance(accounts[0]);

      } else {

        setWallet(null);
        setBalance(null);

      }

    } catch (err) {

      console.error(
        'Load wallet error:',
        err
      );

    }

  };


  // ==========================================================
  // LOAD BALANCE
  // ==========================================================

  const loadBalance = async (address) => {

    if (!window.ethereum || !address) {
      return;
    }

    try {

      const balanceHex =
        await window.ethereum.request({
          method: 'eth_getBalance',
          params: [
            address,
            'latest'
          ]
        });

      const balanceWei =
        BigInt(balanceHex);

      const whole =
        balanceWei / 1000000000000000000n;

      const decimal =
        balanceWei % 1000000000000000000n;

      const decimalString =
        decimal
          .toString()
          .padStart(18, '0')
          .substring(0, 4);

      setBalance(
        `${whole}.${decimalString} ETH`
      );

    } catch (err) {

      console.error(
        'Balance error:',
        err
      );

      setBalance(null);

    }

  };


  // ==========================================================
  // ADD GANACHE
  // ==========================================================

  const addGanache = async () => {

    try {

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          GANACHE_NETWORK
        ]
      });

      return true;

    } catch (err) {

      console.error(
        'Add Ganache error:',
        err
      );

      throw err;

    }

  };


  // ==========================================================
  // SWITCH TO GANACHE
  // ==========================================================

  const switchToGanache = async () => {

    if (!window.ethereum) {
      throw new Error(
        'MetaMask is not installed.'
      );
    }

    try {

      await window.ethereum.request({
        method:
          'wallet_switchEthereumChain',

        params: [
          {
            chainId:
              GANACHE_CHAIN_ID
          }
        ]
      });

    } catch (switchError) {

      console.log(
        'Switch network result:',
        switchError
      );


      if (
        switchError.code === 4902
      ) {

        await addGanache();

      } else {

        throw switchError;

      }

    }


    const newChainId =
      await window.ethereum.request({
        method: 'eth_chainId'
      });

    setChainId(newChainId);

    setNetworkName(
      getNetworkName(newChainId)
    );

    return newChainId;

  };


  // ==========================================================
  // CONNECT METAMASK
  // ==========================================================

  const connectWallet = async () => {

    setLoading(true);
    setError('');
    setSuccess('');

    try {

      if (!window.ethereum) {

        throw new Error(
          'MetaMask is not installed. Please install MetaMask.'
        );

      }


      // ------------------------------------------------------
      // Switch to Ganache
      // ------------------------------------------------------

      await switchToGanache();


      // ------------------------------------------------------
      // Request account
      // ------------------------------------------------------

      const accounts =
        await window.ethereum.request({
          method:
            'eth_requestAccounts'
        });


      if (
        !accounts ||
        accounts.length === 0
      ) {

        throw new Error(
          'No MetaMask account selected.'
        );

      }


      const address =
        accounts[0];

      setWallet(address);

      await loadBalance(address);

      setSuccess(
        'MetaMask connected successfully.'
      );

    } catch (err) {

      console.error(
        'Connect wallet error:',
        err
      );

      setError(
        err?.message ||
        'Failed to connect MetaMask.'
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // CHANGE WALLET
  // ==========================================================

  const changeWallet = async () => {

    setLoading(true);
    setError('');
    setSuccess('');

    try {

      if (!window.ethereum) {

        throw new Error(
          'MetaMask is not installed.'
        );

      }


      // ------------------------------------------------------
      // First make sure Ganache is selected
      // ------------------------------------------------------

      await switchToGanache();


      // ------------------------------------------------------
      // Ask MetaMask to manage account permission
      // ------------------------------------------------------

      try {

        await window.ethereum.request({
          method:
            'wallet_requestPermissions',

          params: [
            {
              eth_accounts: {}
            }
          ]
        });

      } catch (permissionError) {

        console.log(
          'Permission request:',
          permissionError
        );

      }


      // ------------------------------------------------------
      // Get selected account
      // ------------------------------------------------------

      const accounts =
        await window.ethereum.request({
          method:
            'eth_accounts'
        });


      if (
        !accounts ||
        accounts.length === 0
      ) {

        throw new Error(
          'No MetaMask account is connected.'
        );

      }


      const address =
        accounts[0];

      setWallet(address);

      await loadBalance(address);

      setSuccess(
        'Wallet changed successfully.'
      );

    } catch (err) {

      console.error(
        'Change wallet error:',
        err
      );

      setError(
        err?.message ||
        'Failed to change wallet.'
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // COPY ADDRESS
  // ==========================================================

  const copyAddress = async () => {

    if (!wallet) {
      return;
    }

    try {

      await navigator.clipboard.writeText(
        wallet
      );

      setSuccess(
        'Wallet address copied.'
      );

      setTimeout(() => {
        setSuccess('');
      }, 2000);

    } catch (err) {

      console.error(
        'Copy error:',
        err
      );

    }

  };


  // ==========================================================
  // HANDLE ACCOUNT CHANGED
  // ==========================================================

  const handleAccountsChanged =
    async (accounts) => {

      if (
        !accounts ||
        accounts.length === 0
      ) {

        setWallet(null);
        setBalance(null);

        return;

      }

      const address =
        accounts[0];

      setWallet(address);

      await loadBalance(address);

    };


  // ==========================================================
  // HANDLE NETWORK CHANGED
  // ==========================================================

  const handleChainChanged =
    async (newChainId) => {

      setChainId(newChainId);

      setNetworkName(
        getNetworkName(newChainId)
      );

      if (wallet) {
        await loadBalance(wallet);
      }

    };


  // ==========================================================
  // INITIALIZE METAMASK
  // ==========================================================

  useEffect(() => {

    if (!window.ethereum) {
      setError(
        'MetaMask is not detected.'
      );

      return;
    }


    loadWallet();


    window.ethereum.on(
      'accountsChanged',
      handleAccountsChanged
    );

    window.ethereum.on(
      'chainChanged',
      handleChainChanged
    );


    return () => {

      if (!window.ethereum) {
        return;
      }

      window.ethereum.removeListener(
        'accountsChanged',
        handleAccountsChanged
      );

      window.ethereum.removeListener(
        'chainChanged',
        handleChainChanged
      );

    };

  }, []);


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div
      style={{
        minHeight: '100%',
        background: '#f5f7fb',
        padding: '0'
      }}
    >

      {/* ====================================================
          TOP
      ==================================================== */}

      <div
        style={{
          padding: '20px 30px 5px 30px'
        }}
      >

        <div
          style={{
            color: '#00834a',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '15px',
            cursor: 'pointer'
          }}
          onClick={() => window.history.back()}
        >
          ← Back
        </div>


        <h1
          style={{
            margin: 0,
            fontSize: '26px',
            fontWeight: '700',
            color: '#101828'
          }}
        >
          Wallet
        </h1>


        <p
          style={{
            marginTop: '8px',
            color: '#667085',
            fontSize: '14px'
          }}
        >
          Connect and inspect the MetaMask wallet
          used by the seller.
        </p>

      </div>


      {/* ====================================================
          ALERTS
      ==================================================== */}

      {error && (

        <div
          style={{
            margin:
              '10px 30px',
            padding:
              '12px 16px',
            background:
              '#fff1f0',
            border:
              '1px solid #ffccc7',
            color:
              '#cf1322',
            borderRadius:
              '8px',
            fontSize:
              '14px'
          }}
        >
          {error}
        </div>

      )}


      {success && (

        <div
          style={{
            margin:
              '10px 30px',
            padding:
              '12px 16px',
            background:
              '#f0fff4',
            border:
              '1px solid #b7ebc6',
            color:
              '#087443',
            borderRadius:
              '8px',
            fontSize:
              '14px'
          }}
        >
          {success}
        </div>

      )}


      {/* ====================================================
          WALLET CARD
      ==================================================== */}

      <div
        style={{
          margin:
            '25px 30px 40px 30px',
          background:
            '#ffffff',
          borderRadius:
            '12px',
          border:
            '1px solid #e4e7ec',
          boxShadow:
            '0 2px 8px rgba(16,24,40,0.04)',
          padding:
            '20px'
        }}
      >

        {/* --------------------------------------------------
            ICON
        -------------------------------------------------- */}

        <div
          style={{
            textAlign:
              'center',
            paddingTop:
              '5px'
          }}
        >

          <div
            style={{
              width:
                '64px',
              height:
                '64px',
              borderRadius:
                '50%',
              background:
                '#eef4ff',
              display:
                'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              margin:
                '0 auto 20px auto',
              fontSize:
                '30px'
            }}
          >
            ◇
          </div>


          {/* ------------------------------------------------
              CONNECTED
          ------------------------------------------------ */}

          {wallet ? (

            <>
              <h2
                style={{
                  margin:
                    '0 0 10px 0',
                  color:
                    '#101828',
                  fontSize:
                    '21px'
                }}
              >
                Wallet Connected
              </h2>

              <p
                style={{
                  margin:
                    '0 auto 20px auto',
                  color:
                    '#667085',
                  fontSize:
                    '13px',
                  maxWidth:
                    '600px'
                }}
              >
                This is the public Ethereum-compatible
                address used by MetaMask for seller-side
                blockchain transactions.
              </p>


              {/* ------------------------------------------
                  FULL ADDRESS
              ------------------------------------------ */}

              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  gap:
                    '10px',
                  background:
                    '#f8fafc',
                  border:
                    '1px solid #dfe4ea',
                  borderRadius:
                    '8px',
                  padding:
                    '13px',
                  margin:
                    '0 auto 25px auto',
                  maxWidth:
                    '720px',
                  wordBreak:
                    'break-all',
                  fontFamily:
                    'monospace',
                  fontSize:
                    '12px',
                  color:
                    '#344054'
                }}
              >

                <span>
                  {wallet}
                </span>

                <button
                  onClick={copyAddress}
                  style={{
                    border:
                      'none',
                    background:
                      'transparent',
                    cursor:
                      'pointer',
                    fontSize:
                      '16px'
                  }}
                  title="Copy address"
                >
                  📋
                </button>

              </div>


              {/* ------------------------------------------
                  INFORMATION
              ------------------------------------------ */}

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap:
                    '20px',
                  maxWidth:
                    '720px',
                  margin:
                    '0 auto'
                }}
              >

                <div
                  style={{
                    borderBottom:
                      '1px solid #eaecf0',
                    padding:
                      '0 0 18px 0'
                  }}
                >

                  <div
                    style={{
                      color:
                        '#98a2b3',
                      fontSize:
                        '12px',
                      marginBottom:
                        '8px'
                    }}
                  >
                    Network
                  </div>

                  <div
                    style={{
                      fontWeight:
                        '600',
                      color:
                        networkName ===
                        'Ganache Local'
                          ? '#087443'
                          : '#d92d20'
                    }}
                  >
                    {networkName}
                  </div>

                </div>


                <div
                  style={{
                    borderBottom:
                      '1px solid #eaecf0',
                    padding:
                      '0 0 18px 0'
                  }}
                >

                  <div
                    style={{
                      color:
                        '#98a2b3',
                      fontSize:
                        '12px',
                      marginBottom:
                        '8px'
                    }}
                  >
                    Address
                  </div>

                  <div
                    style={{
                      fontWeight:
                        '500',
                      color:
                        '#344054',
                      fontFamily:
                        'monospace',
                      fontSize:
                        '12px'
                    }}
                  >
                    {shortAddress(wallet)}
                  </div>

                </div>


                <div
                  style={{
                    borderBottom:
                      '1px solid #eaecf0',
                    padding:
                      '0 0 18px 0'
                  }}
                >

                  <div
                    style={{
                      color:
                        '#98a2b3',
                      fontSize:
                        '12px',
                      marginBottom:
                        '8px'
                    }}
                  >
                    Role
                  </div>

                  <div
                    style={{
                      fontWeight:
                        '600',
                      color:
                        '#101828'
                    }}
                  >
                    Seller / Current Owner
                  </div>

                </div>


                <div
                  style={{
                    borderBottom:
                      '1px solid #eaecf0',
                    padding:
                      '0 0 18px 0'
                  }}
                >

                  <div
                    style={{
                      color:
                        '#98a2b3',
                      fontSize:
                        '12px',
                      marginBottom:
                        '8px'
                    }}
                  >
                    Balance
                  </div>

                  <div
                    style={{
                      fontWeight:
                        '600',
                      color:
                        '#101828'
                    }}
                  >
                    {balance || 'Loading...'}
                  </div>

                </div>

              </div>


              {/* ------------------------------------------
                  CONTRACT
              ------------------------------------------ */}

              <div
                style={{
                  maxWidth:
                    '720px',
                  margin:
                    '25px auto 0 auto',
                  padding:
                    '15px',
                  background:
                    '#f8fafc',
                  borderRadius:
                    '8px',
                  textAlign:
                    'left'
                }}
              >

                <div
                  style={{
                    fontSize:
                      '12px',
                    color:
                      '#98a2b3',
                    marginBottom:
                      '7px'
                  }}
                >
                  LandRegistry Contract
                </div>

                <div
                  style={{
                    fontFamily:
                      'monospace',
                    fontSize:
                      '12px',
                    color:
                      '#344054',
                    wordBreak:
                      'break-all'
                  }}
                >
                  {CONTRACT_ADDRESS}
                </div>

              </div>


              {/* ------------------------------------------
                  CHANGE WALLET
              ------------------------------------------ */}

              <button
                onClick={changeWallet}
                disabled={loading}
                style={{
                  marginTop:
                    '25px',
                  padding:
                    '11px 22px',
                  background:
                    '#ffffff',
                  color:
                    '#344054',
                  border:
                    '1px solid #d0d5dd',
                  borderRadius:
                    '8px',
                  cursor:
                    loading
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight:
                    '600',
                  opacity:
                    loading
                      ? 0.6
                      : 1
                }}
              >
                {loading
                  ? 'Connecting...'
                  : 'Change Wallet'}
              </button>

            </>

          ) : (

            /* =================================================
               NOT CONNECTED
            ================================================= */

            <>

              <h2
                style={{
                  margin:
                    '0 0 10px 0',
                  color:
                    '#101828',
                  fontSize:
                    '21px'
                }}
              >
                Connect MetaMask
              </h2>


              <p
                style={{
                  margin:
                    '0 auto 25px auto',
                  color:
                    '#667085',
                  fontSize:
                    '13px',
                  maxWidth:
                    '600px'
                }}
              >
                Connect the seller's MetaMask wallet
                to perform blockchain transactions.
              </p>


              <button
                onClick={connectWallet}
                disabled={loading}
                style={{
                  padding:
                    '12px 25px',
                  background:
                    '#07883f',
                  color:
                    '#ffffff',
                  border:
                    'none',
                  borderRadius:
                    '8px',
                  cursor:
                    loading
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight:
                    '600',
                  fontSize:
                    '14px',
                  opacity:
                    loading
                      ? 0.6
                      : 1
                }}
              >
                {loading
                  ? 'Connecting...'
                  : 'Connect MetaMask'}
              </button>

            </>

          )}

        </div>

      </div>

    </div>

  );

}