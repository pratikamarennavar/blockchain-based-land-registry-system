import { ethers } from 'ethers';
import LandRegistry from './LandRegistry.json';

// ============================================================
// DEPLOYED CONTRACT
// ============================================================

export const CONTRACT_ADDRESS =
  import.meta.env.VITE_LAND_REGISTRY_ADDRESS ||
  '0xFDa7dEEDCe65295dA889bFEC27019e2F896178ED';


// ============================================================
// NETWORK
// ============================================================

export const getNetworkName = (chainId) => {
  const id = String(chainId).toLowerCase();

  const networks = {
    '0x1': 'Ethereum Mainnet',
    '0xaa36a7': 'Sepolia',
    '0x539': 'Ganache Local',
    '0x169': 'Ganache Local',
    '0x7a69': 'Hardhat Local',

    '1': 'Ethereum Mainnet',
    '11155111': 'Sepolia',
    '1337': 'Ganache Local',
    '5777': 'Ganache Local',
    '31337': 'Hardhat Local'
  };

  return networks[id] || `Chain ${chainId}`;
};


// ============================================================
// METAMASK CHECK
// ============================================================

const checkMetaMask = () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed.');
  }
};


// ============================================================
// PROVIDER
// ============================================================

export const getProvider = () => {
  checkMetaMask();

  return new ethers.BrowserProvider(
    window.ethereum
  );
};


// ============================================================
// CONNECT WALLET
// ============================================================

export const connectWallet = async () => {
  checkMetaMask();

  const accounts =
    await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

  if (!accounts || accounts.length === 0) {
    throw new Error('No MetaMask account found.');
  }

  return accounts[0];
};


// ============================================================
// CURRENT WALLET
// ============================================================

export const getCurrentWallet = async () => {
  checkMetaMask();

  const accounts =
    await window.ethereum.request({
      method: 'eth_accounts'
    });

  if (!accounts || accounts.length === 0) {
    return null;
  }

  return accounts[0];
};


// ============================================================
// SIGNER
// ============================================================

export const getSigner = async () => {
  const provider = getProvider();

  await provider.send(
    'eth_requestAccounts',
    []
  );

  return await provider.getSigner();
};


// ============================================================
// NETWORK INFORMATION
// ============================================================

export const getNetworkInfo = async () => {
  const provider = getProvider();

  const network =
    await provider.getNetwork();

  const chainId =
    network.chainId.toString();

  return {
    chainId,
    chainIdHex:
      '0x' + BigInt(chainId).toString(16),
    networkName:
      getNetworkName(chainId)
  };
};


// ============================================================
// WRITE CONTRACT
// ============================================================

export const getContract = async () => {
  const signer =
    await getSigner();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    LandRegistry.abi,
    signer
  );
};


// ============================================================
// READ-ONLY CONTRACT
// ============================================================

export const getReadOnlyContract = () => {
  const provider =
    getProvider();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    LandRegistry.abi,
    provider
  );
};


// ============================================================
// COMPLETE BLOCKCHAIN CONTEXT
// ============================================================

export const getBlockchainContext =
  async () => {

    const provider =
      getProvider();

    const signer =
      await getSigner();

    const walletAddress =
      await signer.getAddress();

    const network =
      await provider.getNetwork();

    const chainId =
      network.chainId.toString();

    return {
      provider,
      signer,
      walletAddress,
      chainId,
      chainIdHex:
        '0x' + BigInt(chainId).toString(16),
      networkName:
        getNetworkName(chainId),
      contractAddress:
        CONTRACT_ADDRESS
    };
  };


// ============================================================
// BLOCKCHAIN USER REGISTRATION
// ============================================================

export const registerBlockchainUser =
  async (name, email) => {

    if (!name) {
      throw new Error(
        'Name is required for blockchain registration.'
      );
    }

    if (!email) {
      throw new Error(
        'Email is required for blockchain registration.'
      );
    }

    const context =
      await getBlockchainContext();

    const contract =
      new ethers.Contract(
        CONTRACT_ADDRESS,
        LandRegistry.abi,
        context.signer
      );

    // --------------------------------------------------------
    // Check whether wallet is already registered
    // --------------------------------------------------------

    const existingUser =
      await getBlockchainUser(
        context.walletAddress
      );

    if (existingUser) {

      return {
        success: true,
        alreadyRegistered: true,
        hash: null,
        transactionHash: null,
        blockNumber: null,
        blockchainNetwork:
          context.networkName,
        walletAddress:
          context.walletAddress,
        chainId:
          context.chainId,
        contractAddress:
          CONTRACT_ADDRESS,
        user:
          existingUser
      };
    }

    // --------------------------------------------------------
    // Register user
    // --------------------------------------------------------

    const tx =
      await contract.registerUser(
        name,
        email
      );

    console.log(
      'User registration transaction:',
      tx.hash
    );

    const receipt =
      await tx.wait();

    return {
      success: true,
      alreadyRegistered: false,
      hash: tx.hash,
      transactionHash: tx.hash,
      blockNumber:
        receipt.blockNumber,
      blockchainNetwork:
        context.networkName,
      walletAddress:
        context.walletAddress,
      chainId:
        context.chainId,
      contractAddress:
        CONTRACT_ADDRESS,
      receipt
    };
  };


// ============================================================
// GET BLOCKCHAIN USER
// ============================================================

export const getBlockchainUser =
  async (walletAddress) => {

    if (!walletAddress) {
      return null;
    }

    const contract =
      getReadOnlyContract();

    try {

      const user =
        await contract.getUser(
          walletAddress
        );

      return {
        wallet: user[0],
        name: user[1],
        email: user[2],
        registered: user[3],
        verified: user[4]
      };

    } catch (error) {

      return null;
    }
  };


// ============================================================
// CHECK SELLER BLOCKCHAIN STATUS
// ============================================================

export const checkSellerBlockchainStatus =
  async () => {

    const wallet =
      await getCurrentWallet();

    if (!wallet) {

      return {
        connected: false,
        registered: false,
        verified: false
      };
    }

    const user =
      await getBlockchainUser(wallet);

    const network =
      await getNetworkInfo();

    if (!user) {

      return {
        connected: true,
        registered: false,
        verified: false,
        wallet,
        chainId:
          network.chainId,
        networkName:
          network.networkName
      };
    }

    return {
      connected: true,
      registered:
        user.registered,
      verified:
        user.verified,
      wallet:
        user.wallet,
      name:
        user.name,
      email:
        user.email,
      chainId:
        network.chainId,
      networkName:
        network.networkName
    };
  };


// ============================================================
// REGISTER LAND ON BLOCKCHAIN
// ============================================================

export const registerLandOnBlockchain =
  async ({
    ownerName,
    location,
    surveyNumber,
    area,
    documentHash
  }) => {

    // --------------------------------------------------------
    // Validate input
    // --------------------------------------------------------

    if (!ownerName) {
      throw new Error(
        'Owner name is required.'
      );
    }

    if (!location) {
      throw new Error(
        'Land location is required.'
      );
    }

    if (!surveyNumber) {
      throw new Error(
        'Survey number is required.'
      );
    }

    if (
      area === undefined ||
      area === null ||
      Number(area) <= 0
    ) {
      throw new Error(
        'Area must be greater than zero.'
      );
    }

    if (!documentHash) {
      throw new Error(
        'Document hash is required.'
      );
    }

    // --------------------------------------------------------
    // Blockchain context
    // --------------------------------------------------------

    const context =
      await getBlockchainContext();

    const contract =
      new ethers.Contract(
        CONTRACT_ADDRESS,
        LandRegistry.abi,
        context.signer
      );

    // --------------------------------------------------------
    // Check seller blockchain registration
    // --------------------------------------------------------

    const user =
      await getBlockchainUser(
        context.walletAddress
      );

    if (!user) {
      throw new Error(
        'Seller is not registered on the blockchain.'
      );
    }

    if (!user.registered) {
      throw new Error(
        'Seller blockchain registration is required.'
      );
    }

    if (!user.verified) {
      throw new Error(
        'Seller is not verified on the blockchain.'
      );
    }

    // --------------------------------------------------------
    // Convert area
    //
    // Contract stores uint256.
    //
    // Example:
    // 2.50 acres -> 250
    // 3.75 acres -> 375
    //
    // This represents 2 decimal places.
    // --------------------------------------------------------

    const numericArea =
      Number(area);

    const scaledArea =
      Math.round(
        numericArea * 100
      );

    if (scaledArea <= 0) {
      throw new Error(
        'Invalid land area.'
      );
    }

    // --------------------------------------------------------
    // REGISTER LAND
    // --------------------------------------------------------

    const tx =
      await contract.registerLand(
        ownerName,
        location,
        surveyNumber,
        scaledArea,
        documentHash
      );

    console.log(
      'Land registration transaction:',
      tx.hash
    );

    const receipt =
      await tx.wait();

    // --------------------------------------------------------
    // GET LAND ID FROM LandRegistered EVENT
    // --------------------------------------------------------

    let blockchainLandId = null;

    for (
      const log of receipt.logs
    ) {

      try {

        const parsed =
          contract.interface.parseLog(
            log
          );

        if (
          parsed &&
          parsed.name ===
            'LandRegistered'
        ) {

          blockchainLandId =
            parsed.args.landId.toString();

          break;
        }

      } catch {
        // Ignore logs that do not
        // belong to this contract.
      }
    }

    if (!blockchainLandId) {

      throw new Error(
        'Blockchain transaction succeeded, but Land ID could not be read from the LandRegistered event.'
      );
    }

    // --------------------------------------------------------
    // RETURN REAL BLOCKCHAIN DATA
    // --------------------------------------------------------

    return {
      success: true,

      blockchainLandId,

      hash:
        tx.hash,

      transactionHash:
        tx.hash,

      blockNumber:
        receipt.blockNumber,

      blockchainNetwork:
        context.networkName,

      walletAddress:
        context.walletAddress,

      chainId:
        context.chainId,

      contractAddress:
        CONTRACT_ADDRESS,

      receipt
    };
  };


// ============================================================
// GET LAND FROM BLOCKCHAIN
// ============================================================

export const getLandFromBlockchain =
  async (landId) => {

    const contract =
      getReadOnlyContract();

    const land =
      await contract.getLand(
        landId
      );

    return {
      landId:
        land[0].toString(),

      ownerName:
        land[1],

      location:
        land[2],

      surveyNumber:
        land[3],

      area:
        land[4].toString(),

      documentHash:
        land[5],

      owner:
        land[6],

      registered:
        land[7],

      verified:
        land[8],

      saleRequested:
        land[9],

      buyer:
        land[10],

      saleApproved:
        land[11]
    };
  };


// ============================================================
// BLOCKCHAIN LAND COUNT
// ============================================================

export const getBlockchainLandCount =
  async () => {

    const contract =
      getReadOnlyContract();

    const count =
      await contract.landCount();

    return Number(count);
  };


// ============================================================
// CHECK BLOCKCHAIN CONNECTION
// ============================================================

export const checkContractConnection =
  async () => {

    try {

      const contract =
        getReadOnlyContract();

      const landCount =
        await contract.landCount();

      const network =
        await getNetworkInfo();

      return {
        connected: true,

        contractAddress:
          CONTRACT_ADDRESS,

        landCount:
          Number(landCount),

        chainId:
          network.chainId,

        networkName:
          network.networkName
      };

    } catch (error) {

      console.error(
        'Blockchain connection error:',
        error
      );

      return {
        connected: false,

        contractAddress:
          CONTRACT_ADDRESS,

        landCount: 0,

        chainId: null,

        networkName: null
      };
    }
  };
  // ============================================================
// VERIFY USER ON BLOCKCHAIN
// ============================================================
// Used by Admin to verify Seller / Buyer on-chain.
//
// IMPORTANT:
// The MetaMask account connected while calling this function
// must be the ADMIN account that deployed the contract.
// ============================================================

export const verifyUserOnBlockchain = async (
  userWallet
) => {

  if (!userWallet) {
    throw new Error(
      'User wallet address is required.'
    );
  }

  if (!ethers.isAddress(userWallet)) {
    throw new Error(
      'Invalid wallet address.'
    );
  }

  const context =
    await getBlockchainContext();

  const contract =
    new ethers.Contract(
      CONTRACT_ADDRESS,
      LandRegistry.abi,
      context.signer
    );

  // ----------------------------------------------------------
  // Check current user
  // ----------------------------------------------------------

  const user =
    await getBlockchainUser(
      userWallet
    );

  if (!user) {
    throw new Error(
      'User is not registered on the blockchain.'
    );
  }

  if (!user.registered) {
    throw new Error(
      'User must be registered on the blockchain before verification.'
    );
  }

  // ----------------------------------------------------------
  // Already verified
  // ----------------------------------------------------------

  if (user.verified) {

    return {
      success: true,
      alreadyVerified: true,

      walletAddress:
        userWallet,

      transactionHash: null,

      blockNumber: null,

      blockchainNetwork:
        context.networkName,

      chainId:
        context.chainId,

      contractAddress:
        CONTRACT_ADDRESS
    };
  }

  // ----------------------------------------------------------
  // ADMIN VERIFICATION
  // ----------------------------------------------------------

  const tx =
    await contract.verifyUser(
      userWallet
    );

  console.log(
    'User verification transaction:',
    tx.hash
  );

  const receipt =
    await tx.wait();

  return {
    success: true,

    alreadyVerified: false,

    walletAddress:
      userWallet,

    transactionHash:
      tx.hash,

    hash:
      tx.hash,

    blockNumber:
      receipt.blockNumber,

    blockchainNetwork:
      context.networkName,

    chainId:
      context.chainId,

    contractAddress:
      CONTRACT_ADDRESS,

    receipt
  };
};


// ============================================================
// VERIFY LAND ON BLOCKCHAIN
// ============================================================
// Used by Admin to verify a registered land record on-chain.
// ============================================================

export const verifyLandOnBlockchain =
  async (blockchainLandId) => {

    if (
      blockchainLandId === undefined ||
      blockchainLandId === null ||
      blockchainLandId === ''
    ) {
      throw new Error(
        'Blockchain Land ID is required.'
      );
    }

    const context =
      await getBlockchainContext();

    const contract =
      new ethers.Contract(
        CONTRACT_ADDRESS,
        LandRegistry.abi,
        context.signer
      );

    // ----------------------------------------------------------
    // Read land first
    // ----------------------------------------------------------

    const land =
      await contract.getLand(
        blockchainLandId
      );

    // ----------------------------------------------------------
    // Check registration
    // ----------------------------------------------------------

    if (!land[7]) {
      throw new Error(
        'This land is not registered on the blockchain.'
      );
    }

    // ----------------------------------------------------------
    // Already verified
    // ----------------------------------------------------------

    if (land[8]) {

      return {
        success: true,

        alreadyVerified: true,

        blockchainLandId:
          blockchainLandId.toString(),

        transactionHash: null,

        blockNumber: null,

        blockchainNetwork:
          context.networkName,

        walletAddress:
          context.walletAddress,

        chainId:
          context.chainId,

        contractAddress:
          CONTRACT_ADDRESS
      };
    }

    // ----------------------------------------------------------
    // ADMIN LAND VERIFICATION
    // ----------------------------------------------------------

    const tx =
      await contract.verifyLand(
        blockchainLandId
      );

    console.log(
      'Land verification transaction:',
      tx.hash
    );

    const receipt =
      await tx.wait();

    return {
      success: true,

      alreadyVerified: false,

      blockchainLandId:
        blockchainLandId.toString(),

      transactionHash:
        tx.hash,

      hash:
        tx.hash,

      blockNumber:
        receipt.blockNumber,

      blockchainNetwork:
        context.networkName,

      walletAddress:
        context.walletAddress,

      chainId:
        context.chainId,

      contractAddress:
        CONTRACT_ADDRESS,

      receipt
    };
  };


// ============================================================
// REQUEST TO BUY LAND ON BLOCKCHAIN
// ============================================================
// Used by Buyer.
// NOTE:
// Your current PurchaseRequest.jsx already performs this
// operation directly, so this helper is optional.
// ============================================================

export const requestToBuyOnBlockchain =
  async (blockchainLandId) => {

    if (
      blockchainLandId === undefined ||
      blockchainLandId === null ||
      blockchainLandId === ''
    ) {
      throw new Error(
        'Blockchain Land ID is required.'
      );
    }

    const context =
      await getBlockchainContext();

    const contract =
      new ethers.Contract(
        CONTRACT_ADDRESS,
        LandRegistry.abi,
        context.signer
      );

    // ----------------------------------------------------------
    // Check buyer
    // ----------------------------------------------------------

    const buyer =
      await getBlockchainUser(
        context.walletAddress
      );

    if (!buyer) {
      throw new Error(
        'Buyer is not registered on the blockchain.'
      );
    }

    if (!buyer.registered) {
      throw new Error(
        'Buyer blockchain registration is required.'
      );
    }

    if (!buyer.verified) {
      throw new Error(
        'Buyer is not verified on the blockchain.'
      );
    }

    // ----------------------------------------------------------
    // Check land
    // ----------------------------------------------------------

    const land =
      await contract.getLand(
        blockchainLandId
      );

    if (!land[7]) {
      throw new Error(
        'Land is not registered on the blockchain.'
      );
    }

    if (!land[8]) {
      throw new Error(
        'Land has not been verified by the admin.'
      );
    }

    if (
      land[6].toLowerCase() ===
      context.walletAddress.toLowerCase()
    ) {
      throw new Error(
        'Land owner cannot request their own land.'
      );
    }

    // ----------------------------------------------------------
    // REQUEST PURCHASE
    // ----------------------------------------------------------

    const tx =
      await contract.requestToBuy(
        blockchainLandId
      );

    console.log(
      'Purchase request transaction:',
      tx.hash
    );

    const receipt =
      await tx.wait();

    return {
      success: true,

      blockchainLandId:
        blockchainLandId.toString(),

      buyerWallet:
        context.walletAddress,

      transactionHash:
        tx.hash,

      hash:
        tx.hash,

      blockNumber:
        receipt.blockNumber,

      blockchainNetwork:
        context.networkName,

      chainId:
        context.chainId,

      contractAddress:
        CONTRACT_ADDRESS,

      receipt
    };
  };


// ============================================================
// APPROVE SALE ON BLOCKCHAIN
// ============================================================
// Used by Seller after a Buyer has requested the land.
// ============================================================

export const approveSaleOnBlockchain =
  async (blockchainLandId) => {

    if (
      blockchainLandId === undefined ||
      blockchainLandId === null ||
      blockchainLandId === ''
    ) {
      throw new Error(
        'Blockchain Land ID is required.'
      );
    }

    const context =
      await getBlockchainContext();

    const contract =
      new ethers.Contract(
        CONTRACT_ADDRESS,
        LandRegistry.abi,
        context.signer
      );

    // ----------------------------------------------------------
    // Read land
    // ----------------------------------------------------------

    const land =
      await contract.getLand(
        blockchainLandId
      );

    // ----------------------------------------------------------
    // Validate land
    // ----------------------------------------------------------

    if (!land[7]) {
      throw new Error(
        'Land is not registered on the blockchain.'
      );
    }

    if (!land[8]) {
      throw new Error(
        'Land has not been verified by the admin.'
      );
    }

    // ----------------------------------------------------------
    // Check current wallet is owner
    // ----------------------------------------------------------

    if (
      land[6].toLowerCase() !==
      context.walletAddress.toLowerCase()
    ) {
      throw new Error(
        'Only the current land owner can approve the sale.'
      );
    }

    // ----------------------------------------------------------
    // Check purchase request
    // ----------------------------------------------------------

    if (!land[9]) {
      throw new Error(
        'No purchase request exists for this land.'
      );
    }

    // ----------------------------------------------------------
    // Check buyer
    // ----------------------------------------------------------

    if (
      !land[10] ||
      land[10] ===
        ethers.ZeroAddress
    ) {
      throw new Error(
        'No buyer is associated with this purchase request.'
      );
    }

    // ----------------------------------------------------------
    // Already approved
    // ----------------------------------------------------------

    if (land[11]) {

      return {
        success: true,

        alreadyApproved: true,

        blockchainLandId:
          blockchainLandId.toString(),

        buyerWallet:
          land[10],

        ownerWallet:
          land[6],

        transactionHash: null,

        blockNumber: null,

        blockchainNetwork:
          context.networkName,

        walletAddress:
          context.walletAddress,

        chainId:
          context.chainId,

        contractAddress:
          CONTRACT_ADDRESS
      };
    }

    // ----------------------------------------------------------
    // APPROVE SALE
    // ----------------------------------------------------------

    const tx =
      await contract.approveSale(
        blockchainLandId
      );

    console.log(
      'Sale approval transaction:',
      tx.hash
    );

    const receipt =
      await tx.wait();

    // ----------------------------------------------------------
    // Read updated land
    // ----------------------------------------------------------

    const updatedLand =
      await contract.getLand(
        blockchainLandId
      );

    return {
      success: true,

      alreadyApproved: false,

      blockchainLandId:
        blockchainLandId.toString(),

      buyerWallet:
        updatedLand[10],

      ownerWallet:
        updatedLand[6],

      transactionHash:
        tx.hash,

      hash:
        tx.hash,

      blockNumber:
        receipt.blockNumber,

      blockchainNetwork:
        context.networkName,

      walletAddress:
        context.walletAddress,

      chainId:
        context.chainId,

      contractAddress:
        CONTRACT_ADDRESS,

      receipt
    };
  };