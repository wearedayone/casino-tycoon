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
const nftPrice = 1000000000000000n;

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

    const Token = await ethers.getContractFactory('FIAT');
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
      const nftPrice = 69000000000000000n;
      await token.mint(owner.address, nftPrice);

      const message = ethers.solidityPackedKeccak256(
        // Array of types: declares the data types in the message.
        ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
        // Array of values: actual values of the parameters to be hashed.
        [owner.address, 1, 10, 1, 1]
      );
      const signature = await owner.signMessage(ethers.toBeArray(message));

      await GangsterArenaContract.mint(1, 10, 1, 1, signature, { from: owner.address, value: nftPrice * 10n });

      const balance = await GangsterNFTContract.balanceOf(await GangsterArenaContract.getAddress(), 1);
      expect(balance).to.be.equal(10);
      const gangsterCount = await GangsterArenaContract.gangster(owner.address);
      expect(gangsterCount).to.be.equal(10);
    });
  });

  describe('Withdraw NFT', function () {
    it('deploy contract', async function () {
      const { GangsterNFTContract, GangsterArenaContract, token, owner, acc1 } = await loadFixture(
        deployStakingFixture
      );
      const nftPrice = 1000000000000000n;
      const message1 = ethers.solidityPackedKeccak256(
        // Array of types: declares the data types in the message.
        ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
        // Array of values: actual values of the parameters to be hashed.
        [owner.address, 1, 10, 1, 1]
      );
      const signature1 = await owner.signMessage(ethers.toBeArray(message1));

      await GangsterArenaContract.mint(1, 10, 1, 1, signature1, { from: owner.address, value: nftPrice * 10n });

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
      let data = {
        address: [],
        token: [],
        amount: [],
      };

      for (let i = 0; i < 100; i++) {
        const message = ethers.solidityPackedKeccak256(
          // Array of types: declares the data types in the message.
          ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
          // Array of values: actual values of the parameters to be hashed.
          [acc1.address, 1, 25, i, i + 2]
        );
        const signature = await owner.signMessage(ethers.toBeArray(message));
        await GangsterArenaContract.connect(acc1).mint(1, 25, i, i + 2, signature, {
          from: acc1.address,
          value: nftPrice * 25n,
        });
        data.address.push(acc1.address);
        data.token.push(1);
        data.amount.push(25);
      }

      let message = ethers.solidityPackedKeccak256(
        // Array of types: declares the data types in the message.
        ['address[]', 'uint256[]', 'uint256[]'],
        // Array of values: actual values of the parameters to be hashed.
        [data.address, data.token, data.amount]
      );
      let signature = await owner.signMessage(ethers.toBeArray(message));

      await GangsterArenaContract.burnNFT(data.address, data.token, data.amount, signature);
      await GangsterArenaContract.burnGoon(data.address, data.amount);

      const balance4 = await GangsterNFTContract.balanceOf(await GangsterArenaContract.getAddress(), 1);
      expect(balance4).to.be.equal(10);

      const gangsterCount2 = await GangsterArenaContract.gangster(acc1.address);
      expect(gangsterCount2).to.be.equal(1);
    });
  });
  describe('Test WL mint', function () {
    it('deploy contract', async function () {
      const { GangsterNFTContract, GangsterArenaContract, token, owner, acc1 } = await loadFixture(
        deployStakingFixture
      );

      const message = ethers.solidityPackedKeccak256(
        // Array of types: declares the data types in the message.
        ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
        // Array of values: actual values of the parameters to be hashed.
        [acc1.address, 1, 2, 3, 4]
      );
      const signature = await owner.signMessage(ethers.toBeArray(message));

      await GangsterArenaContract.connect(acc1).mintWL(1, 2, 3, 4, signature, {
        from: acc1.address,
        value: nftPrice * 2n,
      });

      console.log('Here we are');

      const balance = await GangsterNFTContract.balanceOf(await GangsterArenaContract.getAddress(), 1);
      expect(balance).to.be.equal(2);
      const gangsterCount = await GangsterArenaContract.gangster(acc1.address);
      expect(gangsterCount).to.be.equal(2);

      const message1 = ethers.solidityPackedKeccak256(
        // Array of types: declares the data types in the message.
        ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
        // Array of values: actual values of the parameters to be hashed.
        [acc1.address, 1, 3, 3, 3]
      );
      const signature1 = await owner.signMessage(ethers.toBeArray(message1));

      await GangsterArenaContract.connect(acc1).mintWL(1, 3, 3, 3, signature1, {
        from: acc1.address,
        value: nftPrice * 3n,
      });
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

      let message = ethers.solidityPackedKeccak256(
        // Array of types: declares the data types in the message.
        ['address', 'uint256', 'uint256', 'uint256'],
        // Array of values: actual values of the parameters to be hashed.
        [acc1.address, 1, 1005n * BASE_18, 111]
      );
      let signature = await owner.signMessage(ethers.toBeArray(message));
      await token.connect(acc1).approve(GAAddress, 1005000n * BASE_18);
      await GangsterArenaContract.connect(acc1).buyGoon(1, 1005n * BASE_18, 111, signature);

      message = ethers.solidityPackedKeccak256(
        // Array of types: declares the data types in the message.
        ['address', 'uint256', 'uint256', 'uint256'],
        // Array of values: actual values of the parameters to be hashed.
        [acc1.address, 1, 10005n * BASE_18, 123456]
      );
      signature = await owner.signMessage(ethers.toBeArray(message));

      await GangsterArenaContract.connect(acc1).buyGoon(1, 10005n * BASE_18, 123456, signature);
    });
  });
});
