import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { parseEther } from '@ethersproject/units';

import Minter from '../assets/abis/Minter.json';
import environments from '../utils/environments';

const { MINTER_ADDRESS } = environments;

const useSmartContract = ({ provider, checkNetwork }) => {
  const getSigner = () => {
    if (!provider) return null;

    const web3Provider = new Web3Provider(provider);
    const signer = web3Provider.getSigner();
    return signer;
  };

  const getMinterContract = () => {
    const signer = getSigner();
    if (!signer) return null;

    return new Contract(MINTER_ADDRESS, Minter.abi, signer);
  };

  const mint = async ({ phaseId, amount, signature, value }) => {
    await checkNetwork();
    const minterContract = getMinterContract();
    const tx = await minterContract.mintWL(phaseId, amount, signature, { value: parseEther(`${value}`) });
    const receipt = await tx.wait();
    return receipt;
  };

  return { mint };
};

export default useSmartContract;
