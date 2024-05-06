// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/AccessControl.sol';
import './Gangster.sol';
import './GREED.sol';
import './IGangsterArena.sol';
import './libs/SafeMath.sol';
import './libs/SafeTransferLib.sol';
import './libs/SignedSafeMath.sol';
import './libs/SignerLib.sol';

interface IBlastPoints {
  function configurePointsOperator(address operator) external;

  function configurePointsOperatorOnBehalf(address contractAddress, address operator) external;
}

// import 'hardhat/console.sol';

contract GangsterArena is AccessControl, IGangsterArena {
  using SafeMath for uint256;
  using SafeTransferLib for address payable;
  using SignerLib for address;

  Gangster public nft; // NFT token
  GREED public pointToken; // pointToken token
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
  uint256 public percentOfRankPrize = 50_00; //default 50% of eth will go to rank prize, 50% will
  uint256 public percentOfRepPrize = 50_00; //default 50% of eth will go to rank prize, 50% will
  uint256 public percentOfDev = 0; //default 50% of eth will go to rank prize, 50% will

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
    address _gangsterAddress,
    address payable _fiatAddress,
    address _pointsOperator,
    address _blastPointAddr
  ) {
    nft = Gangster(_gangsterAddress);
    pointToken = GREED(_fiatAddress);
    signer = _signerAddress;
    pointsOperator_ = _pointsOperator;

    _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
    _grantRole(ADMIN_ROLE, _adminAddress);
    _grantRole(WORKER_ROLE, _workerAddress);
    if (_blastPointAddr != address(0)) IBlastPoints(_blastPointAddr).configurePointsOperator(_pointsOperator);
    // IBlastPoints(0x2fc95838c71e76ec69ff817983BFf17c710F34E0).configurePointsOperator(_pointsOperator);
  }

  receive() external payable {
    rankPrize += (percentOfRankPrize * msg.value) / 10000;
    reputationPrize += (percentOfRepPrize * msg.value) / 10000;
    devValue += (percentOfDev * msg.value) / 10000;
    burnValue += ((10000 - percentOfDev - percentOfRankPrize - percentOfRepPrize) * msg.value) / 10000;
    emit Received(msg.sender, msg.value);
  }

  fallback() external payable {
    rankPrize += (percentOfRankPrize * msg.value) / 10000;
    reputationPrize += (percentOfRepPrize * msg.value) / 10000;
    devValue += (percentOfDev * msg.value) / 10000;
    burnValue += ((10000 - percentOfDev - percentOfRankPrize - percentOfRepPrize) * msg.value) / 10000;
    emit Received(msg.sender, msg.value);
  }

  //***************************
  // Public
  //***************************

  function addReward(uint256 dev_, uint256 burn_, uint256 reputationPrize_, uint256 rankPrize_) public payable {
    require(msg.value == (dev_ + burn_ + reputationPrize_ + rankPrize_), 'Need to send more ether');
    devValue += dev_;
    burnValue += burn_;
    reputationPrize += reputationPrize_;
    rankPrize += rankPrize_;
    emit AddReward(msg.sender, msg.value);
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
    bytes memory sig
  ) public {
    // require whitelisted for genesis token
    require(!gameClosed, 'Game is closed');
    require(block.timestamp < time + vtd, 'Invalid timestamp');
    require(!usedNonces[nonce], 'Invalid nonce');
    require(gangsterBought[msg.sender] == nGangster, 'outdated number of gangster');
    // require(pointToken.transferFrom(msg.sender, address(this), value));

    bytes32 message = SignerLib.prefixed(
      keccak256(abi.encodePacked(msg.sender, amount, value, time, nGangster, nonce, bType))
    );
    require(signer.verifyAddressSigner(message, sig), 'Invalid signature');
    if (bType == 1) {
      // normal buy
      pointToken.burnFrom(msg.sender, value);
      nft.mintOnBehalf(msg.sender, tokenId, amount);
    } else if (bType == 2) {
      //whitelisted buy
      pointToken.burnFrom(msg.sender, value);
      nft.mintWLOnBehalf(msg.sender, tokenId, amount);
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
    bytes32 message = SignerLib.prefixed(
      keccak256(abi.encodePacked(msg.sender, _typeA, _amount, _value, _lastB, _sTime, _nonce))
    );
    require(signer.verifyAddressSigner(message, _sig), 'Invalid signature');
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
    bytes32 message = SignerLib.prefixed(
      keccak256(abi.encodePacked(msg.sender, _spinType, _amount, _value, _lastSpin, _sTime, _nonce))
    );
    require(signer.verifyAddressSigner(message, _sig), 'Invalid signature');
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

  function retire(address _to, uint256 _payout, uint256 _nonce, bytes memory _sig) public onlyRole(WORKER_ROLE) {
    require(!gameClosed, 'Game is closed');
    bytes32 message = SignerLib.prefixed(keccak256(abi.encodePacked(msg.sender, _to, _payout, _nonce)));
    require(signer.verifyAddressSigner(message, _sig), 'Invalid signature');
    nft.retired(_to);
    address payable receiver = payable(_to);
    receiver.transfer(_payout);
    reputationPrize -= _payout;
    emit Retire(_to, _payout, _nonce);
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
  function setGameConfig(
    uint256 _refReward,
    uint256 _vtd,
    uint256 _percentOfRankPrize,
    uint256 _percentOfRepPrize,
    uint256 _percentOfDev
  ) public onlyRole(ADMIN_ROLE) {
    refReward_ = _refReward;
    vtd = _vtd;
    percentOfRankPrize = _percentOfRankPrize;
    percentOfRepPrize = _percentOfRepPrize;
    percentOfDev = _percentOfDev;
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
   * @notice sum of array
   */
  function reduce(uint256[] memory arr) internal pure returns (uint256 result) {
    for (uint256 i = 0; i < arr.length; i++) {
      result += arr[i];
    }
    return result;
  }
}
