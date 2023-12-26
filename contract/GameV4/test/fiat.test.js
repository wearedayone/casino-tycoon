/* eslint-disable jest/valid-expect */
/* eslint-disable no-unused-expressions */
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
require('chai').use(require('chai-as-promised')).should();

const { ContractFactory, Contract, parseUnits, parseEther } = require('ethers');
const factoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const routerArtifact = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const pairArtifact = require('@uniswap/v2-periphery/build/IUniswapV2Pair.json');
const WETH9 = require('../WETH9.json');

const TOKEN_PER_ACCOUNT = 1000000000n;
const BASE_18 = 1000000000000000000n;

describe('FIAT', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  const deployStakingFixture = async () => {
    const accounts = await ethers.getSigners();
    const [ownerWallet, teamWallet, revShareWallet, userWallet] = accounts;

    const Token = await ethers.getContractFactory('FIAT');
    const token = await Token.deploy(ownerWallet.address, teamWallet.address, revShareWallet.address);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    // console.log('Token: ', tokenAddress);

    const promises = [
      token.mint(ownerWallet.address, TOKEN_PER_ACCOUNT * BASE_18),
      token.mint(userWallet.address, TOKEN_PER_ACCOUNT * BASE_18),
    ];

    await Promise.all(promises);

    // deploy uniswap contracts
    const Factory = new ContractFactory(factoryArtifact.abi, factoryArtifact.bytecode, ownerWallet);
    const factory = await Factory.deploy(ownerWallet.address);
    const factoryAddress = await factory.getAddress();
    // console.log('Factory: ', factoryAddress);

    const Weth = new ContractFactory(WETH9.abi, WETH9.bytecode, ownerWallet);
    const weth = await Weth.deploy();
    const wethAddress = await weth.getAddress();
    // console.log('WETH: ', wethAddress);

    const tx1 = await factory.createPair(tokenAddress, wethAddress);
    await tx1.wait();

    const pairAddress = await factory.getPair(tokenAddress, wethAddress);
    // console.log('Pair: ', pairAddress);

    const pair = new Contract(pairAddress, pairArtifact.abi, ownerWallet);
    const reserves = await pair.getReserves();
    console.log('Reserves: ', reserves);

    const Router = new ContractFactory(routerArtifact.abi, routerArtifact.bytecode, ownerWallet);
    const router = await Router.deploy(factoryAddress, wethAddress);
    const routerAddress = await router.getAddress();
    // console.log('Router: ', routerAddress);

    const tokenAmount = parseUnits('1000000');
    const ethAmount = parseUnits('10');
    const deadline = Math.floor(Date.now() / 1000 + 10 * 60);

    const approveTx = await token.approve(routerAddress, ethers.MaxUint256);
    await approveTx.wait();

    // const ownerBalance = await ethers.provider.getBalance(ownerWallet.address);
    // console.log('Owner balance: ', ownerBalance);

    const addLiquidityTxn = await router
      .connect(ownerWallet)
      .addLiquidityETH(tokenAddress, tokenAmount, 0, 0, ownerWallet.address, deadline, {
        value: ethAmount,
      });
    await addLiquidityTxn.wait();

    // const newOwnerBalance = await ethers.provider.getBalance(ownerWallet.address);
    // console.log('New owner balance: ', newOwnerBalance);

    const newReserves = await pair.getReserves();
    console.log('New reserves: ', newReserves);

    return {
      token,
      tokenAddress,
      factory,
      factoryAddress,
      weth,
      wethAddress,
      router,
      routerAddress,
      pair,
      pairAddress,
      ownerWallet,
      teamWallet,
      revShareWallet,
      userWallet,
    };
  };

  describe('deployment', function () {
    it('deploy contract', async function () {
      const { token, tokenAddress, ownerWallet, teamWallet, revShareWallet } = await loadFixture(deployStakingFixture);

      expect(tokenAddress).not.to.be.undefined;

      const teamWalletAddress = await token.teamWallet();
      expect(teamWalletAddress).to.equal(teamWallet.address);

      const revShareWalletAddress = await token.revShareWallet();
      expect(revShareWalletAddress).to.equal(revShareWallet.address);

      const swapTokensAtAmount = await token.swapTokensAtAmount();
      expect(swapTokensAtAmount).to.equal(1000000000000000000000n);

      const totalFees = await token.totalFees();
      expect(totalFees).to.equal(50);

      const revShareFee = await token.revShareFee();
      expect(revShareFee).to.equal(20);

      const liquidityFee = await token.liquidityFee();
      expect(liquidityFee).to.equal(10);

      const teamFee = await token.teamFee();
      expect(teamFee).to.equal(20);

      const burnFee = await token.burnFee();
      expect(burnFee).to.equal(0);

      const tokensForRevShare = await token.tokensForRevShare();
      expect(tokensForRevShare).to.equal(0);

      const tokensForLiquidity = await token.tokensForLiquidity();
      expect(tokensForLiquidity).to.equal(0);

      const tokensForTeam = await token.tokensForTeam();
      expect(tokensForTeam).to.equal(0);

      const isZeroAddressExcludedFromFee = await token.isExcludedFromFees(ethers.ZeroAddress);
      expect(isZeroAddressExcludedFromFee).to.equal(true);

      const isTokenAddressExcludedFromFee = await token.isExcludedFromFees(tokenAddress);
      expect(isTokenAddressExcludedFromFee).to.equal(true);

      const isOwnerWalletAddressExcludedFromFee = await token.isExcludedFromFees(ownerWallet.address);
      expect(isOwnerWalletAddressExcludedFromFee).to.equal(true);

      const isTeamWalletAddressExcludedFromFee = await token.isExcludedFromFees(teamWallet.address);
      expect(isTeamWalletAddressExcludedFromFee).to.equal(true);

      const isRevShareWalletAddressExcludedFromFee = await token.isExcludedFromFees(revShareWallet.address);
      expect(isRevShareWalletAddressExcludedFromFee).to.equal(true);
    });
  });

  describe('set up', function () {
    it('set up token contract', async function () {
      const { token, routerAddress, pairAddress, userWallet } = await loadFixture(deployStakingFixture);

      // change uniswap addresses
      await token.updateUniswapAddresses(pairAddress, routerAddress);
      const tokenPairAddress = await token.uniswapV2Pair();
      expect(tokenPairAddress).to.equal(pairAddress);

      // change swap token at amount
      await token.updateSwapTokensAtAmount(BASE_18);
      const swapTokensAtAmount = await token.swapTokensAtAmount();
      expect(swapTokensAtAmount).to.equal(BASE_18);

      // change fees
      await token.updateFees(100, 50, 30, 20);
      const totalFees = await token.totalFees();
      expect(totalFees).to.equal(200);

      const revShareFee = await token.revShareFee();
      expect(revShareFee).to.equal(100);

      const liquidityFee = await token.liquidityFee();
      expect(liquidityFee).to.equal(50);

      const teamFee = await token.teamFee();
      expect(teamFee).to.equal(30);

      const burnFee = await token.burnFee();
      expect(burnFee).to.equal(20);

      // change excludes from fees
      await token.excludeFromFees(userWallet.address, true);
      const isUserWalletAddressExcludedFromFee = await token.isExcludedFromFees(userWallet.address);
      expect(isUserWalletAddressExcludedFromFee).to.equal(true);

      // change wallets
      await token.updateRevShareWallet(userWallet.address);
      const revShareWalletAddress = await token.revShareWallet();
      expect(revShareWalletAddress).to.equal(userWallet.address);

      // change team wallet
      await token.updateTeamWallet(userWallet.address);
      const teamWalletAddress = await token.teamWallet();
      expect(teamWalletAddress).to.equal(userWallet.address);
    });
  });

  describe('transactions', function () {
    it('transfer', async function () {
      const {
        token,
        tokenAddress,
        factory,
        factoryAddress,
        weth,
        wethAddress,
        router,
        routerAddress,
        pair,
        pairAddress,
        ownerWallet,
        teamWallet,
        revShareWallet,
        userWallet,
      } = await loadFixture(deployStakingFixture);

      await token.updateUniswapAddresses(pairAddress, routerAddress);

      const senderBalanceBefore = await token.balanceOf(userWallet.address);
      const receiverBalanceBefore = await token.balanceOf(teamWallet.address);
      const amount = parseUnits('100');
      await token.connect(userWallet).transfer(teamWallet.address, amount);
      const senderBalanceAfter = await token.balanceOf(userWallet.address);
      const receiverBalanceAfter = await token.balanceOf(teamWallet.address);

      expect(senderBalanceBefore - senderBalanceAfter).to.equal(amount);
      expect(receiverBalanceAfter - receiverBalanceBefore).to.equal(amount);
    });

    it('swap eth to token no burn', async function () {
      const {
        token,
        tokenAddress,
        factory,
        factoryAddress,
        weth,
        wethAddress,
        router,
        routerAddress,
        pair,
        pairAddress,
        ownerWallet,
        teamWallet,
        revShareWallet,
        userWallet,
      } = await loadFixture(deployStakingFixture);

      await token.updateUniswapAddresses(pairAddress, routerAddress);

      const tokenBalanceBefore = await token.balanceOf(tokenAddress);

      const paths = [wethAddress, tokenAddress];
      const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
      const ethAmount = parseUnits('1');
      const amountOut = await router.getAmountsOut(ethAmount, paths);

      const userTokenBalanceBeforeSwapping = await token.balanceOf(userWallet.address);
      const userEthBalanceBeforeSwapping = await ethers.provider.getBalance(userWallet.address);
      const beforeTokensForRevShare = await token.tokensForRevShare();
      const beforeTokensForLiquidity = await token.tokensForLiquidity();
      const beforeTokensForTeam = await token.tokensForTeam();

      const txn = await router
        .connect(userWallet)
        .swapExactETHForTokensSupportingFeeOnTransferTokens(0, paths, userWallet.address, deadline, {
          value: ethAmount,
        });
      const receipt = await txn.wait();

      const tokenBalanceAfter = await token.balanceOf(tokenAddress);
      const tokenReceived = tokenBalanceAfter - tokenBalanceBefore;

      const percentage = tokenReceived / amountOut[1];

      const totalFees = await token.totalFees();
      const totalFeesInNumber = totalFees / BigInt(1000);
      expect(percentage).to.equal(totalFeesInNumber);

      const fees = (totalFees * amountOut[1]) / BigInt(1000);

      const userTokenBalanceAfterSwapping = await token.balanceOf(userWallet.address);
      expect(userTokenBalanceAfterSwapping).to.equal(userTokenBalanceBeforeSwapping + amountOut[1] - fees);

      const revShareFee = await token.revShareFee();
      const revShareTokens = (fees * revShareFee) / totalFees;
      const tokensForRevShare = await token.tokensForRevShare();
      expect(revShareTokens).to.equal(tokensForRevShare - beforeTokensForRevShare);

      const liquidityFee = await token.liquidityFee();
      const liquidityTokens = (fees * liquidityFee) / totalFees;
      const tokensForLiquidity = await token.tokensForLiquidity();
      expect(liquidityTokens).to.equal(tokensForLiquidity - beforeTokensForLiquidity);

      const teamFee = await token.teamFee();
      const teamTokens = (fees * teamFee) / totalFees;
      const tokensForTeam = await token.tokensForTeam();
      expect(teamTokens).to.equal(tokensForTeam - beforeTokensForTeam);

      const burnFee = await token.burnFee();
      const burnTokens = Math.floor(Number((fees * burnFee) / totalFees / BigInt(1e18)));
      const tokensForBurn = Math.floor(Number(fees - revShareTokens - liquidityTokens - teamTokens) / 1e18);
      expect(burnTokens).to.equal(tokensForBurn);

      const userEthBalanceAfterSwapping = await ethers.provider.getBalance(userWallet.address);
      expect(userEthBalanceAfterSwapping).to.equal(
        userEthBalanceBeforeSwapping - receipt.gasUsed * receipt.gasPrice - ethAmount
      );
    });

    it('swap eth to token includes burning', async function () {
      const {
        token,
        tokenAddress,
        factory,
        factoryAddress,
        weth,
        wethAddress,
        router,
        routerAddress,
        pair,
        pairAddress,
        ownerWallet,
        teamWallet,
        revShareWallet,
        userWallet,
      } = await loadFixture(deployStakingFixture);

      await token.updateUniswapAddresses(pairAddress, routerAddress);
      await token.updateFees(20, 10, 20, 10);

      const tokenBalanceBefore = await token.balanceOf(tokenAddress);

      const paths = [wethAddress, tokenAddress];
      const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
      const ethAmount = parseUnits('1');
      const amountOut = await router.getAmountsOut(ethAmount, paths);

      const userTokenBalanceBeforeSwapping = await token.balanceOf(userWallet.address);
      const userEthBalanceBeforeSwapping = await ethers.provider.getBalance(userWallet.address);
      const beforeTokensForRevShare = await token.tokensForRevShare();
      const beforeTokensForLiquidity = await token.tokensForLiquidity();
      const beforeTokensForTeam = await token.tokensForTeam();

      const txn = await router
        .connect(userWallet)
        .swapExactETHForTokensSupportingFeeOnTransferTokens(0, paths, userWallet.address, deadline, {
          value: ethAmount,
        });
      const receipt = await txn.wait();

      const tokenBalanceAfter = await token.balanceOf(tokenAddress);
      const tokenReceived = tokenBalanceAfter - tokenBalanceBefore;

      const percentage = tokenReceived / amountOut[1];

      const totalFees = await token.totalFees();
      const totalFeesInNumber = totalFees / BigInt(1000);
      expect(percentage).to.equal(totalFeesInNumber);

      const fees = (totalFees * amountOut[1]) / BigInt(1000);

      const userTokenBalanceAfterSwapping = await token.balanceOf(userWallet.address);
      expect(userTokenBalanceAfterSwapping).to.equal(userTokenBalanceBeforeSwapping + amountOut[1] - fees);

      const revShareFee = await token.revShareFee();
      const revShareTokens = (fees * revShareFee) / totalFees;
      const tokensForRevShare = await token.tokensForRevShare();
      expect(revShareTokens).to.equal(tokensForRevShare - beforeTokensForRevShare);

      const liquidityFee = await token.liquidityFee();
      const liquidityTokens = (fees * liquidityFee) / totalFees;
      const tokensForLiquidity = await token.tokensForLiquidity();
      expect(liquidityTokens).to.equal(tokensForLiquidity - beforeTokensForLiquidity);

      const teamFee = await token.teamFee();
      const teamTokens = (fees * teamFee) / totalFees;
      const tokensForTeam = await token.tokensForTeam();
      expect(teamTokens).to.equal(tokensForTeam - beforeTokensForTeam);

      const burnFee = await token.burnFee();
      const burnTokens = Math.floor(Number((fees * burnFee) / totalFees / BigInt(1e18)));
      const tokensForBurn = Math.floor(Number(fees - revShareTokens - liquidityTokens - teamTokens) / 1e18);
      expect(burnTokens).to.equal(tokensForBurn);

      const userEthBalanceAfterSwapping = await ethers.provider.getBalance(userWallet.address);
      expect(userEthBalanceAfterSwapping).to.equal(
        userEthBalanceBeforeSwapping - receipt.gasUsed * receipt.gasPrice - ethAmount
      );
    });

    it('swap token to eth no burn', async function () {
      const {
        token,
        tokenAddress,
        factory,
        factoryAddress,
        weth,
        wethAddress,
        router,
        routerAddress,
        pair,
        pairAddress,
        ownerWallet,
        teamWallet,
        revShareWallet,
        userWallet,
      } = await loadFixture(deployStakingFixture);

      await token.updateUniswapAddresses(pairAddress, routerAddress);

      const tokenBalanceBefore = await token.balanceOf(tokenAddress);

      const paths = [tokenAddress, wethAddress];
      const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
      const tokenAmount = parseUnits('1000');

      const userTokenBalanceBeforeSwapping = await token.balanceOf(userWallet.address);
      const userEthBalanceBeforeSwapping = await ethers.provider.getBalance(userWallet.address);
      const beforeTokensForRevShare = await token.tokensForRevShare();
      const beforeTokensForLiquidity = await token.tokensForLiquidity();
      const beforeTokensForTeam = await token.tokensForTeam();

      const approveTxn = await token.connect(userWallet).approve(routerAddress, ethers.MaxUint256);
      const receipt1 = await approveTxn.wait();

      const totalFees = await token.totalFees();
      const fees = (totalFees * tokenAmount) / BigInt(1000);

      const amountOut = await router.getAmountsOut(tokenAmount - fees, paths);

      const txn = await router
        .connect(userWallet)
        .swapExactTokensForETHSupportingFeeOnTransferTokens(tokenAmount, 0, paths, userWallet.address, deadline);
      const receipt2 = await txn.wait();

      const userTokenBalanceAfterSwapping = await token.balanceOf(userWallet.address);
      expect(userTokenBalanceAfterSwapping).to.equal(userTokenBalanceBeforeSwapping - tokenAmount);

      const tokenBalanceAfter = await token.balanceOf(tokenAddress);
      const tokenReceived = tokenBalanceAfter - tokenBalanceBefore;

      const percentage = tokenReceived / tokenAmount;

      const totalFeesInNumber = totalFees / BigInt(1000);
      expect(percentage).to.equal(totalFeesInNumber);

      const revShareFee = await token.revShareFee();
      const revShareTokens = (fees * revShareFee) / totalFees;
      const tokensForRevShare = await token.tokensForRevShare();
      expect(revShareTokens).to.equal(tokensForRevShare - beforeTokensForRevShare);

      const liquidityFee = await token.liquidityFee();
      const liquidityTokens = (fees * liquidityFee) / totalFees;
      const tokensForLiquidity = await token.tokensForLiquidity();
      expect(liquidityTokens).to.equal(tokensForLiquidity - beforeTokensForLiquidity);

      const teamFee = await token.teamFee();
      const teamTokens = (fees * teamFee) / totalFees;
      const tokensForTeam = await token.tokensForTeam();
      expect(teamTokens).to.equal(tokensForTeam - beforeTokensForTeam);

      const burnFee = await token.burnFee();
      const burnTokens = Math.floor(Number((fees * burnFee) / totalFees / BigInt(1e18)));
      const tokensForBurn = Math.floor(Number(fees - tokensForRevShare - tokensForLiquidity - tokensForTeam) / 1e18);
      expect(burnTokens).to.equal(tokensForBurn);

      // const amountOut0 = await router.getAmountsOut(tokenAmount, paths);
      const userEthBalanceAfterSwapping = await ethers.provider.getBalance(userWallet.address);
      expect(userEthBalanceAfterSwapping).to.equal(
        userEthBalanceBeforeSwapping -
          receipt1.gasUsed * receipt1.gasPrice -
          receipt2.gasUsed * receipt2.gasPrice +
          amountOut[1]
      );
    });

    it('swap token to eth includes burning', async function () {
      const {
        token,
        tokenAddress,
        factory,
        factoryAddress,
        weth,
        wethAddress,
        router,
        routerAddress,
        pair,
        pairAddress,
        ownerWallet,
        teamWallet,
        revShareWallet,
        userWallet,
      } = await loadFixture(deployStakingFixture);

      await token.updateUniswapAddresses(pairAddress, routerAddress);
      await token.updateFees(20, 10, 20, 10);

      const tokenBalanceBefore = await token.balanceOf(tokenAddress);

      const paths = [tokenAddress, wethAddress];
      const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
      const tokenAmount = parseUnits('1000');

      const userTokenBalanceBeforeSwapping = await token.balanceOf(userWallet.address);
      const userEthBalanceBeforeSwapping = await ethers.provider.getBalance(userWallet.address);
      const beforeTokensForRevShare = await token.tokensForRevShare();
      const beforeTokensForLiquidity = await token.tokensForLiquidity();
      const beforeTokensForTeam = await token.tokensForTeam();

      const approveTxn = await token.connect(userWallet).approve(routerAddress, ethers.MaxUint256);
      const receipt1 = await approveTxn.wait();

      const totalFees = await token.totalFees();
      const fees = (totalFees * tokenAmount) / BigInt(1000);
      const amountOut = await router.getAmountsOut(tokenAmount - fees, paths);

      const txn = await router
        .connect(userWallet)
        .swapExactTokensForETHSupportingFeeOnTransferTokens(tokenAmount, 0, paths, userWallet.address, deadline);
      const receipt2 = await txn.wait();

      const userTokenBalanceAfterSwapping = await token.balanceOf(userWallet.address);
      expect(userTokenBalanceAfterSwapping).to.equal(userTokenBalanceBeforeSwapping - tokenAmount);

      const tokenBalanceAfter = await token.balanceOf(tokenAddress);
      const tokenReceived = tokenBalanceAfter - tokenBalanceBefore;

      const percentage = tokenReceived / tokenAmount;

      const totalFeesInNumber = totalFees / BigInt(1000);
      expect(percentage).to.equal(totalFeesInNumber);

      const revShareFee = await token.revShareFee();
      const revShareTokens = (fees * revShareFee) / totalFees;
      const tokensForRevShare = await token.tokensForRevShare();
      expect(revShareTokens).to.equal(tokensForRevShare - beforeTokensForRevShare);

      const liquidityFee = await token.liquidityFee();
      const liquidityTokens = (fees * liquidityFee) / totalFees;
      const tokensForLiquidity = await token.tokensForLiquidity();
      expect(liquidityTokens).to.equal(tokensForLiquidity - beforeTokensForLiquidity);

      const teamFee = await token.teamFee();
      const teamTokens = (fees * teamFee) / totalFees;
      const tokensForTeam = await token.tokensForTeam();
      expect(teamTokens).to.equal(tokensForTeam - beforeTokensForTeam);

      const burnFee = await token.burnFee();
      const burnTokens = Math.floor(Number((fees * burnFee) / totalFees / BigInt(1e18)));
      const tokensForBurn = Math.floor(Number(fees - tokensForRevShare - tokensForLiquidity - tokensForTeam) / 1e18);
      expect(burnTokens).to.equal(tokensForBurn);

      const userEthBalanceAfterSwapping = await ethers.provider.getBalance(userWallet.address);
      expect(userEthBalanceAfterSwapping).to.equal(
        userEthBalanceBeforeSwapping -
          receipt1.gasUsed * receipt1.gasPrice -
          receipt2.gasUsed * receipt2.gasPrice +
          amountOut[1]
      );
    });

    it('swap token to eth swapback', async function () {
      const {
        token,
        tokenAddress,
        factory,
        factoryAddress,
        weth,
        wethAddress,
        router,
        routerAddress,
        pair,
        pairAddress,
        ownerWallet,
        teamWallet,
        revShareWallet,
        userWallet,
      } = await loadFixture(deployStakingFixture);

      await token.updateUniswapAddresses(pairAddress, routerAddress);

      // init a txn to swapback in next txn
      const paths = [tokenAddress, wethAddress];
      const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
      const tokenAmount = parseUnits('1000');

      const approveTxn = await token.connect(userWallet).approve(routerAddress, ethers.MaxUint256);
      await approveTxn.wait();

      const txn = await router
        .connect(userWallet)
        .swapExactTokensForETHSupportingFeeOnTransferTokens(tokenAmount, 0, paths, userWallet.address, deadline);
      await txn.wait();

      const tokensForRevShare = await token.tokensForRevShare();
      const tokensForLiquidity = await token.tokensForLiquidity();
      const tokensForTeam = await token.tokensForTeam();
      const totalTokensToSwap = tokensForRevShare + tokensForLiquidity + tokensForTeam;

      const tokenContractBalance = await token.balanceOf(tokenAddress);
      const liquidityTokens = (tokenContractBalance * tokensForLiquidity) / totalTokensToSwap;
      const amountToSwapForETH = tokenContractBalance - liquidityTokens;
      const amountOut = await router.getAmountsOut(amountToSwapForETH, paths);

      const ethForTeam = (amountOut[1] * tokensForTeam) / totalTokensToSwap;
      const ethForLiquidity = (amountOut[1] * tokensForLiquidity) / totalTokensToSwap;
      const ethForRevShare = amountOut[1] - ethForTeam - ethForLiquidity;

      const teamWalletETHBalanceBefore = await ethers.provider.getBalance(teamWallet.address);
      const revShareWalletETHBalanceBefore = await ethers.provider.getBalance(revShareWallet.address);
      const reservesBefore = await pair.getReserves();

      // start a txn to trigger swapback
      await token.updateSwapTokensAtAmount(0);
      const totalFees = await token.totalFees();
      const fees = (totalFees * tokenAmount) / BigInt(1000);
      const amountOut1 = await router.getAmountsOut(tokenAmount - fees, paths);
      const txn1 = await router
        .connect(userWallet)
        .swapExactTokensForETHSupportingFeeOnTransferTokens(tokenAmount, 0, paths, userWallet.address, deadline);
      await txn1.wait();

      // swap should be trigger already this time
      const teamWalletETHBalanceAfter = await ethers.provider.getBalance(teamWallet.address);
      expect(teamWalletETHBalanceAfter).to.equal(teamWalletETHBalanceBefore + ethForTeam);

      const revShareWalletETHBalanceAfter = await ethers.provider.getBalance(revShareWallet.address);
      expect(revShareWalletETHBalanceAfter).to.equal(revShareWalletETHBalanceBefore + ethForRevShare);

      console.log('test', liquidityTokens, ethForLiquidity);
      const reservesAfter = await pair.getReserves();
      // expect(reservesAfter[0]).to.equal(
      //   reservesBefore[0] + tokensForLiquidity + (tokenAmount * (BigInt(1000) - totalFees)) / BigInt(1000)
      // );
      // expect(reservesAfter[1]).to.equal(reservesBefore[1] + ethForLiquidity - amountOut[1] - amountOut1[1]);

      const teamFee = await token.teamFee();
      const liquidityFee = await token.liquidityFee();
      const revShareFee = await token.revShareFee();

      const newTokensForTeam = await token.tokensForTeam();
      const newTokensForLiquidity = await token.tokensForLiquidity();
      const newTokensForRevShare = await token.tokensForRevShare();

      expect(newTokensForTeam).to.equal((teamFee * tokenAmount) / BigInt(1000));
      expect(newTokensForLiquidity).to.equal((liquidityFee * tokenAmount) / BigInt(1000));
      expect(newTokensForRevShare).to.equal((revShareFee * tokenAmount) / BigInt(1000));
    });
  });
});
