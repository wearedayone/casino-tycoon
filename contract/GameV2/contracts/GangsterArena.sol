// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import './Gangster.sol';
import './FIAT.sol';

contract GangsterArena is Ownable {
  FIAT private fiat;
  Gangster private gangsterNFT;

  mapping(uint256 => uint256) public tokenMaxSupply;
  mapping(uint256 => bytes32) public merkleRoot;
  mapping(address => bool) public playerAddess;
  mapping(address => uint256) public goons;
  mapping(address => uint256) public safeHouses;
  mapping(address => uint256) public claimToken;
  mapping(address => uint256) public lastUpdatedTimestamp;
  mapping(address => uint256) public lastClaimTimestamp;

  uint256 public totalGoonBought;
  uint256 public totalSafeHouseUpgraded;

  uint256 public MAX_PER_BATCH = 1;
  uint256 public MAX_PER_WALLET = 1;

  constructor(address fiatAddress, address gangterAddress) {
    fiat = FIAT(fiatAddress);
    gangsterNFT = Gangster(gangterAddress);
  }

  receive() external payable {}

  fallback() external payable {}

  function validateWhitelist(
    bytes32[] calldata merkleProof,
    uint256 tokenId,
    address sender
  ) private view returns (bool) {
    bytes32 leaf = keccak256(abi.encodePacked(sender));
    return MerkleProof.verify(merkleProof, merkleRoot[tokenId], leaf);
  }

  /**
  ***************************
  Public
  ***************************
   */

  function hireGangter(address to, uint256 tokenId, uint256 amount) public payable {
    // require whitelisted for genesis token
    uint256 maxSully = tokenMaxSupply[tokenId];
    require(maxSully != 0, 'Invalid token id');

    require(amount <= MAX_PER_BATCH, 'Max per batch reached');
    require(gangsterNFT.totalSupply(tokenId) + amount <= tokenMaxSupply[tokenId], 'Max supply reached');
    uint256 balance = gangsterNFT.balanceOf(to, tokenId);
    require(balance + amount <= MAX_PER_WALLET, 'Max per wallet reached');

    if (amount == 1) {
      gangsterNFT.mint(to, tokenId, 1, '');
      playerAddess[to] = true;
    }

    if (amount > 1) {
      uint256[] memory tokenIds = new uint256[](1);
      tokenIds[0] = tokenId;
      uint256[] memory amounts = new uint256[](1);
      amounts[0] = amount;
      gangsterNFT.mintBatch(to, tokenIds, amounts, '');
      playerAddess[to] = true;
    }
  }

  function hireGoon(address to, uint256 amount) public {
    goons[to] += amount;
    totalGoonBought += amount;
  }

  function upgradeSafeHouse(address to, uint256 level) public {
    safeHouses[to] += level;
    totalSafeHouseUpgraded += level;
  }

  function balance() public {}

  // function buyGangterWL(address to, bytes32[] calldata merkleProof, uint256 tokenId, uint256 amount) public payable {
  //   // require whitelisted for genesis token
  //   uint256 maxSully = tokenMaxSupply[tokenId];
  //   require(maxSully != 0, 'Invalid token id');
  //   require(mintedAddess[to] != true, 'Max per wallet reached');
  //   require(amount <= MAX_PER_BATCH, 'Max per batch reached');
  //   require(token.totalSupply(tokenId) + amount <= tokenMaxSupply[tokenId], 'Max supply reached');
  //   uint256 balance = token.balanceOf(to, tokenId);
  //   require(balance + amount <= MAX_PER_WALLET, 'Max per wallet reached');
  //   // validate whitelisted
  //   require(validateWhitelist(merkleProof, tokenId, to), 'Bad credential');

  //   if (amount == 1) {
  //     token.mint(to, tokenId, 1, '');
  //     mintedAddess[to] = true;
  //   }

  //   if (amount > 1) {
  //     uint256[] memory tokenIds = new uint256[](1);
  //     tokenIds[0] = tokenId;
  //     uint256[] memory amounts = new uint256[](1);
  //     amounts[0] = amount;
  //     token.mintBatch(to, tokenIds, amounts, '');
  //     mintedAddess[to] = true;
  //   }
  // }

  /**
  ***************************
  Customization for the contract
  ***************************
   */

  function setMerkleRoot(uint256 id, bytes32 _merkleRoot) public onlyOwner {
    merkleRoot[id] = _merkleRoot;
  }

  function setTokenMaxSupply(uint256[] calldata _tokenMaxSupplies) public onlyOwner {
    for (uint256 i = 0; i < _tokenMaxSupplies.length; i++) {
      tokenMaxSupply[i] = _tokenMaxSupplies[i];
    }
  }

  function setMaxPerBatch(uint256 _maxPerBatch) public onlyOwner {
    MAX_PER_BATCH = _maxPerBatch;
  }

  function setMaxPerWallet(uint256 _maxPerWallet) public onlyOwner {
    MAX_PER_WALLET = _maxPerWallet;
  }
}
