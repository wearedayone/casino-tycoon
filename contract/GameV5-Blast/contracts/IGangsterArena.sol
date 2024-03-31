// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGangsterArena {
  /**
  ***************************
    Event
  ***************************
   */
  event Mint(address indexed to, uint256 tokenId, uint256 amount, uint256 nonce);
  event BuyGoon(address indexed to, uint256 amount, uint256 nonce);
  event BuySafeHouse(address indexed to, uint256 amount, uint256 nonce);
  event Deposit(address indexed to, uint256 tokenId, uint256 amount);
  event Withdraw(address indexed to, uint256 tokenId, uint256 amount);
  event Burn(address[] to, uint256[] tokenId, uint256[] amount);
  event BurnGoon(address[] to, uint256[] amount);
  event Retire(address to, uint256 reward, uint256 nonce);

  /**
  ***************************
    Function
  ***************************
   */

  /**
   * public send reward from ourside to contract (ex: from LP)
   *
   */
  function addReward(uint256 devFee, uint256 marketingFee, uint256 prizePool, uint256 retirePool) external payable;

  // /**
  //  * public mint when user buy gangster NFT
  //  *
  //  */
  // function mint(
  //   uint256 tokenId,
  //   uint256 amount,
  //   uint256 bonus,
  //   uint256 time,
  //   uint256 nonce,
  //   bytes memory sig
  // ) external payable;

  // /**
  //  * public referral mint when user buy gangster NFT
  //  */
  // function mintReferral(
  //   uint256 tokenId,
  //   uint256 amount,
  //   uint256 bonus,
  //   address referral,
  //   uint256 time,
  //   uint256 nonce,
  //   bytes memory sig
  // ) external payable;

  // /**
  //  * Whitelist mint when user buy gangster NFT
  //  */
  // function mintWL(
  //   uint256 tokenId,
  //   uint256 amount,
  //   uint256 bonus,
  //   uint256 time,
  //   uint256 nonce,
  //   bytes memory sig
  // ) external payable;

  /**
   * user deposit gangster NFTs
   */
  // function depositNFT(address to, uint256 tokenId, uint256 amount) external;

  // /**
  //  * Withdraw gangster NFTs
  //  */
  // function withdrawNFT(address to, uint256 tokenId, uint256 amount) external;

  /**
   * Burn gangster NFTs
   */
  function burnNFT(address[] memory to, uint256 tokenId, uint256[] memory amount) external;

  /**
   * user retire game
   */
  function retired(uint256 nonce) external;
}
