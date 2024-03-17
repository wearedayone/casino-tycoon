// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/AccessControl.sol';
import './Gangster.sol';
import './FIAT.sol';
import './IGangsterArena.sol';
import './libs/SafeMath.sol';
import './libs/SafeTransferLib.sol';
import './libs/SignedSafeMath.sol';

// import 'hardhat/console.sol';

contract GangsterArena is AccessControl, IGangsterArena {
  using SafeMath for uint256;
  using SignedSafeMath for int256;
  using SafeTransferLib for address payable;

  // NFT token
  Gangster public nft;
  // Fiat token
  FIAT public fiat;

  // Signer address
  address private signer;

  /// Roles
  // Worker role - process game transaction
  bytes32 public constant WORKER_ROLE = keccak256('WORKER_ROLE');
  // Admin role - setting contract
  bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
  // Dev role - withdraw dev fee
  bytes32 public constant DEV_ROLE = keccak256('DEV_ROLE');
  // Marketing role - withdraw marketing fee
  bytes32 public constant MARKETING_ROLE = keccak256('MARKETING_ROLE');
  // NFT base price
  uint256 public bPrice_ = 0.01 ether; // base price

  uint256 public bpwl_ = 0.01 ether; // NFT price for whitelisted

  // Referral reward
  uint256 public refReward_ = 1000;

  // Referral discount
  uint256 public refDiscount_ = 9000;

  // Dev fee - over 10000
  uint256 public DEV_PERCENT = 0;
  // Marketing fee - over 10000
  uint256 public MARKETING_PERCENT = 1000;
  // Prize Pool value percentage - over 10000
  uint256 public PRIZE_PERCENT = 5000;
  // Retire pool value percentage - over 10000
  uint256 public RETIRE_PERCENT = 4000;

  uint256 public vtd = 60; // valid timestamp different

  // Value dev spent - use to calculate
  int256 public devDebt;
  // Value marketing spent - use to calculate
  int256 public marketingDebt;
  // Value retire pool spent - use to calculate
  int256 public retireDebt;
  // Value prize pool spent - use to calculate
  int256 public prizeDebt;

  // Flag toggle when game close
  bool public gameClosed;

  mapping(address => uint256) public goon; // address -> number of goon
  mapping(address => uint256) public safehouse; // address -> number of safehouse
  uint256 public tgoon; // total goon bought
  uint256 public tshouse; // total safehouse bought

  uint256 rpGangster = 10; // reputation per gangster
  uint256 rpGoon = 2; // reputation per goon
  uint256 rpSHouse = 8; // reputation per safe house
  uint256 retireTax = 2000; // Retire tax (over 10000)
  uint256 public tPBalance; // total prize balance when game end
  uint256 public totalPoint; // total allocation points, use when calculate prize
  // Nonces of transaction
  mapping(uint256 => bool) usedNonces;

  constructor(
    address _defaultAdmin,
    address _adminAddress,
    address _workerAddress,
    address _signerAddress,
    address _gangsterAddress,
    address payable _fiatAddress
  ) {
    nft = Gangster(_gangsterAddress);
    fiat = FIAT(_fiatAddress);
    signer = _signerAddress;

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

  function getDevBalance() public view returns (uint256) {
    int256 totalDebt = devDebt + marketingDebt + retireDebt + prizeDebt;
    return totalDebt.add(int256(address(this).balance)).mul(int256(DEV_PERCENT)).div(10000).sub(devDebt).toUInt256();
  }

  function getMarketingBalance() public view returns (uint256) {
    int256 totalDebt = devDebt + marketingDebt + retireDebt + prizeDebt;
    return
      totalDebt
        .add(int256(address(this).balance))
        .mul(int256(MARKETING_PERCENT))
        .div(10000)
        .sub(marketingDebt)
        .toUInt256();
  }

  function getRetireBalance() public view returns (uint256) {
    int256 totalDebt = devDebt + marketingDebt + retireDebt + prizeDebt;
    return
      totalDebt.add(int256(address(this).balance)).mul(int256(RETIRE_PERCENT)).div(10000).sub(retireDebt).toUInt256();
  }

  function getPrizeBalance() public view returns (uint256) {
    int256 totalDebt = devDebt + marketingDebt + retireDebt + prizeDebt;
    return
      totalDebt.add(int256(address(this).balance)).mul(int256(PRIZE_PERCENT)).div(10000).sub(prizeDebt).toUInt256();
  }

  function addReward(uint256 devFee, uint256 marketingFee, uint256 prizePool, uint256 retirePool) public payable {
    require(msg.value >= devFee + marketingFee + prizePool + retirePool, 'Need to send more ether');
    devDebt = devDebt.sub(int256(devFee));
    marketingDebt = marketingDebt.sub(int256(marketingFee));
    retireDebt = retireDebt.sub(int256(retirePool));
    prizeDebt = prizeDebt.sub(int256(prizePool));
  }

  /**
   * @notice Normal buy gangster
   */
  function mint(
    uint256 tokenId,
    uint256 amount,
    uint256 bonus,
    uint256 time,
    uint256 nonce,
    bytes memory sig
  ) public payable {
    require(msg.value >= bPrice_ * amount, 'Need to send more ether');
    require(!gameClosed, 'Game is closed');
    require(block.timestamp < time + vtd, 'Invalid timestamp');
    require(!usedNonces[nonce], 'Invalid nonce');
    bytes32 message = prefixed(keccak256(abi.encodePacked(msg.sender, tokenId, amount, bonus, time, nonce, 'mint')));
    require(verifyAddressSigner(message, sig), 'Invalid signature');
    nft.mintOnBehalf(msg.sender, tokenId, amount);
    usedNonces[nonce] = true;
    fiat.mint(msg.sender, bonus);
    emit Mint(msg.sender, tokenId, amount, nonce);
  }

  /**
   * @notice Buy gangster with referral
   */
  function mintReferral(
    uint256 tokenId,
    uint256 amount,
    uint256 bonus,
    address referral,
    uint256 time,
    uint256 nonce,
    bytes memory sig
  ) public payable {
    // require whitelisted for genesis token
    require(!usedNonces[nonce], 'Invalid nonce');
    require(block.timestamp < time + vtd, 'Invalid timestamp');
    bytes32 message = prefixed(
      keccak256(abi.encodePacked(msg.sender, tokenId, amount, bonus, referral, time, nonce, 'mintReferral'))
    );
    require(verifyAddressSigner(message, sig), 'Invalid signature');
    require(msg.value >= (bPrice_ * refDiscount_ * amount) / 10000, 'Need to send more ether');
    require(!gameClosed, 'Game is closed');
    nft.mintOnBehalf(msg.sender, tokenId, amount);
    usedNonces[nonce] = true;
    payable(referral).safeTransferETH((msg.value * refReward_) / 10000);
    fiat.mint(msg.sender, bonus);
    emit Mint(msg.sender, tokenId, amount, nonce);
  }

  /**
   * @notice Buy gangster with referral
   */
  function mintWL(
    uint256 tokenId,
    uint256 amount,
    uint256 bonus,
    uint256 time,
    uint256 nonce,
    bytes memory sig
  ) public payable {
    // require whitelisted for genesis token
    require(msg.value >= bpwl_ * amount, 'Need to send more ether');
    require(!gameClosed, 'Game is closed');
    require(block.timestamp < time + vtd, 'Invalid timestamp');
    require(!usedNonces[nonce], 'Invalid nonce');
    bytes32 message = prefixed(keccak256(abi.encodePacked(msg.sender, tokenId, amount, bonus, time, nonce, 'mintWL')));
    require(verifyAddressSigner(message, sig), 'Invalid signature');
    nft.mintWLOnBehalf(msg.sender, tokenId, amount);
    usedNonces[nonce] = true;
    fiat.mint(msg.sender, bonus);
    emit Mint(msg.sender, tokenId, amount, nonce);
  }

  /**
   * @notice Buy Goon
   */
  function buyGoon(
    uint256 amount,
    uint256 value,
    uint256 totalGoon,
    uint256 time,
    uint256 nonce,
    bytes memory sig
  ) public {
    require(!gameClosed, 'Game is closed');
    require(goon[msg.sender] == totalGoon, 'Invalid total Goon');
    require(block.timestamp < time + vtd, 'Invalid timestamp');
    require(!usedNonces[nonce], 'Nonce is used');
    bytes32 message = prefixed(
      keccak256(abi.encodePacked(msg.sender, amount, value, totalGoon, time, nonce, 'buyGoon'))
    );
    require(verifyAddressSigner(message, sig), 'Invalid signature');
    fiat.burnFrom(msg.sender, value);
    usedNonces[nonce] = true;
    goon[msg.sender] += amount;
    tgoon += amount;
    emit BuyGoon(msg.sender, amount, nonce);
  }

  /**
   * @notice Buy Safehouse
   */
  function buySafeHouse(
    uint256 amount,
    uint256 value,
    uint256 totalSafehouse,
    uint256 time,
    uint256 nonce,
    bytes memory sig
  ) public {
    require(!gameClosed, 'Game is closed');
    require(safehouse[msg.sender] == totalSafehouse, 'Invalid total Safehouse');
    require(block.timestamp < time + vtd, 'Invalid timestamp');
    require(!usedNonces[nonce], 'Nonce is used');

    bytes32 message = prefixed(
      keccak256(abi.encodePacked(msg.sender, amount, value, totalSafehouse, time, nonce, 'buySafeHouse'))
    );
    require(verifyAddressSigner(message, sig), 'Invalid signature');
    fiat.burnFrom(msg.sender, value);
    usedNonces[nonce] = true;
    safehouse[msg.sender] += amount;
    tshouse += amount;
    emit BuySafeHouse(msg.sender, amount, nonce);
  }

  /**
   * @notice depositNFT
   */
  function depositNFT(address to, uint256 tokenId, uint256 amount) public {
    require(!gameClosed, 'Game is closed');
    nft.depositNFT(msg.sender, to, tokenId, amount);
    emit Deposit(to, tokenId, amount);
  }

  /**
   * @notice withdrawNFT
   */
  function withdrawNFT(address to, uint256 tokenId, uint256 amount) public {
    nft.withdrawNFT(msg.sender, to, tokenId, amount);
    emit Withdraw(msg.sender, tokenId, amount);
  }

  function retired(uint256 nonce) public {
    require(!gameClosed, 'Game is closed');
    uint256 numberOfGangster = nft.gangster(msg.sender);
    uint256 totalGangster = nft.balanceOf(address(nft), 1);

    uint256 reputation = numberOfGangster * rpGangster + goon[msg.sender] * rpGoon + safehouse[msg.sender] * rpSHouse;
    uint256 totalRP = totalGangster * rpGangster + tgoon * rpGoon + tshouse * rpSHouse;

    uint256 reward = (getRetireBalance() * reputation * (10000 - retireTax)) / (totalRP * 10000);

    nft.retired(msg.sender);
    address payable receiver = payable(msg.sender);
    receiver.transfer(reward);
    retireDebt += int256(reward);
    tgoon -= goon[msg.sender];
    tshouse -= safehouse[msg.sender];
    goon[msg.sender] = 0;
    safehouse[msg.sender] = 0;
    emit Retire(msg.sender, reward, nonce);
  }

  /**
   * @notice Burn NFT for gangwar
   */
  function burnNFT(
    address[] memory addr,
    uint256[] memory tokenId,
    uint256[] memory amount
  ) public onlyRole(WORKER_ROLE) {
    require(!gameClosed, 'Game is closed');

    nft.burnNFT(addr, tokenId, amount);
    emit Burn(addr, tokenId, amount);
  }

  /**
   * @notice update winners and payout
   */
  function setWinner(address[] memory to, uint256[] memory points) public onlyRole(WORKER_ROLE) {
    require(gameClosed && tPBalance > 0 && totalPoint > 0, 'Game is not closed');
    require(address(this).balance > 0, 'Nothing to withdraw');
    require(to.length == points.length, 'Invalid input array length');

    for (uint256 i = 0; i < to.length; i++) {
      address payable receiver = payable(to[i]);
      uint256 reward = (tPBalance * points[i]) / totalPoint;
      if (reward > 0) receiver.transfer(reward);
    }
  }

  /**
   * @notice set game close status
   */
  function setGameClosed(bool value, uint256 _totalPoint) public onlyRole(WORKER_ROLE) {
    gameClosed = value;
    tPBalance = getPrizeBalance() + getRetireBalance();
    totalPoint = _totalPoint;
  }

  /**
  ***************************
  DEV withdraw (DEV_ROLE)
  ***************************
   */

  function devWithdraw() public onlyRole(DEV_ROLE) {
    require(getDevBalance() > 0, 'Nothing to withdraw');
    address payable receiver = payable(msg.sender);
    receiver.transfer(getDevBalance());
    devDebt += int256(getDevBalance());
  }

  /**
   * ***************************
   * Marketing withdraw to burn token (ADMIN_ROLE)
   * ***************************
   */

  function markettingWithdraw() public onlyRole(MARKETING_ROLE) {
    uint256 b = getMarketingBalance();
    require(b > 0, 'Nothing to withdraw');
    address payable receiver = payable(msg.sender);
    receiver.transfer(b);
    marketingDebt += int256(b);
  }

  /**
  ***************************
  Customization for the contract (ADMIN_ROLE)
  ***************************
   */

  /**
   * @notice set setGameFee [0,10000]
   */
  function setGameFee(uint256 _dev, uint256 _marketing, uint256 _prize, uint256 _retire) public onlyRole(ADMIN_ROLE) {
    require(_dev + _marketing + _prize + _retire == 10000, 'Invalid data');
    DEV_PERCENT = _dev;
    MARKETING_PERCENT = _marketing;
    PRIZE_PERCENT = _prize;
    RETIRE_PERCENT = _retire;
  }

  /**
   * @notice set Base Price Gangster
   */
  function setBasePrice(
    uint256 _basePrice,
    uint256 _basePriceWL,
    uint256 _refferral,
    uint256 refferral_discount,
    uint256 _vtd
  ) public onlyRole(ADMIN_ROLE) {
    bPrice_ = _basePrice;
    bpwl_ = _basePriceWL;
    refReward_ = _refferral;
    refDiscount_ = refferral_discount;
    vtd = _vtd;
  }

  /**
   * @notice set setReputation and retire tax
   */
  function setReputation(
    uint256 _rpGangster,
    uint256 _rpGoon,
    uint256 _rpSHouse,
    uint256 _retireTax
  ) public onlyRole(ADMIN_ROLE) {
    rpGangster = _rpGangster;
    rpGoon = _rpGoon;
    rpSHouse = _rpSHouse;
    retireTax = _retireTax;
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

  function migrateData(
    int256 _devDebt,
    int256 _marketingDebt,
    int256 _retireDebt,
    int256 _prizeDebt,
    uint256 _tgoon,
    uint256 _tshouse
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    devDebt = _devDebt;
    marketingDebt = _marketingDebt;
    retireDebt = _retireDebt;
    prizeDebt = _prizeDebt;
    tgoon = _tgoon;
    tshouse = _tshouse;
  }

  function migrateGoon(
    address[] memory _addrs,
    uint256[] memory values,
    uint256 _type
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_addrs.length == values.length, 'input donot match');
    for (uint256 i = 0; i < _addrs.length; i++) {
      if (_type == 1) goon[_addrs[i]] = values[i];
      else safehouse[_addrs[i]] = values[i];
    }
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
    return signer == recoverSignerFromSignature(message, sig);
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
}
