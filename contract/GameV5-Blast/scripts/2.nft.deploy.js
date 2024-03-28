const { ethers } = require('hardhat');

const { readConfigs, updateConfigs, verifyContract } = require('./_utils');

const main = async () => {
  try {
    console.log('deploying NFT...');
    const { defaultAdmin, worker } = readConfigs();

    const Gangster = await ethers.getContractFactory('Gangster');
    const GangsterNFT = await Gangster.deploy(defaultAdmin, worker);
    const nftAddress = await GangsterNFT.getAddress();

    await verifyContract({ address: nftAddress, constructorArguments: [defaultAdmin, worker] });

    updateConfigs({ nft: nftAddress, nftDeployed: true });

    await GangsterNFT.setURI('https://gangsterarena.com/nft/1.json');
    console.log('set URI done');

    await GangsterNFT.mint(defaultAdmin, 1, 1, '0x11');
    console.log('mint for admin done');

    console.log(`NFT is deployed to ${nftAddress}`);
  } catch (err) {
    console.error(err);
  }

  process.exit();
};

main();
