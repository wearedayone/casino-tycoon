DEPLOY GUIDE

0. Prepare

- Double check to ensure all .env.your_env files are ready
- Run script/tasks/generateGameConfig.js to get 2 game.config.json files in contract folder && script folder

1. Double check hardhat.config.js to ensure includes your network

2. Fill in secret keys in secrets.json for your network

- ensure that the secret key belongs to defaultAdmin wallet
- ensure that defaultAdmin wallet has enough eth for liquidity and gas fees

3. Override \_configs.reset.json into \_configs.json

4. Fill in these fields in \_configs.json

- defaultAdmin
- admin
- worker
- signer
- tokenAmountToLiquidity
- ethAmountToLiquidity

5. Run `npx hardhat run scripts/1.token.deploy.js --network [your_network]`
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
- pairdeployed: from `false` --> `true`
- liquidityAdded: from `false` --> `true`

6. Run `npx hardhat run scripts/2.nft.deploy.js --network [your_network]`
   If everything works well, the \_configs.json will change these fields

- nft: from '' --> nft address
- nftDeployed: from `false` --> `true`

7. Set up NFT collection on Opensea

8. Run `npx hardhat run scripts/3.game.deploy.js --network [your_network]`
   If everything works well, the \_configs.json will change these fields

- game: from '' --> game address
- gameDeployed: from `false` --> `true`
- contractCompleted: from `false` --> `true`

9. Double check

- every contract address in \_configs.json should be verified on your network
- every configs for token, nft, game contract should be applied correctly

10. Run `node scripts/4.exportAddress.js`
    --> copy file contracts.txt and paste to script/.env.your_env to generate seed data

11. Run seed script to create new season

12. Deploy app

- ssh to vps
- pull code
- update .env.your_env files if needed
- restart app, backend, listener, cronjob (need to restart listener every time start a new season)
