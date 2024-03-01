require('dotenv').config();
const { ethers } = require('hardhat');
const { parseEther } = require('ethers');

const factoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const routerArtifact = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const WETH9 = require('../WETH9.json');

const { readConfigs, updateConfigs, readProductionConfigs, verifyContract } = require('./_utils');

const deployToken = async () => {
  console.log('deploying token...');
  const configs = readConfigs();
  const { defaultAdmin, worker } = configs;
  const FIAT = await ethers.getContractFactory('FIAT');
  const FIATToken = await FIAT.deploy(defaultAdmin, worker);
  const tokenAddress = await FIATToken.getAddress();

  await verifyContract({ address: tokenAddress, constructorArguments: [defaultAdmin, worker] });

  updateConfigs({
    token: tokenAddress,
    tokenDeployed: true,
  });
  console.log(`token is deployed to ${tokenAddress}`);
};

const deployUniswapContract = async () => {
  console.log('deploying uniswap smart contract...');

  if (process.env.ENVIRONMENT === 'production') {
    console.log('Production environment, use Uniswap contracts from _configs.uniswap.production.json');
    const productionConfigs = readProductionConfigs();
    const { uniWeth, uniFactory, uniRouter } = productionConfigs;
    updateConfigs({
      uniWeth,
      uniFactory,
      uniRouter,
      wethDeployed: true,
      factoryDeployed: true,
      routerDeployed: true,
    });
  } else {
    console.log('Staging environment, deploy our own Uniswap contracts');
    const configs = readConfigs();
    const { defaultAdmin } = configs;

    const Weth = await ethers.getContractFactory(WETH9.abi, WETH9.bytecode);
    const weth = await Weth.deploy();
    const wethAddress = await weth.getAddress();
    await verifyContract({ address: wethAddress, constructorArguments: [] });
    updateConfigs({ uniWeth: wethAddress, wethDeployed: true });

    const Factory = await ethers.getContractFactory(factoryArtifact.abi, factoryArtifact.bytecode);
    const factory = await Factory.deploy(defaultAdmin);
    const factoryAddress = await factory.getAddress();
    await verifyContract({ address: factoryAddress, constructorArguments: [defaultAdmin] });
    updateConfigs({ uniFactory: factoryAddress, factoryDeployed: true });

    const Router = await ethers.getContractFactory(routerArtifact.abi, routerArtifact.bytecode);
    const router = await Router.deploy(factoryAddress, wethAddress);
    const routerAddress = await router.getAddress();
    await verifyContract({ address: routerAddress, constructorArguments: [factoryAddress, wethAddress] });
    updateConfigs({ uniRouter: routerAddress, routerDeployed: true });
  }

  const configs = readConfigs();
  const { uniWeth, uniFactory, uniRouter } = configs;
  console.log(`
    uniswap sc are deployed.
    weth: ${uniWeth},
    factory: ${uniFactory},
    router: ${uniRouter}
  `);
};

const deployPair = async () => {
  console.log('deploying liquidity pair');
  const { weth, factory, token } = readConfigs();

  const Factory = await ethers.getContractFactory(factoryArtifact.abi, factoryArtifact.bytecode);
  const factoryContract = Factory.attach(factory);

  const tx = await factoryContract.createPair(token, weth);
  await tx.wait();

  const pairAddress = await factoryContract.getPair(token, weth);
  updateConfigs({ pair: pairAddress, pairDeployed: true });

  const { pair } = readConfigs();
  console.log(`liquidity pair is deployed to ${pair}`);
};

const addLiquidity = async () => {
  console.log('adding liquidity');

  const { defaultAdmin, token, router, tokenAmountToLiquidity, ethAmountToLiquidity } = readConfigs();
  const FIAT = await ethers.getContractFactory('FIAT');
  const fiatToken = FIAT.attach(token);
  const minterRole = await fiatToken.MINTER_ROLE();
  await fiatToken.grantRole(minterRole, defaultAdmin);
  await fiatToken.mint(defaultAdmin, parseEther(`${tokenAmountToLiquidity}`));

  const Router = await ethers.getContractFactory(routerArtifact.abi, routerArtifact.bytecode);
  const routerContract = Router.attach(router);
  const tx = await fiatToken.approve(router, parseEther(`${tokenAmountToLiquidity}`));
  await tx.wait();

  const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
  const addLiquidityTxn = await routerContract.addLiquidityETH(
    token,
    parseEther(`${tokenAmountToLiquidity}`),
    0,
    parseEther(`${ethAmountToLiquidity}`),
    defaultAdmin,
    deadline,
    {
      value: parseEther(`${ethAmountToLiquidity}`),
    }
  );
  await addLiquidityTxn.wait();

  updateConfigs({ liquidityAdded: true });
  console.log(`
    liquidity is added.
    Token in pool: ${tokenAmountToLiquidity},
    ETH in pool: ${ethAmountToLiquidity}
  `);
};

const main = async () => {
  try {
    await deployToken();
    await deployUniswapContract();
    await deployPair();
    await addLiquidity();
  } catch (err) {
    console.error(err);
  }

  process.exit();
};

main();
