const fs = require('fs');
const { ethers } = require('hardhat');

async function main() {
  const adminWallet = '0xd88A3D28c2a04b39A6c6521F8D8037C3c3B5e96c';

  const depositLayerL1Contract = await ethers.getContractFactory('DepositLayerL1');
  const depositLayerL1 = await depositLayerL1Contract.deploy(adminWallet);

  const depositLayerL1Address = await depositLayerL1.getAddress();
  console.log(
    `Run this script to verify this contract: \n npx hardhat verify --network [your_network] ${depositLayerL1Address} "${adminWallet}"`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
