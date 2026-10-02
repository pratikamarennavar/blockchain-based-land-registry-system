import { BrowserProvider, Contract } from 'ethers';
import LandRegistryArtifact from './LandRegistry.json';

const CONTRACT_ADDRESS =
  import.meta.env.VITE_LAND_REGISTRY_ADDRESS;

export async function getLandRegistryContract() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed.');
  }

  if (!CONTRACT_ADDRESS) {
    throw new Error(
      'Land Registry contract address is not configured.'
    );
  }

  const provider = new BrowserProvider(
    window.ethereum
  );

  const signer = await provider.getSigner();

  return new Contract(
    CONTRACT_ADDRESS,
    LandRegistryArtifact.abi,
    signer
  );
}

export async function registerLandOnBlockchain({
  ownerName,
  location,
  surveyNumber,
  area,
  documentHash
}) {
  const contract =
    await getLandRegistryContract();

  const numericArea =
    Math.round(Number(area) * 100);

  if (numericArea <= 0) {
    throw new Error(
      'Land area must be greater than zero.'
    );
  }

  const transaction =
    await contract.registerLand(
      ownerName,
      location,
      surveyNumber,
      numericArea,
      documentHash
    );

  const receipt =
    await transaction.wait();

  let blockchainLandId = null;

  try {
    const event =
      receipt.logs
        .map((log) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(
          (event) =>
            event &&
            event.name === 'LandRegistered'
        );

    if (event) {
      blockchainLandId =
        event.args.landId?.toString() ||
        event.args.id?.toString() ||
        null;
    }
  } catch (error) {
    console.warn(
      'Unable to read LandRegistered event:',
      error
    );
  }

  const network =
    await receipt.getBlock();

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    blockchainLandId,
    network
  };
}