const { ethers } = require('hardhat');
const { formatEther } = require('ethers');

const routerArtifact = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const pairArtifact = require('@uniswap/v2-periphery/build/IUniswapV2Pair.json');

const { readConfigs } = require('./_utils');

async function main() {
  console.log('adding liquidity');

  const { defaultAdmin, token, uniRouter, pair } = readConfigs();

  const Router = await ethers.getContractFactory(routerArtifact.abi, routerArtifact.bytecode);
  const routerContract = Router.attach(uniRouter);

  const PairFactory = await ethers.getContractFactory(pairArtifact.abi, pairArtifact.bytecode);
  const pairContract = PairFactory.attach(pair);

  const balance = await pairContract.balanceOf(defaultAdmin);
  console.log({ defaultAdmin, token, uniRouter, pair, balance: formatEther(balance) });

  const tx = await pairContract.approve(uniRouter, balance);
  await tx.wait();

  const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
  const addLiquidityTxn = await routerContract.removeLiquidityETH(token, balance, 0, 0, defaultAdmin, deadline);
  await addLiquidityTxn.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
