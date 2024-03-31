/* eslint-disable jest/valid-expect */
/* eslint-disable no-unused-expressions */
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');
const { expect } = require('chai');
require('chai').use(require('chai-as-promised')).should();

// const { getBigNumber } = require('./utils');
const TOKEN_PER_ACCOUNT = 1000000000n;
const BASE_18 = 1000000000000000000n;
const nftPrice = 10000000000000000n;
const nftPriceWL = 5000000000000000n;

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

describe('Gangster Arena', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const deployStakingFixture = async () => {
    const accounts = await ethers.getSigners();
    const [owner, acc1, acc2, acc3, ...others] = accounts;
    const [ownerWallet, teamWallet, revShareWallet, userWallet] = accounts;

    const Token = await ethers.getContractFactory('GANG');
    const token = await Token.deploy(ownerWallet.address, ownerWallet.address);
    await token.waitForDeployment();
    const FiatContractAddress = await token.getAddress();

    const GangsterNFT = await ethers.getContractFactory('Gangster');
    const GangsterNFTContract = await GangsterNFT.deploy(owner.address, acc1.address);
    await GangsterNFTContract.waitForDeployment();
    const GangsterNFTContractAddress = await GangsterNFTContract.getAddress();

    const _defaultAdmin = owner.address;
    const _adminAddress = owner.address;
    const _workerAddress = owner.address;
    const _signerAddress = owner.address;
    const _gangsterAddress = GangsterNFTContractAddress;
    const _fiatAddress = FiatContractAddress;

    const GangsterArena = await ethers.getContractFactory('GangsterArena');
    const GangsterArenaContract = await GangsterArena.deploy(
      _defaultAdmin,
      _adminAddress,
      _workerAddress,
      _signerAddress,
      _gangsterAddress,
      _fiatAddress
    );
    await GangsterArenaContract.waitForDeployment();
    const GangsterArenaContractAddress = await GangsterArenaContract.getAddress();

    //GrantRole
    await GangsterNFTContract.grantRole(MINTER_ROLE, GangsterArenaContractAddress);
    await GangsterNFTContract.setRoyalties(GangsterArenaContractAddress, 4200);

    await token.grantRole(MINTER_ROLE, GangsterArenaContractAddress);

    // update config for gangster arena
    // await GangsterArenaContract.setContractAddress(GangsterNFTContract.getAddress());
    await GangsterNFTContract.setTokenMaxSupply([0, 10000]);

    const promises = [];
    token.mint(GangsterArenaContractAddress, 1000000n * BASE_18);
    for (const account of accounts) {
      promises.push(token.mint(account.address, TOKEN_PER_ACCOUNT * BASE_18));
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
      const nftPrice = 10000000000000000n;
      await token.mint(owner.address, nftPrice);
      const timestamp = Math.floor(Date.now() / 1000);
      let tokenId = 1;
      let amount = 10;
      let value = 1000n;
      let nGangster = 0;
      let nonce = 1000;
      let bType = 1;
      let referral = acc1.address;
      const message = ethers.solidityPackedKeccak256(
        // Array of types: declares the data types in the message.
        ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'address'],
        // Array of values: actual values of the parameters to be hashed.
        [owner.address, tokenId, amount, value, timestamp, nGangster, nonce, bType, referral]
      );
      const signature = await owner.signMessage(ethers.toBeArray(message));
      const GAAddress = await GangsterArenaContract.getAddress();
      console.log({ GAAddress, value });
      await token.approve(GAAddress, value * BASE_18);
      console.log({ tokenId, amount, value, timestamp, nGangster, nonce, bType, referral });
      await GangsterArenaContract.buyGangster(
        tokenId,
        amount,
        value,
        timestamp,
        nGangster,
        nonce,
        bType,
        referral,
        signature
      );
      console.log({ tokenId, amount, value, timestamp, nGangster, nonce, bType, referral });
      const balance = await GangsterNFTContract.balanceOf(await GangsterNFTContract.getAddress(), 1);
      expect(balance).to.be.equal(10);
      const gangsterCount = await GangsterNFTContract.gangster(owner.address);
      expect(gangsterCount).to.be.equal(10);
    });
  });

  describe('Withdraw NFT', function () {
    it('deploy contract', async function () {
      const { GangsterNFTContract, GangsterArenaContract, token, owner, acc1 } = await loadFixture(
        deployStakingFixture
      );
      const nftPrice = 10000000000000000n;
      let timestamp = Math.floor(Date.now() / 1000);
      let tokenId = 1;
      let amount = 10;
      let value = 1000n;
      let nGangster = 0;
      let nonce = 1000;
      let bType = 1;
      let referral = acc1.address;

      const message1 = ethers.solidityPackedKeccak256(
        // Array of types: declares the data types in the message.
        ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'address'],
        // Array of values: actual values of the parameters to be hashed.
        [owner.address, tokenId, amount, value, timestamp, nGangster, nonce, bType, referral]
      );
      const signature1 = await owner.signMessage(ethers.toBeArray(message1));
      const GAAddress = await GangsterArenaContract.getAddress();
      await token.approve(GAAddress, value * BASE_18);
      await GangsterArenaContract.buyGangster(
        tokenId,
        amount,
        value,
        timestamp,
        nGangster,
        nonce,
        bType,
        referral,
        signature1
      );

      const gangsterCount = await GangsterNFTContract.gangster(owner.address);
      expect(gangsterCount).to.be.equal(10);
      console.log('we are here 1', {
        GangsterNFTContract: await GangsterNFTContract.getAddress(),
        GangsterArenaContract: await GangsterArenaContract.getAddress(),
      });
      // await GangsterNFTContract.approvalForWithdraw(await GangsterArenaContract.getAddress(), true);
      await GangsterArenaContract.withdrawNFT(acc1.address, 1, 4);

      const balance = await GangsterNFTContract.balanceOf(await GangsterNFTContract.getAddress(), 1);
      expect(balance).to.be.equal(6);

      const balance1 = await GangsterNFTContract.balanceOf(acc1.address, 1);
      expect(balance1).to.be.equal(4);
      await GangsterNFTContract.connect(acc1).setApprovalForAll(await GangsterArenaContract.getAddress(), true);

      await GangsterArenaContract.connect(acc1).depositNFT(owner.address, 1, 3);

      await GangsterArenaContract.connect(acc1).depositNFT(acc1.address, 1, 1);

      const balance2 = await GangsterNFTContract.balanceOf(acc1.address, 1);
      expect(balance2).to.be.equal(0);

      const gangsterCount1 = await GangsterNFTContract.gangster(acc1.address);
      expect(gangsterCount1).to.be.equal(1);
      let data = {
        address: [],
        token: [],
        amount: [],
      };
      for (let i = 0; i < 10; i++) {
        timestamp = Math.floor(Date.now() / 1000);

        tokenId = 1;
        amount = 10;
        value = 1000n;
        nGangster = 10 + 10 * i;
        nonce = 1001 + i;
        bType = 1;
        referral = acc1.address;

        const message1 = ethers.solidityPackedKeccak256(
          // Array of types: declares the data types in the message.
          ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'address'],
          // Array of values: actual values of the parameters to be hashed.
          [owner.address, tokenId, amount, value, timestamp, nGangster, nonce, bType, referral]
        );
        const signature1 = await owner.signMessage(ethers.toBeArray(message1));
        const GAAddress = await GangsterArenaContract.getAddress();
        await token.approve(GAAddress, value * BASE_18);
        await GangsterArenaContract.buyGangster(
          tokenId,
          amount,
          value,
          timestamp,
          nGangster,
          nonce,
          bType,
          referral,
          signature1
        );

        data.address.push(owner.address);
        data.token.push(1);
        data.amount.push(10);
      }
      console.log('we are here 2');
      console.log({ data });
      const balance5 = await GangsterNFTContract.balanceOf(await GangsterNFTContract.getAddress(), 1);

      const s = await GangsterNFTContract.gangster(data.address[0]);
      console.log({ balance5, s });
      await GangsterArenaContract.burnNFT(data.address, 1, data.amount);
      console.log('we are here 3');
      const balance4 = await GangsterNFTContract.balanceOf(await GangsterNFTContract.getAddress(), 1);
      expect(balance4).to.be.equal(10);
      console.log('we are here 4');
      const gangsterCount2 = await GangsterNFTContract.gangster(acc1.address);
      expect(gangsterCount2).to.be.equal(1);

      await GangsterArenaContract.retired(123457);
    });
  });
  describe('Test WL mint', function () {
    it('deploy contract', async function () {
      const { GangsterNFTContract, GangsterArenaContract, token, owner, acc1 } = await loadFixture(
        deployStakingFixture
      );
      let timestamp = Math.floor(Date.now() / 1000);
      let tokenId = 1;
      let amount = 2;
      let value = 1000n;
      let nGangster = 0;
      let nonce = 1000;
      let bType = 2;
      let referral = acc1.address;

      const message = ethers.solidityPackedKeccak256(
        // Array of types: declares the data types in the message.
        ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'address'],
        // Array of values: actual values of the parameters to be hashed.
        [owner.address, tokenId, amount, value, timestamp, nGangster, nonce, bType, referral]
      );
      const signature = await owner.signMessage(ethers.toBeArray(message));
      const GAAddress = await GangsterArenaContract.getAddress();
      await token.approve(GAAddress, value * BASE_18);
      await GangsterArenaContract.buyGangster(
        tokenId,
        amount,
        value,
        timestamp,
        nGangster,
        nonce,
        bType,
        referral,
        signature
      );

      console.log('Here we are');

      const balance = await GangsterNFTContract.balanceOf(await GangsterNFTContract.getAddress(), 1);
      expect(balance).to.be.equal(2);
      const gangsterCount = await GangsterNFTContract.gangster(owner.address);
      expect(gangsterCount).to.be.equal(2);
    });
  });

  describe('Test buyGoon', function () {
    it('Using Transfer', async function () {
      const { GangsterNFTContract, GangsterArenaContract, token, owner, acc1 } = await loadFixture(
        deployStakingFixture
      );
      const GAAddress = await GangsterArenaContract.getAddress();
      await token.approve(GAAddress, 100500n * BASE_18);
      await token.transfer(GAAddress, 1005n * BASE_18);
    });

    it('Using contract', async function () {
      const { GangsterNFTContract, GangsterArenaContract, token, owner, acc1 } = await loadFixture(
        deployStakingFixture
      );
      const GAAddress = await GangsterArenaContract.getAddress();
      let tgoon = await GangsterArenaContract.tgoon();
      let timestamp = Math.floor(Date.now() / 1000);

      let message = ethers.solidityPackedKeccak256(
        // Array of types: declares the data types in the message.
        ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'string'],
        // Array of values: actual values of the parameters to be hashed.
        [acc1.address, 1, 1005n * BASE_18, tgoon, timestamp, 111, 'buyGoon']
      );
      let signature = await owner.signMessage(ethers.toBeArray(message));
      await token.connect(acc1).approve(GAAddress, 1005n * BASE_18);
      await GangsterArenaContract.connect(acc1).buyGoon(1, 1005n * BASE_18, tgoon, timestamp, 111, signature);

      tgoon = await GangsterArenaContract.tgoon();
      timestamp = Math.floor(Date.now() / 1000);
      message = ethers.solidityPackedKeccak256(
        // Array of types: declares the data types in the message.
        ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'string'],
        // Array of values: actual values of the parameters to be hashed.
        [acc1.address, 1, 10005n * BASE_18, tgoon, timestamp, 123456, 'buyGoon']
      );
      signature = await owner.signMessage(ethers.toBeArray(message));
      await token.connect(acc1).approve(GAAddress, 10005n * BASE_18);
      await GangsterArenaContract.connect(acc1).buyGoon(1, 10005n * BASE_18, tgoon, timestamp, 123456, signature);
    });
  });
});
