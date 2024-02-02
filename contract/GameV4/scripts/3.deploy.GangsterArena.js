// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const fs = require('fs');
const { ethers } = require('hardhat');
const factoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const routerArtifact = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const pairArtifact = require('@uniswap/v2-periphery/build/IUniswapV2Pair.json');
const WETH9 = require('../WETH9.json');

const _nftAddress = '0x999E7E6Cf4D8F49d9002d8595C71699A7c26D53F';
const _fiatAddress = '0x068a561Cd3Cf611c630237DAe8588f261358e3dF';

async function main() {
  // const _defaultAdmin = '0xd97612bD2272eDc1F66BbA99666C6a0fAa6046F4';
  // const _adminAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _workerAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _signerAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';

  const _defaultAdmin = '0x890611302Ee344d5bD94DA9811C18e2De5588077';
  const _adminAddress = '0x890611302Ee344d5bD94DA9811C18e2De5588077';
  const _workerAddress = '0xd0A8dBf15F547604Ff836be3176206DbDc3bcadF';
  const _signerAddress = '0x9e3B61bb59493aD1d4E5deA89eE02bF6CEfC8fA8';

  const GangsterArena = await ethers.getContractFactory('GangsterArena');
  const GangsterArenaContract = await GangsterArena.deploy(
    _defaultAdmin,
    _adminAddress,
    _workerAddress,
    _signerAddress,
    _nftAddress,
    _fiatAddress
  );
  const GangsterArenaContractAddress = await GangsterArenaContract.getAddress();
  console.log(`Game contract is deployed to ${GangsterArenaContractAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
