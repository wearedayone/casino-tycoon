// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';
import './Gangster.sol';
import './IGangsterArena.sol';

contract GangsterArena is Ownable, IGangsterArena {
  Gangster private token;
  address private contractAddress;

  uint256 public BASE_PRICE = 0.00069 ether;
  uint256 public MAX_PER_BATCH = 1000;

  mapping(uint256 => uint256) public tokenMaxSupply;
  mapping(address => bool) public mintedAddess;
  mapping(address => uint256) public goon;
  mapping(address => uint256) public gangster;
  mapping(address => uint256) public building;

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
    require(amount != 0, 'Invalid amount');
    require(amount <= MAX_PER_BATCH, 'Max per batch reached');
    require(token.totalSupply(tokenId) + amount <= tokenMaxSupply[tokenId], 'Max supply reached');
    require(msg.value >= BASE_PRICE * amount, 'Need to send more ether');

    if (amount == 1) {
      token.mint(address(this), tokenId, 1, '');
      gangster[to] += 1;
    }

    if (amount > 1) {
      uint256[] memory tokenIds = new uint256[](1);
      tokenIds[0] = tokenId;
      uint256[] memory amounts = new uint256[](1);
      amounts[0] = amount;
      token.mintBatch(address(this), tokenIds, amounts, '');
      gangster[to] += amount;
    }
    if (!mintedAddess[to]) mintedAddess[to] = true;
  }

  function mintWL(address to, uint256 tokenId, uint256 amount, bytes32[] calldata merkleProof) external payable {}

  function depositNFT(address from, uint256 tokenId, uint256 amount) external {
    token.safeTransferFrom(msg.sender, address(this), tokenId, amount, '');
    gangster[from] += amount;
  }

  function withdrawNFT(address to, uint256 tokenId, uint256 amount) external {
    require(gangster[msg.sender] >= amount, 'Insufficient balance');
    token.safeTransferFrom(address(this), to, tokenId, amount, '');
    gangster[msg.sender] -= amount;
  }

  function burnNFT(address[] memory to, uint256[] memory tokenId, uint256[] memory amount) external onlyOwner {
    for (uint256 i = 0; i < to.length; i++) {
      token.burn(address(this), tokenId[i], amount[i]);
      gangster[to[i]] -= amount[i];
    }
  }

  function withdraw() external onlyOwner {
    require(address(this).balance > 0, 'Nothing to withdraw');
    address payable receiver = payable(msg.sender);
    receiver.transfer(address(this).balance);
  }

  function setWinner(address[] memory to, uint256[] memory points) external onlyOwner {
    require(address(this).balance > 0, 'Nothing to withdraw');
    require(to.length == points.length, 'Invalid input array length');

    uint256 total = reduce(points);
    require(total > 0, 'Invalid points input');

    for (uint256 i = 0; i < to.length; i++) {
      address payable receiver = payable(to[i]);
      uint256 reward = (address(this).balance * points[i]) / total;
      receiver.transfer(reward);
    }
  }

  function onERC1155Received(
    address operator,
    address from,
    uint256 id,
    uint256 value,
    bytes calldata data
  ) external returns (bytes4) {
    return bytes4(keccak256('onERC1155Received(address,address,uint256,uint256,bytes)'));
  }

  //
  function reduce(uint256[] memory arr) internal pure returns (uint256 result) {
    for (uint256 i = 0; i < arr.length; i++) {
      result += arr[i];
    }
    return result;
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

  function setBasePrice(uint256 _basePrice) public onlyOwner {
    BASE_PRICE = _basePrice;
  }
}
