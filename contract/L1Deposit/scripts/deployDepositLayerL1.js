const fs = require('fs');
const { ethers } = require('hardhat');

async function main() {
  const adminWallet = '0x2f9f3D08f9F5eD6527d02C42cbF4ac54Bef49D13';

  const depositLayerL1Contract = await ethers.getContractFactory('DepositLayerL1');
  const depositLayerL1 = await depositLayerL1Contract.deploy(adminWallet);
  console.log({ depositLayerL1 });
  await depositLayerL1.waitForDeployment();

  const depositLayerL1Address = await depositLayerL1.getAddress();
  console.log(
    `Run this script to verify this contract: \n npx hardhat verify --network eth_sepolia ${depositLayerL1Address} ${adminWallet}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
