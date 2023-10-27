import { Contract } from '@ethersproject/contracts';
import { usePrivy } from '@privy-io/react-auth';

import useUserWallet from './useUserWallet';
import gameContractAbi from '../assets/abis/GameContract.json';
import tokenAbi from '../assets/abis/Token.json';
import { formatter } from '../utils/numbers';
import environments from '../utils/environments';

const { NETWORK_ID, GAME_CONTRACT_ADDRESS, TOKEN_ADDRESS, SYSTEM_ADDRESS } = environments;

const useSmartContract = () => {
  const { sendTransaction } = usePrivy();
  const embeddedWallet = useUserWallet();

  const buyMachine = async (amount, value) => {
    console.log({ amount, value });
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);

    const data = gameContract.interface.encodeFunctionData('mint', [embeddedWallet.address, 1, amount]);

    const unsignedTx = {
      to: GAME_CONTRACT_ADDRESS,
      chainId: Number(NETWORK_ID),
      data,
      // eslint-disable-next-line
      value: BigInt(value * 1e18),
    };

    const uiConfig = {
      header: `Buy ${amount} gangsters with ${formatter.format(value)} ETH`,
      description: '',
      buttonText: 'Send transaction',
    };

    const receipt = await sendTransaction(unsignedTx, uiConfig);

    return receipt;
  };

  const buyWorkerOrBuilding = async (amount, value, type) => {
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const tokenContract = new Contract(TOKEN_ADDRESS, tokenAbi.abi, privyProvider.provider);

    const valueInWei = (value * 1e18).toLocaleString('fullwide', { useGrouping: false });
    const data = tokenContract.interface.encodeFunctionData('transfer', [SYSTEM_ADDRESS, valueInWei]);

    const unsignedTx = {
      to: TOKEN_ADDRESS,
      chainId: Number(NETWORK_ID),
      data,
    };

    const uiConfig = {
      header: `Buy ${amount} ${type === 'buy-worker' ? 'workers' : 'buildings'} with ${formatter.format(value)} FIAT`,
      description: '',
      buttonText: 'Send transaction',
    };

    const receipt = await sendTransaction(unsignedTx, uiConfig);

    return receipt;
  };

  return { buyMachine, buyWorkerOrBuilding };
};

export default useSmartContract;
