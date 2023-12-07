// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const fs = require('fs');
const { ethers } = require('hardhat');

async function main() {
  const _defaultAdmin = '0xd97612bD2272eDc1F66BbA99666C6a0fAa6046F4';
  const _adminAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  const _workerAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  const _signerAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  const _nftAddress = '0x873a4f8cD3623032fa4ba8f13128cf02F288Bd51';
  const _fiatAddress = '0xDfF92e4c9a21Fcd201983D904Db0A6D1713C3636';

  // const workerAddress = '0x890611302Ee344d5bD94DA9811C18e2De5588077';
  // const _defaultAdmin = '0x890611302Ee344d5bD94DA9811C18e2De5588077';
  // const _adminAddress = '0x890611302Ee344d5bD94DA9811C18e2De5588077';
  // const _workerAddress = '0x890611302Ee344d5bD94DA9811C18e2De5588077';
  // const _signerAddress = '0x890611302Ee344d5bD94DA9811C18e2De5588077';

  // const FIAT = await ethers.getContractFactory('FIAT');
  // const FIATToken = await FIAT.deploy(_workerAddress);
  // const _fiatAddress = await FIATToken.getAddress();
  // console.log(`FIATToken is deployed to ${_fiatAddress}`);

  // const Gangster = await ethers.getContractFactory('Gangster');
  // const GangsterNFT = await Gangster.deploy(_workerAddress, _workerAddress);
  // const GangsterNFTAddress = await GangsterNFT.getAddress();
  // console.log(`NFT contract is deployed to ${GangsterNFTAddress}`);

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
  // await GangsterArenaContract.setTokenMaxSupply([0, 10000]);
  // const minterRole = await GangsterNFT.MINTER_ROLE();
  // await GangsterNFT.grantRole(minterRole, GangsterArenaContractAddress);

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
