const fs = require('fs');
const { ethers } = require('hardhat');

async function main() {
  const adminWallet = '';

  const depositLayerL2Contract = await ethers.getContractFactory('DepositLayerL2');
  const depositLayerL2 = await depositLayerL2Contract.deploy(adminWallet);
  const depositLayerL2Address = await depositLayerL2.getAddress();
  console.log(`depositLayerL2 is deployed to ${depositLayerL2Address}`);
  console.log(
    `Run this script to verify this contract: \n npx hardhat verify --network [your_network] ${depositLayerL2Address} "${adminWallet}"`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
