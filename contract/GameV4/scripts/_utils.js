const fs = require('fs');
const { run } = require('hardhat');

const readConfigs = () => {
  const configs = fs.readFileSync(`${__dirname}/_configs.json`, { encoding: 'utf-8' });
  return JSON.parse(configs);
};

const updateConfigs = (additionalConfigs) => {
  const configs = readConfigs();
  const newConfigs = { ...configs, ...additionalConfigs };
  fs.writeFileSync(`${__dirname}/_configs.json`, JSON.stringify(newConfigs), { encoding: 'utf-8' });
};

const readProductionConfigs = () => {
  const configs = fs.readFileSync(`${__dirname}/_configs.uniswap.production.json`, { encoding: 'utf-8' });
  return JSON.parse(configs);
};

const verifyContract = async ({ address, constructorArguments }) => {
  try {
    await run('verify:verify', {
      address,
      constructorArguments,
    });
  } catch (err) {
    console.error(err.message);
  }
};

module.exports = {
  readConfigs,
  updateConfigs,
  readProductionConfigs,
  verifyContract,
};
