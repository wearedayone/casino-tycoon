/* eslint-disable jest/valid-expect */
/* eslint-disable no-unused-expressions */
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
require('chai').use(require('chai-as-promised')).should();

const { parseEther } = require('ethers');

describe('Deposit', function () {
  const deployDepositLayers = async () => {
    const accounts = await ethers.getSigners();
    const [ownerWallet] = accounts;

    const DepositLayerL1 = await ethers.getContractFactory('DepositLayerL1');
    const depositLayerL1 = await DepositLayerL1.deploy(ownerWallet.address);
    await depositLayerL1.waitForDeployment();
    const depositLayerL1Address = await depositLayerL1.getAddress();

    const DepositLayerL2 = await ethers.getContractFactory('DepositLayerL2');
    const depositLayerL2 = await DepositLayerL2.deploy(ownerWallet.address);
    await depositLayerL2.waitForDeployment();
    const depositLayerL2Address = await depositLayerL2.getAddress();

    return {
      ownerWallet,
      accounts,
      depositLayerL1,
      depositLayerL1Address,
      depositLayerL2,
      depositLayerL2Address,
    };
  };

  describe('deployment', function () {
    it('deploy contract', async function () {
      const { depositLayerL1Address, depositLayerL2Address } = await loadFixture(deployDepositLayers);

      expect(depositLayerL1Address).not.to.be.undefined;
      expect(depositLayerL2Address).not.to.be.undefined;
    });
  });

  describe('submitDepositProposal', function () {
    it('submit deposit proposal', async function () {
      const { accounts, depositLayerL1, depositLayerL1Address } = await loadFixture(deployDepositLayers);

      const scEthBalance = await ethers.provider.getBalance(depositLayerL1Address);
      expect(scEthBalance).to.equal(parseEther('0'));

      const depositAmount = parseEther('2');

      const tx = await depositLayerL1.submitDepositProposal(accounts[1].address, { value: depositAmount });
      const receipt = await tx.wait();

      const { logs } = receipt;
      const { data, topics } = logs[0];
      const decodedData = depositLayerL1.interface.decodeEventLog('DepositProposalCreated', data, topics);
      const receiver = decodedData[0];
      const amount = decodedData[1];
      expect(receiver).to.equal(accounts[1].address);
      expect(amount).to.equal(depositAmount);

      const scEthBalanceAfter = await ethers.provider.getBalance(depositLayerL1Address);
      expect(scEthBalanceAfter).to.equal(depositAmount);
    });

    it('approve deposit proposal', async function () {
      const { accounts, depositLayerL2 } = await loadFixture(deployDepositLayers);

      const ethBalance = await ethers.provider.getBalance(accounts[1].address);
      const depositAmount = parseEther('2');

      const tx = await depositLayerL2.approveDepositProposal(accounts[1].address, { value: depositAmount });
      const receipt = await tx.wait();

      const { logs } = receipt;
      const { data, topics } = logs[0];
      const decodedData = depositLayerL2.interface.decodeEventLog('DepositProposalApproved', data, topics);
      const receiver = decodedData[0];
      const amount = decodedData[1];
      expect(receiver).to.equal(accounts[1].address);
      expect(amount).to.equal(depositAmount);

      const ethBalanceAfter = await ethers.provider.getBalance(accounts[1].address);
      expect(ethBalanceAfter).to.equal(ethBalance + depositAmount);
    });
  });
});
