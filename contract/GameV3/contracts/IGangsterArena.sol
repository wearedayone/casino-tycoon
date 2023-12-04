// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGangsterArena {
  /// Event
  event Mint(address to, uint256 tokenId, uint256 amount);
  event BuyGoon(address to, uint256 amount, uint256 nonce);
  event BuySafeHouse(address to, uint256 amount, uint256 nonce);
  event Deposit(address to, uint256 tokenId, uint256 amount);
  event Withdraw(address to, uint256 tokenId, uint256 amount);
  event Burn(address[] to, uint256[] tokenId, uint256[] amount);

  /// Function
  function mint(uint256 tokenId, uint256 amount) external payable;

  function mintReferral(
    uint256 tokenId,
    uint256 amount,
    uint256 nonce,
    address referral,
    bytes memory sig
  ) external payable;

  function mintWL(uint256 tokenId, uint256 amount, uint256 nonce, bytes memory sig) external payable;

  function depositNFT(address to, uint256 tokenId, uint256 amount) external;

  function withdrawNFT(address to, uint256 tokenId, uint256 amount) external;

  function burnNFT(address[] memory to, uint256[] memory tokenId, uint256[] memory amount) external;
}
