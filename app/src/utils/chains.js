const mainnet = 1;
const sepolia = 11_155_111;

export const blast = {
  id: 81457,
  name: 'Blast',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.blast.io'] },
  },
  blockExplorers: {
    default: {
      name: 'Blastscan',
      url: 'https://blastscan.io',
      apiUrl: 'https://api.blastscan.io/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 212929,
    },
  },
  sourceId: mainnet,
};

export const blastSepolia = {
  id: 168_587_773,
  name: 'Blast Sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.blast.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blastscan',
      url: 'https://sepolia.blastscan.io',
      apiUrl: 'https://api-sepolia.blastscan.io/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 756690,
    },
  },
  testnet: true,
  sourceId: sepolia,
};
