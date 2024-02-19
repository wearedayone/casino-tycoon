const fs = require('fs');
require('dotenv').config();
const { ethers } = require('hardhat');
const { ContractFactory, Contract, parseUnits, parseEther, formatEther } = require('ethers');

const factoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const routerArtifact = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const pairArtifact = require('@uniswap/v2-periphery/build/IUniswapV2Pair.json');
const WETH9 = require('../WETH9.json');

const _fiatAddress = process.env.FIAT;
const _factoryAddress = process.env.FACTORY;
const _wethAddress = process.env.WETH;
const _routerAddress = process.env.ROUTER;

async function main() {
  const _defaultAdmin = process.env.DefaultAdmin;

  const FIAT = await ethers.getContractFactory('FIAT');
  const fiatToken = FIAT.attach(_fiatAddress);
  const minterRole = await fiatToken.MINTER_ROLE();
  await fiatToken.grantRole(minterRole, _defaultAdmin);
  await fiatToken.mint(_defaultAdmin, parseEther('100000'));

  const Factory = await ethers.getContractFactory(factoryArtifact.abi, factoryArtifact.bytecode);
  const factoryContract = await Factory.attach(_factoryAddress);

  const Weth = await ethers.getContractFactory(WETH9.abi, WETH9.bytecode);
  // const weth = await Weth.attach(_wethAddress);

  const tx1 = await factoryContract.createPair(_fiatAddress, _wethAddress);
  await tx1.wait();

  const pairAddress = await factoryContract.getPair(_fiatAddress, _wethAddress);

  const Router = await ethers.getContractFactory(routerArtifact.abi, routerArtifact.bytecode);
  const router = await Router.attach(_routerAddress);

  console.log({ pairAddress });

  // add liquidity
  const tx2 = await fiatToken.approve(_routerAddress, parseEther('100000'));
  await tx2.wait();

  const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
  const addLiquidityTxn = await router.addLiquidityETH(
    _fiatAddress,
    parseEther('100000'),
    0,
    parseEther('0.1'),
    _defaultAdmin,
    deadline,
    {
      value: parseEther('0.1'),
    }
  );
  await addLiquidityTxn.wait();
  console.log('Add liquidity successfully');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
