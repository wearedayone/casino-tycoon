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

async function main() {
  const _nftAddress = '0x8147879efE745F773a6b23232b851FB6AA5C655c';
  const _fiatAddress = '0xB830Dbac42B35D9821A511F205332D733158Bcda';
  const _gaAddress = '0xc7B23C14153ac59a7b4e58DE24e08730cAea772d';

  const FIATToken = await ethers.getContractAt('FIAT', _fiatAddress);
  let minterRole = await FIATToken.MINTER_ROLE();
  await FIATToken.grantRole(minterRole, _gaAddress);

  const GangsterNFT = await ethers.getContractAt('Gangster', _nftAddress);
  await GangsterNFT.setTokenMaxSupply([0, 10000]);
  minterRole = await GangsterNFT.MINTER_ROLE();
  await GangsterNFT.grantRole(minterRole, _gaAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
