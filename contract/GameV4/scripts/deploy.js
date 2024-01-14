// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const fs = require('fs');
const { ethers } = require('hardhat');

async function main() {
  // const _defaultAdmin = '0xd97612bD2272eDc1F66BbA99666C6a0fAa6046F4';
  // const _adminAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _workerAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _signerAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _nftAddress = '0x8aD26e8B97B7F06D86cd05bE609718E50aD274E1';
  // const _fiatAddress = '0x292e20DEDFB76d222b80Df1DeF97340A19b777c5';

  // const workerAddress = '0xb63b1c3450b74A6Def7106028a091d3324B1e981';
  const _defaultAdmin = '0x890611302Ee344d5bD94DA9811C18e2De5588077';
  const _adminAddress = '0x890611302Ee344d5bD94DA9811C18e2De5588077';
  const _workerAddress = '0xd0A8dBf15F547604Ff836be3176206DbDc3bcadF';
  const _signerAddress = '0x9e3B61bb59493aD1d4E5deA89eE02bF6CEfC8fA8';

  const FIAT = await ethers.getContractFactory('FIAT');
  const FIATToken = await FIAT.deploy(_defaultAdmin, _workerAddress);
  const _fiatAddress = await FIATToken.getAddress();
  console.log(`FIATToken is deployed to ${_fiatAddress}`);

  const Gangster = await ethers.getContractFactory('Gangster');
  const GangsterNFT = await Gangster.deploy(_defaultAdmin, _workerAddress);
  const _nftAddress = await GangsterNFT.getAddress();
  console.log(`NFT contract is deployed to ${_nftAddress}`);

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

  // Pre-config
  // FIAT:
  let minterRole = await FIATToken.MINTER_ROLE();
  await FIATToken.grantRole(minterRole, GangsterArenaContractAddress);

  await GangsterNFT.setTokenMaxSupply([0, 10000]);
  minterRole = await GangsterNFT.MINTER_ROLE();
  await GangsterNFT.grantRole(minterRole, GangsterArenaContractAddress);

  fs.writeFileSync(
    './contracts.txt',
    `FIATToken = ${_fiatAddress}\nNFT contract = ${_nftAddress}\nGame contract = ${GangsterArenaContractAddress}`,
    {
      encoding: 'utf-8',
    }
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
