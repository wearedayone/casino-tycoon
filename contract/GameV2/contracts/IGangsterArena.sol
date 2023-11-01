// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGangsterArena {
  /// Event
  event Deposit(address to, uint256 tokenId, uint256 amount);
  event Withdraw(address to, uint256 tokenId, uint256 amount);
  event Burn(address[] to, uint256[] tokenId, uint256[] amount);

  /// Function
  function mint(address to, uint256 tokenId, uint256 amount) external payable;

  function mintWL(address to, uint256 tokenId, uint256 amount, bytes32[] calldata merkleProof) external payable;

  function depositNFT(address to, uint256 tokenId, uint256 amount) external;

  function withdrawNFT(address to, uint256 tokenId, uint256 amount) external;

  function burnNFT(address[] memory to, uint256[] memory tokenId, uint256[] memory amount) external;
}
