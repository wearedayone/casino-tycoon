DEPLOY GUIDE

---PRE_DEPLOYMENT---

0. Prepare

- input??
- Send ETH to defaultAdmin wallet to deployment && add liquidity
- Send ETH to worker wallet

- Double check to ensure all .env.your_env files are ready
- Double check all game config variables on gg sheet
- Run script/tasks/generateGameConfig.js to get 2 game.config.json files in contract folder && script folder

1. Double check hardhat.config.js to ensure includes your network

2. Fill in secret keys in secrets.json for your network

- ensure that the secret key belongs to defaultAdmin wallet
- key???
- ensure that defaultAdmin wallet has enough eth for liquidity and gas fees
- estimate?? (0.3eth)

3. Override \_configs.reset.json into \_configs.json

4. Fill in these fields in \_configs.json

- defaultAdmin
- admin
- worker
- signer
- tokenAmountToLiquidity
- ethAmountToLiquidity
- input???

5. Double check ENVIRONMENT variable in contract/GameV4/.env file to ensure we are deploying to correct environment

- use deployeed sc
- if ENVIRONMENT === staging, we will dpeloy our own swap contracts
- if ENVIRONMENT === production, we will use uniswap contracts

6. Run `npx hardhat run scripts/1.token.deploy.js --network [your_network]`
   If everything works well, the \_configs.json will change these fields

- token: from '' --> token address
- tokenDeployed: from `false` --> `true`
- uniWeth: from '' --> weth address
- uniFactory: from '' --> factory address
- uniRouter: from '' ---> router address
- wethDeployed: from `false` --> `true`
- factoryDeployed: from `false` --> `true`
- routerDeployed: from `false` --> `true`
- pair: from '' --> pair address
- pairDeployed: from `false` --> `true`
- liquidityAdded: from `false` --> `true`

7. Run `npx hardhat run scripts/2.nft.deploy.js --network [your_network]`
   If everything works well, the \_configs.json will change these fields

- nft: from '' --> nft address
- nftDeployed: from `false` --> `true`

8. Set up NFT collection on Opensea

- detailed

9. Run `npx hardhat run scripts/3.game.deploy.js --network [your_network]`
   If everything works well, the \_configs.json will change these fields

- game: from '' --> game address
- gameDeployed: from `false` --> `true`
- contractCompleted: from `false` --> `true`

10. Double check

- every contract address in \_configs.json should be verified on your network
- every configs for token, nft, game contract should be applied correctly (detailed fields)

11. Run `node scripts/4.exportAddress.js`
    --> copy file contracts.txt and paste to script/.env.your_env to generate seed data

---DEPLOYMENT---

12. Run seed script to create new season

13. Deploy app

- ssh to vps
- pull code
- update .env.your_env files if needed
- restart app, backend, listener, cronjob (need to restart listener every time start a new season)

- disabledUrls
- whitelitsted
