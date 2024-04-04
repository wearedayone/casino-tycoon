// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/AccessControl.sol';
import './Gangster.sol';
import './GANG.sol';
import './IGangsterArena.sol';
import './libs/SafeMath.sol';
import './libs/SafeTransferLib.sol';
import './libs/SignedSafeMath.sol';

interface IBlastPoints {
  function configurePointsOperator(address operator) external;

  function configurePointsOperatorOnBehalf(address contractAddress, address operator) external;
}

// import 'hardhat/console.sol';

contract GangsterArena is AccessControl, IGangsterArena {
  using SafeMath for uint256;
  using SafeTransferLib for address payable;

  Gangster public nft; // NFT token
  GANG public pointToken; // pointToken token
  address private signer; // Signer address

  bytes32 public constant WORKER_ROLE = keccak256('WORKER_ROLE'); // Worker role - process game transaction
  bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE'); // Admin role - setting contract

  /*
   ****************
   * Game config
   ****************
   */

  uint256 public tokenId = 1; // NFT tokenId

  uint256 public refReward_ = 10_00; // Referral reward: 10%

  uint256 public vtd = 60; // valid timestamp different

  //****************
  // Game Contract Balance
  //****************
  uint256 public devValue; // dev fee
  uint256 public burnValue; // burn value
  uint256 public reputationPrize; // reputation prize
  uint256 public rankPrize; // rank prize

  //****************
  // Game Address
  //****************
  address public burnAddr_;
  address public devAddr_;
  address public pointsOperator_;

  //****************
  // Game Data
  //****************
  bool public gameClosed; // Flag toggle when game close
  mapping(address => mapping(uint256 => uint256)) public lastB; // address -> type -> timestamp
  mapping(address => uint256) public gangsterBought; // address -> number of gangster bought

  // Nonces of transaction
  mapping(uint256 => bool) usedNonces;
  uint256 public totalPoint; // total reputation when game end

  constructor(
    address _defaultAdmin,
    address _adminAddress,
    address _workerAddress,
    address _signerAddress,
    address _pointsOperator,
    address _gangsterAddress,
    address payable _fiatAddress
  ) {
    nft = Gangster(_gangsterAddress);
    pointToken = GANG(_fiatAddress);
    signer = _signerAddress;
    pointsOperator_ = _pointsOperator;

    _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
    _grantRole(ADMIN_ROLE, _adminAddress);
    _grantRole(WORKER_ROLE, _workerAddress);
    IBlastPoints(0x2fc95838c71e76ec69ff817983BFf17c710F34E0).configurePointsOperator(_pointsOperator);
  }

  receive() external payable {}

  fallback() external payable {}

  //***************************
  // Public
  //***************************

  function addReward(uint256 dev_, uint256 burn_, uint256 reputationPrize_, uint256 rankPrize_) public payable {
    require(msg.value == (dev_ + burn_ + reputationPrize_ + rankPrize_), 'Need to send more ether');
    devValue += dev_;
    burnValue += burn_;
    reputationPrize += reputationPrize_;
    rankPrize += rankPrize_;
  }

  /**
   * @notice Buy gangster with referral
   */
  function buyGangster(
    uint256 amount,
    uint256 value,
    uint256 time,
    uint256 nGangster,
    uint256 nonce,
    uint256 bType,
    address referral,
    bytes memory sig
  ) public {
    // require whitelisted for genesis token
    require(!gameClosed, 'Game is closed');
    require(block.timestamp < time + vtd, 'Invalid timestamp');
    require(!usedNonces[nonce], 'Invalid nonce');
    require(gangsterBought[msg.sender] == nGangster, 'outdated number of gangster');
    // require(pointToken.transferFrom(msg.sender, address(this), value));

    bytes32 message = prefixed(
      keccak256(abi.encodePacked(msg.sender, tokenId, amount, value, time, nGangster, nonce, bType, referral))
    );
    require(verifyAddressSigner(message, sig), 'Invalid signature');
    if (bType == 1) {
      // normal buy
      pointToken.burnFrom(msg.sender, value);
      nft.mintOnBehalf(msg.sender, tokenId, amount);
    } else if (bType == 2) {
      //whitelisted buy
      pointToken.burnFrom(msg.sender, value);
      nft.mintWLOnBehalf(msg.sender, tokenId, amount);
    } else {
      // referral buy
      require(pointToken.transfer(referral, (value * refReward_) / 100_00));
      pointToken.burnFrom(address(this), (value * (100_00 - refReward_)) / 100_00);
      nft.mintOnBehalf(msg.sender, tokenId, amount);
    }
    usedNonces[nonce] = true;
    gangsterBought[msg.sender] += amount;
    emit BuyGangster(msg.sender, tokenId, amount, nonce);
  }

  /**
   * @notice Buy Asset
   * typeA: type of Asset, 1 is goon, 2 is safehouse
   * amount: amount of asset
   * value: value user have to pay in token
   * lastB: lastB time block time
   * sTime: signature time
   * nonce: application transaction nonce
   * sig: signatire from application
   */
  function buyAsset(
    uint256 _typeA,
    uint256 _amount,
    uint256 _value,
    uint256 _lastB,
    uint256 _sTime,
    uint256 _nonce,
    bytes memory _sig
  ) public {
    require(!gameClosed, 'Game is closed');
    require(lastB[msg.sender][_typeA] == _lastB, 'Invalid last buy time');
    require(block.timestamp < _sTime + vtd, 'Invalid timestamp');
    require(!usedNonces[_nonce], 'Nonce is used');
    bytes32 message = prefixed(
      keccak256(abi.encodePacked(msg.sender, _typeA, _amount, _value, _lastB, _sTime, _nonce))
    );
    require(verifyAddressSigner(message, _sig), 'Invalid signature');
    pointToken.burnFrom(msg.sender, _value);
    usedNonces[_nonce] = true;
    lastB[msg.sender][_typeA] = block.timestamp;
    if (_typeA == 1) emit BuyGoon(msg.sender, _amount, _nonce);
    if (_typeA == 2) emit BuySafeHouse(msg.sender, _amount, _nonce);
  }

  /**
   * @notice Buy Asset
   * type: type of spint, default is 1
   * amount: number of spin
   * value: value user have to pay in token
   * _lastP: last time user spin in block time
   * sTime: signature time
   * nonce: application transaction nonce
   * sig: signatire from application
   */
  function spin(
    uint256 _spinType,
    uint256 _amount,
    uint256 _value,
    uint256 _lastSpin,
    uint256 _sTime,
    uint256 _nonce,
    bytes memory _sig
  ) public {
    require(!gameClosed, 'Game is closed');
    require(block.timestamp < _sTime + vtd, 'Invalid timestamp');
    require(!usedNonces[_nonce], 'Nonce is used');
    bytes32 message = prefixed(
      keccak256(abi.encodePacked(msg.sender, _spinType, _amount, _value, _lastSpin, _sTime, _nonce))
    );
    require(verifyAddressSigner(message, _sig), 'Invalid signature');
    pointToken.burnFrom(msg.sender, _value);
    usedNonces[_nonce] = true;
    emit DailySpin(msg.sender, _value, _spinType, _amount, _nonce);
  }

  /**
   * @notice depositNFT
   */
  function depositNFT(address to, uint256 amount) public {
    require(!gameClosed, 'Game is closed');
    nft.depositNFT(msg.sender, to, tokenId, amount);
    emit Deposit(to, tokenId, amount);
  }

  /**
   * @notice withdrawNFT
   */
  function withdrawNFT(address to, uint256 amount) public {
    nft.withdrawNFT(msg.sender, to, tokenId, amount);
    emit Withdraw(msg.sender, tokenId, amount);
  }

  /**
   ***************************
   *DEV withdraw
   ***************************
   */

  function devWithdraw() public {
    require(devValue > 0, 'Nothing to withdraw');
    require(devAddr_ != address(0), 'Dev is not set');
    address payable receiver = payable(devAddr_);
    receiver.transfer(devValue);
    devValue = 0;
  }

  /**
   * ***************************
   * Marketing withdraw to burn token
   * ***************************
   */

  function markettingWithdraw() public {
    require(burnValue > 0, 'Nothing to withdraw');
    require(burnAddr_ != address(0), 'Burn is not set');
    address payable receiver = payable(burnAddr_);
    receiver.transfer(burnValue);
    burnValue = 0;
  }

  /**
   ***************************
   *Customization for the contract (ADMIN_ROLE)
   ***************************
   */

  function retired(address to, uint256 payout, uint256 nonce) public onlyRole(WORKER_ROLE) {
    require(!gameClosed, 'Game is closed');
    nft.retired(to);
    address payable receiver = payable(to);
    receiver.transfer(payout);
    reputationPrize -= payout;
    emit Retire(to, payout, nonce);
  }

  function finalWarResult(
    address[] memory addr,
    uint256[] memory _lGang,
    uint256[] memory _wToken
  ) public onlyRole(WORKER_ROLE) {
    require(!gameClosed, 'Game is closed');
    pointToken.batchMint(addr, _wToken);
    nft.burnNFT(addr, tokenId, _lGang);

    emit WarResult(addr, _lGang, _wToken);
  }

  /**
   * @notice update winners and payout
   */
  function setWinner(address[] memory to, uint256[] memory points) public onlyRole(WORKER_ROLE) {
    require(gameClosed && totalPoint > 0, 'Game is not closed');
    require(address(this).balance > 0, 'Nothing to withdraw');
    require(to.length == points.length, 'Invalid input array length');
    uint256 totalPrize = reputationPrize + rankPrize;
    for (uint256 i = 0; i < to.length; i++) {
      address payable receiver = payable(to[i]);
      uint256 reward = (totalPrize * points[i]) / totalPoint;
      require(address(this).balance >= reward, 'Nothing to payout');
      if (reward > 0) receiver.transfer(reward);
    }
  }

  /**
   * @notice set game close status
   */
  function setGameClosed(bool value, uint256 _totalPoint) public onlyRole(WORKER_ROLE) {
    gameClosed = value;
    totalPoint = _totalPoint;
  }

  /**
   ***************************
   *Customization for the contract (ADMIN_ROLE)
   ***************************
   */

  /**
   * @notice set Base Price Gangster
   */
  function setGameConfig(uint256 _refReward, uint256 _vtd) public onlyRole(ADMIN_ROLE) {
    refReward_ = _refReward;
    vtd = _vtd;
  }

  /**
  ***************************
  DEFAULT_ADMIN_ROLE Function
  ***************************
   */
  function emegencyWithdraw() public onlyRole(DEFAULT_ADMIN_ROLE) {
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
