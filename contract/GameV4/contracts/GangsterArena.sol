// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import '@openzeppelin/contracts/access/AccessControl.sol';
import './Gangster.sol';
import './FIAT.sol';
import './IGangsterArena.sol';

contract GangsterArena is AccessControl, IGangsterArena {
  Gangster public tokenNFT;
  FIAT public tokenFiat;
  address private signerAddress;
  bytes32 public constant WORKER_ROLE = keccak256('WORKER_ROLE');
  bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');

  uint256 public BASE_PRICE = 0.001 ether;
  uint256 public BASE_PRICE_WL = 0.001 ether;
  uint256 public BASE_REFERRAL = 10;
  uint256 public BASE_REFERRAL_DISCOUNT = 90;
  uint256 public MAX_PER_BATCH = 25;
  uint256 public MAX_PER_WL = 20;
  uint256 public BONUS_FIAT = 10;

  bool public gameClosed;
  bool public lockNFT;

  mapping(uint256 => uint256) public tokenMaxSupply;
  mapping(address => bool) public mintedAddess;
  mapping(address => uint256) public mintedAddessWL;
  mapping(address => uint256) public gangster;
  mapping(uint256 => bool) usedNonces;

  constructor(
    address _defaultAdmin,
    address _adminAddress,
    address _workerAddress,
    address _signerAddress,
    address _gangsterAddress,
    address _fiatAddress
  ) {
    tokenNFT = Gangster(_gangsterAddress);
    tokenFiat = FIAT(_fiatAddress);
    signerAddress = _signerAddress;

    _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
    _grantRole(ADMIN_ROLE, _adminAddress);
    _grantRole(WORKER_ROLE, _workerAddress);
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

  /**
   * @notice Normal buy gangster
   */
  function mint(uint256 tokenId, uint256 amount) public payable {
    require(msg.value >= BASE_PRICE * amount, 'Need to send more ether');
    mintNFT(tokenId, amount);
  }

  /**
   * @notice Buy gangster with referral
   */
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
    //TODO: update payout for referree
  }

  /**
   * @notice Buy gangster with referral
   */
  function mintWL(uint256 tokenId, uint256 amount, uint256 nonce, bytes memory sig) public payable {
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

  /**
   * @notice Buy Goon
   */
  function buyGoon(uint256 amount, uint256 value, uint256 nonce, bytes memory sig) public {
    require(!gameClosed, 'Game is closed');
    bytes32 message = prefixed(keccak256(abi.encodePacked(msg.sender, amount, value, nonce)));
    require(verifyAddressSigner(message, sig), 'Invalid signature');
    tokenFiat.transferFrom(msg.sender, address(this), value);
    emit BuyGoon(msg.sender, amount, nonce);
  }

  /**
   * @notice Buy Safehouse
   */
  function buySafeHouse(uint256 amount, uint256 value, uint256 nonce, bytes memory sig) public {
    require(!gameClosed, 'Game is closed');
    bytes32 message = prefixed(keccak256(abi.encodePacked(msg.sender, amount, value, nonce)));
    require(verifyAddressSigner(message, sig), 'Invalid signature');
    tokenFiat.transferFrom(msg.sender, address(this), value);
    emit BuySafeHouse(msg.sender, amount, nonce);
  }

  /**
   * @notice depositNFT
   */
  function depositNFT(address to, uint256 tokenId, uint256 amount) public {
    require(!gameClosed, 'Game is closed');
    tokenNFT.safeTransferFrom(msg.sender, address(this), tokenId, amount, '');
    gangster[to] += amount;
    emit Deposit(to, tokenId, amount);
  }

  /**
   * @notice withdrawNFT
   */
  function withdrawNFT(address to, uint256 tokenId, uint256 amount) public {
    require(!lockNFT, 'NFT is locked');
    require(gangster[msg.sender] >= amount, 'Insufficient balance');
    tokenNFT.safeTransferFrom(address(this), to, tokenId, amount, '');
    gangster[msg.sender] -= amount;
    emit Withdraw(msg.sender, tokenId, amount);
  }

  /**
   * @notice Burn NFT for gangwar
   */
  function burnNFT(
    address[] memory to,
    uint256[] memory tokenId,
    uint256[] memory amount
  ) public onlyRole(WORKER_ROLE) {
    require(!gameClosed, 'Game is closed');
    require(to.length == tokenId.length && tokenId.length == amount.length, 'Input array is not match');
    for (uint256 i = 0; i < to.length; i++) {
      require(gangster[to[i]] >= amount[i], 'Invalid amount to burn');
    }

    uint256 total = reduce(amount);
    tokenNFT.burn(address(this), tokenId[0], total);
    for (uint256 i = 0; i < to.length; i++) {
      gangster[to[i]] -= amount[i];
    }
    emit Burn(to, tokenId, amount);
  }

  /**
   * @notice Burn goon for gangwar
   */
  function burnGoon(address[] memory to, uint256[] memory amount) public onlyRole(WORKER_ROLE) {
    require(!gameClosed, 'Game is closed');
    require(to.length == amount.length, 'Input array is not match');
    emit BurnGoon(to, amount);
  }

  /**
   * @notice update winners and payout
   */
  function setWinner(address[] memory to, uint256[] memory points) public onlyRole(WORKER_ROLE) {
    require(gameClosed, 'Game is not closed');
    require(address(this).balance > 0, 'Nothing to withdraw');
    require(to.length == points.length, 'Invalid input array length');

    uint256 total = reduce(points);
    require(total > 0, 'Invalid points input');
    uint256 totalBalance = address(this).balance;
    for (uint256 i = 0; i < to.length; i++) {
      address payable receiver = payable(to[i]);
      uint256 reward = (totalBalance * points[i]) / total;
      if (reward > 0) receiver.transfer(reward);
    }
  }

  /**
   * @notice set game close status
   */
  function setGameClosed(bool value) public onlyRole(WORKER_ROLE) {
    gameClosed = value;
  }

  /**
   * @notice set NFT Lock flag - use to prevent withdraw nft when calculate gangwar result
   */
  function setLockNFT(bool value) public onlyRole(WORKER_ROLE) {
    lockNFT = value;
  }

  /**
   * @notice ERC1155 receiver
   */
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
  Customization for the contract (ADMIN_ROLE)
  ***************************
   */

  /**
   * @notice set Token Max Supply - default [0,1000]
   */
  function setTokenMaxSupply(uint256[] calldata _tokenMaxSupplies) public onlyRole(ADMIN_ROLE) {
    for (uint256 i = 0; i < _tokenMaxSupplies.length; i++) {
      tokenMaxSupply[i] = _tokenMaxSupplies[i];
    }
  }

  /**
   * @notice set Max per batch
   */
  function setMaxPerBatch(uint256 _maxPerBatch) public onlyRole(ADMIN_ROLE) {
    MAX_PER_BATCH = _maxPerBatch;
  }

  /**
   * @notice set Base Price Gangster
   */
  function setBasePrice(uint256 _basePrice) public onlyRole(ADMIN_ROLE) {
    BASE_PRICE = _basePrice;
  }

  /**
   * @notice set Base Price of Gangster for Whitelisted
   */
  function setBasePriceWL(uint256 _basePrice) public onlyRole(ADMIN_ROLE) {
    BASE_PRICE_WL = _basePrice;
  }

  /**
   * @notice set Base Referral /10000
   */
  function setBaseReferral(uint256 _refferral) public onlyRole(ADMIN_ROLE) {
    BASE_REFERRAL = _refferral;
  }

  /**
   * @notice set Base Referral Discount /10000
   */
  function setBaseReferralDiscount(uint256 refferral_discount) public onlyRole(ADMIN_ROLE) {
    BASE_REFERRAL_DISCOUNT = refferral_discount;
  }

  /**
   * @notice set Max Per Whitelisted Wallet
   */
  function setMaxPerWL(uint256 _maxPerWL) public onlyRole(ADMIN_ROLE) {
    MAX_PER_WL = _maxPerWL;
  }

  /**
  ***************************
  DEFAULT_ADMIN_ROLE Function
  ***************************
   */
  function withdraw() public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(gameClosed, 'Game is not closed');
    require(address(this).balance > 0, 'Nothing to withdraw');
    address payable receiver = payable(msg.sender);
    receiver.transfer(address(this).balance);
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
    uint256 fiatBonus;
    for (uint256 i = 0; i < amount; i++) {
      fiatBonus += (fiatReserve * BONUS_FIAT) / 1000;
      fiatReserve = fiatReserve - (fiatReserve * BONUS_FIAT) / 1000;
    }
    tokenFiat.transfer(msg.sender, fiatBonus);
    emit Mint(msg.sender, tokenId, amount);
  }
}
