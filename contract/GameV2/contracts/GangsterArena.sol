// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';
import './Gangster.sol';
import './IGangsterArena.sol';

contract GangsterArena is Ownable, IGangsterArena {
  Gangster public token;
  uint256 public BASE_PRICE = 0.00069 ether;
  uint256 public MAX_PER_BATCH = 25;
  bool public gameClosed;
  mapping(uint256 => uint256) public tokenMaxSupply;
  mapping(address => bool) public mintedAddess;
  mapping(address => uint256) public gangster;

  constructor(address initialOwner, address gangsterAddress) Ownable(initialOwner) {
    token = Gangster(gangsterAddress);
  }

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
    require(!gameClosed, 'Game is closed');
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
    emit Mint(to, tokenId, amount);
  }

  function mintWL(address to, uint256 tokenId, uint256 amount, bytes32[] calldata merkleProof) external payable {
    require(!gameClosed, 'Game is closed');
  }

  function depositNFT(address to, uint256 tokenId, uint256 amount) external {
    require(!gameClosed, 'Game is closed');
    token.safeTransferFrom(msg.sender, address(this), tokenId, amount, '');
    gangster[to] += amount;
    emit Deposit(to, tokenId, amount);
  }

  function withdrawNFT(address to, uint256 tokenId, uint256 amount) external {
    require(!gameClosed, 'Game is closed');
    require(gangster[msg.sender] >= amount, 'Insufficient balance');
    token.safeTransferFrom(address(this), to, tokenId, amount, '');
    gangster[msg.sender] -= amount;
    emit Withdraw(to, tokenId, amount);
  }

  function burnNFT(address[] memory to, uint256[] memory tokenId, uint256[] memory amount) external onlyOwner {
    require(!gameClosed, 'Game is closed');
    require(to.length == tokenId.length && tokenId.length == amount.length, 'Input array is not match');
    for (uint256 i = 0; i < to.length; i++) {
      require(gangster[to[i]] >= amount[i], 'Invalid amount to burn');
    }

    for (uint256 i = 0; i < to.length; i++) {
      token.burn(address(this), tokenId[i], amount[i]);
      gangster[to[i]] -= amount[i];
    }
    emit Burn(to, tokenId, amount);
  }

  function withdraw() external onlyOwner {
    require(gameClosed, 'Game is not closed');
    require(address(this).balance > 0, 'Nothing to withdraw');
    address payable receiver = payable(msg.sender);
    receiver.transfer(address(this).balance);
  }

  function setWinner(address[] memory to, uint256[] memory points) external onlyOwner {
    require(gameClosed, 'Game is not closed');
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

  // internal function
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

  function setGameClosed(bool value) external onlyOwner {
    gameClosed = value;
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
