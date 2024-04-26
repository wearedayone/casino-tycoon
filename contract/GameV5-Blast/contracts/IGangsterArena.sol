// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGangsterArena {
  /**
  ***************************
    Event
  ***************************
   */
  event BuyGangster(address indexed to, uint256 tokenId, uint256 amount, uint256 nonce);
  event BuyGoon(address indexed to, uint256 amount, uint256 nonce);
  event BuySafeHouse(address indexed to, uint256 amount, uint256 nonce);
  event DailySpin(address indexed to, uint256 spinType, uint256 amount, uint256 value, uint256 nonce);
  event Deposit(address indexed to, uint256 tokenId, uint256 amount);
  event Withdraw(address indexed to, uint256 tokenId, uint256 amount);
  event Burn(address[] to, uint256[] tokenId, uint256[] amount);
  event BurnGoon(address[] to, uint256[] amount);
  event Retire(address to, uint256 reward, uint256 nonce);
  event WarResult(address[] addr, uint256[] _lGang, uint256[] _wToken);

  /**
  ***************************
    Function
  ***************************
   */

  /**
   * public send reward from ourside to contract (ex: from LP)
   *
   */
  function addReward(uint256 devValue, uint256 burnValue, uint256 rankPrize, uint256 reputationPrize) external payable;

  function buyGangster(
    uint256 amount,
    uint256 value,
    uint256 time,
    uint256 nGangster,
    uint256 nonce,
    uint256 bType,
    bytes memory sig
  ) external;

  function buyAsset(
    uint256 _typeA,
    uint256 _amount,
    uint256 _value,
    uint256 _lastB,
    uint256 _sTime,
    uint256 _nonce,
    bytes memory _sig
  ) external;

  function depositNFT(address to, uint256 amount) external;

  function withdrawNFT(address to, uint256 amount) external;

  function finalWarResult(address[] memory addr, uint256[] memory _lGang, uint256[] memory _wToken) external;

  function setWinner(address[] memory to, uint256[] memory points) external;

  /**
   * user retire game
   */
  function retired(address to, uint256 payout, uint256 nonce) external;
}
