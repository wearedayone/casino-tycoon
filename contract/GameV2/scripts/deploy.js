// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const fs = require('fs');
const { ethers } = require('hardhat');

async function main() {
  const FIAT = await ethers.getContractFactory('FIAT');
  const workerAddress = '0x890611302Ee344d5bD94DA9811C18e2De5588077';
  const nftAddress = '0x87377767C46D79aEfc9364EBDf0e00334d2269b9';
  // const FIATToken = await FIAT.deploy(workerAddress);
  // const FIATTokenAddress = await FIATToken.getAddress();
  // console.log(`FIATToken is deployed to ${FIATTokenAddress}`);

  // const Gangster = await ethers.getContractFactory('Gangster');
  // const GangsterNFT = await Gangster.deploy(workerAddress, workerAddress);
  // const GangsterNFTAddress = await GangsterNFT.getAddress();
  // console.log(`NFT contract is deployed to ${GangsterNFTAddress}`);

  const GangsterArena = await ethers.getContractFactory('GangsterArena');
  const GangsterArenaContract = await GangsterArena.deploy(workerAddress, nftAddress);
  const GangsterArenaContractAddress = await GangsterArenaContract.getAddress();
  console.log(`Game contract is deployed to ${GangsterArenaContractAddress}`);

  // fs.writeFileSync(
  //   './contracts.txt',
  //   `FIATToken = ${FIATTokenAddress}\nNFT contract = ${GangsterNFTAddress}\nGame contract = ${GangsterArenaContractAddress}`,
  //   {
  //     encoding: 'utf-8',
  //   }
  // );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
