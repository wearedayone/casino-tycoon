/* eslint-disable jest/valid-expect */
/* eslint-disable no-unused-expressions */
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');
const { expect } = require('chai');
require('chai').use(require('chai-as-promised')).should();

// const { getBigNumber } = require('./utils');
const TOKEN_PER_ACCOUNT = 1000000000n;

const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';

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
    const GangsterNFTContractAddress = await GangsterNFTContract.getAddress();
    const GangsterArena = await ethers.getContractFactory('GangsterArena');
    const GangsterArenaContract = await GangsterArena.deploy(owner.address, GangsterNFTContractAddress);
    await GangsterArenaContract.waitForDeployment();
    GangsterArenaContract.set;

    //GrantRole
    await GangsterNFTContract.grantRole(MINTER_ROLE, GangsterArenaContract.getAddress());
    await GangsterNFTContract.setRoyalties(GangsterArenaContract.getAddress(), 4200);
    // update config for gangster arena
    // await GangsterArenaContract.setContractAddress(GangsterNFTContract.getAddress());
    await GangsterArenaContract.setTokenMaxSupply([0, 1000]);

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

  describe('Mint NFT', function () {
    it('Mint NFT', async function () {
      const { GangsterNFTContract, GangsterArenaContract, token, owner, acc1 } = await loadFixture(
        deployStakingFixture
      );
      const nftPrice = 69000000000000000n;
      await GangsterArenaContract.mint(owner.address, 1, 10, { from: owner.address, value: nftPrice * 10n });

      const balance = await GangsterNFTContract.balanceOf(await GangsterArenaContract.getAddress(), 1);
      expect(balance).to.be.equal(10);
      const gangsterCount = await GangsterArenaContract.gangster(owner.address);
      expect(gangsterCount).to.be.equal(10);
      await GangsterArenaContract.mint(owner.address, 1, 10, { from: owner.address, value: nftPrice * 10n });
      await GangsterArenaContract.mint(owner.address, 1, 10, { from: owner.address, value: nftPrice * 10n });
      await GangsterArenaContract.mint(owner.address, 1, 10, { from: owner.address, value: nftPrice * 10n });
      await GangsterArenaContract.mint(owner.address, 1, 10, { from: owner.address, value: nftPrice * 10n });
      await GangsterArenaContract.mint(owner.address, 1, 10, { from: owner.address, value: nftPrice * 10n });
      await GangsterArenaContract.mint(owner.address, 1, 10, { from: owner.address, value: nftPrice * 10n });
      await GangsterArenaContract.mint(owner.address, 1, 10, { from: owner.address, value: nftPrice * 10n });
    });
  });

  describe('Withdraw NFT', function () {
    it('deploy contract', async function () {
      const { GangsterNFTContract, GangsterArenaContract, token, owner, acc1 } = await loadFixture(
        deployStakingFixture
      );
      const nftPrice = 69000000000000000n;
      await GangsterArenaContract.mint(owner.address, 1, 10, { from: owner.address, value: nftPrice * 10n });

      const gangsterCount = await GangsterArenaContract.gangster(owner.address);
      expect(gangsterCount).to.be.equal(10);
      await GangsterArenaContract.withdrawNFT(acc1.address, 1, 4);
      const balance = await GangsterNFTContract.balanceOf(await GangsterArenaContract.getAddress(), 1);
      expect(balance).to.be.equal(6);

      const balance1 = await GangsterNFTContract.balanceOf(acc1.address, 1);
      expect(balance1).to.be.equal(4);
      await GangsterNFTContract.connect(acc1).setApprovalForAll(await GangsterArenaContract.getAddress(), true);
      await GangsterArenaContract.connect(acc1).depositNFT(owner.address, 1, 3);
      await GangsterArenaContract.connect(acc1).depositNFT(acc1.address, 1, 1);
      const balance2 = await GangsterNFTContract.balanceOf(acc1.address, 1);
      expect(balance2).to.be.equal(0);

      const gangsterCount1 = await GangsterArenaContract.gangster(acc1.address);
      expect(gangsterCount1).to.be.equal(1);

      await GangsterArenaContract.burnNFT([acc1.address], [1], [1]);
      const balance4 = await GangsterNFTContract.balanceOf(await GangsterArenaContract.getAddress(), 1);
      expect(balance4).to.be.equal(9);

      const gangsterCount2 = await GangsterArenaContract.gangster(acc1.address);
      expect(gangsterCount2).to.be.equal(0);
    });
  });
});
