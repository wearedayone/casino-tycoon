const fs = require('fs');

const { readConfigs } = require('./_utils');

const main = () => {
  const { token, nft, game, uniRouter, uniWeth, pair } = readConfigs();

  const content = `
TOKEN_ADDRESS=${token}
NFT_ADDRESS=${nft}
GAME_CONTRACT_ADDRESS=${game}
ROUTER_ADDRESS=${uniRouter}
WETH_ADDRESS=${uniWeth}
PAIR_ADDRESS=${pair}
  `;

  fs.writeFileSync(`${__dirname}/../contracts.txt`, content, { encoding: 'utf-8' });
};

main();
