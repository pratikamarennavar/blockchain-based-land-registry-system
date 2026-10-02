import { ethers } from 'ethers';
import LandRegistry from './LandRegistry.json';

const CONTRACT_ADDRESS =
  '0xFDa7dEEDCe65295dA889bFEC27019e2F896178ED';

export const getProvider = () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed.');
  }

  return new ethers.BrowserProvider(
    window.ethereum
  );
};

export const getSigner = async () => {
  const provider = getProvider();

  await provider.send(
    'eth_requestAccounts',
    []
  );

  return await provider.getSigner();
};

export const getContract = async () => {
  const signer = await getSigner();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    LandRegistry.abi,
    signer
  );
};

export const getReadOnlyContract = () => {
  const provider = getProvider();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    LandRegistry.abi,
    provider
  );
};

export const CONTRACT_ADDRESS_EXPORT =
  CONTRACT_ADDRESS;