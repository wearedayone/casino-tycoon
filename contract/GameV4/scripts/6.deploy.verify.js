// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

require('dotenv').config();
const fs = require('fs');
const { ethers, run } = require('hardhat');

const fiatAddress = process.env.FIAT;
const nftAddress = process.env.NFT;
const gameAddress = process.env.GAME;
const factoryAddress = process.env.FACTORY;
const routerAddress = process.env.ROUTER;
const wethAddress = process.env.WETH;
const pairAddress = process.env.PAIR;

async function main() {
  // const _defaultAdmin = '0xd97612bD2272eDc1F66BbA99666C6a0fAa6046F4';
  // const _adminAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _workerAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _signerAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _nftAddress = '0x8aD26e8B97B7F06D86cd05bE609718E50aD274E1';
  // const _fiatAddress = '0xDB34eb205A2f0389a6B1DeEADc0da1a71307D119';

  const _defaultAdmin = process.env.DefaultAdmin;
  const _adminAddress = process.env.Admin;
  const _workerAddress = process.env.WorkerAddress;
  const _signerAddress = process.env.SignerAddress;

  const contracts = [
    { address: fiatAddress, args: [_defaultAdmin, _workerAddress] },
    { address: routerAddress, args: [factoryAddress, wethAddress] },
    { address: factoryAddress, args: [_defaultAdmin] },
    // {address: pairAddress, args: [_defaultAdmin, _workerAddress]},
    { address: wethAddress, args: [] },
    { address: nftAddress, args: [_defaultAdmin, _workerAddress] },
    {
      address: gameAddress,
      args: [_defaultAdmin, _adminAddress, _workerAddress, _signerAddress, nftAddress, fiatAddress],
    },
  ];

  for (const contract of contracts) {
    try {
      await run('verify:verify', {
        address: contract.address,
        constructorArguments: contract.args,
      });
    } catch (err) {
      console.error(err.message);
    }
  }

  console.log('verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
