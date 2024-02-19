// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const fs = require('fs');
require('dotenv').config();
const { ethers, run } = require('hardhat');
const factoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const routerArtifact = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const pairArtifact = require('@uniswap/v2-periphery/build/IUniswapV2Pair.json');
const WETH9 = require('../WETH9.json');

async function main() {
  const _defaultAdmin = process.env.DefaultAdmin;
  const _workerAddress = process.env.WorkerAddress;

  const Gangster = await ethers.getContractFactory('Gangster');
  const GangsterNFT = await Gangster.deploy(_defaultAdmin, _workerAddress);
  const _nftAddress = await GangsterNFT.getAddress();
  console.log(`NFT contract is deployed to ${_nftAddress}`);

  await GangsterNFT.setURI('https://gangsterarena.com/nft/1.json');
  console.log('Set URI');

  await GangsterNFT.mint(_defaultAdmin, 1, 1, '0x11');
  console.log('minted');

  // await run('verify:verify', {
  //   address: _nftAddress,
  //   constructorArguments: [_defaultAdmin, _workerAddress],
  // });
  // console.log('verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
