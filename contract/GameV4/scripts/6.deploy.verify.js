// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const fs = require('fs');
const { ethers, run } = require('hardhat');

const fiatAddress = '0x068a561Cd3Cf611c630237DAe8588f261358e3dF';
const routerAddress = '0x1255050930Be7b365Ee93e091ff9C2c633471c02';
const factoryAddress = '0xD7b9d88D97d1A542fB57fB276D6532145cb8fF3f';
const pairAddress = '0xf660b98C2924D907Fa650eC65113e3390BE135F4';
const wethAddress = '0x19c6b88868343c38538C6a1709b4cBc9cb8011aa';
const nftAddress = '0x999E7E6Cf4D8F49d9002d8595C71699A7c26D53F';
const gameAddress = '0x23cA98298Fc555aFa6cC6E556c02bB5bBB445577';

async function main() {
  // const _defaultAdmin = '0xd97612bD2272eDc1F66BbA99666C6a0fAa6046F4';
  // const _adminAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _workerAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _signerAddress = '0x9EC95637ff4fA040a54CbDCDD0312e46F7a204CF';
  // const _nftAddress = '0x8aD26e8B97B7F06D86cd05bE609718E50aD274E1';
  // const _fiatAddress = '0xDB34eb205A2f0389a6B1DeEADc0da1a71307D119';

  const _defaultAdmin = '0x890611302Ee344d5bD94DA9811C18e2De5588077';
  const _adminAddress = '0x890611302Ee344d5bD94DA9811C18e2De5588077';
  const _workerAddress = '0xd0A8dBf15F547604Ff836be3176206DbDc3bcadF';
  const _signerAddress = '0x9e3B61bb59493aD1d4E5deA89eE02bF6CEfC8fA8';

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
