// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';

import './Gangster.sol';
import './FIAT.sol';
import './IGangsterArena.sol';

import 'hardhat/console.sol';

contract GangsterArena is Ownable, IGangsterArena {
  Gangster public tokenNFT;
  FIAT public tokenFiat;
  address private signerAddress;

  uint256 public BASE_PRICE = 0.00069 ether;
  uint256 public BASE_PRICE_WL = 0.00042 ether;
  uint256 public BASE_REFERRAL = 10;
  uint256 public BASE_REFERRAL_DISCOUNT = 90;
  uint256 public MAX_PER_BATCH = 20;
  uint256 public MAX_PER_WL = 20;
  bool public gameClosed;

  mapping(uint256 => uint256) public tokenMaxSupply;
  mapping(address => bool) public mintedAddess;
  mapping(address => uint256) public mintedAddessWL;
  mapping(address => uint256) public gangster;
  mapping(uint256 => bool) usedNonces;

  constructor(
    address initialOwner,
    address _signerAddress,
    address gangsterAddress,
    address fiatAddress
  ) Ownable(initialOwner) {
    tokenNFT = Gangster(gangsterAddress);
    tokenFiat = FIAT(fiatAddress);
    signerAddress = _signerAddress;
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

  function mint(uint256 tokenId, uint256 amount) public payable {
    // require whitelisted for genesis token
    require(msg.value >= BASE_PRICE * amount, 'Need to send more ether');
    mintNFT(tokenId, amount);
  }

  function mintReferral(
    uint256 tokenId,
    uint256 amount,
    uint256 nonce,
    address referral,
    bytes memory sig
  ) public payable {
    // require whitelisted for genesis token
    require(!usedNonces[nonce], 'Invalid nonce');
    bytes32 message = prefixed(keccak256(abi.encodePacked(msg.sender, tokenId, amount, nonce, referral)));
    require(verifyAddressSigner(message, sig), 'Invalid signature');
    require(msg.value >= (BASE_PRICE * BASE_REFERRAL_DISCOUNT * amount) / 100, 'Need to send more ether');
    mintNFT(tokenId, amount);
    usedNonces[nonce] = true;
  }

  function mintWL(uint256 tokenId, uint256 amount, uint256 nonce, bytes memory sig) external payable {
    // require whitelisted for genesis token
    require(msg.value >= BASE_PRICE_WL * amount, 'Need to send more ether');
    require(mintedAddessWL[msg.sender] + amount <= MAX_PER_WL, 'Max whitelisted perwallet reached');
    require(!usedNonces[nonce], 'Invalid nonce');
    bytes32 message = prefixed(keccak256(abi.encodePacked(msg.sender, tokenId, amount, nonce)));
    require(verifyAddressSigner(message, sig), 'Invalid signature');
    mintNFT(tokenId, amount);
    usedNonces[nonce] = true;
    mintedAddessWL[msg.sender] += amount;
  }

  function buyGoon(uint256 amount, uint256 value, uint256 nonce, bytes memory sig) public {
    require(!gameClosed, 'Game is closed');
    bytes32 message = prefixed(keccak256(abi.encodePacked(msg.sender, amount, value, nonce)));
    require(verifyAddressSigner(message, sig), 'Invalid signature');
    tokenFiat.transferFrom(msg.sender, address(this), value);
    emit BuyGoon(msg.sender, amount, nonce);
  }

  function buySafeHouse(uint256 amount, uint256 value, uint256 nonce, bytes memory sig) public {
    require(!gameClosed, 'Game is closed');
    bytes32 message = prefixed(keccak256(abi.encodePacked(msg.sender, amount, value, nonce)));
    require(verifyAddressSigner(message, sig), 'Invalid signature');
    tokenFiat.transferFrom(msg.sender, address(this), value);
    emit BuySafeHouse(msg.sender, amount, nonce);
  }

  function depositNFT(address to, uint256 tokenId, uint256 amount) external {
    require(!gameClosed, 'Game is closed');
    tokenNFT.safeTransferFrom(msg.sender, address(this), tokenId, amount, '');
    gangster[to] += amount;
    emit Deposit(to, tokenId, amount);
  }

  function withdrawNFT(address to, uint256 tokenId, uint256 amount) external {
    require(gangster[msg.sender] >= amount, 'Insufficient balance');
    tokenNFT.safeTransferFrom(address(this), to, tokenId, amount, '');
    gangster[msg.sender] -= amount;
    emit Withdraw(msg.sender, tokenId, amount);
  }

  function burnNFT(address[] memory to, uint256[] memory tokenId, uint256[] memory amount) external onlyOwner {
    require(!gameClosed, 'Game is closed');
    require(to.length == tokenId.length && tokenId.length == amount.length, 'Input array is not match');
    for (uint256 i = 0; i < to.length; i++) {
      require(gangster[to[i]] >= amount[i], 'Invalid amount to burn');
    }

    for (uint256 i = 0; i < to.length; i++) {
      tokenNFT.burn(address(this), tokenId[i], amount[i]);
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

  function setBasePriceWL(uint256 _basePrice) public onlyOwner {
    BASE_PRICE_WL = _basePrice;
  }

  function setBaseReferral(uint256 _refferral) public onlyOwner {
    BASE_REFERRAL = _refferral;
  }

  function setBaseReferralDiscount(uint256 refferral_discount) public onlyOwner {
    BASE_REFERRAL_DISCOUNT = refferral_discount;
  }

  function setMaxPerWL(uint256 _maxPerWL) public onlyOwner {
    MAX_PER_WL = _maxPerWL;
  }

  /**
  ***************************
  Internal Function
  ***************************
   */

  /**
   * @notice Verify signature
   */
  function verifyAddressSigner(bytes32 message, bytes memory sig) internal view returns (bool) {
    return signerAddress == recoverSignerFromSignature(message, sig);
  }

  //function to get the public address of the signer
  function recoverSignerFromSignature(bytes32 message, bytes memory sig) internal pure returns (address) {
    require(sig.length == 65);

    uint8 v;
    bytes32 r;
    bytes32 s;

    assembly {
      // first 32 bytes, after the length prefix
      r := mload(add(sig, 32))
      // second 32 bytes
      s := mload(add(sig, 64))
      // final byte (first byte of the next 32 bytes)
      v := byte(0, mload(add(sig, 96)))
    }

    return ecrecover(message, v, r, s);
  }

  // Builds a prefixed hash to mimic the behavior of eth_sign.
  function prefixed(bytes32 _hashedMessage) internal pure returns (bytes32) {
    bytes memory prefix = '\x19Ethereum Signed Message:\n32';
    bytes32 prefixedHashMessage = keccak256(abi.encodePacked(prefix, _hashedMessage));
    return prefixedHashMessage;
  }

  /**
   * @notice sum of array
   */
  function reduce(uint256[] memory arr) internal pure returns (uint256 result) {
    for (uint256 i = 0; i < arr.length; i++) {
      result += arr[i];
    }
    return result;
  }

  /**
   * @notice common logic for minting
   */
  function mintNFT(uint256 tokenId, uint256 amount) private {
    // require whitelisted for genesis token
    require(!gameClosed, 'Game is closed');
    uint256 maxSully = tokenMaxSupply[tokenId];
    require(maxSully != 0, 'Invalid token id');
    require(amount != 0, 'Invalid amount');
    require(amount <= MAX_PER_BATCH, 'Max per batch reached');
    require(tokenNFT.totalSupply(tokenId) + amount <= tokenMaxSupply[tokenId], 'Max supply reached');
    if (amount == 1) {
      tokenNFT.mint(address(this), tokenId, 1, '');
      gangster[msg.sender] += 1;
    }

    if (amount > 1) {
      uint256[] memory tokenIds = new uint256[](1);
      tokenIds[0] = tokenId;
      uint256[] memory amounts = new uint256[](1);
      amounts[0] = amount;
      tokenNFT.mintBatch(address(this), tokenIds, amounts, '');
      gangster[msg.sender] += amount;
    }
    if (!mintedAddess[msg.sender]) mintedAddess[msg.sender] = true;
    uint256 fiatReserve = tokenFiat.balanceOf(address(this));
    uint256 bonus = ((100 ** amount - 99 ** amount) * fiatReserve) / (100 ** amount);
    tokenFiat.transfer(msg.sender, bonus);
    emit Mint(msg.sender, tokenId, amount);
  }
}
