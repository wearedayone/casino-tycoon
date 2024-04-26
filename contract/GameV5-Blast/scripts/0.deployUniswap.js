const fs = require('fs');
const { ethers } = require('hardhat');
const { ContractFactory, Contract, parseUnits, parseEther, formatEther } = require('ethers');

const factoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const routerArtifact = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const pairArtifact = require('@uniswap/v2-periphery/build/IUniswapV2Pair.json');
const WETH9 = require('../WETH9.json');

const _fiatAddress = '0x589c6835C21c51Bf297a7DdD7aEAb134c5a11858';

async function main() {
  const _defaultAdmin = '0x7866Ac3933dCA99b2e9a80F8948344a387a7BF62';

  const FIAT = await ethers.getContractFactory('GREED');
  const fiatToken = FIAT.attach(_fiatAddress);
  const minterRole = await fiatToken.MINTER_ROLE();
  await fiatToken.grantRole(minterRole, _defaultAdmin);
  await fiatToken.mint(_defaultAdmin, parseEther('100000'));

  const Factory = await ethers.getContractFactory(factoryArtifact.abi, factoryArtifact.bytecode);
  const factoryContract = await Factory.deploy(_defaultAdmin);
  const factoryContractAddress = await factoryContract.getAddress();

  const Weth = await ethers.getContractFactory(WETH9.abi, WETH9.bytecode);
  const weth = await Weth.deploy();
  const wethAddress = await weth.getAddress();

  const tx1 = await factoryContract.createPair(_fiatAddress, wethAddress);
  await tx1.wait();

  const pairAddress = await factoryContract.getPair(_fiatAddress, wethAddress);

  const Router = await ethers.getContractFactory(routerArtifact.abi, routerArtifact.bytecode);
  const router = await Router.deploy(factoryContractAddress, wethAddress);
  const routerAddress = await router.getAddress();

  console.log({ wethAddress, factoryContractAddress, pairAddress, routerAddress });

  // add liquidity
  const tx2 = await fiatToken.approve(routerAddress, parseEther('500000'));
  await tx2.wait();

  const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
  const addLiquidityTxn = await router.addLiquidityETH(
    _fiatAddress,
    parseEther('500000'),
    0,
    parseEther('1'),
    _defaultAdmin,
    deadline,
    {
      value: parseEther('1'),
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
