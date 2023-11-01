// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';
import './Gangster.sol';
import './IGangsterArena.sol';

contract GangsterArena is Ownable, IGangsterArena {
  Gangster private token;
  address private contractAddress;

  uint256 public BASE_PRICE = 0.069 ether;
  uint256 public MAX_PER_BATCH = 1000;

  mapping(uint256 => uint256) public tokenMaxSupply;
  mapping(address => bool) public mintedAddess;

  constructor(address initialOwner) Ownable(initialOwner) {}

  receive() external payable {}

  fallback() external payable {}

  /**
  ***************************
  Public
  ***************************
   */

  function getBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function mint(address to, uint256 tokenId, uint256 amount) public payable {
    // require whitelisted for genesis token
    uint256 maxSully = tokenMaxSupply[tokenId];
    require(maxSully != 0, 'Invalid token id');
    require(amount <= MAX_PER_BATCH, 'Max per batch reached');
    require(token.totalSupply(tokenId) + amount <= tokenMaxSupply[tokenId], 'Max supply reached');
    require(msg.value >= BASE_PRICE * amount, 'Need to send more ether');

    if (amount == 1) {
      token.mint(to, tokenId, 1, '');
      mintedAddess[to] = true;
    }

    if (amount > 1) {
      uint256[] memory tokenIds = new uint256[](1);
      tokenIds[0] = tokenId;
      uint256[] memory amounts = new uint256[](1);
      amounts[0] = amount;
      token.mintBatch(to, tokenIds, amounts, '');
      mintedAddess[to] = true;
    }
  }

  /**
  ***************************
  Customization for the contract
  ***************************
   */

  function setContractAddress(address payable _address) external onlyOwner {
    contractAddress = _address;
    token = Gangster(_address);
  }

  function setTokenMaxSupply(uint256[] calldata _tokenMaxSupplies) public onlyOwner {
    for (uint256 i = 0; i < _tokenMaxSupplies.length; i++) {
      tokenMaxSupply[i] = _tokenMaxSupplies[i];
    }
  }

  function setMaxPerBatch(uint256 _maxPerBatch) public onlyOwner {
    MAX_PER_BATCH = _maxPerBatch;
  }
}
