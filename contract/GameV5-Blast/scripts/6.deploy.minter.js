const { ethers } = require('hardhat');

const { readConfigs, updateConfigs, verifyContract } = require('./_utils');

const phases = [
  {
    id: 1,
    name: 'Whitelist mint',
    maxSupply: 500,
    maxPerBatch: 10,
    maxPerWallet: 10,
    basePrice: (0.0005 * 1e18).toString(),
    status: true,
    isWhitelistedOnly: true,
  },
  {
    id: 2,
    name: 'Season 1 user mint', // only for season 1 users
    maxSupply: 500,
    maxPerBatch: 1,
    maxPerWallet: 1,
    basePrice: 0,
    status: true,
    isWhitelistedOnly: true,
  },
  {
    id: 3,
    name: 'Season 1 user mint then public 24h later', // public but season 1 users can mint 24h before
    maxSupply: 500,
    maxPerBatch: 10,
    maxPerWallet: 10,
    basePrice: (0.001 * 1e18).toString(),
    status: true,
    isWhitelistedOnly: true,
  },
  {
    id: 4,
    name: 'Public mint', // public
    maxSupply: 500,
    maxPerBatch: 10,
    maxPerWallet: 10,
    basePrice: (0.002 * 1e18).toString(),
    status: true,
    isWhitelistedOnly: false,
  },
];

const main = async () => {
  try {
    console.log('deploying minter...');
    const { defaultAdmin, signer, nft } = readConfigs();

    const Minter = await ethers.getContractFactory('Minter');
    const minter = await Minter.deploy(defaultAdmin, nft, signer);
    const minterAddress = await minter.getAddress();

    await verifyContract({ address: minterAddress, constructorArguments: [defaultAdmin, nft, signer] });

    updateConfigs({ minter: minterAddress, minterDeployed: true });

    for (const phase of phases) {
      await minter.updatePhase(
        phase.id,
        phase.maxSupply,
        phase.maxPerBatch,
        phase.maxPerWallet,
        phase.basePrice,
        phase.status,
        phase.isWhitelistedOnly
      );
    }

    console.log(`Minter is deployed to ${minterAddress}`);
  } catch (err) {
    console.error(err);
  }

  process.exit();
};

main();
