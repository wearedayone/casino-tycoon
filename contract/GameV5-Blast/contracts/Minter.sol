// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';
import './libs/SignerLib.sol';
import './Gangster.sol';

contract Minter is Ownable {
  using SignerLib for address;

  struct Phase {
    uint256 MAX_PER_BATCH;
    uint256 MAX_PER_WALLET;
    uint256 MAX_SUPPLY; // total win reward to withdraw
    uint256 currentSupply; //
    uint256 BASE_PRICE;
    bool status;
    bool whitelistedOnly;
  }

  Gangster gangster;
  address private signer; // Signer address
  uint256 MAX_SUPPLY_PRESALE = 2000; // Max supply for presale

  mapping(uint256 => Phase) public mintPhase; //
  mapping(uint256 => mapping(address => uint256)) public mintedAddr; // phaseId => address => amount

  /**
   ***************************
   *Public
   ***************************
   */

  event Mint(address addr, uint256 amount, uint256 phaseId);

  constructor(address initialOwner, address _gangster, address _signer) Ownable(initialOwner) {
    gangster = Gangster(_gangster);
    signer = _signer;
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
   * @notice mintWL
   * type: type of mint, 0 is free mint, 1 is public mint
   * amount: number of nft
   * sig: signatire from application
   */
  function mintWL(uint256 phaseId, uint256 amount, bytes memory sig) public payable {
    require(mintPhase[phaseId].status, 'Mint phase is not available'); // check phase status
    require(mintPhase[phaseId].MAX_PER_BATCH >= amount, 'Over max per batch'); // Limit max per batch
    require(mintPhase[phaseId].MAX_SUPPLY >= mintPhase[phaseId].currentSupply + amount, 'Over max supply'); // Limit max supply presale in phase
    require(MAX_SUPPLY_PRESALE >= gangster.totalSupply(1) + amount, 'Over max supply'); // Limit max supply presale in phase

    require(mintPhase[phaseId].MAX_PER_WALLET >= mintedAddr[phaseId][msg.sender] + amount, 'Over max wl');
    if (mintPhase[phaseId].BASE_PRICE > 0) {
      require(msg.value >= amount * mintPhase[phaseId].BASE_PRICE);
    }

    if (mintPhase[phaseId].whitelistedOnly) {
      bytes32 message = SignerLib.prefixed(keccak256(abi.encodePacked(msg.sender, phaseId, amount)));
      require(signer.verifyAddressSigner(message, sig), 'Invalid signature'); // validate signature
    }

    gangster.mint(msg.sender, 1, amount, '');
    mintedAddr[phaseId][msg.sender] += amount;
    mintPhase[phaseId].currentSupply += amount;
    emit Mint(msg.sender, amount, phaseId);
  }

  /**
  ***************************
  DEFAULT_ADMIN_ROLE Function
  ***************************
   */
  function emegencyWithdraw() public onlyOwner {
    require(address(this).balance > 0, 'Nothing to withdraw');
    address payable receiver = payable(msg.sender);
    receiver.transfer(address(this).balance);
  }

  function updateConfig(uint256 _maxSupply) public onlyOwner {
    MAX_SUPPLY_PRESALE = _maxSupply; // Max supply for presale
  }

  function updatePhase(
    uint256 _phaseId,
    uint256 _maxSupply,
    uint256 _maxPerBatch,
    uint256 _maxPerWallet,
    uint256 _basePrice,
    bool _status,
    bool _whitelistedOnly
  ) public onlyOwner {
    mintPhase[_phaseId].MAX_SUPPLY = _maxSupply;
    mintPhase[_phaseId].MAX_PER_BATCH = _maxPerBatch;
    mintPhase[_phaseId].MAX_PER_WALLET = _maxPerWallet;
    mintPhase[_phaseId].BASE_PRICE = _basePrice;
    mintPhase[_phaseId].status = _status;
    mintPhase[_phaseId].whitelistedOnly = _whitelistedOnly;
  }
}
