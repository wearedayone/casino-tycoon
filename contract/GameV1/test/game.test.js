/* eslint-disable jest/valid-expect */
/* eslint-disable no-unused-expressions */
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');
const { expect } = require('chai');
require('chai').use(require('chai-as-promised')).should();

// const { getBigNumber } = require('./utils');
const TOKEN_PER_ACCOUNT = 1000000000n;

const EVENT = {
  DepositEther: 'DepositEther',
  DepositEtherOnBehalf: 'DepositEtherOnBehalf',
  DepositERC20: 'DepositERC20',
  DepositERC20OnBehalf: 'DepositERC20OnBehalf',
  WithdrawEtherOnBehalf: 'WithdrawEtherOnBehalf',
  WithdrawEther: 'WithdrawEther',
  WithdrawERC20OnBehalf: 'WithdrawERC20OnBehalf',
  WithdrawERC20: 'WithdrawERC20',
  SendEther: 'SendEther',
  SendERC20: 'SendERC20',
  ReceiveEther: 'ReceiveEther',
  ReceiveERC20: 'ReceiveERC20',
};

describe('Rakku Bank', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const deployStakingFixture = async () => {
    const accounts = await ethers.getSigners();
    const [owner, acc1, acc2, acc3, ...others] = accounts;
    const Token = await ethers.getContractFactory('FIAT');
    const token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    const GangsterNFT = await ethers.getContractFactory('Gangster');
    const GangsterNFTContract = await GangsterNFT.deploy(owner.address, acc1.address);
    await GangsterNFTContract.waitForDeployment();

    const GangsterArena = await ethers.getContractFactory('GangsterArena');
    const GangsterArenaContract = await GangsterArena.deploy(owner.address);
    await GangsterArenaContract.waitForDeployment();

    const promises = [];
    for (const account of accounts) {
      promises.push(token.mint(account.address, TOKEN_PER_ACCOUNT));
    }
    await Promise.all(promises);

    return {
      GangsterNFTContract,
      GangsterArenaContract,
      token,
      accounts,
      owner,
      acc1,
      acc2,
      acc3,
      others,
    };
  };

  describe('deployment', function () {
    it('deploy contract', async function () {
      const { GangsterNFTContract, GangsterArenaContract, token } = await loadFixture(deployStakingFixture);
      const tokenAddress = await token.getAddress();
      expect(tokenAddress).not.to.be.undefined;
      const GangsterNFTContractAddress = await GangsterNFTContract.getAddress();
      expect(GangsterNFTContractAddress).not.to.be.undefined;
      const GangsterArenaContractAddress = await GangsterArenaContract.getAddress();
      expect(GangsterArenaContractAddress).not.to.be.undefined;
    });
  });
});
