// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const fs = require('fs');
const { ethers, run } = require('hardhat');
const factoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const routerArtifact = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const pairArtifact = require('@uniswap/v2-periphery/build/IUniswapV2Pair.json');
const WETH9 = require('../WETH9.json');

async function main() {
  // const _defaultAdmin = '0xd97612bD2272eDc1F66BbA99666C6a0fAa6046F4';
  // const _adminAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _workerAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _signerAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _nftAddress = '0x8aD26e8B97B7F06D86cd05bE609718E50aD274E1';
  // const _fiatAddress = '0xDB34eb205A2f0389a6B1DeEADc0da1a71307D119';

  const _defaultAdmin = '0x890611302Ee344d5bD94DA9811C18e2De5588077';
  const _workerAddress = '0xd0A8dBf15F547604Ff836be3176206DbDc3bcadF';

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
